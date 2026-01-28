# 📋 Plan de Mejora del Sistema - Basado en PRD v1.3

**Fecha:** 27 de Enero 2026  
**Versión Actual:** MVP con Módulos Básicos  
**Versión Objetivo:** Sistema Completo según PRD v1.3

---

## 🎯 Resumen Ejecutivo

### Estado Actual del Sistema

**✅ Implementado:**

- ✅ Autenticación con Supabase (login, signup, password reset)
- ✅ Gestión de Proyectos (Kanban, tabla, calendario)
- ✅ Sistema de Tareas por Proyecto (CRUD, estados, prioridades)
- ✅ Módulo Financiero Básico (gastos y ventas)
- ✅ Chat Interno (comunicación estilo Discord)
- ✅ Arquitectura Feature-First optimizada para IA
- ✅ RLS Multi-tenant configurado

**⚠️ Parcialmente Implementado:**

- ⚠️ Portal de Proveedores (estructura básica, falta autogestión completa)
- ⚠️ Gestión de Usuarios (falta panel de administración completo)
- ⚠️ Reportes (dashboards básicos, faltan reportes avanzados)

**❌ No Implementado:**

- ✅ Rol de Administrador con panel operativo
- ✅ Dashboard de salud del sistema y métricas
- ✅ Logs de auditoría implementados
- ✅ Sistema de Subtareas Jerárquicas (3 niveles)
- ❌ Módulo de facturación automática por completar
- ❌ Multi-moneda y TRM pendiente
- ❌ Legalizador AI (OCR de facturas) pendiente
- ❌ Sistema de notificaciones avanzado pendiente
- ❌ Gestión avanzada de archivos y entregables pendiente

### Brecha Funcional

El sistema actual cubre aproximadamente el **40%** de las funcionalidades definidas en el PRD v1.3. Las brechas más críticas son:

1. **Panel de Administrador** - ✅ 90% implementado
2. **Portal de Proveedores Completo** - 30% implementado
3. **Automatizaciones Financieras** - 20% implementado
4. **Reportes Avanzados** - 60% implementado (Dashboard Operativo ✅)
5. **Legalizador AI** - 0% implementado

---

## 📊 Análisis de Prioridades

### Matriz de Impacto vs Esfuerzo

| Funcionalidad              | Impacto  | Esfuerzo | Prioridad  | Fase |
| -------------------------- | -------- | -------- | ---------- | ---- |
| **Panel de Administrador** | 🔴 Alto  | 🟡 Medio | 🔥 Crítica | 1    |
| **Portal de Proveedores**  | 🔴 Alto  | 🟡 Medio | 🔥 Crítica | 1    |
| **Legalizador AI (OCR)**   | 🔴 Alto  | 🔴 Alto  | 🟠 Alta    | 2    |
| **Multi-moneda y TRM**     | 🟡 Medio | 🟢 Bajo  | 🟠 Alta    | 2    |
| **Reportes Avanzados**     | 🔴 Alto  | 🟡 Medio | 🟠 Alta    | 2    |
| **Gestión de Entregables** | 🟡 Medio | 🟢 Bajo  | 🟡 Media   | 3    |
| **Webhooks**               | 🟢 Bajo  | 🟢 Bajo  | 🟡 Media   | 3    |
| **Logs de Auditoría**      | 🟡 Medio | 🟡 Medio | 🟡 Media   | 3    |
| **Personalización Campos** | 🟡 Medio | 🔴 Alto  | 🟢 Baja    | 4    |
| **Integración Contable**   | 🟡 Medio | 🔴 Alto  | 🟢 Baja    | 4    |

---

## 🗺️ Roadmap de Implementación

### **FASE 1: Fundamentos de Administración** (3-4 semanas)

_Objetivo: Habilitar control total del sistema para administradores_

#### 1.1 Panel de Administrador (Semana 1-2)

**Prioridad:** 🔥 Crítica

**Tareas:**

- [x] **Dashboard Principal del Administrador**
  - Métricas de salud del sistema
  - Resumen financiero
  - Alertas y notificaciones
  - Acciones rápidas
  - Métricas de adopción

- [x] **Gestión de Usuarios**
  - Vista de usuarios con filtros
  - Formulario crear/editar usuario
  - Gestión de roles y permisos básicos
  - Activar/desactivar usuarios
  - Logs de actividad por usuario (Audit Logs)

