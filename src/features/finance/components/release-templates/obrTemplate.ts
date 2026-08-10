import type { PurchaseOrder } from '../../types/purchase-order.types';
import type { Provider } from '@/features/providers/types/provider.types';
import type { MarcaRelease, ReleaseObrCampos, ReleaseObra } from '../../types/release-document.types';
import { buildReleaseLetterhead, buildReleaseFooter, RELEASE_BASE_STYLES } from './releaseShared';

export interface ObrTemplateParams {
    marca: MarcaRelease;
    releaseNumber: string;
    campos: ReleaseObrCampos;
    po?: PurchaseOrder | null;
    provider?: Provider | null;
}

const fmtCOP = (n: number) =>
    new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(n);

const TIPOS_OBRA: ReleaseObra['tipo_obra'][] = ['Fotográfica', 'Audiovisual', 'Literaria', 'Artística', 'Otro'];

function obraRow(o: ReleaseObra): string {
    const tipo = o.tipo_obra === 'Otro' && o.tipo_obra_otro ? `Otro: ${o.tipo_obra_otro}` : o.tipo_obra;
    return `<tr><td>${tipo}</td><td>${o.nombre_descripcion}</td><td>${o.autor}</td><td>${o.producto_editorial}</td></tr>`;
}

export function buildObrReleaseHTML({ marca, releaseNumber, campos }: ObrTemplateParams): string {
    const obrasRows = campos.obras.map(obraRow).join('');
    const tipoCheck = (t: 'fonograma' | 'obra') => (campos.tipo_derecho === t ? '&#9746;' : '&#9744;');

    return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8" /><style>${RELEASE_BASE_STYLES}</style></head>
<body>
  ${buildReleaseLetterhead(marca, 'Autorización Uso y Publicación de Obras y/o Fonogramas', releaseNumber)}

  <p>Yo <strong>${campos.autor_nombre}</strong>, identificado(a) como aparece al pie de mi firma, actuando en nombre propio ${!campos.representa_sociedad ? '&#9746;' : '&#9744;'} o en representación legal de la sociedad <strong>${campos.representa_sociedad || '_______________________'}</strong> ${campos.representa_sociedad ? '&#9746;' : '&#9744;'}, en calidad de autor y/o titular de los derechos patrimoniales sobre la obra que a continuación se describe, por medio de este documento AUTORIZO a PUBLICACIONES SEMANA S.A., FONNETA COMUNICACIONES S.A.S y a las empresas que hacen parte de su Grupo Empresarial (en adelante &ldquo;SEMANA&rdquo; y &ldquo;FONNETA&rdquo;), para reproducir, comunicar públicamente, licenciar, distribuir, sincronizar, transformar, poner a disposición de terceros, la inclusión en obras derivadas compilatorias. Esta autorización se otorga para un único uso, para todos los países del mundo, incluyendo pero sin limitarse en medios digitales, redes sociales, medios magnetofónicos, metaverso, satelitales, intranet, internet, copias fijadas en físico (incluyendo prensa impresa), plataformas de distribución musical o podcast, de streaming, televisión, redes sociales, web o cine u otros medios físicos, digitales o analógicos conocidos. Estas obras serán empleadas en marco de la activación de la campaña denominada:</p>

  <p style="font-weight:700; border-bottom:1px solid #9ca3af; padding-bottom:4px;">${campos.nombre_campana}</p>

  <p style="font-size:10.5px;">${tipoCheck('fonograma')}&nbsp; Fonograma <span style="font-style:italic; color:#6b7280;">(fijaciones o grabaciones de sonido o voz)</span> &nbsp;&nbsp;&nbsp; ${tipoCheck('obra')}&nbsp; Obra</p>

  <table>
    <thead>
      <tr><th>Tipo de Obra</th><th>Nombre de la obra y/o descripción</th><th>Autor</th><th>Producto editorial de Semana donde se publica</th></tr>
    </thead>
    <tbody>${obrasRows}</tbody>
  </table>

  <p>Declaro que cuento con los derechos y autorizaciones de imagen en los eventos en que las obras descritas en la tabla anterior involucren la imagen o voz de personas, o de los titulares de derechos patrimoniales de autor o conexos en caso de que se fijen interpretaciones, ejecuciones, fonogramas, retransmisiones, o se sincronicen o incorporen obras de terceros, por lo tanto, no existe impedimento de ninguna naturaleza para realizar la entrega de los derechos patrimoniales de autor sobre estas obras a favor de SEMANA Y FONNETA, sin limitación de uso, territorial o temporal alguna; y mantendré indemne a SEMANA Y FONNETA por cualquier reclamación o litigio derivado de las obras incluidas, imagen, voz o derechos conexos derivados de las obras descritas en la tabla.</p>

  <p>La presente autorización de uso se otorga a título:</p>
  <p style="font-size:10.5px;">
    ${campos.forma_pago === 'gratuito' ? '&#9746;' : '&#9744;'}&nbsp; Gratuito &nbsp;&nbsp;&nbsp;
    ${campos.forma_pago === 'oneroso' ? '&#9746;' : '&#9744;'}&nbsp; Oneroso por un valor de <strong>${campos.forma_pago === 'oneroso' && campos.valor_pago ? fmtCOP(campos.valor_pago) : '________________'}</strong>
  </p>

  <p>Adicionalmente, reconozco que el fuero legal del presente contrato es el de la República de Colombia, por lo cual renuncio expresamente a cualquier otro fuero legal, tribunal o jurisdicción diferente, para la resolución de disputas relativas a materias de derecho de autor, conexos o imagen. En caso de que la entrega se realice mediante el uso de redes globales o internet, ratifico que garantizaré que la remisión de las obras se efectúa a través de proveedores de servicios de conectividad colombianos; de lo contrario, acepto que cualquier controversia se someta a las disposiciones legales colombianas en materia de propiedad intelectual y derechos afines.</p>

  <p>De igual forma, autorizo el tratamiento de mis datos personales en los sistemas de información de SEMANA Y FONNETA para finalidades de consulta y gestiones comerciales, así como los demás propósitos y prerrogativas detalladas en la &ldquo;Política de tratamiento de información personal&rdquo; publicada en: https://s3-aws-semana.s3.amazonaws.com/semana/upload/legal/habeas-data.pdf</p>

  <p>En constancia de aceptación y conformidad, se suscribe el presente instrumento a los <span style="border-bottom:1px solid #9ca3af;">&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</span> días del mes de <span style="border-bottom:1px solid #9ca3af;">&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</span> del año <span style="border-bottom:1px solid #9ca3af;">&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</span>.</p>

  <p>Atentamente,</p>

  <div class="sign-box">
    <div class="row"><span class="label">Firma:</span><span class="line"></span></div>
    <div class="row"><span class="label">C.C. No.:</span><span class="line"></span></div>
    <div class="row"><span class="label">Correo electrónico:</span><span class="line"></span></div>
    <div class="row"><span class="label">Teléfono:</span><span class="line"></span></div>
  </div>

  ${buildReleaseFooter()}
</body>
</html>
  `;
}
