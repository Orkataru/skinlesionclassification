import torch
from torchvision import transforms
from PIL import Image
from flask import Flask, request, jsonify
from flask_cors import CORS
import io
import timm
import os

app = Flask(__name__)
# Enable CORS for all routes
CORS(app)

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

@app.route('/predict', methods=['POST'])
def predict():
    print("Received request with files:", list(request.files.keys()))
    print("Received request with form:", list(request.form.keys()))
    if 'file' not in request.files:
        return jsonify({'error': 'No file provided'}), 400
    
    file = request.files['file']
    img_bytes = file.read()
    image = Image.open(io.BytesIO(img_bytes))
    input_tensor = val_transform(image).unsqueeze(0).to(device)
    
    with torch.no_grad():
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
        
    return jsonify({
        'prediction': prediction,
        'probabilities': prob_list,
        'max_confidence': max_prob.item()
    })

if __name__ == '__main__':
    # Get port from environment variable or default to 5000
    port = int(os.environ.get('PORT', 5000))
    app.run(host='0.0.0.0', port=port)
