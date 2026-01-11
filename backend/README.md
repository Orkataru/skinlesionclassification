# Skin Lesion Classification Backend

This repository contains the backend service for the ENS492 graduation project focused on skin lesion classification using deep learning. The system is designed to provide accurate classification of dermatological images to assist in the early detection and diagnosis of skin conditions.

> ⚠️ **Disclaimer**: This is a research tool and is not approved for clinical diagnosis. Results should not replace professional medical evaluation by a qualified dermatologist.

## Project Overview

This backend service is built as part of a comprehensive system for skin lesion classification. The system accepts images of skin lesions and classifies them into different diagnostic categories with confidence scores, helping to identify potentially dangerous skin conditions.

## Features

- **AI-Powered Classification**: EfficientNet-B5 model trained on ISIC dataset
- **Grad-CAM Visualization**: Visual attention maps showing which regions influenced the AI's decision
- **Uncertainty Quantification**: Low-confidence predictions are flagged as "Uncertain"
- **RESTful API**: Easy integration with any frontend application
- **Cloud-Ready**: Dockerized for seamless deployment to Google Cloud Run

## Technical Architecture

### Machine Learning Model

- **Model Architecture**: EfficientNet B5, a state-of-the-art convolutional neural network optimized for image classification tasks
- **Input**: 456×456 RGB images of skin lesions (automatically resized)
- **Classes**: The model distinguishes between 8 different skin lesion types:

  | Class | Abbreviation | Full Name |
  |-------|--------------|-----------|
  | 0 | MEL | Melanoma |
  | 1 | NV | Melanocytic Nevus |
  | 2 | BCC | Basal Cell Carcinoma |
  | 3 | AKIEC | Actinic Keratosis / Intraepithelial Carcinoma |
  | 4 | BKL | Benign Keratosis |
  | 5 | DF | Dermatofibroma |
  | 6 | VASC | Vascular Lesion |
  | 7 | SCC | Squamous Cell Carcinoma |
  | 8 | N/A | Not Confident (uncertainty flag) |

- **Uncertainty Handling**: Predictions with confidence below 50% are classified as "Not Confident", reducing false diagnoses

### Model Weights

**The trained model weights (`model.pth`) are not included in this repository due to file size constraints.**

📧 **To obtain the model weights, please contact the project team**
The weights will be provided for research and educational purposes.

### Grad-CAM Explainability

The backend includes Grad-CAM (Gradient-weighted Class Activation Mapping) to provide visual explanations of the model's predictions:

- Generates heatmaps highlighting regions the model focused on
- Helps users understand why the AI made a particular prediction
- Overlays attention maps on the original image for easy interpretation
- Uses the last convolutional layer (`conv_head`) for activation extraction

## API Endpoints

### `POST /predict`

Classifies a skin lesion image.

**Request:**
- Content-Type: `multipart/form-data`
- Body: `file` - Image file (JPEG, PNG)

**Response:**
```json
{
  "prediction": 1,
  "probabilities": [0.02, 0.85, 0.03, 0.02, 0.04, 0.01, 0.02, 0.01, 0.0],
  "max_confidence": 0.85,
  "gradcam": "base64_encoded_image_string"
}
```

### `GET /health`

Health check endpoint for container orchestration.

**Response:**
```json
{
  "status": "healthy"
}
```

## Local Development

### Prerequisites

- Python 3.9+
- PyTorch with CUDA support (optional, for GPU acceleration)

### Installation

```bash
cd backend
pip install -r requirements.txt
```

### Running Locally

```bash
# Place your model.pth file in the backend directory
python app.py
```

The server will start on `http://localhost:5000`.

### Docker Deployment

```bash
# Build the container
docker build -t skin-classifier-backend .

# Run the container
docker run -p 5000:5000 skin-classifier-backend
```

## Technologies Used

- **Deep Learning**: PyTorch, TorchVision, TIMM (PyTorch Image Models)
- **API Framework**: Flask, Flask-CORS
- **Image Processing**: Pillow, OpenCV
- **Explainability**: Grad-CAM implementation
- **Containerization**: Docker
- **Cloud Infrastructure**: Google Cloud Run

## Data Sources

The model is trained on the ISIC (International Skin Imaging Collaboration) dataset, which contains dermatoscopic images of skin lesions with expert annotations. The service respects all licensing and attribution requirements for the data used.

## Frontend Integration

This backend service is designed to integrate with the [SkinTracker frontend](https://github.com/ismailcakmak/SkinTracker), which provides:
- Interactive body map for mole location tracking
- Image capture and upload functionality
- Visual display of classification results and Grad-CAM attention maps
- Historical tracking of skin lesion changes

## Project Team

This project was developed as part of the ENS492 graduation project at Sabancı University.

**Team Members:**
- Bilgehan Bilgin
- İsmail Çakmak
