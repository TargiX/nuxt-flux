export interface GeneratedImageData {
  imageUrl: string;
  promptText?: string;
  dreamId: number;
  graphState: any; // Or a more specific type for your dream's graph state
}

export const saveGeneratedImage = async (imageData: GeneratedImageData) => {
  try {
    const response = await $fetch('/api/images', {
      method: 'POST',
      body: imageData,
    });
    return response;
  } catch (error: any) {
    console.error('Error saving image via service:', error);
    // You might want to throw a more specific error or handle it based on your app's needs
    throw new Error(error.data?.message || 'Failed to save image. Please try again.');
  }
}; 