-- Add nota_credito column to ventas table
ALTER TABLE ventas ADD COLUMN nota_credito BOOLEAN DEFAULT FALSE NOT NULL;

-- Add comment for clarity
COMMENT ON COLUMN ventas.nota_credito IS 'Marca si la venta fue objeto de una nota de crédito (retractada)';
