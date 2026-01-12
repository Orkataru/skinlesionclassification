import torch
from torchvision import transforms
from PIL import Image, ImageOps
from flask import Flask, request, jsonify
from flask_cors import CORS
import io
import timm
import os
import numpy as np
import base64
import cv2
import gc

app = Flask(__name__)
# Enable CORS for all routes
CORS(app)

# Global variables for model and hooks
model = None
device = None
gradients = None
activations = None
enable_gradcam = False  # Flag to control Grad-CAM hook behavior

def save_gradient(grad):
    global gradients
    # Detach to avoid keeping any autograd references around accidentally
    gradients = grad.detach()

def forward_hook(module, input, output):
    global activations, enable_gradcam
    # IMPORTANT:
    # - Only keep activations when Grad-CAM is requested, otherwise we retain a large tensor
    #   for no reason.
    # - Store activations *detached* so we don't keep the autograd graph alive between requests
    #   (this can lead to memory growth / OOM on Cloud Run).
    if enable_gradcam:
        activations = output.detach()
        if output.requires_grad:
            output.register_hook(save_gradient)
    else:
        activations = None

def load_model(model_path, device):
    # Initialize EfficientNet model
    model = timm.create_model('efficientnet_b5', pretrained=False, num_classes=8)
    model.to(device)
    
    # Load the trained weights
    state_dict = torch.load(model_path, map_location=device)
    # If the state dict was saved with DataParallel, remove the 'module.' prefix
    if list(state_dict.keys())[0].startswith('module.'):
        state_dict = {k[7:]: v for k, v in state_dict.items()}
    model.load_state_dict(state_dict)
    model.eval()
    
    # Register hook on the last convolutional layer for Grad-CAM
    # For EfficientNet-B5, the last conv layer is in conv_head
    target_layer = model.conv_head
    target_layer.register_forward_hook(forward_hook)
    
    return model

device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
model_path = "model.pth"
model = load_model(model_path, device)

# Transform pipeline for EfficientNet
val_transform = transforms.Compose([
    transforms.Lambda(lambda img: img.convert('RGB')),
    transforms.Resize((456,456)),
    transforms.ToTensor(),
    transforms.Normalize([0.485,0.456,0.406],[0.229,0.224,0.225])
])

def _resize_keep_aspect(width: int, height: int, max_side: int) -> tuple[int, int]:
    if max_side <= 0:
        return width, height
    longest = max(width, height)
    if longest <= max_side:
        return width, height
    scale = max_side / float(longest)
    return max(1, int(round(width * scale))), max(1, int(round(height * scale)))

def generate_gradcam(input_tensor, class_idx, original_image, max_side: int = 512):
    """Generate Grad-CAM heatmap for the given class."""
    global gradients, activations, enable_gradcam
    
    # Enable Grad-CAM mode
    enable_gradcam = True
    
    try:
        # Enable gradients for this forward pass
        try:
            model.zero_grad(set_to_none=True)
        except TypeError:
            model.zero_grad()
        input_tensor.requires_grad_(True)
        
        # Forward pass
        outputs = model(input_tensor)
        
        # Backward pass for the target class (no need to retain the graph)
        score = outputs[0, class_idx]
        score.backward()
        
        # Get gradients and activations
        if gradients is None or activations is None:
            raise ValueError("Gradients or activations not captured")
        
        grads = gradients
        acts = activations
        
        # Global average pooling of gradients
        weights = torch.mean(grads, dim=[2, 3], keepdim=True)
        
        # Weighted combination of activation maps
        cam = torch.sum(weights * acts, dim=1, keepdim=True)
        cam = torch.relu(cam)  # ReLU to keep only positive contributions
        
        # Normalize
        cam = cam - cam.min()
        if cam.max() > 0:
            cam = cam / cam.max()
        
        # Resize to a bounded output size to keep payload + memory under control
        target_w, target_h = _resize_keep_aspect(original_image.width, original_image.height, max_side)
        cam = cam.squeeze().cpu().numpy()
        cam = cv2.resize(cam, (target_w, target_h))
        
        # Apply colormap
        heatmap = cv2.applyColorMap(np.uint8(255 * cam), cv2.COLORMAP_JET)
        heatmap = cv2.cvtColor(heatmap, cv2.COLOR_BGR2RGB)
        
        # Overlay on original image
        original_np = np.array(original_image.resize((target_w, target_h)))
        if len(original_np.shape) == 2:
            original_np = cv2.cvtColor(original_np, cv2.COLOR_GRAY2RGB)
        
        overlay = cv2.addWeighted(original_np, 0.6, heatmap, 0.4, 0)
        
        # Convert to base64
        _, buffer = cv2.imencode('.png', cv2.cvtColor(overlay, cv2.COLOR_RGB2BGR))
        gradcam_base64 = base64.b64encode(buffer).decode('utf-8')
        
        return gradcam_base64
    finally:
        # Always disable Grad-CAM mode and clear state
        enable_gradcam = False
        gradients = None
        activations = None
        # Help Python free large temporaries promptly in constrained environments (e.g. Cloud Run).
        gc.collect()
        if device.type == "cuda":
            torch.cuda.empty_cache()

@app.route('/predict', methods=['POST'])
def predict():
    global gradients, activations
    
    print("Received request with files:", list(request.files.keys()))
    print("Received request with form:", list(request.form.keys()))
    if 'file' not in request.files:
        return jsonify({'error': 'No file provided'}), 400
    
    file = request.files['file']
    img_bytes = file.read()
    try:
        original_image = Image.open(io.BytesIO(img_bytes))
        # Normalize orientation (EXIF) and ensure a consistent 3-channel RGB image for
        # both inference and Grad-CAM overlay generation.
        original_image = ImageOps.exif_transpose(original_image).convert("RGB")
    except Exception as e:
        return jsonify({'error': f'Invalid or unsupported image file: {e}'}), 400
    input_tensor = val_transform(original_image).unsqueeze(0).to(device)
    
    # First pass without gradients for prediction
    with torch.inference_mode():
        outputs = model(input_tensor)
        probs = torch.softmax(outputs, dim=-1)
        max_prob, predicted = probs.max(1)
        
        # Check if the model is uncertain (max probability < 0.5)
        if max_prob.item() < 0.5:
            prediction = 8  # 8 represents "UNKNOWN"
        else:
            prediction = predicted.item()
        
        prob_list = probs.squeeze(0).cpu().tolist()
        # Add uncertainty class probability (initially 0)
        prob_list.append(1.0 if max_prob.item() < 0.5 else 0.0)
    
    # Generate Grad-CAM for the predicted class (or top class if uncertain)
    gradcam_class = predicted.item()
    gradcam_base64 = None
    
    try:
        # Need to reload tensor for gradient computation
        input_tensor = val_transform(original_image).unsqueeze(0).to(device)
        gradcam_max_side = int(os.environ.get("GRADCAM_MAX_SIDE", "512"))
        gradcam_base64 = generate_gradcam(input_tensor, gradcam_class, original_image, max_side=gradcam_max_side)
    except Exception as e:
        print(f"Grad-CAM generation failed: {e}")
        gradcam_base64 = None
    
    response_data = {
        'prediction': prediction,
        'probabilities': prob_list,
        'max_confidence': max_prob.item()
    }
    
    if gradcam_base64:
        response_data['gradcam'] = gradcam_base64
    
    return jsonify(response_data)

@app.route('/health', methods=['GET'])
def health():
    return jsonify({'status': 'healthy'})

if __name__ == '__main__':
    # Get port from environment variable or default to 5000
    port = int(os.environ.get('PORT', 5000))
    app.run(host='0.0.0.0', port=port)
