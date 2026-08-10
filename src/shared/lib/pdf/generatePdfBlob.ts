interface GeneratePdfOptions {
    // Estampa "N de M páginas" al pie de cada página (para documentos legales).
    pageNumbers?: boolean;
}

// Interfaz mínima del objeto jsPDF que expone html2pdf vía .get('pdf').
interface JsPdfLike {
    internal: {
        getNumberOfPages(): number;
        pageSize: { getWidth(): number; getHeight(): number };
    };
    setPage(n: number): void;
    setFontSize(n: number): void;
    setTextColor(r: number, g?: number, b?: number): void;
    text(txt: string, x: number, y: number, opts?: { align?: string }): void;
    output(type: string): Blob;
}

/**
 * Genera un Blob PDF desde HTML usando html2pdf.js (client-side).
 * Reutilizado por cualquier flujo que construya un documento imprimible
 * (Órdenes de Compra, Releases, etc.) para evitar reimplementar el
 * workaround de renderizado.
 */
export async function generatePdfBlob(html: string, opts?: GeneratePdfOptions): Promise<Blob> {
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
        const worker = html2pdf().set(options).from(container);

        if (opts?.pageNumbers) {
            // Renderiza el PDF y estampa "N de M páginas" en cada página vía jsPDF.
            const pdf = (await worker.toPdf().get('pdf')) as JsPdfLike;
            const total = pdf.internal.getNumberOfPages();
            const width = pdf.internal.pageSize.getWidth();
            const height = pdf.internal.pageSize.getHeight();
            for (let i = 1; i <= total; i++) {
                pdf.setPage(i);
                pdf.setFontSize(8);
                pdf.setTextColor(120, 120, 120);
                pdf.text(`${i} de ${total} páginas`, width / 2, height - 5, { align: 'center' });
            }
            return pdf.output('blob');
        }

        const blob: Blob = await worker.outputPdf('blob');
        return blob;
    } finally {
        document.body.removeChild(container);
    }
}
