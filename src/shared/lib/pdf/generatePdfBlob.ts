/**
 * Genera un Blob PDF desde HTML usando html2pdf.js (client-side).
 * Reutilizado por cualquier flujo que construya un documento imprimible
 * (Órdenes de Compra, Releases, etc.) para evitar reimplementar el
 * workaround de renderizado.
 */
export async function generatePdfBlob(html: string): Promise<Blob> {
    // html2pdf.js mueve su contenedor a coords negativas ANTES de llamar html2canvas
    // → Chrome no pinta esa área → canvas en blanco.
    // Fix: usar onclone de html2canvas para reposicionar el contenedor en el
    // documento clonado (antes del pintado) a position:fixed top:0 left:0,
    // así Chrome lo pinta correctamente y html2pdf puede aplicar sus page-breaks.
    let html2pdf;
    try {
        const module = await import('html2pdf.js');
        html2pdf = module.default;
    } catch (error) {
        const err = error as Error;
        if (err.name === 'ChunkLoadError' || err.message.includes('Failed to load chunk')) {
            throw new Error('La plataforma ha sido actualizada. Por favor, recarga la página (F5 o Ctrl+R) e intenta nuevamente.');
        }
        throw err;
    }

    const container = document.createElement('div');
    container.innerHTML = html;
    document.body.appendChild(container);

    try {
        // El paquete html2pdf.js publica su propio type.d.ts (node_modules/html2pdf.js/type.d.ts)
        // que no declara `pagebreak`, aunque el runtime sí lo soporta. Como esos tipos empaquetados
        // tienen prioridad sobre cualquier .d.ts ambiental propio, se castea puntualmente aquí.
        const options = {
            margin: [10, 10, 10, 10] as [number, number, number, number],
            filename: 'documento.pdf',
            image: { type: 'jpeg' as const, quality: 0.95 },
            html2canvas: {
                scale: 2,
                useCORS: true,
                logging: false,
                scrollX: 0,
                scrollY: 0,
                // onclone se ejecuta en el doc clonado, ANTES de que html2canvas pinte.
                // html2pdf habrá movido el container a coords negativas; aquí lo devolvemos
                // al viewport (0,0) para que Chrome lo renderice correctamente.
                onclone: (_clonedDoc: Document, element: HTMLElement) => {
                    element.style.position = 'fixed';
                    element.style.left = '0';
                    element.style.top = '0';
                },
            },
            jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' as const },
            pagebreak: { mode: ['css', 'legacy'] },
        };
        const blob: Blob = await html2pdf()
            .set(options)
            .from(container)
            .outputPdf('blob');
        return blob;
    } finally {
        document.body.removeChild(container);
    }
}
