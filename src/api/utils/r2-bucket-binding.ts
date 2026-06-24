import { env } from 'cloudflare:workers';

export function getR2Bucket(): R2Bucket | null {
  return (env as { BUCKET?: R2Bucket }).BUCKET ?? null;
}
