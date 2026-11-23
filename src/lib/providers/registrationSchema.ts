import { z } from 'zod';

export const TERMS_VERSION = '2026-11-23';
export const MAX_DOCUMENT_BYTES = 10 * 1024 * 1024; // 10 MB
export const MIN_PASSWORD_LENGTH = 10;

export const ALLOWED_DOCUMENT_MIMES = ['application/pdf', 'image/png', 'image/jpeg'] as const;
export type AllowedDocumentMime = (typeof ALLOWED_DOCUMENT_MIMES)[number];

const text = (min: number, max: number) => z.string().trim().min(min).max(max);

export const registrationSchema = z.object({
  business_name: text(2, 200),
  person_type: z.enum(['natural', 'juridica']),
  document_type: z.enum(['nit', 'cedula_ciudadania', 'cedula_extranjeria', 'pasaporte']),
  document_number: z.string().trim().min(4).max(20).regex(/^[A-Za-z0-9.\-\s]+$/),
  contact_name: text(2, 150),
  contact_email: z.string().trim().toLowerCase().email().max(200),
  contact_phone: z.string().trim().min(7).max(25).regex(/^[0-9+()\-\s]+$/),
  billing_email: z.string().trim().toLowerCase().email().max(200),
  password: z.string().min(MIN_PASSWORD_LENGTH).max(128),
  address: text(3, 250),
  country: text(2, 80),
  department: z.string().trim().max(80).optional().default(''),
  city: z.string().trim().max(80).optional().default(''),
  terms_accepted: z.literal('true'),
});

export type RegistrationInput = z.infer<typeof registrationSchema>;

/** Valida el contenido real del archivo (firma), no solo el MIME declarado por el cliente. */
export function detectMime(buffer: Buffer): AllowedDocumentMime | null {
  if (buffer.length >= 4 && buffer.subarray(0, 4).toString('latin1') === '%PDF') return 'application/pdf';
  if (buffer.length >= 8 && buffer.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) {
    return 'image/png';
  }
  if (buffer.length >= 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) return 'image/jpeg';
  return null;
}

export const EXTENSION_BY_MIME: Record<AllowedDocumentMime, string> = {
  'application/pdf': 'pdf',
  'image/png': 'png',
  'image/jpeg': 'jpg',
};
