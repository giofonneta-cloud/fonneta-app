import type { PurchaseOrder } from '../../types/purchase-order.types';
import type { Provider } from '@/features/providers/types/provider.types';
import type { MarcaRelease, ReleaseCoeCampos } from '../../types/release-document.types';
import { buildReleaseLetterhead, buildReleaseFooter, RELEASE_BASE_STYLES, fechaEnPalabras } from './releaseShared';
import { valorEnLetrasCOP } from '@/shared/lib/numeroALetras';

export interface CoeTemplateParams {
    marca: MarcaRelease;
    releaseNumber: string;
    campos: ReleaseCoeCampos;
    po?: PurchaseOrder | null;
    provider?: Provider | null;
}

const fmtCOP = (n: number) =>
    new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(n);

export function buildCoeReleaseHTML({ marca, releaseNumber, campos }: CoeTemplateParams): string {
    const obrasRows = campos.obras.map((o) => `<tr><td>${o.descripcion}</td></tr>`).join('');
    const tipoCheck = (t: 'fonograma' | 'obra') => (campos.tipo_derecho === t ? '&#9746;' : '&#9744;');
    const valorTexto = `${fmtCOP(campos.valor_pago)} <em>(${valorEnLetrasCOP(campos.valor_pago)})</em>`;
    const f = fechaEnPalabras(campos.fecha_firma);

    return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8" /><style>${RELEASE_BASE_STYLES}</style></head>
<body>
  ${buildReleaseLetterhead(marca, 'Contrato de Obra por Encargo, Entrega de Fonogramas y Transferencia de Derechos', releaseNumber)}

  <p>Entre los suscritos, de una parte, <strong>${campos.encargado_nombre}</strong>, identificado(a) como aparece al pie de su firma (en adelante &ldquo;El ENCARGADO&rdquo;), y, de la otra, <strong>${campos.representante_fonneta}</strong>, identificado(a) como aparece al pie de su firma, actuando en calidad de Representante Legal/Apoderado(a) General de Fonneta Comunicaciones S.A.S. y Publicaciones Semana S.A.S (en adelante &ldquo;El ENCARGANTE&rdquo;) hemos decidido celebrar el presente contrato de obra por encargo, cuyo objeto principal es la creación de obras por parte del AUTOR ENCARGADO o la entrega de fonograma para el ENCARGANTE, dichas obras o fijaciones de sonido relacionadas y descritas a continuación:</p>

  <p style="font-size:10.5px;">${tipoCheck('fonograma')}&nbsp; Fonograma <span style="font-style:italic; color:#6b7280;">(fijaciones o grabaciones de sonido o voz)</span> &nbsp;&nbsp;&nbsp; ${tipoCheck('obra')}&nbsp; Obra</p>

  <table>
    <thead><tr><th>Tipo de obra o fonograma y breve descripción del mismo</th></tr></thead>
    <tbody>${obrasRows}</tbody>
  </table>

  <p>A través de este contrato, el AUTOR ENCARGADO de las obras o fonogramas antes relacionados, hace entrega formal y transfiere todos y cada uno de los derechos patrimoniales sobre las mismas a SEMANA. Las Partes reconocen que el presente contrato tiene como objeto una obra por encargo, por lo tanto, operan según lo establecido por la Ley 1450 de 2011 art. 28 y siguientes. En virtud del desarrollo del objeto del contrato, y de conformidad con el artículo 10 de la Decisión 351 del Acuerdo de Cartagena y los artículos 20 y 83 de la Ley 23 de 1982 modificado por la Ley 1450 de 2011, y las demás normas que los modifiquen, adicionen y/o reglamenten, la totalidad de los derechos patrimoniales de autor sobre todas las obras o fonogramas producidos o entregados por el ENCARGADO en desarrollo de este contrato se entienden desde el momento de su creación transferidos al ENCARGANTE para reproducir, comunicar públicamente, comercializar, distribuir, licenciar, sincronizar, transformar, importar o exportar, poner a disposición de terceros, o para cualquier otra forma de explotación onerosa o gratuita de las obras y/o fonogramas arriba descritas. Esta transferencia de derechos patrimoniales se otorga a FONNETA Y SEMANA, por el término de protección del derecho de autor sobre las obras en Colombia, para todos los países del mundo, incluyendo pero sin limitarse en medios digitales, redes sociales, de transferencia de datos, medios magnetofónicos, metaverso, satelitales, intranet, internet, copias fijadas en físico (incluyendo prensa impresa), plataformas de distribución musical o podcast, de streaming, televisión, redes sociales, web o cine u otros medios físicos, digitales o analógicos conocidos.</p>

  <p>El ENCARGANTE pagará al AUTOR ENCARGADO como retribución por la creación de las obras o fonogramas respectivos la suma de <strong>${valorTexto}</strong>.</p>

  <p>El AUTOR ENCARGADO manifiesta que las obras o fonogramas antes relacionadas fueron creadas por él o fijadas por encargo de FONNETA Y SEMANA y en estricto seguimiento de sus instrucciones, y se trata de creaciones originales que no violan derechos de terceros, y que para la realización de las mismas realizó la debida diligencia y recolección de autorizaciones de imagen en los eventos que las obras o fonogramas involucren la fijación de imagen o voz de personas o de los titulares de derechos conexos o de los autores en caso de que se fijen interpretaciones, ejecuciones, fonogramas, retransmisiones, o se sincronicen o incorporen obras de terceros, por lo tanto, no existe impedimento de ninguna naturaleza para realizar la entrega de los derechos patrimoniales de autor o conexos sobre estas obras o fonogramas a favor de FONNETA Y SEMANA, sin limitación territorial o temporal alguna. El AUTOR ENCARGADO mantendrá indemne a FONNETA Y SEMANA por cualquier reclamación o litigio derivado de las obras incluidas, imagen, voz o derechos conexos derivados de las obras o fonogramas.</p>

  <p>El AUTOR ENCARGADO actúa de manera independiente, sin ningún tipo de subordinación, directriz continuada, instrucción laboral por parte de FONNETA Y SEMANA, en cuanto a la forma, modo, tiempo o lugar respecto de las obras realizadas o fonogramas producidos.</p>

  <p>Asimismo, mediante este documento el AUTOR ENCARGADO ratifica que reconoce, entiende y acepta que todos y cada uno de los derechos patrimoniales de autor o conexos respecto de las obras o fonogramas antes relacionadas son de titularidad de FONNETA Y SEMANA, y que FONNETA Y SEMANA, o cualquier tercero que FONNETA Y SEMANA autorice, podrá explotarla en los términos del artículo 10 de la Decisión 351 del Acuerdo de Cartagena y los artículos 20 y 83 de la Ley 23 de 1982 modificado por la Ley 1450 de 2011.</p>

  <p>Igualmente, mediante la suscripción del presente contrato, el AUTOR ENCARGADO declara mantener indemne a FONNETA Y SEMANA frente a cualquier reclamación de terceros derivada del uso de las obras o fonogramas, en los diferentes territorios, tiempo, medios y marcas autorizadas, asumiendo directamente la defensa frente a cualquier autoridad judicial o administrativa, nacional o extranjera, así como frente a terceros, tanto en Colombia como en el exterior, por procesos, investigaciones, infracciones, reclamaciones u otros que tengan origen o se relacionen con el uso, la titularidad o contenido de las obras o fonogramas; así como frente a reclamaciones por parte de terceros que aleguen tener algún derecho de autor sobre las obras o fonogramas y/o imágenes o que se sientan perjudicados respecto de su imagen, intimidad, honra, reputación o buen nombre.</p>

  <p>El AUTOR ENCARGADO reconoce que el fuero legal del presente contrato es el de la República de Colombia, por lo cual renuncia expresamente a cualquier otro fuero legal, tribunal o jurisdicción diferente, para la resolución de disputas relativas a materias de derecho de autor, conexos o imagen. Entendiéndose que las obras que produzca el AUTOR ENCARGADO con ocasión de este contrato han sido creadas o entregadas en la República de Colombia. En caso de que la entrega se haga por internet, el AUTOR ENCARGADO ratifica que garantizará que la entrega de obras se hace desde proveedores de servicio de internet colombianos, caso contrario, acepta que cualquier disputa se efectúe según las normas colombianas de derecho de autor y derechos conexos.</p>

  <p>De igual forma, autorizo el tratamiento de mis datos personales en las bases de datos de FONNETA Y SEMANA para fines de consulta y fines comerciales, así como las demás finalidades y garantías descritas en la &ldquo;Política de tratamiento de datos personales&rdquo; disponible en: https://cdn.semana.com/semana/upload/legal/habeas-data.pdf</p>

  <p>El AUTOR ENCARGADO mantendrá bajo reserva, confidencialmente y sin revelación a terceras personas, toda la información confidencial que conozca o le sea suministrada por FONNETA Y SEMANA, en virtud del presente contrato.</p>

  <p>En señal de conformidad, se suscribe este documento, a los <strong>${f ? f.dia : '<span style="border-bottom:1px solid #9ca3af;">&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</span>'}</strong> días del mes de <strong>${f ? f.mes : '<span style="border-bottom:1px solid #9ca3af;">&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</span>'}</strong> del año <strong>${f ? f.anio : '<span style="border-bottom:1px solid #9ca3af;">&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</span>'}</strong>.</p>

  <div style="display:flex; gap:16px; margin-top:10px;">
    <div class="sign-box" style="flex:1;">
      <p style="font-weight:700; margin:0 0 6px;">Por el AUTOR ENCARGADO,</p>
      <div class="row"><span class="label">Nombre:</span><span class="line">${campos.encargado_nombre}</span></div>
      <div class="row"><span class="label">Firma:</span><span class="line"></span></div>
      <div class="row"><span class="label">C.C. No.:</span><span class="line"></span></div>
    </div>
    <div class="sign-box" style="flex:1;">
      <p style="font-weight:700; margin:0 0 6px;">Por FONNETA,</p>
      <div class="row"><span class="label">Firma:</span><span class="line"></span></div>
      <div class="row"><span class="label">C.C. No.:</span><span class="line"></span></div>
      <div class="row"><span class="label">Rep. Legal:</span><span class="line">${campos.representante_fonneta}</span></div>
    </div>
  </div>

  ${buildReleaseFooter()}
</body>
</html>
  `;
}
