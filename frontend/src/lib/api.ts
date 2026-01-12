export type PredictionResponse = {
  max_confidence: number;
  prediction: number;
  probabilities: number[];
  gradcam?: string; // Base64 encoded Grad-CAM heatmap image
};

const DEFAULT_PREDICT_URL =
  'https://skin-lesion-service-286247711107.us-central1.run.app/predict';

const getPredictUrl = (): string => {
  // Optional override for local/dev deployments
  return process.env.NEXT_PUBLIC_PREDICT_URL || DEFAULT_PREDICT_URL;
};

export const CLASS_LABELS = [
  'MEL', 
  'NV', 
  'BCC', 
  'AKIEC', 
  'BKL', 
  'DF', 
  'VASC', 
  'SCC', 
  'Not confident'
];

export const CLASS_FULL_NAMES: { [key: string]: string } = {
  'MEL': 'Melanoma',
  'NV': 'Melanocytic nevus',
  'BCC': 'Basal cell carcinoma',
  'AKIEC': 'Actinic keratosis',
  'BKL': 'Benign keratosis',
  'DF': 'Dermatofibroma',
  'VASC': 'Vascular lesion',
  'SCC': 'Squamous cell carcinoma',
  'Not confident': 'Uncertain prediction'
};

export const CLASS_DESCRIPTIONS: { [key: string]: string } = {
  'MEL': 'A serious form of skin cancer that develops from pigment-producing cells',
  'NV': 'A common benign mole formed by clusters of pigment cells',
  'BCC': 'The most common type of skin cancer, usually slow-growing',
  'AKIEC': 'A rough, scaly patch caused by sun damage that may become cancerous',
  'BKL': 'A non-cancerous growth that appears with age',
  'DF': 'A harmless firm bump that often appears on the legs',
  'VASC': 'Abnormal blood vessel growths in the skin',
  'SCC': 'A common form of skin cancer from squamous cells',
  'Not confident': 'The model is uncertain about this classification'
};

export const getPredictionLabel = (prediction: number): string => {
  if (prediction >= 0 && prediction < CLASS_LABELS.length) {
    return CLASS_LABELS[prediction];
  }
  return 'Unknown';
};

export const isConfident = (maxConfidence: number): boolean => {
  return maxConfidence >= 0.5;
};

export const compressImage = (base64String: string, quality: number = 0.7, maxWidth: number = 800): Promise<string> => {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      // Calculate new dimensions
      let { width, height } = img;
      if (width > maxWidth) {
        height = (height * maxWidth) / width;
        width = maxWidth;
      }
      
      canvas.width = width;
      canvas.height = height;
      
      // Draw and compress
      ctx?.drawImage(img, 0, 0, width, height);
      const compressedBase64 = canvas.toDataURL('image/jpeg', quality);
      resolve(compressedBase64);
    };
    img.src = base64String;
  });
};

export const normalizeImageBlob = async (
  blob: Blob,
  opts: { maxSide?: number; quality?: number } = {}
): Promise<Blob> => {
  const maxSide = opts.maxSide ?? 1024;
  const quality = opts.quality ?? 0.85;

  // Decode
  let width: number;
  let height: number;
  let drawSource: CanvasImageSource;

  if (typeof createImageBitmap === 'function') {
    const bitmap = await createImageBitmap(blob);
    width = bitmap.width;
    height = bitmap.height;
    drawSource = bitmap;
    try {
      // Resize
      const scale = Math.min(1, maxSide / Math.max(width, height));
      const targetW = Math.max(1, Math.round(width * scale));
      const targetH = Math.max(1, Math.round(height * scale));

      const canvas = document.createElement('canvas');
      canvas.width = targetW;
      canvas.height = targetH;

      const ctx = canvas.getContext('2d');
      if (!ctx) return blob;

      ctx.drawImage(drawSource, 0, 0, targetW, targetH);

      // Encode as JPEG
      const out = await new Promise<Blob>((resolve) => {
        canvas.toBlob((b) => resolve(b ?? blob), 'image/jpeg', quality);
      });

      return out;
    } finally {
      bitmap.close();
    }
  }

  // Fallback path (older browsers): decode via <img>
  const objectUrl = URL.createObjectURL(blob);
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const el = new Image();
      el.onload = () => resolve(el);
      el.onerror = () => reject(new Error('Failed to decode image'));
      el.src = objectUrl;
    });

    width = img.naturalWidth;
    height = img.naturalHeight;
    drawSource = img;

    const scale = Math.min(1, maxSide / Math.max(width, height));
    const targetW = Math.max(1, Math.round(width * scale));
    const targetH = Math.max(1, Math.round(height * scale));

    const canvas = document.createElement('canvas');
    canvas.width = targetW;
    canvas.height = targetH;

    const ctx = canvas.getContext('2d');
    if (!ctx) return blob;

    ctx.drawImage(drawSource, 0, 0, targetW, targetH);

    const out = await new Promise<Blob>((resolve) => {
      canvas.toBlob((b) => resolve(b ?? blob), 'image/jpeg', quality);
    });

    return out;
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
};

