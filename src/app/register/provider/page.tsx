import { ProviderOnboarding } from '@/features/providers/components/ProviderOnboarding';
import Image from 'next/image';

export default function RegisterProviderPage() {
  return (
    <main className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
      <div className="mb-8 flex flex-col items-center">
        <div className="w-20 h-20 mb-4">
          <img src="/logo.png" alt="Fonnetapp Logo" className="w-full h-full object-contain" />
        </div>
        <h1 className="text-2xl font-black text-slate-900 tracking-tight">Registro de Clientes y Proveedores</h1>
        <p className="text-slate-500 font-medium">Únete a la red de Fonneta</p>
      </div>
      
      <ProviderOnboarding />
      
      <p className="mt-8 text-slate-400 text-sm font-medium">
        © {new Date().getFullYear()} Fonnetapp. Todos los derechos reservados.
      </p>
    </main>
  );
}
