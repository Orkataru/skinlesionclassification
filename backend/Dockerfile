# Use PyTorch base image
FROM pytorch/pytorch:2.1.0-cuda12.1-cudnn8-runtime

WORKDIR /app

# Copy requirements first to leverage Docker cache
COPY requirements.txt .

# Install requirements
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code last
COPY app.py ./
COPY efficientnet_model.pth ./model.pth

# Expose the port the app runs on
EXPOSE 8080

CMD ["python", "app.py"]
