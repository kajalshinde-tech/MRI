import { networkInterfaces } from 'node:os';

/** QR links must be reachable from a phone, not point to the phone's localhost. */
export function publicOrigin(requestOrigin: string): string {
  const configured = process.env.NEXT_PUBLIC_SITE_URL;
  if (configured) return new URL(configured).origin;
  const origin = new URL(requestOrigin);
  if (!['localhost', '127.0.0.1', '[::1]'].includes(origin.hostname)) return origin.origin;
  const addresses = Object.values(networkInterfaces()).flat().filter(a => a && !a.internal && a.family === 'IPv4');
  const address = addresses.find(a => a!.address.startsWith('192.168.')) || addresses.find(a => a!.address.startsWith('10.'));
  if (address) origin.hostname = address.address;
  return origin.origin;
}
