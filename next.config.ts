import type { NextConfig } from 'next';
import { networkInterfaces } from 'node:os';
const localAddresses = Object.values(networkInterfaces()).flat()
  .filter(address => address && !address.internal && address.family === 'IPv4')
  .map(address => address!.address);
const config: NextConfig = {
  reactStrictMode: true,
  allowedDevOrigins: ['127.0.0.1', ...localAddresses],
  outputFileTracingIncludes: {
    '/api/certificates/*': ['./node_modules/@fontsource/noto-sans-devanagari/files/noto-sans-devanagari-devanagari-400-normal.woff'],
  },
};
export default config;
