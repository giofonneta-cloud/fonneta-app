// Conversor de números a letras en español (para documentos legales COP).

const UNIDADES = [
    'cero', 'uno', 'dos', 'tres', 'cuatro', 'cinco', 'seis', 'siete', 'ocho', 'nueve',
    'diez', 'once', 'doce', 'trece', 'catorce', 'quince', 'dieciséis', 'diecisiete',
    'dieciocho', 'diecinueve', 'veinte', 'veintiuno', 'veintidós', 'veintitrés',
    'veinticuatro', 'veinticinco', 'veintiséis', 'veintisiete', 'veintiocho', 'veintinueve',
];
const DECENAS = ['', '', '', 'treinta', 'cuarenta', 'cincuenta', 'sesenta', 'setenta', 'ochenta', 'noventa'];
const CENTENAS = ['', 'ciento', 'doscientos', 'trescientos', 'cuatrocientos', 'quinientos', 'seiscientos', 'setecientos', 'ochocientos', 'novecientos'];

function centenasALetras(n: number): string {
    if (n === 100) return 'cien';
    let out = '';
    const c = Math.floor(n / 100);
    const resto = n % 100;
    if (c > 0) out += CENTENAS[c] + ' ';
    if (resto > 0) {
        if (resto < 30) {
            out += UNIDADES[resto];
        } else {
            const d = Math.floor(resto / 10);
            const u = resto % 10;
            out += DECENAS[d] + (u > 0 ? ' y ' + UNIDADES[u] : '');
        }
    }
    return out.trim();
}

// Apócope de "uno" → "un" al final (para "un millón", "veintiún mil", etc.)
function apocope(words: string): string {
    return words.replace(/veintiuno$/, 'veintiún').replace(/(\s|^)uno$/, '$1un');
}

function milesALetras(n: number): string {
    const miles = Math.floor(n / 1000);
    const resto = n % 1000;
    let out = '';
    if (miles > 0) {
        out += miles === 1 ? 'mil' : apocope(centenasALetras(miles)) + ' mil';
    }
    if (resto > 0) out += (out ? ' ' : '') + centenasALetras(resto);
    return out.trim();
}

export function numeroALetras(num: number): string {
    const entero = Math.floor(Math.abs(num));
    if (entero === 0) return 'cero';
    const millones = Math.floor(entero / 1_000_000);
    const resto = entero % 1_000_000;
    let out = '';
    if (millones > 0) {
        out += millones === 1 ? 'un millón' : apocope(milesALetras(millones)) + ' millones';
    }
    if (resto > 0) out += (out ? ' ' : '') + milesALetras(resto);
    return out.trim();
}

// Devuelve el valor en letras con la coletilla legal colombiana.
// Ej: 2000000 → "dos millones de pesos moneda corriente colombiana"
export function valorEnLetrasCOP(num: number): string {
    const entero = Math.floor(Math.abs(num));
    const letras = numeroALetras(entero);
    const conDe = entero >= 1_000_000 && entero % 1_000_000 === 0;
    return `${letras}${conDe ? ' de' : ''} pesos moneda corriente colombiana`;
}
