import type { InspectionPhoto } from './types';

export function readAttachment(file: File): Promise<string> {
  if (!['application/pdf', 'image/jpeg', 'image/png', 'image/webp'].includes(file.type)) return Promise.reject(new Error('Choose a PDF, JPEG, PNG or WebP file.'));
  if (file.size > 500_000) return Promise.reject(new Error('Choose a document smaller than 500 KB.'));
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error('Unable to read the file.'));
    reader.readAsDataURL(file);
  });
}

export async function inspectionPhoto(file: File): Promise<InspectionPhoto> {
  if (!file.type.startsWith('image/') || file.size > 10_000_000) throw new Error('Choose an image smaller than 10 MB.');
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, 1000 / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  canvas.getContext('2d')!.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();
  const dataUrl = canvas.toDataURL('image/jpeg', 0.65);
  if (dataUrl.length > 450_000) throw new Error('This image is too detailed. Choose a smaller image.');
  return { id: crypto.randomUUID(), name: file.name, dataUrl, capturedAt: new Date().toISOString() };
}