- [ ] **Gestión de Roles**
  - Configuración de permisos granulares
  - Crear roles personalizados
  - Matriz de permisos por módulo
  - Límites de aprobación por rol

**Archivos a Crear:**

```
src/features/admin/
├── components/
│   ├── AdminDashboard.tsx
│   ├── UserManagement.tsx
│   ├── UserForm.tsx
│   ├── RoleManagement.tsx
│   ├── PermissionMatrix.tsx
│   └── SystemHealth.tsx
├── services/
│   ├── userService.ts
│   └── roleService.ts
├── hooks/
│   ├── useUsers.ts
│   └── useRoles.ts
└── types/
    ├── user.types.ts
    └── role.types.ts

supabase/migrations/
└── 20260127_admin_panel.sql
```

**Migraciones de BD:**

```sql
-- Tabla de roles personalizados
CREATE TABLE roles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  permissions JSONB NOT NULL DEFAULT '{}',
  approval_limits JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabla de permisos de usuario
CREATE TABLE user_permissions (
  user_id UUID REFERENCES auth.users(id),
  role_id UUID REFERENCES roles(id),
  custom_permissions JSONB,
  PRIMARY KEY (user_id, role_id)
);

-- Tabla de logs de auditoría
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id),
  action TEXT NOT NULL,
  entity_type TEXT,
  entity_id UUID,
  changes JSONB,
  ip_address INET,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### 1.2 Portal de Proveedores Completo (Semana 2-3)

**Prioridad:** 🔥 Crítica

**Tareas:**

- [ ] **Autogestión de Proveedores**
  - Portal de registro público
  - Perfil de proveedor editable
  - Carga de documentos legales
  - Alertas de vencimiento de documentos
  - Estado de cuenta y pagos

- [ ] **Validación de Proveedores**
  - Panel de aprobación para administrativos
  - Validación de documentos
  - Suspensión automática por documentos vencidos
  - Historial de cambios

- [ ] **Gestión de Facturas por Proveedor**
  - Carga de facturas por proveedor
  - Tracking de estado de pago
  - Notificaciones automáticas

**Archivos a Crear:**

```
src/features/providers/
├── components/
│   ├── ProviderPortal.tsx
│   ├── ProviderProfile.tsx
│   ├── DocumentUpload.tsx
│   ├── DocumentValidation.tsx
│   ├── InvoiceUpload.tsx
│   └── PaymentStatus.tsx
├── services/
│   ├── providerService.ts
│   └── documentService.ts
└── hooks/
    ├── useProviderProfile.ts
    └── useDocuments.ts

src/app/(provider)/
├── portal/
│   ├── page.tsx
│   ├── profile/page.tsx
│   ├── documents/page.tsx
│   └── invoices/page.tsx
```

**Migraciones de BD:**

```sql
-- Tabla de documentos de proveedores
CREATE TABLE provider_documents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  provider_id UUID REFERENCES providers(id),
  document_type TEXT NOT NULL,
  file_url TEXT NOT NULL,
  expiration_date DATE,
  status TEXT CHECK (status IN ('pending', 'approved', 'rejected', 'expired')),
  validated_by UUID REFERENCES auth.users(id),
  validated_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabla de configuración de documentos requeridos
CREATE TABLE required_documents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  provider_type TEXT CHECK (provider_type IN ('natural', 'juridica')),
  document_type TEXT NOT NULL,
  is_required BOOLEAN DEFAULT true,
  alert_days_before INT[] DEFAULT ARRAY[30, 15, 7, 0]
);
```

#### 1.3 Configuración de Módulos (Semana 3-4)

**Prioridad:** 🟠 Alta

**Tareas:**

- [ ] **Panel de Activación/Desactivación**
  - Toggle ON/OFF por módulo
  - Configuración específica por módulo
  - Roles afectados por módulo

- [ ] **Configuración de Categorías de Gasto**
  - CRUD de categorías
  - Subcategorías
  - Estadísticas de uso
  - Activar/desactivar categorías

**Archivos a Crear:**

```
src/features/admin/components/
├── ModuleConfiguration.tsx
├── CategoryManagement.tsx
└── CategoryForm.tsx

