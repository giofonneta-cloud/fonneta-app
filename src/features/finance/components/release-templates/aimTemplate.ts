import type { PurchaseOrder } from '../../types/purchase-order.types';
import type { Provider } from '@/features/providers/types/provider.types';
import type { MarcaRelease, ReleaseAimCampos } from '../../types/release-document.types';
import { buildReleaseLetterhead, buildReleaseFooter, RELEASE_BASE_STYLES } from './releaseShared';

export interface AimTemplateParams {
    marca: MarcaRelease;
    releaseNumber: string;
    campos: ReleaseAimCampos;
    po?: PurchaseOrder | null;
    provider?: Provider | null;
}

export function buildAimReleaseHTML({ marca, releaseNumber, campos }: AimTemplateParams): string {
    return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8" /><style>${RELEASE_BASE_STYLES}</style></head>
<body>
  ${buildReleaseLetterhead(marca, 'Autorización de Uso de Imagen y Cesión de Derechos Patrimoniales de Imagen', releaseNumber)}

  <p>Yo, <span style="border-bottom:1px solid #9ca3af;">&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</span>, identificado(a) como aparece al pie de mi firma, por medio del presente contrato, autorizo de manera expresa, libre e informada a FONNETA COMUNICACIONES S.A.S. y a cualquier tercero que FONNETA autorice o considere pertinente, a divulgar, adaptar, transformar, reproducir, distribuir, licenciar, comunicar públicamente, poner a disposición de terceros, y modificar la imagen que de mí se capte, incluyendo mi voz, en los soportes y medios utilizados en la sesión fotográfica y/o audiovisual, esta autorización se otorga a perpetuidad, por el territorio mundo, y comprende cualquier fijación de la imagen o voz en soporte físico, analógico o digital, publicaciones impresas y digitales en internet, videogramas o fonogramas de cualquier temática, medios digitales, redes sociales, de transferencia de datos, medios magnetofónicos, metaverso, satelitales, intranet, internet, copias fijadas en físico o impresas, mailing, e-mail marketing, SMS y comunicaciones digitales masivas, vallas, plataformas de distribución de streaming, YouTube, televisión o cine, relaciones públicas, eventos, exhibiciones, ferias y activaciones de marca y conforme a lo que se describe en el presente documento:</p>

  <table>
    <thead>
      <tr>
        <th>Nombre y descripción de la sesión / producción</th>
        <th>Lugar y fecha de realización</th>
        <th>Nombre e identificación del fotógrafo</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td>${campos.sesion_nombre}</td>
        <td>${campos.lugar_fecha}</td>
        <td>${campos.fotografo_nombre}</td>
      </tr>
    </tbody>
  </table>

  <p style="font-size:10.5px;">No. fotografías autorizadas: <strong>${campos.no_fotografias || '________'}</strong> &nbsp;&nbsp;&nbsp; No. audiovisuales autorizados: <strong>${campos.no_audiovisuales || '________'}</strong></p>
  <p style="font-size:9px; font-style:italic; color:#6b7280;">(1) Diligenciar solo si se conoce el número exacto. Dejar en blanco si no se conoce.</p>

  <p>Autorizo a FONNETA COMUNICACIONES S.A.S. a usar su nombre artístico o legal, iniciales, seudónimo, firma y voz en conexión con el uso de imagen descrito en el presente contrato, de conformidad con la Ley 1581 de 2012 y el Decreto 1074 de 2015 sobre protección de Datos Personales. El tratamiento de los datos personales se realizará exclusivamente para las finalidades asociadas a la ejecución del presente contrato y al cumplimiento de obligaciones legales, comerciales y contables de FONNETA. La política de Tratamiento de Datos Personales de FONNETA COMUNICACIONES S.A.S. está disponible en gerencia@fonneta.com y será entregada a El/La Modelo a solicitud.</p>

  <p>Mantendré indemne a FONNETA COMUNICACIONES S.A.S. y a los terceros autorizados por FONNETA, de cualquier reclamación que derive del incumplimiento de las declaraciones contenidas en el presente documento.</p>

  <p>Atentamente,</p>

  <div class="sign-box">
    <div class="row"><span class="label">Firma:</span><span class="line"></span></div>
    <div class="row"><span class="label">Nombre completo:</span><span class="line"></span></div>
    <div class="row"><span class="label">C.c. / documento:</span><span class="line"></span></div>
    <div class="row"><span class="label">Correo electrónico:</span><span class="line"></span></div>
    <div class="row"><span class="label">Celular:</span><span class="line"></span></div>
  </div>

  ${buildReleaseFooter()}
</body>
</html>
  `;
}
