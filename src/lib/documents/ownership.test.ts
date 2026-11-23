import { describe, expect, it } from 'vitest'
import { userOwnsDriveFile, userOwnsStoragePath } from './ownership'

const ctx = { userId: '11111111-aaaa-bbbb-cccc-222222222222', providerDocumentNumbers: ['900123456'] }

describe('userOwnsDriveFile', () => {
  it("allows files inside the user's own provider folder", () => {
    expect(userOwnsDriveFile(['RUT_x.pdf', 'Documentos', '900123456_Mi Empresa', 'Proveedores'], ctx)).toBe(true)
    expect(userOwnsDriveFile(['F1.pdf', 'Releases', 'Documentos', '900123456_Mi Empresa', 'Proveedores'], ctx)).toBe(true)
  })

  it('allows the legacy SIN-NIT_<nit> folder naming', () => {
    expect(userOwnsDriveFile(['RUT.pdf', 'Documentos', 'SIN-NIT_900123456', 'Proveedores'], ctx)).toBe(true)
  })

  it("denies another provider's folder, even with a similar NIT prefix", () => {
    expect(userOwnsDriveFile(['RUT.pdf', 'Documentos', '900999999_Otra SAS', 'Proveedores'], ctx)).toBe(false)
    expect(userOwnsDriveFile(['RUT.pdf', 'Documentos', '9001234567_Otra SAS', 'Proveedores'], ctx)).toBe(false)
  })

  it('denies files that are not under Proveedores', () => {
    expect(userOwnsDriveFile(['x.pdf', '900123456_Mi Empresa', 'Otra'], ctx)).toBe(false)
    expect(userOwnsDriveFile(['x.pdf'], ctx)).toBe(false)
  })

  it('allows only my own legalización supports', () => {
    expect(userOwnsDriveFile(['soporte_11111111_17000.pdf', '20261123', 'Legalizaciones'], ctx)).toBe(true)
    expect(userOwnsDriveFile(['soporte_11111111_17000.pdf', '20261123', 'Otra'], ctx)).toBe(false)
    expect(userOwnsDriveFile(['soporte_99999999_17000.pdf', 'Legalizaciones'], ctx)).toBe(false)
  })

  it('denies everything for a user without providers', () => {
    expect(userOwnsDriveFile(['RUT.pdf', 'Documentos', '900123456_Mi Empresa', 'Proveedores'], { ...ctx, providerDocumentNumbers: [] })).toBe(false)
  })
})

describe('userOwnsStoragePath', () => {
  it('matches the owner folder only', () => {
    expect(userOwnsStoragePath('documents/abc/RUT.pdf', ['abc'])).toBe(true)
    expect(userOwnsStoragePath('documents/other/RUT.pdf', ['abc'])).toBe(false)
    expect(userOwnsStoragePath('private/abc/RUT.pdf', ['abc'])).toBe(false)
  })
})
