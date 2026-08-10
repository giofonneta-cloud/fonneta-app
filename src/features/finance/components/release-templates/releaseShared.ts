import { FONNETA_LOGO_B64 } from '@/shared/lib/pdf/fonnetaLogoBase64';
import type { MarcaRelease } from '../../types/release-document.types';

type BrandMark =
    | { type: 'image'; src: string }
    | { type: 'text'; label: string; style: string };

/**
 * Marca de marca en el encabezado de cada Release.
 * Solo FONNETA tiene un logo real embebido (public/logo.png). El resto de
 * marcas (SOHO, FUSCIA, MONICA J, CLUB INDOMITAS) no tienen un archivo de
 * logo disponible en el repo todavía, así que se muestran como wordmark de
 * texto estilizado hasta que se provean los archivos reales.
 */
export const BRAND_MARKS: Record<MarcaRelease, BrandMark> = {
    FONNETA: { type: 'image', src: FONNETA_LOGO_B64 },
    SOHO: { type: 'text', label: 'SoHo', style: 'font-style:italic;font-weight:700;font-size:22px;letter-spacing:.02em;color:#111827;' },
    FUSCIA: { type: 'text', label: 'FUCSIA', style: 'font-weight:900;letter-spacing:.12em;font-size:18px;color:#d6006b;' },
    'MONICA J': { type: 'text', label: 'MÓNICA J', style: 'font-family:Georgia,serif;font-weight:600;letter-spacing:.05em;font-size:18px;color:#111827;' },
    'CLUB INDOMITAS': { type: 'text', label: 'CLUB INDÓMITAS', style: 'font-weight:800;text-transform:uppercase;letter-spacing:.08em;font-size:15px;color:#7c1d1d;' },
};

function renderBrandMark(marca: MarcaRelease): string {
    const mark = BRAND_MARKS[marca];
    if (mark.type === 'image') {
        return `<img src="${mark.src}" alt="${marca}" style="width:36px; height:auto;" />`;
    }
    return `<span style="${mark.style}">${mark.label}</span>`;
}

export function buildReleaseLetterhead(marca: MarcaRelease, releaseTitle: string, releaseNumber: string): string {
    return `
    <div style="display:flex; justify-content:space-between; align-items:flex-start; padding-bottom:10px; border-bottom:3px solid #111827;">
      <div style="display:flex; align-items:center; gap:8px;">
        <img src="${FONNETA_LOGO_B64}" alt="Fonneta" style="width:32px; height:auto;" />
        <span style="font-weight:800; font-size:14px; color:#111827;">FONNETA<br/><span style="font-weight:400; font-size:10px; letter-spacing:.05em;">Comunicaciones</span></span>
      </div>
      <div>${renderBrandMark(marca)}</div>
    </div>
    <div style="font-size:10px; color:#374151; margin-top:4px;">NIT 901.362.051-7</div>
    <div style="text-align:right; font-size:10px; color:#6b7280; margin-top:-14px;">Ref. interna: ${releaseNumber}</div>
    <h1 style="text-align:center; font-size:14px; font-weight:800; margin:18px 0 16px; text-transform:uppercase; color:#111827;">${releaseTitle}</h1>
  `;
}

export function buildReleaseFooter(): string {
    return `
    <div style="border-top:2px solid #111827; margin-top:24px; padding-top:8px; text-align:center; font-size:9px; color:#6b7280;">
      Documento confidencial - Uso interno y de archivo comercial<br/>
      administrativo@fonneta.com &middot; Cra 6 N&deg; 123 A - 74 Bogot&aacute; D.C. &middot; +57 3182544377
    </div>
  `;
}

const MESES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];

export function fechaEnPalabras(iso?: string): { dia: string; mes: string; anio: string } | null {
    if (!iso) return null;
    const [y, m, d] = iso.split('-').map(Number);
    if (!y || !m || !d) return null;
    return { dia: String(d), mes: MESES[m - 1] ?? '', anio: String(y) };
}

export const RELEASE_BASE_STYLES = `
  body { font-family: Arial, sans-serif; color:#1f2937; font-size:11.5px; line-height:1.5; padding: 20px 28px; }
  p { text-align: justify; }
  table { width:100%; border-collapse:collapse; margin:10px 0; }
  th, td { border:1px solid #111827; padding:6px 8px; font-size:10.5px; vertical-align:top; }
  th { background:#111827; color:#fff; text-transform:uppercase; font-size:9px; letter-spacing:.03em; }
  .field-row { display:flex; gap:6px; margin:4px 0; }
  .field-label { color:#374151; white-space:nowrap; }
  .field-value { font-weight:600; border-bottom:1px solid #9ca3af; flex:1; min-height:14px; }
  .sign-box { border:1px solid #111827; padding:8px; margin-top:6px; }
  .sign-box .row { display:flex; gap:6px; margin:6px 0; }
  .sign-box .row .label { font-weight:700; min-width:110px; }
  .sign-box .row .line { flex:1; border-bottom:1px solid #9ca3af; min-height:14px; }
`;