supabase/migrations/
└── 20260127_module_config.sql
```

---

### **FASE 2: Automatización Financiera** (3-4 semanas)

_Objetivo: Reducir trabajo manual y mejorar precisión_

#### 2.1 Legalizador AI (OCR de Facturas) (Semana 5-7)

**Prioridad:** 🟠 Alta

**Tareas:**

- [ ] **Extracción Híbrida (Texto + Visión)**
  - Integración con API de OCR (Google Vision / Tesseract)
  - Extracción de texto de PDFs nativos
  - Procesamiento de imágenes escaneadas
  - Validación de datos extraídos

- [ ] **UI de Validación**
  - Vista previa del documento
  - Edición de datos extraídos
  - Bounding boxes de evidencia
  - Aprobación/rechazo

- [ ] **Configuración del Módulo**
  - Selección de estrategia (Híbrida/Solo Texto)
  - Configuración de API keys
  - Umbrales de confianza

**Archivos a Crear:**

```
src/features/finance/
├── components/
│   ├── DocumentScanner.tsx
│   ├── OCRValidation.tsx
│   └── ExtractionPreview.tsx
├── services/
│   ├── ocrService.ts
│   ├── pdfTextExtractor.ts
│   └── aiProvider.ts
└── hooks/
    └── useOCR.ts

supabase/functions/
└── smart-organizer/
    └── index.ts
```

**Integraciones:**

- Google Cloud Vision API
- OpenAI GPT-4 Vision (alternativa)
- PDF.js para extracción de texto

#### 2.2 Multi-moneda y TRM (Semana 7-8)

**Prioridad:** 🟠 Alta

**Tareas:**

- [ ] **Gestión de Divisas**
  - Configuración de monedas activas
  - Moneda base del sistema
  - Conversión automática en reportes

- [ ] **Integración con API de TRM**
  - Actualización automática de tasas
  - Historial de tasas
  - Cálculo de conversión en tiempo real

- [ ] **UI Multi-moneda**
  - Selector de moneda en formularios
  - Visualización en moneda original + convertida
  - Reportes consolidados

**Archivos a Crear:**

```
src/features/finance/
├── components/
│   ├── CurrencySelector.tsx
│   ├── CurrencyConverter.tsx
│   └── ExchangeRateConfig.tsx
├── services/
│   ├── currencyService.ts
│   └── exchangeRateService.ts
└── hooks/
    └── useCurrency.ts

supabase/migrations/
└── 20260127_multi_currency.sql
```

**Migraciones de BD:**

```sql
-- Tabla de monedas
CREATE TABLE currencies (
  code TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  symbol TEXT,
  is_active BOOLEAN DEFAULT true,
  is_base BOOLEAN DEFAULT false
);

-- Tabla de tasas de cambio
CREATE TABLE exchange_rates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  from_currency TEXT REFERENCES currencies(code),
  to_currency TEXT REFERENCES currencies(code),
  rate DECIMAL(18, 6) NOT NULL,
  date DATE NOT NULL,
  source TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(from_currency, to_currency, date)
);

-- Agregar campos de moneda a gastos y ventas
ALTER TABLE expenses ADD COLUMN currency TEXT REFERENCES currencies(code) DEFAULT 'COP';
ALTER TABLE sales ADD COLUMN currency TEXT REFERENCES currencies(code) DEFAULT 'COP';
```

#### 2.3 Reportes Avanzados (Semana 8)

**Prioridad:** 🟠 Alta

**Tareas:**

- [ ] **Dashboards Personalizados**
  - Flujo de caja proyectado
  - Rentabilidad por proyecto
  - Análisis de gastos por categoría
  - Comparativas mensuales

- [ ] **Exportación de Datos**
  - Excel/CSV
  - PDF con gráficos
  - Programación de reportes automáticos

**Archivos a Crear:**

```
src/features/reports/
├── components/
│   ├── CashFlowReport.tsx
│   ├── ProfitabilityReport.tsx
│   ├── ExpenseAnalysis.tsx
│   └── ReportExporter.tsx
├── services/
│   └── reportService.ts
└── hooks/
    └── useReports.ts
```

---

### **FASE 3: Optimización y Escalabilidad** (2-3 semanas)

_Objetivo: Mejorar UX y preparar para crecimiento_

#### 3.1 Gestión de Entregables (Semana 9-10)

**Prioridad:** 🟡 Media

**Tareas:**

- [ ] **Upload de Archivos**
  - Integración con Supabase Storage
  - Drag & drop de archivos
  - Preview de archivos
  - Versionamiento

- [ ] **Organización de Archivos**
  - Carpetas por proyecto
  - Tags y categorías
  - Búsqueda de archivos

**Archivos a Crear:**

```
src/features/projects/
├── components/
│   ├── FileUpload.tsx
│   ├── FilePreview.tsx
│   └── FileManager.tsx
└── services/
    └── storageService.ts

