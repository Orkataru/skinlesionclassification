export type PredictionResponse = {
  max_confidence: number;
  prediction: number;
  probabilities: number[];
  gradcam?: string; // Base64 encoded Grad-CAM heatmap image
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

export const getPrediction = async (imageBase64: string): Promise<PredictionResponse> => {
  try {
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/2a1324a1-d3dd-4e63-97f4-5b0a585a16d2',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'api.ts:getPrediction:entry',message:'getPrediction called',data:{imageLength:imageBase64?.length},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'H5'})}).catch(()=>{});
    // #endregion
    
    // Remove data URL prefix if it exists
    const base64Data = imageBase64.includes('base64,') 
      ? imageBase64.split('base64,')[1] 
      : imageBase64;
    
    // Create a Blob from the base64 data
    const byteCharacters = atob(base64Data);
    const byteArrays = [];
    
    for (let i = 0; i < byteCharacters.length; i++) {
      byteArrays.push(byteCharacters.charCodeAt(i));
    }
    
    const byteArray = new Uint8Array(byteArrays);
    const blob = new Blob([byteArray], { type: 'image/jpeg' });
    
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/2a1324a1-d3dd-4e63-97f4-5b0a585a16d2',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'api.ts:getPrediction:blob',message:'Blob created',data:{blobSize:blob.size,blobType:blob.type},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'H5'})}).catch(()=>{});
    // #endregion
    
    // Create FormData and append the file
    const formData = new FormData();
    formData.append('file', blob, 'image.jpg');
    
    const response = await fetch('https://skin-lesion-service-286247711107.us-central1.run.app/predict', {
      method: 'POST',
      body: formData,
    });

    // #region agent log
    const responseText = await response.clone().text();
    fetch('http://127.0.0.1:7242/ingest/2a1324a1-d3dd-4e63-97f4-5b0a585a16d2',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'api.ts:getPrediction:response',message:'API response received',data:{status:response.status,statusText:response.statusText,ok:response.ok,responseBody:responseText.substring(0,500)},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'H2'})}).catch(()=>{});
    // #endregion

    if (!response.ok) {
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/2a1324a1-d3dd-4e63-97f4-5b0a585a16d2',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'api.ts:getPrediction:error',message:'API returned error',data:{status:response.status,body:responseText},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'H2'})}).catch(()=>{});
      // #endregion
      throw new Error(`API error: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/2a1324a1-d3dd-4e63-97f4-5b0a585a16d2',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'api.ts:getPrediction:catch',message:'Exception caught',data:{error:String(error),errorName:(error as Error)?.name},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'H5'})}).catch(()=>{});
    // #endregion
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