export const getPredictionFromBlob = async (
  imageBlob: Blob,
  filename: string = 'image.jpg'
): Promise<PredictionResponse> => {
  const formData = new FormData();
  formData.append('file', imageBlob, filename);

  const response = await fetch(getPredictUrl(), {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    const responseText = await response.text().catch(() => '');
    throw new Error(`API error: ${response.status} ${responseText}`);
  }

  return await response.json();
};

export const getPrediction = async (imageBase64: string): Promise<PredictionResponse> => {
  try {
    // Remove data URL prefix if it exists
    const base64Data = imageBase64.includes('base64,') 
      ? imageBase64.split('base64,')[1] 
      : imageBase64;
    
    // Create a Blob from the base64 data
    const byteCharacters = atob(base64Data);
    const byteArray = new Uint8Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
      byteArray[i] = byteCharacters.charCodeAt(i);
    }

    const blob = new Blob([byteArray], { type: 'image/jpeg' });
    return await getPredictionFromBlob(blob, 'image.jpg');
  } catch (error) {
    console.error('Error getting prediction:', error);
    throw error;
  }
};

export const captureImage = async (videoRef: React.RefObject<HTMLVideoElement | null>): Promise<string> => {
  return new Promise((resolve, reject) => {
    try {
      const video = videoRef.current;
      if (!video) {
        console.error('Video element not found');
        reject(new Error('Video element not found'));
        return;
      }

      // Check if video has valid dimensions
      const videoWidth = video.videoWidth;
      const videoHeight = video.videoHeight;
      
      console.log('Video dimensions:', videoWidth, 'x', videoHeight);
      
      if (videoWidth === 0 || videoHeight === 0) {
        console.error('Video dimensions are invalid (0x0)');
        reject(new Error('Cannot capture from video stream with 0 dimensions'));
        return;
      }

      const canvas = document.createElement('canvas');
      canvas.width = videoWidth;
      canvas.height = videoHeight;
      
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        console.error('Could not get canvas context');
        reject(new Error('Could not get canvas context'));
        return;
      }
      
      // Try to capture the frame
      try {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        
        // Try to get data URL
        try {
          const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
          console.log('Successfully captured image');
          resolve(dataUrl);
        } catch (toDataUrlError) {
          console.error('Error converting to data URL:', toDataUrlError);
          
          // Fallback to blob
          canvas.toBlob((blob) => {
            if (!blob) {
              reject(new Error('Failed to create blob from canvas'));
              return;
            }
            
            const reader = new FileReader();
            reader.onloadend = () => {
              const base64data = reader.result as string;
              resolve(base64data);
            };
            reader.onerror = () => {
              reject(new Error('Error reading blob data'));
            };
            reader.readAsDataURL(blob);
          }, 'image/jpeg', 0.8);
        }
      } catch (drawError) {
        console.error('Error drawing to canvas:', drawError);
        reject(new Error('Error drawing video to canvas, possibly due to security restrictions'));
      }
    } catch (error) {
      console.error('Unexpected error in capture:', error);
      reject(error);
    }
  });
};