supabase/migrations/
└── 20260127_file_management.sql
```

#### 3.2 Sistema de Notificaciones (Semana 10-11)

**Prioridad:** 🟡 Media

**Tareas:**

- [ ] **Notificaciones en Plataforma**
  - Centro de notificaciones
  - Badges de contador
  - Marcado como leído

- [ ] **Notificaciones por Email**
  - Templates personalizables
  - Configuración de frecuencia
  - Resúmenes programados

- [ ] **Webhooks**
  - Configuración de webhooks
  - Eventos personalizables
  - Logs de ejecución

**Archivos a Crear:**

```
src/features/notifications/
├── components/
│   ├── NotificationCenter.tsx
│   ├── NotificationBadge.tsx
│   └── WebhookConfig.tsx
├── services/
│   ├── notificationService.ts
│   └── webhookService.ts
└── hooks/
    └── useNotifications.ts

supabase/functions/
└── send-notifications/
    └── index.ts
```

#### 3.3 Logs de Auditoría (Semana 11)

**Prioridad:** 🟡 Media

**Tareas:**

- [ ] **Registro Automático**
  - Triggers en tablas críticas
  - Captura de cambios (before/after)
  - IP y user agent

- [ ] **Visualización de Logs**
  - Timeline de cambios
  - Filtros por usuario/entidad/fecha
  - Exportación de logs

**Archivos a Crear:**

```
src/features/admin/components/
├── AuditLogs.tsx
└── AuditTimeline.tsx

supabase/migrations/
└── 20260127_audit_triggers.sql
```

---

### **FASE 4: Personalización Avanzada** (3-4 semanas)

_Objetivo: Adaptar el sistema a necesidades específicas_

#### 4.1 Campos Personalizados (Semana 12-14)

**Prioridad:** 🟢 Baja

**Tareas:**

- [ ] **Gestión de Campos**
  - CRUD de campos personalizados
  - Tipos de campo (texto, número, fecha, dropdown, etc.)
  - Validaciones personalizadas
  - Visibilidad por rol

- [ ] **Renderizado Dinámico**
  - Formularios dinámicos
  - Validación en runtime
  - Almacenamiento en JSONB

**Archivos a Crear:**

```
src/features/admin/components/
├── CustomFieldManager.tsx
├── CustomFieldForm.tsx
└── DynamicFormRenderer.tsx

