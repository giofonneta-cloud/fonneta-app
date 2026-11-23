-- =====================================================================
-- PRP-001: bucket `providers` privado.
-- APLICAR SOLO DESPUÉS de desplegar /api/documents/view (convierte las URLs públicas
-- antiguas en URLs firmadas de 60 s tras validar sesión y propiedad).
-- =====================================================================
UPDATE storage.buckets
SET public = false,
    file_size_limit = 10485760, -- 10 MB
    allowed_mime_types = ARRAY['application/pdf', 'image/png', 'image/jpeg']
WHERE id = 'providers';
