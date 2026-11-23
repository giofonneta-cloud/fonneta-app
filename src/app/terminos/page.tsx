import Link from 'next/link';
import { ArrowLeft, FileText } from 'lucide-react';
import { TERMS_VERSION } from '@/lib/providers/registrationSchema';

export const metadata = { title: 'Términos de uso | Fonnetapp' };

interface Clause {
  title: string;
  body: string[];
}

// BORRADOR: revisar con asesoría legal antes de considerarlo definitivo.
const CLAUSES: Clause[] = [
  {
    title: '1. Qué es Fonnetapp',
    body: [
      'Fonnetapp es el portal de gestión de Fonneta Comunicaciones para sus proveedores y clientes: registro y validación de documentos, radicación de cuentas de cobro y facturas, órdenes de compra, cartera y obligaciones.',
      'Al registrarte o usar el portal aceptas estos Términos y la Política de Tratamiento de Datos Personales.',
    ],
  },
  {
    title: '2. Tu cuenta',
    body: [
      'Debes entregar información veraz, completa y actualizada. Eres responsable de la confidencialidad de tu contraseña y de toda actividad realizada con tu cuenta.',
      'Avísanos de inmediato a administrativo@fonneta.com si sospechas un uso no autorizado. Podemos suspender cuentas con información falsa o uso indebido.',
    ],
  },
  {
    title: '3. Uso permitido',
    body: [
      'Puedes usar el portal únicamente para gestionar tu relación comercial con Fonneta. Está prohibido: acceder a datos de otros usuarios, intentar vulnerar la seguridad del sistema, cargar archivos con malware, o usar el portal para fines ilícitos o fraudulentos.',
      'Solo se aceptan archivos PDF, PNG o JPG de hasta 10 MB.',
    ],
  },
  {
    title: '4. Contenido que cargas',
    body: [
      'Eres responsable de la legalidad y autenticidad de los documentos que cargas (RUT, cédula, certificaciones, facturas, soportes). Declaras que tienes derecho a compartirlos.',
      'Nos autorizas a almacenarlos y tratarlos únicamente para validar tu vinculación y gestionar pagos y obligaciones. Podemos retirar contenido que infrinja estos Términos o la ley.',
      'Si encuentras contenido que consideres indebido o que afecte tus derechos, repórtalo a administrativo@fonneta.com indicando el documento y el motivo; lo revisaremos con prioridad.',
    ],
  },
  {
    title: '5. Validación y pagos',
    body: [
      'La aceptación de un registro, factura o cuenta de cobro está sujeta a validación documental y a las políticas internas de Fonneta. El portal no constituye por sí mismo una obligación de pago.',
    ],
  },
  {
    title: '6. Disponibilidad y responsabilidad',
    body: [
      'Procuramos mantener el portal disponible y seguro, pero no garantizamos disponibilidad ininterrumpida. En la medida permitida por la ley, Fonneta no responde por daños indirectos derivados de interrupciones, fallos de terceros o uso indebido de tus credenciales.',
    ],
  },
  {
    title: '7. Datos personales y eliminación de cuenta',
    body: [
      'Tratamos tus datos conforme a la Política de Tratamiento de Datos Personales (Ley 1581 de 2012). Puedes ejercer tus derechos de acceso, rectificación y supresión.',
      'Puedes eliminar tu cuenta desde Ajustes en el portal. Se eliminan tu acceso y tus documentos de identidad; las facturas y órdenes ya radicadas se conservan sin datos personales por obligación de conservación contable.',
    ],
  },
  {
    title: '8. Cambios y ley aplicable',
    body: [
      'Podemos actualizar estos Términos; la versión vigente se publica en esta página. Se rigen por las leyes de la República de Colombia.',
    ],
  },
];

export default function TerminosPage() {
  return (
    <main className="min-h-screen bg-slate-50 flex flex-col items-center p-4 md:p-8">
      <div className="w-full max-w-4xl flex justify-between items-center mb-8">
        <div className="flex items-center gap-2">
          <img src="/logo.png" alt="Fonnetapp Logo" className="w-8 h-8 object-contain" />
          <span className="font-black text-slate-800 tracking-tight text-lg">Fonnetapp</span>
        </div>
        <Link
          href="/register/provider"
          className="flex items-center gap-2 text-slate-600 hover:text-slate-900 font-bold text-sm transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Volver al Registro
        </Link>
      </div>

      <div className="bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden w-full max-w-4xl">
        <div className="p-8 md:p-12 border-b border-gray-100 text-center">
          <FileText className="w-12 h-12 mx-auto mb-3 text-blue-600" />
          <h1 className="text-3xl font-black tracking-tight text-slate-900">Términos de uso</h1>
          <p className="text-sm text-slate-500 mt-2">Versión {TERMS_VERSION}</p>
        </div>

        <div className="p-8 md:p-12 space-y-8">
          {CLAUSES.map((clause) => (
            <section key={clause.title}>
              <h2 className="text-lg font-bold text-slate-900 mb-2">{clause.title}</h2>
              {clause.body.map((paragraph) => (
                <p key={paragraph} className="text-slate-600 leading-relaxed mb-2">
                  {paragraph}
                </p>
              ))}
            </section>
          ))}
          <p className="text-sm text-slate-500 pt-4 border-t border-gray-100">
            Consulta también la{' '}
            <Link href="/politica-privacidad" className="text-blue-600 underline">
              Política de Tratamiento de Datos Personales
            </Link>{' '}
            y los{' '}
            <Link href="/creditos" className="text-blue-600 underline">
              créditos y licencias de terceros
            </Link>
            .
          </p>
        </div>
      </div>
    </main>
  );
}
