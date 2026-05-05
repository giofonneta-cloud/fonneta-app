import { FileText, ArrowLeft, Shield, Lock, Eye, CheckCircle } from 'lucide-react';
import Link from 'next/link';

export default function PoliticaPrivacidadPage() {
  const lastUpdated = "18 de Marzo, 2026";

  return (
    <main className="min-h-screen bg-slate-50 flex flex-col items-center p-4 md:p-8">
      {/* Header / Navigation */}
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

      {/* Main Content Card */}
      <div className="bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden w-full max-w-4xl">
        {/* Banner */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-700 p-8 md:p-12 text-white text-center relative overflow-hidden">
          <div className="absolute inset-0 opacity-10">
            <div className="absolute -top-10 -left-10 w-40 h-40 bg-white rounded-full blur-2xl" />
            <div className="absolute -bottom-10 -right-10 w-60 h-60 bg-white rounded-full blur-3xl" />
          </div>
          <div className="relative z-10 flex flex-col items-center">
            <Shield className="w-16 h-16 mb-4 text-blue-100" />
            <h1 className="text-3xl md:text-4xl font-black tracking-tight mb-2">
              Política de Tratamiento de Datos Personales
            </h1>
            <p className="text-blue-100 font-medium text-sm">
              Habeas Data (Colombia) • Última actualización: {lastUpdated}
            </p>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6 md:p-12 space-y-8 text-slate-700">
          
          <section className="space-y-3">
            <h2 className="text-xl font-black text-slate-900 flex items-center gap-2">
              <span className="text-blue-600">1.</span> Identificación del Responsable
            </h2>
            <p className="text-sm font-medium leading-relaxed">
              <span className="font-bold text-slate-800">Fonneta Comunicaciones S.A.S.</span> (en adelante, "La Compañía"), con domicilio principal en Colombia, es la Responsable del tratamiento de los datos personales que se recolecten y procesen a través del portal de proveedores y sus canales digitales.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-black text-slate-900 flex items-center gap-2">
              <span className="text-blue-600">2.</span> Marco Legal
            </h2>
            <p className="text-sm font-medium leading-relaxed">
              Esta política se rige bajo lo dispuesto por la <span className="font-bold text-blue-600">Ley 1581 de 2012</span> de la República de Colombia y su Decreto Reglamentario 1377 de 2013, que regulan la recolección, almacenamiento, uso, circulación y supresión de datos personales.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-black text-slate-900 flex items-center gap-2">
              <span className="text-blue-600">3.</span> Finalidades del Tratamiento
            </h2>
            <p className="text-sm font-medium">
              Al aceptar esta política y registrarte como proveedor/cliente, autorizas a La Compañía para recolectar y usar tus datos personales (y/o de la persona jurídica que representas) para las siguientes finalidades:
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <PurposeCard 
                icon={CheckCircle} 
                title="Registro y Validación" 
                description="Verificar la identidad del proveedor, registrarlo en el sistema y validar documentos listados (RUT, Cámara de Comercio, etc.)." 
              />
              <PurposeCard 
                icon={Lock} 
                title="Gestión de Seguridad" 
                description="Consultar y reportar información en bases de datos de riesgo financiero, crediticio, LAFT y listas restrictivas." 
              />
              <PurposeCard 
                icon={FileText} 
                title="Ejecución de Contratos" 
                description="Tramitar órdenes de compra, contratos, facturación electrónica y pagos bancarios certificados." 
              />
              <PurposeCard 
                icon={Eye} 
                title="Comunicaciones" 
                description="Enviar notificaciones sobre el estado de órdenes, actualizaciones del portal y requerimientos administrativos." 
              />
            </div>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-black text-slate-900 flex items-center gap-2">
              <span className="text-blue-600">4.</span> Derechos de los Titulares
            </h2>
            <p className="text-sm font-medium leading-relaxed">
              De acuerdo con el Artículo 8 de la Ley 1581 de 2012, tú como titular de los datos tienes derecho a:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-sm font-medium text-slate-600">
              <li>Conocer, actualizar y rectificar tus datos personales frente a La Compañía.</li>
              <li>Solicitar prueba de la autorización otorgada, salvo excepciones legales.</li>
              <li>Ser informado sobre el uso que se le ha dado a tus datos.</li>
              <li>Presentar quejas ante la Superintendencia de Industria y Comercio (SIC).</li>
              <li>Revocar la autorización y/o solicitar la supresión del dato cuando no se respeten los principios legales.</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-black text-slate-900 flex items-center gap-2">
              <span className="text-blue-600">5.</span> Canales de Atención (Habeas Data)
            </h2>
            <p className="text-sm font-medium leading-relaxed">
              Para ejercer tus derechos de consulta, reclamo o actualización de tu información, puedes enviar una solicitud a los canales oficiales de La Compañía:
            </p>
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 flex flex-col md:flex-row justify-between items-center gap-4">
              <div>
                <p className="text-xs font-black uppercase text-slate-400">Correo Electrónico de Soporte Legal</p>
                <p className="text-lg font-black text-blue-600">soporte@fonneta.com</p>
              </div>
              <div className="text-center md:text-right">
                <p className="text-xs font-medium text-slate-500">Tiempo de respuesta máximo</p>
                <p className="text-sm font-bold text-slate-800">15 días hábiles</p>
              </div>
            </div>
          </section>

          <div className="border-t border-slate-100 pt-6 text-center text-xs font-medium text-slate-400">
            Esta política es vinculante para todos los usuarios del portal de proveedores de Fonneta Comunicaciones S.A.S.
          </div>
        </div>
      </div>

      <p className="mt-8 text-slate-400 text-sm font-medium">
        © {new Date().getFullYear()} Fonnetapp. Todos los derechos reservados.
      </p>
    </main>
  );
}

interface PurposeCardProps {
  icon: any;
  title: string;
  description: string;
}

function PurposeCard({ icon: Icon, title, description }: PurposeCardProps) {
  return (
    <div className="flex gap-4 p-4 border border-slate-100 bg-slate-50/50 rounded-2xl hover:border-blue-200 transition-colors">
      <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center flex-shrink-0">
        <Icon className="w-5 h-5 text-blue-600" />
      </div>
      <div>
        <h3 className="text-sm font-bold text-slate-800 mb-1">{title}</h3>
        <p className="text-xs font-medium text-slate-500 leading-relaxed">{description}</p>
      </div>
    </div>
  );
}
