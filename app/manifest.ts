import type { MetadataRoute } from 'next';
export default function manifest(): MetadataRoute.Manifest {
  return { name: 'MahaCare Field Inspections', short_name: 'MahaCare', description: 'Demo registry and offline field inspection workspace', start_url: '/field', display: 'standalone', background_color: '#f5f7f9', theme_color: '#0d9488', icons: [{ src: '/app-icon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any' }] };
}