supabase/migrations/
└── 20260127_custom_fields.sql
```

#### 4.2 Flujos de Trabajo Personalizados (Semana 14-15)

**Prioridad:** 🟢 Baja

**Tareas:**

- [ ] **Configuración de Estados**
  - CRUD de estados de proyecto
  - Colores e iconos
  - Orden y transiciones

- [ ] **Acciones Automáticas**
  - Triggers al entrar/salir de estado
  - Notificaciones automáticas
  - Validaciones de transición

**Archivos a Crear:**

```
src/features/admin/components/
├── WorkflowConfiguration.tsx
├── StateEditor.tsx
└── AutomationRules.tsx
```

---

## 🎯 Métricas de Éxito

### KPIs por Fase

**Fase 1:**

- ✅ 100% de usuarios con roles correctamente asignados
- ✅ 100% de proveedores con documentos validados
- ✅ Tiempo de configuración inicial < 2 horas

**Fase 2:**

- ✅ 80% reducción en tiempo de registro de gastos (con OCR)
- ✅ 100% de proyectos completados facturados en <48h
- ✅ Visibilidad de flujo de caja proyectado a 30 días

**Fase 3:**

- ✅ 90% de archivos organizados en sistema
- ✅ Tiempo de respuesta a notificaciones < 1 hora
- ✅ 100% de acciones críticas auditadas

**Fase 4:**

- ✅ 5+ campos personalizados activos
- ✅ 3+ flujos de trabajo personalizados
- ✅ 95% satisfacción de usuarios con personalización

---

## 🛠️ Stack Técnico Requerido

### Nuevas Dependencias

```json
{
  "dependencies": {
    "@google-cloud/vision": "^4.0.0",
    "tesseract.js": "^5.0.0",
    "pdf-parse": "^1.1.1",
    "xlsx": "^0.18.5",
    "recharts": "^2.10.0",
    "react-dropzone": "^14.2.3",
    "date-fns": "^3.0.0"
  }
}
```

### Servicios Externos

- **Google Cloud Vision API** - OCR de facturas
- **Exchange Rate API** - Tasas de cambio
- **SendGrid / Resend** - Emails transaccionales
- **Supabase Storage** - Almacenamiento de archivos

---

## 📋 Checklist de Implementación

### Pre-requisitos

- [ ] Configurar Google Cloud Vision API
- [ ] Configurar Exchange Rate API
- [ ] Configurar servicio de email
- [ ] Configurar Supabase Storage buckets
- [ ] Revisar y optimizar RLS policies existentes

### Por Fase

**Fase 1:**

- [ ] Migración de BD para admin panel
- [ ] Implementar dashboard de administrador
- [ ] Implementar gestión de usuarios
- [ ] Implementar portal de proveedores
- [ ] Testing de roles y permisos
- [ ] Documentación de configuración

**Fase 2:**

- [ ] Integrar Google Vision API
- [ ] Implementar OCR de facturas
- [ ] Implementar multi-moneda
- [ ] Implementar reportes avanzados
- [ ] Testing de extracción de datos
- [ ] Documentación de APIs

**Fase 3:**

- [ ] Configurar Supabase Storage
- [ ] Implementar gestión de archivos
- [ ] Implementar notificaciones
- [ ] Implementar webhooks
- [ ] Implementar logs de auditoría
- [ ] Testing de integraciones

**Fase 4:**

- [ ] Implementar campos personalizados
- [ ] Implementar flujos de trabajo
- [ ] Testing de personalización
- [ ] Documentación de usuario final

---

## 🚨 Riesgos y Mitigaciones

| Riesgo                               | Probabilidad | Impacto | Mitigación                                      |
| ------------------------------------ | ------------ | ------- | ----------------------------------------------- |
| **Complejidad del OCR**              | Alta         | Alto    | Empezar con PDFs nativos, luego agregar visión  |
| **Performance con archivos grandes** | Media        | Alto    | Implementar procesamiento asíncrono con workers |
| **Costos de APIs externas**          | Media        | Medio   | Implementar caching y límites de uso            |
| **Migración de datos existentes**    | Baja         | Alto    | Scripts de migración con rollback               |
| **Curva de aprendizaje**             | Alta         | Medio   | Documentación exhaustiva y capacitación         |

---

## 📚 Recursos Necesarios

### Equipo

- **1 Full-Stack Developer** - 100% dedicación
- **1 UI/UX Designer** - 30% dedicación (Fase 1 y 2)
- **1 QA Tester** - 50% dedicación (todas las fases)

### Tiempo Estimado

- **Fase 1:** 3-4 semanas
- **Fase 2:** 3-4 semanas
- **Fase 3:** 2-3 semanas
- **Fase 4:** 3-4 semanas
- **Total:** 11-15 semanas (2.5-3.5 meses)

### Presupuesto Estimado (APIs)

- Google Cloud Vision: ~$1.50 por 1,000 imágenes
- Exchange Rate API: $10-50/mes
- SendGrid: $15-80/mes
- Supabase Storage: $0.021/GB/mes

---

## 🎓 Capacitación y Documentación

### Documentación a Crear

- [ ] Manual de Administrador
- [ ] Manual de Usuario (PM)
- [ ] Manual de Usuario (Administrativo)
- [ ] Manual de Proveedor
- [ ] Guía de API para integraciones
- [ ] Videos tutoriales por módulo

### Sesiones de Capacitación

- [ ] Sesión 1: Panel de Administrador (2h)
- [ ] Sesión 2: Portal de Proveedores (1h)
- [ ] Sesión 3: Legalizador AI (1.5h)
- [ ] Sesión 4: Reportes Avanzados (1h)
- [ ] Sesión 5: Personalización (1.5h)

---

## 📊 Conclusión

Este plan de mejora transformará el sistema actual (40% de funcionalidad) en un sistema completo (100%) que cumple con todos los requisitos del PRD v1.3.

**Beneficios Esperados:**

- ⏱️ **80% reducción** en tiempo administrativo
- 💰 **100% visibilidad** financiera en tiempo real
- 🤖 **90% automatización** de procesos repetitivos
- 📊 **Toma de decisiones** basada en datos precisos
- 🚀 **Escalabilidad** para crecimiento futuro

**Próximo Paso Inmediato:**
Ejecutar **Fase 1 - Semana 1: Dashboard Principal del Administrador**

---

_Documento generado el 27 de Enero 2026 | Basado en PRD v1.3_
