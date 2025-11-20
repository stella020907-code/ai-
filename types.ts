
export enum ImageStatus {
  PENDING = 'pending',
  GENERATING = 'generating',
  SUCCESS = 'success',
  ERROR = 'error',
}

export interface GeneratedImage {
  id: number;
  prompt: string;
  src: string | null;
  status: ImageStatus;
  category: 'professional' | 'casual' | 'high-fashion';
}

export interface UploadedImage {
  base64: string;
  mimeType: string;
  objectUrl: string;
}

export interface Prompt {
  text: string;
  category: 'professional' | 'casual' | 'high-fashion';
  gender: 'female' | 'male' | 'unisex';
}