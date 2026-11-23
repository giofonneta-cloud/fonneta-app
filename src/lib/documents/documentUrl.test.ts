import { describe, expect, it } from 'vitest'
import { isManagedDocumentUrl, parseDocumentUrl, secureDocUrl } from './documentUrl'

const SUPABASE = 'https://abc123.supabase.co'

describe('parseDocumentUrl', () => {
  it('extracts the Drive file id from view and open links', () => {
    expect(parseDocumentUrl('https://drive.google.com/file/d/1AbCdEfGhIjKlMnOp/view?usp=drivesdk')).toEqual({
      kind: 'drive',
      fileId: '1AbCdEfGhIjKlMnOp',
    })
    expect(parseDocumentUrl('https://drive.google.com/open?id=1AbCdEfGhIjKlMnOp')).toEqual({
      kind: 'drive',
      fileId: '1AbCdEfGhIjKlMnOp',
    })
  })

  it('parses Supabase storage URLs only for the project host', () => {
    const url = `${SUPABASE}/storage/v1/object/public/providers/documents/u1/RUT.pdf`
    expect(parseDocumentUrl(url, SUPABASE)).toEqual({ kind: 'storage', bucket: 'providers', path: 'documents/u1/RUT.pdf' })
    expect(parseDocumentUrl('https://evil.supabase.co/storage/v1/object/public/providers/x.pdf', SUPABASE)).toBeNull()
  })

  it('rejects non-https, foreign hosts and garbage', () => {
    expect(parseDocumentUrl('http://drive.google.com/file/d/1AbCdEfGhIjKlMnOp/view')).toBeNull()
    expect(parseDocumentUrl('https://evil.example.com/file/d/1AbCdEfGhIjKlMnOp/view')).toBeNull()
    expect(parseDocumentUrl('not a url')).toBeNull()
  })
})

describe('secureDocUrl', () => {
  it('routes managed URLs through the authenticated viewer', () => {
    const drive = 'https://drive.google.com/file/d/1AbCdEfGhIjKlMnOp/view'
    expect(isManagedDocumentUrl(drive)).toBe(true)
    expect(secureDocUrl(drive)).toBe(`/api/documents/view?u=${encodeURIComponent(drive)}`)
  })

  it('leaves external and empty URLs untouched', () => {
    expect(secureDocUrl('https://example.com/factura.pdf')).toBe('https://example.com/factura.pdf')
    expect(secureDocUrl(null)).toBeUndefined()
    expect(secureDocUrl('')).toBeUndefined()
  })
})
