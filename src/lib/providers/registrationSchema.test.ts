import { describe, expect, it } from 'vitest'
import { detectMime, registrationSchema, MIN_PASSWORD_LENGTH } from './registrationSchema'

const validInput = {
  business_name: 'Imprenta Los Andes S.A.S',
  person_type: 'juridica',
  document_type: 'nit',
  document_number: '900123456-7',
  contact_name: 'Ana Pérez',
  contact_email: 'Ana@Empresa.com',
  contact_phone: '+57 300 123 4567',
  billing_email: 'facturas@empresa.com',
  password: 'una-clave-larga-123',
  address: 'Calle 1 # 2-3',
  country: 'Colombia',
  department: 'Antioquia',
  city: 'Medellín',
  terms_accepted: 'true',
}

describe('registrationSchema', () => {
  it('accepts a valid registration and normalizes emails', () => {
    // Arrange / Act
    const result = registrationSchema.safeParse(validInput)

    // Assert
    expect(result.success).toBe(true)
    if (result.success) expect(result.data.contact_email).toBe('ana@empresa.com')
  })

  it('rejects short passwords', () => {
    const result = registrationSchema.safeParse({ ...validInput, password: 'x'.repeat(MIN_PASSWORD_LENGTH - 1) })
    expect(result.success).toBe(false)
  })

  it('requires terms acceptance', () => {
    expect(registrationSchema.safeParse({ ...validInput, terms_accepted: 'false' }).success).toBe(false)
    const { terms_accepted: _omit, ...withoutTerms } = validInput
    expect(registrationSchema.safeParse(withoutTerms).success).toBe(false)
  })

  it('ignores a client-supplied role (it is never part of the schema)', () => {
    const result = registrationSchema.safeParse({ ...validInput, role: 'admin' })
    expect(result.success).toBe(true)
    if (result.success) expect('role' in result.data).toBe(false)
  })

  it('rejects malformed document numbers', () => {
    expect(registrationSchema.safeParse({ ...validInput, document_number: "9001'; DROP TABLE" }).success).toBe(false)
  })
})

describe('detectMime', () => {
  it('recognizes PDF, PNG and JPEG by signature', () => {
    expect(detectMime(Buffer.from('%PDF-1.7 ...'))).toBe('application/pdf')
    expect(detectMime(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00]))).toBe('image/png')
    expect(detectMime(Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0x00]))).toBe('image/jpeg')
  })

  it('rejects executables and scripts disguised with a safe extension', () => {
    expect(detectMime(Buffer.from('MZ\x90\x00'))).toBeNull()
    expect(detectMime(Buffer.from('<script>alert(1)</script>'))).toBeNull()
    expect(detectMime(Buffer.alloc(0))).toBeNull()
  })
})
