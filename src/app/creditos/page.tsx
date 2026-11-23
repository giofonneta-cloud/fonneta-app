import Link from 'next/link';
import { ArrowLeft, Scale } from 'lucide-react';

export const metadata = { title: 'Créditos y licencias | Fonnetapp' };

interface Credit {
  name: string;
  license: string;
  note?: string;
}

// Resumen de componentes de terceros. El listado completo y exacto (todas las
// dependencias de producción) está en THIRD_PARTY_LICENSES.md, generado con license-checker.
const CREDITS: Credit[] = [
  { name: 'Next.js, React, React DOM', license: 'MIT' },
  { name: 'Supabase JS y SSR', license: 'MIT' },
  { name: 'Radix UI', license: 'MIT' },
  { name: 'Tailwind CSS, tailwind-merge, clsx', license: 'MIT' },
  { name: 'Recharts, Zustand, React Hook Form, Zod, Sonner, date-fns', license: 'MIT' },
  { name: 'Lucide (íconos)', license: 'ISC' },
  { name: 'html2pdf.js', license: 'MIT' },
  { name: 'SheetJS (xlsx), googleapis', license: 'Apache-2.0' },
  { name: 'Nodemailer', license: 'MIT-0' },
  {
    name: 'sharp / libvips (optimización de imágenes de Next.js)',
    license: 'Apache-2.0 y LGPL-3.0-or-later',
    note: 'Biblioteca libvips enlazada dinámicamente y sin modificar.',
  },
  {
    name: 'caniuse-lite (datos de compatibilidad de navegadores)',
    license: 'CC-BY-4.0',
    note: 'Datos de caniuse.com, Alexis Deveria y colaboradores.',
  },
];

export default function CreditosPage() {
  return (
    <main className="min-h-screen bg-slate-50 flex flex-col items-center p-4 md:p-8">
      <div className="w-full max-w-4xl flex justify-between items-center mb-8">
        <div className="flex items-center gap-2">
          <img src="/logo.png" alt="Fonnetapp Logo" className="w-8 h-8 object-contain" />
          <span className="font-black text-slate-800 tracking-tight text-lg">Fonnetapp</span>
        </div>
        <Link href="/login" className="flex items-center gap-2 text-slate-600 hover:text-slate-900 font-bold text-sm">
          <ArrowLeft className="w-4 h-4" />
          Volver
        </Link>
      </div>

      <div className="bg-white rounded-3xl shadow-xl border border-gray-100 w-full max-w-4xl p-8 md:p-12">
        <div className="text-center mb-8">
          <Scale className="w-12 h-12 mx-auto mb-3 text-blue-600" />
          <h1 className="text-3xl font-black tracking-tight text-slate-900">Créditos y licencias</h1>
          <p className="text-sm text-slate-500 mt-2">
            Fonnetapp es software propietario de Fonneta Comunicaciones. Usa los siguientes componentes de código abierto.
          </p>
        </div>

        <ul className="divide-y divide-gray-100">
          {CREDITS.map((credit) => (
            <li key={credit.name} className="py-3 flex flex-col md:flex-row md:justify-between gap-1">
              <div>
                <p className="font-semibold text-slate-800">{credit.name}</p>
                {credit.note && <p className="text-xs text-slate-500">{credit.note}</p>}
              </div>
              <span className="text-sm font-mono text-slate-600">{credit.license}</span>
            </li>
          ))}
        </ul>

        <p className="text-xs text-slate-500 mt-8">
          El listado completo de dependencias de producción con sus textos de licencia se publica en el repositorio
          (THIRD_PARTY_LICENSES.md). Las marcas y logotipos de Fonneta son propiedad de Fonneta Comunicaciones.
        </p>
      </div>
    </main>
  );
}
