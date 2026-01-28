# Business Logic - Fonnetapp

## 🎯 Visión General
Fonnetapp es un sistema de gestión integrada para agencias creativas y editoriales que unifica la operación de proyectos con la realidad financiera.

## 👥 Roles de Usuario
- **Administrador**: Control total, financiero y estratégico.
- **Project Manager (PM)**: Gestión de proyectos, proveedores y entregables.
- **Administrativo**: Validación financiera, facturación y proveedores.
- **Proveedor**: Autogestión de datos, documentos y facturación.

## 🏗️ Módulos Principales

### 1. Gestión de Proyectos (Vistas 4D)
- **Tabla**: Análisis detallado.
- **Kanban**: Flujo operativo (Brief → ... → Facturado).
- **Calendario**: Gestión de plazos.
- **Gantt**: Ruta crítica y dependencias.
- *Trigger*: Al pasar a "Completado", notifica a Administrativo para facturar.

### 2. Portal de Proveedores
- Onboarding digital (RUT, Cámara de Comercio, etc.).
- Carga de facturas asociadas a proyectos.
- Seguimiento de estado de pagos.

### 3. Gestión Financiera (Multi-moneda)
- Integración TRM diaria (USD/COP).
- Registro de gastos (Proyecto vs Recurrente).
- Registro de ingresos y control de cartera.
- Margen de rentabilidad en tiempo real.

### 4. Automatización OCR
- Escaneo de facturas vía Gmail/Carga directa.
- Extracción de datos con Google Document AI / AWS Textract.
- Validación manual asistida.

### 5. Comunicación (Canales)
- Canales por Proyecto (auto-creados).
- Canales por Cliente/Proveedor.
- Mensajería estilo Discord con hilos y reacciones.

## 🛠️ Stack Tecnológico (Golden Path)
- **Framework**: Next.js 15 (App Router).
- **Backend**: Supabase (PostgreSQL + Auth + Edge Functions).
- **Estilos**: Tailwind CSS + Shadcn UI.
- **Estado**: Zustand.
- **IA**: Google Document AI (OCR) + OpenAI/Anthropic (Análisis).
