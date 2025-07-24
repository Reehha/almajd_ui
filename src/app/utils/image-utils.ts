// src/app/utils/image-utils.ts

export async function fetchImageAsBase64(imageUrl: string): Promise<string> {
    const response = await fetch(imageUrl, { mode: 'cors' });
    if (!response.ok) throw new Error('Image fetch failed');
    const blob = await response.blob();
  
    return await new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  }
  