import type { TipoRelease, ReleaseCampos } from '../../types/release-document.types';
import { buildAimReleaseHTML, type AimTemplateParams } from './aimTemplate';
import { buildObrReleaseHTML, type ObrTemplateParams } from './obrTemplate';
import { buildCoeReleaseHTML, type CoeTemplateParams } from './coeTemplate';

export type ReleaseTemplateParams =
    | ({ tipo: 'aim' } & AimTemplateParams)
    | ({ tipo: 'obr' } & ObrTemplateParams)
    | ({ tipo: 'coe' } & CoeTemplateParams);

export function buildReleaseHTML(tipo: TipoRelease, params: {
    marca: ReleaseTemplateParams['marca'];
    releaseNumber: string;
    campos: ReleaseCampos;
    po?: ReleaseTemplateParams['po'];
    provider?: ReleaseTemplateParams['provider'];
}): string {
    if (tipo === 'aim') return buildAimReleaseHTML(params as AimTemplateParams);
    if (tipo === 'obr') return buildObrReleaseHTML(params as ObrTemplateParams);
    return buildCoeReleaseHTML(params as CoeTemplateParams);
}

export { BRAND_MARKS } from './releaseShared';
