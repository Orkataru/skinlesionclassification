# Skin Lesion Classification Service

This repository contains the backend service for the ENS492 graduation project focused on skin lesion classification using deep learning. The system is designed to provide accurate classification of dermatological images to assist in the early detection and diagnosis of skin conditions.

**Try our application here**: [Skin Lesion Classification App](#) *(URL to be provided)*

## Project Overview

This backend service is built as part of a comprehensive system for skin lesion classification. The system accepts images of skin lesions and classifies them into different diagnostic categories with confidence scores, helping to identify potentially dangerous skin conditions.

## Technical Architecture

### Machine Learning Model

- **Model Architecture**: EfficientNet B5, a state-of-the-art convolutional neural network optimized for image classification tasks
- **Classes**: The model distinguishes between 8 different skin lesion types, with an additional "UNKNOWN" category for uncertain predictions:
  - Class 0: MEL (Melanoma)
  - Class 1: NV (Nevus)
  - Class 2: BCC (Basal Cell Carcinoma)
  - Class 3: AKIEC (Actinic Keratosis / Intraepithelial Carcinoma)
  - Class 4: BKL (Benign Keratosis)
  - Class 5: DF (Dermatofibroma)
  - Class 6: VASC (Vascular Lesion)
  - Class 7: SCC (Squamous Cell Carcinoma)
  - Class 8: Not confident (for predictions with low confidence)
- **Input**: 224×224 RGB images of skin lesions
- **Performance**: The model achieves high accuracy while maintaining low inference time (~1000ms on CPU)
- **Uncertainty Handling**: Predictions with confidence below 0.5 are classified as "Not confident" (Class 8), reducing false diagnoses

### Backend Service

- **Framework**: Flask-based RESTful API service
- **Endpoint**: Single prediction endpoint at `/predict` accepting image uploads
- **Containerization**: Packaged as a Docker container for easy deployment and scaling
- **Cloud Deployment**: Deployed on Google Cloud Run for serverless operation
- **Scalability**: Automatically scales based on incoming traffic patterns

### Image Processing Pipeline

1. Client uploads a skin lesion image to the API endpoint
2. Image is preprocessed using standard transformations:
   - RGB conversion
   - Resizing to 224×224 pixels
   - Normalization with ImageNet mean and standard deviation
3. Preprocessed image is passed through the EfficientNet model
4. Model outputs class probabilities for the 8 skin lesion categories
5. Response includes:
   - Predicted class index
   - Confidence score for the prediction
   - Complete probability distribution across all classes

### Deployment Architecture

The service is designed for cloud native deployment with:

- Containerized application with optimized Docker image
- Environment variable configuration for flexible deployment
- Auto-scaling capabilities based on incoming request load
- GPU/CPU flexibility (automatically detects available hardware)

## Technologies Used

- **Deep Learning**: PyTorch, TorchVision, TIMM (PyTorch Image Models)
- **API Framework**: Flask
- **Image Processing**: Pillow
- **Containerization**: Docker
- **Cloud Infrastructure**: Google Cloud Run

## Data Sources

The model is trained on the ISIC (International Skin Imaging Collaboration) dataset, which contains dermatoscopic images of skin lesions with expert annotations. The service respects all licensing and attribution requirements for the data used.

## Integration

This backend service is designed to integrate with our frontend application, providing a seamless user experience for uploading images and receiving predictions. The API returns structured JSON responses that can be easily consumed by any client application.

## Project Team

This project was developed as part of the ENS492 graduation project at Sabancı University. Team members are:
Bilgehan Bilgin
İsmail Çakmak
