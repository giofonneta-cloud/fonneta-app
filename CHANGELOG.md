# Changelog & Roadmap - Fonnetapp

Este documento centraliza el historial de cambios realizados y el plan de desarrollo futuro del sistema de Gestión Integrada (Agencia & Editorial).

---

## [Roadmap] - Cambios Futuros

Las siguientes funcionalidades están planeadas para las próximas fases de desarrollo, priorizadas por impacto operativo.

### Fase 1: Fundamentos de Administración (Próximamente)

- [ ] **Gestión de Roles Granulares**: Configuración de permisos específicos y roles personalizados.
- [ ] **Portal de Proveedores Interactivo**: Autogestión completa, perfil editable y estado de pagos en tiempo real.
- [ ] **Validación de Documentos**: Flujo administrativo para aprobar/rechazar documentos legales de proveedores.
- [ ] **Categorización Avanzada**: Gestión de categorías y subcategorías de gasto.

### Fase 2: Automatización Financiera

- [ ] **Legalizador AI (OCR)**: Extracción automática de datos de facturas mediante IA (Híbrido Texto/Visión).
- [ ] **Multi-moneda & TRM**: Soporte para múltiples divisas y actualización automática de tasas.
- [ ] **Reportes Avanzados**: Dashboards de flujo de caja proyectado y rentabilidad detallada.

### Fase 3: Optimización

- [ ] **Gestión de Entregables**: Integración con Supabase Storage para manejo de archivos por proyecto.
- [ ] **Sistema de Notificaciones**: Alertas por email y centro de notificaciones en plataforma.
- [ ] **Logs de Auditoría**: Registro completo de actividad por usuario para cumplimiento y seguridad.

---

## [1.5.0] - 2026-02-02

### Added

- **Integración Financiera de Proveedores**:
  - Vinculación automática entre Facturas de Proveedores y Gastos Internos.
  - Generación automática de registros en `gastos` al aprobar una factura.
  - Consistencia de datos financieros (Valor Neto, IVA, Total).
- **Gestión de Plazos de Pago**:
  - Configuración de plazo de pago por defecto a 60 días para proveedores.
  - Capacidad administrativa para ajustar plazos y ver fecha estimada de pago.
- **Mejoras en Dashboard Administrativo**:
  - Modal de revisión enriquecido con selector de proyectos y categorías de gasto.
  - Visualización clara de fechas estimadas y estados de pago.
- **Sistema de Notificaciones In-App**:
  - Centro de notificaciones en tiempo real para Admin y Proveedores.
  - Alertas visuales inmediatas sobre cambios de estado en facturas.
  - Componente `NotificationBell` con contador de notificaciones no leídas.
  - Integración en layouts de Admin y Proveedores.

### Fixed

- **Registro de Proveedores - Condición de Carrera**:
  - Implementado mecanismo de espera para creación de perfil de usuario.
  - Creado API route `/api/create-profile` con privilegios de service role.
  - Solución definitiva para error `foreign key constraint "providers_user_id_fkey"`.
  - Manejo robusto de casos donde el trigger de Supabase falla o es lento.

### Security

- **Credenciales SMTP Expuestas**:
  - Removidas credenciales hardcodeadas de archivos de documentación.
  - Actualizado `GOOGLE_DRIVE_SETUP.md` y `GMAIL_SMTP_SETUP.md` con placeholders.
  - Instrucciones claras para rotación de credenciales comprometidas.
  - Reforzadas prácticas de seguridad en documentación.

## [1.4.0] - 2026-01-28

### Added

- **Dashboard de Administración**: Métricas de salud del sistema, resumen financiero y acciones rápidas.
- **Sistema de Tareas Jerárquicas**: Soporte para subtareas de hasta 3 niveles de profundidad.
- **Auditoría**: Estructura inicial para logs de actividad.

## [1.3.0] - 2026-01-21

### Added

- **Módulo de Tareas estilo ClickUp**: CRUD completo, panel slide-in, estados, prioridades y responsables.
- **Indicadores de Progreso**: Visualización de avance en tarjetas de proyectos del Kanban.
- **Sistema de Comentarios**: Hilo de conversación dentro de cada proyecto.
- **Formularios Financieros Dinámicos**: Registro de ventas y gastos con cálculo automático de IVA.
- **Sanitización de Payloads**: Conversión de strings vacíos a null para integridad de base de datos.

## [1.2.0] - 2026-01-14

### Added

- **Estrategia de Extracción Híbrida**: Base para el Legalizador AI que permite procesar PDFs nativos e imágenes.
- **RLS Multi-tenant**: Aislamiento de datos por organización y roles de usuario.

## [1.1.0] - 2026-01-10

### Added

- **Arquitectura Feature-First**: Reestructuración del proyecto para mejor escalabilidad y mantenibilidad.
- **Chat Interno**: Sistema de comunicación en tiempo real tipo Discord.

## [1.0.0] - 2026-01-05

### Added

- **MVP Inicial**: Autenticación con Supabase, Gestión de Proyectos (Kanban/Tabla) y perfiles básicos.

---

> [!NOTE]
> Este documento se actualiza automáticamente con cada cambio significativo en el sistema.
