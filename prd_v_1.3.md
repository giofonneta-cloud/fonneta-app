# PRD: Sistema de Gestión Integrada - Agencia & Editorial

**Versión:** 1.4 (Implementación Real vs Transición)
**Fecha:** 28 de Enero 2026
**Propietario del Producto:** [Gio Romero]

## 0. Historial de Versiones

| Versión | Fecha       | Cambios Principales                                                                                                                                                                                                                                                  |
| ------- | ----------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1.0     | Ene 2026    | Definición MVP inicial.                                                                                                                                                                                                                                              |
| 1.1     | Ene 2026    | Arquitectura Supabase y RLS Multi-tenant.                                                                                                                                                                                                                            |
| 1.2     | Ene 2026    | Legalizador AI: Extracción Híbrida (Texto/Visión) y validación previa.                                                                                                                                                                                               |
| 1.3     | Ene 2026    | Módulo Financiero: Formularios dinámicos (Gastos/Ventas), cálculo automático de IVA, Gestión de Entregables, sanitización de payloads y lógica "Solicite Documentos".                                                                                                |
| 1.4     | 28 Ene 2026 | **Dashboard de Administración:** Métricas de salud, resumen financiero y acciones rápidas. **Auditoría:** Sistema de logs de actividad. **Tareas:** Soporte para Subtareas Jerárquicas (3 niveles). **Infraestructura:** Soporte inicial para campos personalizados. |

---

## 1. Resumen Ejecutivo

### 1.1 Problema a Resolver

Las agencias creativas y editoriales enfrentan un desafío crítico: **desconexión entre la operación de proyectos y la realidad financiera**. Esto genera:

- Proyectos "completados" sin facturar durante semanas
- Gastos de proveedores registrados manualmente con error del 15-20%
- Cero visibilidad de rentabilidad real hasta cierre mensual
- Flujo de caja impredecible que impide decisiones estratégicas

### 1.2 Solución Propuesta

Plataforma centralizada que **unifica gestión de proyectos con inteligencia financiera automatizada**, eliminando el caos administrativo mediante:

- **Automatización OCR** de facturas vía email (reducción del 90% en entrada manual)
- **Trigger automático** de facturación al completar proyectos
- **Dashboard en tiempo real** de flujo de caja y rentabilidad por proyecto
- **Multi-moneda con TRM actualizada** para visión consolidada

### 1.3 Estado de Implementación (Ene 2026)

- **Avance General:** 65% (PRD v1.4)
- ⏱️ **Registro de Gastos:** ✅ Implementado (Pendiente OCR)
- 💰 **Roles y Permisos:** ✅ 100% Implementado (Supabase Auth + RLS)
- 📊 **Panel de Admin:** ✅ 90% Implementado (Dashboard + Usuarios + Auditoría)
- ✅ **Tareas Jerárquicas:** ✅ 100% Implementado (3 niveles de profundidad)
- 🚀 **Adopción:** En fase de refinamiento de UI/UX.

---

## 2. Definición de Usuarios y Casos de Uso

### 2.1 Roles y Permisos

| Rol                 | Accesos                 | Responsabilidades Críticas                                                                                                                                                                 |
| ------------------- | ----------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Administrador**   | Total                   | • Configuración de presupuestos por proyecto<br>• Aprobación de gastos >USD 500<br>• Análisis de rentabilidad y flujo de caja<br>• Validación final de nuevos proveedores                  |
| **Project Manager** | Proyectos + Entregables | • Gestión de estados del pipeline<br>• Carga de archivos finales<br>• Invitación de proveedores y asignación a proyectos                                                                   |
| **Administrativo**  | Finanzas + Validación   | • Validación de facturas cargadas por proveedores<br>• Aprobación de documentos legales de proveedores<br>• Gestión de cuentas por pagar/cobrar<br>• Emisión de facturas a clientes        |
| **Proveedor**       | Portal Autogestión      | • Registro y mantenimiento de datos fiscales<br>• Carga de documentos legales (RUT, Cámara Comercio, etc.)<br>• Carga de facturas por servicios prestados<br>• Consulta de estado de pagos |

# PRD: Rol de Administrador - Sistema de Gestión Integrada

## 1. Visión General del Rol

### 1.1 Definición del Rol de Administrador

El **Administrador** es el rol con privilegios máximos en el sistema, responsable de la configuración, personalización, supervisión y mantenimiento de toda la plataforma. Este rol actúa como "super usuario" con capacidad de:

- **Configurar** todos los aspectos operativos y financieros del sistema
- **Controlar** el acceso y permisos de todos los demás roles
- **Personalizar** flujos de trabajo, campos y módulos según necesidades del negocio
- **Supervisar** la salud del sistema y tomar decisiones estratégicas basadas en datos
- **Administrar** usuarios, proveedores, clientes y toda la estructura organizacional

**Filosofía de diseño:** El Administrador debe poder gestionar el 95% de las configuraciones del sistema sin necesidad de soporte técnico o desarrollo adicional, a través de interfaces intuitivas de "apuntar y hacer clic".

---

## 2. Dashboard Principal del Administrador

### 2.1 Vista de Control Central

El dashboard del Administrador es diferente al de otros roles, mostrando:

```
┌─────────────────────────────────────────────────────────────────────┐
│ 🏢 PANEL DE CONTROL - ADMINISTRADOR                    [⚙️ Configurar] │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│ 📊 SALUD DEL SISTEMA (Última 24h)                                  │
│ ┌───────────────────────────────────────────────────────────────┐ │
│ │ ✅ Sistema Operativo: 99.8% uptime                             │ │
│ │ 👥 Usuarios Activos: 24/30 (80%)                               │ │
│ │ 💾 Uso de Almacenamiento: 45GB / 100GB (45%)                   │ │
│ │ 🔄 Tareas Programadas: 12/12 ejecutadas correctamente          │ │
│ │ ⚠️ Alertas Pendientes: 3 (2 medias, 1 baja)                    │ │
│ │   └─ [Ver Detalles]                                            │ │
│ └───────────────────────────────────────────────────────────────┘ │
│                                                                     │
│ 💰 RESUMEN FINANCIERO (Mes Actual)                                 │
│ ┌─────────────────────┬─────────────────────┬──────────────────┐ │
│ │ Proyectos Activos   │ Facturación Mensual │ Margen Promedio  │ │
│ │ 18 proyectos        │ $125,000 USD        │ +32.5%           │ │
│ │ ↑ +3 vs mes pasado  │ ↑ +15% vs objetivo  │ ↓ -2.3% vs mes  │ │
│ └─────────────────────┴─────────────────────┴──────────────────┘ │
│                                                                     │
│ 🎯 ACCIONES RÁPIDAS                                                │
│ ┌───────────────────────────────────────────────────────────────┐ │
│ │ [👤 Gestionar Usuarios]  [📋 Configurar Módulos]              │ │
│ │ [🔧 Personalizar Campos] [📊 Ver Reportes Avanzados]          │ │
│ │ [💼 Gestionar Proveedores] [🏗️ Configurar Flujos de Trabajo]  │ │
│ └───────────────────────────────────────────────────────────────┘ │
│                                                                     │
│ 🚨 ALERTAS Y NOTIFICACIONES                                        │
│ ┌───────────────────────────────────────────────────────────────┐ │
│ │ ⚠️ 2 proveedores con documentos por vencer en <7 días          │ │
│ │ 📄 5 facturas pendientes de aprobación >3 días                 │ │
│ │ 👤 Usuario "juan.perez@empresa.com" inactivo >30 días          │ │
│ │ 💾 Backup automático completado: 21/01/2026 02:00 AM           │ │
│ └───────────────────────────────────────────────────────────────┘ │
│                                                                     │
│ 📈 MÉTRICAS DE ADOPCIÓN                                            │
│ ┌───────────────────────────────────────────────────────────────┐ │
│ │ Proyectos gestionados en sistema: 100% (✅ Objetivo cumplido)  │ │
│ │ Proveedores usando portal: 68% (⚠️ Meta: 70%)                  │ │
│ │ Gastos registrados automáticamente: 85% (✅)                   │ │
│ │ Tiempo promedio de aprobación de facturas: 2.1 días (✅)       │ │
│ └───────────────────────────────────────────────────────────────┘ │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 3. Módulos de Administración

### 3.1 Gestión de Usuarios

**Ubicación:** Panel de Control > Usuarios y Permisos

#### 3.1.1 Vista de Usuarios

```
┌─────────────────────────────────────────────────────────────────────┐
│ 👥 GESTIÓN DE USUARIOS                            [+ Nuevo Usuario] │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│ 🔍 Buscar: [___________]  Filtros: [Todos ▼] [Activos ▼] [Rol ▼]  │
│                                                                     │
│ ┌─────────────────────────────────────────────────────────────────┐│
│ │ Usuario             │ Rol            │ Estado    │ Último Acceso││
│ ├─────────────────────┼────────────────┼───────────┼──────────────┤│
│ │ 👤 Juan Pérez       │ Project Manager│ ✅ Activo │ Hoy 9:15 AM  ││
│ │ juan.perez@...      │                │           │ [⋮ Acciones] ││
│ ├─────────────────────┼────────────────┼───────────┼──────────────┤│
│ │ 👤 María González   │ Project Manager│ ✅ Activo │ Hoy 8:45 AM  ││
│ │ maria.gonzalez@...  │                │           │ [⋮ Acciones] ││
│ ├─────────────────────┼────────────────┼───────────┼──────────────┤│
│ │ 👤 Ana López        │ Administrativo │ ✅ Activo │ Hoy 10:30 AM ││
│ │ ana.lopez@...       │                │           │ [⋮ Acciones] ││
│ ├─────────────────────┼────────────────┼───────────┼──────────────┤│
│ │ 👤 Pedro Ramírez    │ Project Manager│ ⚠️ Inactiv│ 15 Dic 2025  ││
│ │ pedro.ramirez@...   │                │   o >30d  │ [⋮ Acciones] ││
│ └─────────────────────┴────────────────┴───────────┴──────────────┘│
│                                                                     │
│ Mostrando 4 de 30 usuarios                    [1] 2 3 ... 5 [→]   │
└─────────────────────────────────────────────────────────────────────┘
```

**Menú de Acciones por Usuario (⋮):**

- 👁️ Ver Perfil Completo
- ✏️ Editar Usuario
- 🔑 Restablecer Contraseña
- 🔒 Bloquear / Desbloquear Cuenta
- 🗑️ Desactivar Usuario (soft delete)
- 📊 Ver Actividad Reciente
- 📧 Enviar Correo de Invitación

#### 3.1.2 Formulario de Creación/Edición de Usuario

```
┌─────────────────────────────────────────────────────────────────────┐
│ ➕ NUEVO USUARIO                                [Cancelar] [Guardar] │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│ 📋 DATOS PERSONALES                                                 │
│ ┌───────────────────────────────────────────────────────────────┐ │
│ │ Nombre Completo: [_______________________________]            │ │
│ │ Email Corporativo: [_______________________________]           │ │
│ │ Teléfono: [_______________________________] (opcional)        │ │
│ │ Cargo/Posición: [_______________________________]             │ │
│ └───────────────────────────────────────────────────────────────┘ │
│                                                                     │
│ 🔐 CONFIGURACIÓN DE ACCESO                                          │
│ ┌───────────────────────────────────────────────────────────────┐ │
│ │ Rol: [Seleccionar Rol ▼]                                      │ │
│ │   ◯ Administrador                                             │ │
│ │   ◯ Project Manager                                           │ │
│ │   ◉ Administrativo                                            │ │
│ │                                                               │ │
│ │ ☑️ Enviar invitación por email (link para crear contraseña)   │ │
│ │ ☐ Requerir cambio de contraseña en primer acceso             │ │
│ │ ☐ Activar autenticación de dos factores (2FA)                │ │
│ └───────────────────────────────────────────────────────────────┘ │
│                                                                     │
│ 🎯 PERMISOS ESPECÍFICOS (Personalizar más allá del rol)            │
│ ┌───────────────────────────────────────────────────────────────┐ │
│ │ Módulos Habilitados:                                          │ │
│ │ ☑️ Proyectos (Gestión)                                         │ │
│ │ ☑️ Finanzas (Solo lectura)                                     │ │
│ │ ☑️ Proveedores (Aprobación de facturas)                        │ │
│ │ ☐ Reportes Avanzados                                          │ │
│ │ ☐ Configuración del Sistema                                   │ │
│ │                                                               │ │
│ │ Límites de Aprobación:                                        │ │
│ │ • Aprobar gastos hasta: [$________] USD                       │ │
│ │ • Aprobar ventas hasta: [$________] USD                       │ │
│ └───────────────────────────────────────────────────────────────┘ │
│                                                                     │
│ 📧 NOTIFICACIONES                                                   │
│ ┌───────────────────────────────────────────────────────────────┐ │
│ │ Recibir notificaciones por:                                   │ │
│ │ ☑️ Email                                                       │ │
│ │ ☑️ En plataforma                                               │ │
│ │ ☐ SMS (requiere configuración adicional)                      │ │
│ │                                                               │ │
│ │ Frecuencia de resúmenes:                                      │ │
│ │ ◯ Diario (9:00 AM)                                            │ │
│ │ ◉ Semanal (Lunes 9:00 AM)                                     │ │
│ │ ◯ Mensual                                                     │ │
│ │ ◯ Nunca                                                       │ │
│ └───────────────────────────────────────────────────────────────┘ │
│                                                                     │
│                                      [Cancelar] [Guardar Usuario]  │
└─────────────────────────────────────────────────────────────────────┘
```

#### 3.1.3 Gestión de Roles y Permisos

**Ubicación:** Panel de Control > Usuarios y Permisos > Configurar Roles

```
┌─────────────────────────────────────────────────────────────────────┐
│ 🔐 CONFIGURACIÓN DE ROLES                          [+ Crear Rol]   │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│ Roles del Sistema:                                                 │
│                                                                     │
│ ┌─────────────────────────────────────────────────────────────────┐│
│ │ 🛡️ ADMINISTRADOR                              [Editar] [Ver 2 👤]││
│ │ Acceso total al sistema. Puede configurar todos los módulos.   ││
│ │ ────────────────────────────────────────────────────────────── ││
│ │ Permisos:                                                       ││
│ │ ✅ Gestión de Usuarios    ✅ Configuración del Sistema          ││
│ │ ✅ Proyectos (CRUD)       ✅ Finanzas (Total)                   ││
│ │ ✅ Proveedores (Total)    ✅ Reportes Avanzados                 ││
│ │ ✅ Chat Interno           ✅ Logs de Auditoría                  ││
│ └─────────────────────────────────────────────────────────────────┘│
│                                                                     │
│ ┌─────────────────────────────────────────────────────────────────┐│
│ │ 👔 PROJECT MANAGER                            [Editar] [Ver 8 👤]││
│ │ Gestión de proyectos, gastos asociados y comunicación.         ││
│ │ ────────────────────────────────────────────────────────────── ││
│ │ Permisos:                                                       ││
│ │ ❌ Gestión de Usuarios    ❌ Configuración del Sistema          ││
│ │ ✅ Proyectos (CRUD)       ⚠️ Finanzas (Solo sus proyectos)      ││
│ │ ⚠️ Proveedores (Invitar)  ⚠️ Reportes (Solo sus proyectos)      ││
│ │ ✅ Chat Interno           ❌ Logs de Auditoría                  ││
│ │                                                                 ││
│ │ Límites:                                                        ││
│ │ • Aprobar gastos hasta: $500 USD                               ││
│ └─────────────────────────────────────────────────────────────────┘│
│                                                                     │
│ ┌─────────────────────────────────────────────────────────────────┐│
│ │ 💼 ADMINISTRATIVO                             [Editar] [Ver 3 👤]││
│ │ Validación financiera, aprobación de facturas y documentos.    ││
│ │ ────────────────────────────────────────────────────────────── ││
│ │ Permisos:                                                       ││
│ │ ❌ Gestión de Usuarios    ❌ Configuración del Sistema          ││
│ │ ⚠️ Proyectos (Solo lectura) ✅ Finanzas (Total)                 ││
│ │ ✅ Proveedores (Aprobación) ✅ Reportes Financieros             ││
│ │ ✅ Chat Interno (Canales Finanzas) ⚠️ Logs (Solo financieros)  ││
│ │                                                                 ││
│ │ Límites:                                                        ││
│ │ • Aprobar gastos: Sin límite                                   ││
│ │ • Aprobar ventas: Sin límite                                   ││
│ └─────────────────────────────────────────────────────────────────┘│
│                                                                     │
│ ┌─────────────────────────────────────────────────────────────────┐│
│ │ 🤝 PROVEEDOR                                  [Editar] [Ver 24 👤]││
│ │ Portal de autogestión para carga de documentos y facturas.     ││
│ │ ────────────────────────────────────────────────────────────── ││
│ │ Permisos:                                                       ││
│ │ ❌ Gestión de Usuarios    ❌ Configuración del Sistema          ││
│ │ ❌ Proyectos              ⚠️ Finanzas (Solo sus facturas)       ││
│ │ ⚠️ Proveedores (Su perfil) ❌ Reportes                          ││
│ │ ⚠️ Chat Interno (Solo canales asignados) ❌ Logs               ││
│ └─────────────────────────────────────────────────────────────────┘│
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

**Leyenda de Permisos:**

- ✅ **Acceso Total:** Crear, Leer, Actualizar, Eliminar
- ⚠️ **Acceso Parcial:** Solo ciertas acciones o datos específicos
- ❌ **Sin Acceso:** Módulo no visible para el rol

**Funcionalidad "Crear Rol Personalizado":**
El Administrador puede crear roles híbridos, por ejemplo:

- "Coordinador Editorial": PM + algunos permisos de Administrativo
- "Analista Financiero": Solo lectura en Finanzas + Reportes Avanzados

---

### 3.2 Configuración de Módulos

**Ubicación:** Panel de Control > Configuración del Sistema > Módulos

#### 3.2.1 Panel de Activación/Desactivación de Módulos

```
┌─────────────────────────────────────────────────────────────────────┐
│ 📋 GESTIÓN DE MÓDULOS                                               │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│ Controla qué funcionalidades están disponibles para cada rol.      │
│ Los cambios se aplican inmediatamente para todos los usuarios.     │
│                                                                     │
│ ┌─────────────────────────────────────────────────────────────────┐│
│ │ MÓDULOS CORE (No se pueden desactivar)                          ││
│ │                                                                 ││
│ │ ✅ Gestión de Proyectos                         [🔒 Bloqueado]  ││
│ │    └─ Vistas: Tabla, Kanban, Calendario, Gantt                 ││
│ │                                                                 ││
│ │ ✅ Gestión de Usuarios                          [🔒 Bloqueado]  ││
│ │    └─ Solo visible para Administradores                        ││
│ └─────────────────────────────────────────────────────────────────┘│
│                                                                     │
│ ┌─────────────────────────────────────────────────────────────────┐│
│ │ MÓDULOS OPCIONALES                                              ││
│ │                                                                 ││
│ │ ✅ Portal de Proveedores                        [⚙️ Configurar] ││
│ │    Permite a proveedores cargar facturas y documentos          ││
│ │    └─ Roles afectados: Proveedor, Administrativo               ││
│ │    └─ [Toggle ON/OFF] Actualmente: ✅ Activo                   ││
│ │                                                                 ││
│ │ ✅ Legalizador AI (OCR de Facturas)             [⚙️ Configurar] ││
│ │    Extracción automática de datos de facturas                  ││
│ │    └─ Roles afectados: Administrativo                          ││
│ │    └─ [Toggle ON/OFF] Actualmente: ✅ Activo                   ││
│ │    └─ Estrategia: ◉ Híbrida (Texto + Visión)  ◯ Solo Texto    ││
│ │                                                                 ││
│ │ ✅ Chat Interno                                 [⚙️ Configurar] ││
│ │    Sistema de comunicación estilo Discord                      ││
│ │    └─ Roles afectados: Todos menos Proveedor                   ││
│ │    └─ [Toggle ON/OFF] Actualmente: ✅ Activo                   ││
│ │                                                                 ││
│ │ ⚠️ Multi-moneda y TRM                           [⚙️ Configurar] ││
│ │    Gestión de múltiples divisas con conversión automática      ││
│ │    └─ Roles afectados: Administrativo, Administrador           ││
│ │    └─ [Toggle ON/OFF] Actualmente: ⚠️ Configuración Pendiente ││
│ │    └─ ⚙️ [Configurar API de TRM]                               ││
│ │                                                                 ││
│ │ ❌ Reportes Avanzados                           [⚙️ Configurar] ││
│ │    Dashboards personalizados y exportación masiva              ││
│ │    └─ Roles afectados: Administrador, Administrativo           ││
│ │    └─ [Toggle ON/OFF] Actualmente: ❌ Inactivo                 ││
│ │    └─ 💡 Requiere activación de módulo Multi-moneda            ││
│ │                                                                 ││
│ │ ❌ Integración Contable (Fase 2)                [🔜 Próximamente]││
│ │    Sincronización con software contable externo                ││
│ │    └─ Disponible en versión 2.0                                ││
│ └─────────────────────────────────────────────────────────────────┘│
│                                                                     │
│ 💡 Nota: Desactivar un módulo oculta toda su funcionalidad de      │
│    los usuarios afectados, pero NO elimina los datos guardados.    │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

#### 3.2.2 Configuración Detallada de Módulos

**Ejemplo: Configurar Portal de Proveedores**

```
┌─────────────────────────────────────────────────────────────────────┐
│ ⚙️ CONFIGURACIÓN: Portal de Proveedores          [Guardar Cambios]  │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│ 🔐 CONTROL DE ACCESO                                                │
│ ┌───────────────────────────────────────────────────────────────┐ │
│ │ ☑️ Permitir auto-registro de proveedores                       │ │
│ │   └─ URL pública: https://sistema.com/proveedor/registro      │ │
│ │   └─ ☐ Requerir aprobación admin antes de activar cuenta      │ │
│ │                                                               │ │
│ │ ☑️ Permitir a PMs invitar proveedores directamente             │ │
│ │   └─ Link de invitación válido por: [7] días                  │ │
│ └───────────────────────────────────────────────────────────────┘ │
│                                                                     │
│ 📋 DOCUMENTOS REQUERIDOS                                            │
│ ┌───────────────────────────────────────────────────────────────┐ │
│ │ Para Persona Natural:                                         │ │
│ │ ☑️ RUT (Obligatorio)                                           │ │
│ │ ☑️ Cédula de Ciudadanía (Obligatorio)                          │ │
│ │ ☐ Certificación Bancaria (Opcional)                           │ │
│ │                                                               │ │
│ │ Para Persona Jurídica:                                        │ │
│ │ ☑️ RUT (Obligatorio)                                           │ │
│ │ ☑️ Cámara de Comercio vigente <30 días (Obligatorio)           │ │
│ │ ☑️ Cédula Representante Legal (Obligatorio)                    │ │
│ │ ☑️ Certificación Bancaria (Obligatorio)                        │ │
│ │ ☐ Pólizas de Cumplimiento (Opcional)                          │ │
│ │                                                               │ │
│ │ [+ Agregar Documento Personalizado]                           │ │
│ └───────────────────────────────────────────────────────────────┘ │
│                                                                     │
│ ⏰ ALERTAS DE VENCIMIENTO                                           │
│ ┌───────────────────────────────────────────────────────────────┐ │
│ │ Enviar recordatorio de actualización:                         │ │
│ │ ☑️ 30 días antes del vencimiento                               │ │
│ │ ☑️ 15 días antes del vencimiento                               │ │
│ │ ☑️ 7 días antes del vencimiento                                │ │
│ │ ☑️ El día del vencimiento                                      │ │
│ │                                                               │ │
│ │ Acción automática al vencer documento:                        │ │
│ │ ◉ Suspender cuenta (no puede cargar nuevas facturas)          │ │
│ │ ◯ Solo alertar (permitir continuar)                           │ │
│ └───────────────────────────────────────────────────────────────┘ │
│                                                                     │
│ 💳 TÉRMINOS DE PAGO                                                 │
│ ┌───────────────────────────────────────────────────────────────┐ │
│ │ Plazo de pago por defecto: [30] días                          │ │
│ │   (El proveedor puede tener un término personalizado)         │ │
│ │                                                               │ │
│ │ ☑️ Permitir pago anticipado con descuento                      │ │
│ │   └─ Descuento si paga en <[10] días: [2]%                    │ │
│ └───────────────────────────────────────────────────────────────┘ │
│                                                                     │
│ 📧 NOTIFICACIONES                                                   │
│ ┌───────────────────────────────────────────────────────────────┐ │
│ │ Notificar a proveedor cuando:                                 │ │
│ │ ☑️ Factura es aprobada                                         │ │
│ │ ☑️ Factura es rechazada                                        │ │
│ │ ☑️ Pago es programado                                          │ │
│ │ ☑️ Pago es realizado                                           │ │
│ │ ☑️ Documento está por vencer                                   │ │
│ └───────────────────────────────────────────────────────────────┘ │
│                                                                     │
│                                                [Cancelar] [Guardar] │
└─────────────────────────────────────────────────────────────────────┘
```

---

### 3.3 Personalización de Campos y Formularios

**Ubicación:** Panel de Control > Configuración del Sistema > Campos Personalizados

#### 3.3.1 Gestión de Campos Personalizados

```
┌─────────────────────────────────────────────────────────────────────┐
│ 🔧 CAMPOS PERSONALIZADOS                          [+ Nuevo Campo]   │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│ Crea campos adicionales para adaptarse a tus procesos de negocio.  │
│                                                                     │
│ 📋 Campos para: [Proyectos ▼]                                      │
│                                                                     │
│ ┌─────────────────────────────────────────────────────────────────┐│
│ │ CAMPOS ACTIVOS                                                  ││
│ │                                                                 ││
│ │ 🏷️ Código de Proyecto Interno                  [Editar] [⚙️]    ││
│ │    Tipo: Texto    │ Obligatorio: ☑️  │ Visible en: Tabla, Kanban││
│ │    Formato: PROJ-YYYY-NNN (ej: PROJ-2026-001)                  ││
│ │    └─ Usado en 45 proyectos                                    ││
│ │                                                                 ││
│ │ 🌐 Idioma del Proyecto                          [Editar] [⚙️]    ││
│ │    Tipo: Dropdown │ Obligatorio: ☐  │ Visible en: Tabla        ││
│ │    Opciones# PRD: Rol de Administrador - Sistema de Gestión Integrada

## 1. Visión General del Rol

### 1.1 Definición del Rol de Administrador

El **Administrador** es el rol con privilegios máximos en el sistema, responsable de la configuración, personalización, supervisión y mantenimiento de toda la plataforma. Este rol actúa como "super usuario" con capacidad de:

- **Configurar** todos los aspectos operativos y financieros del sistema
- **Controlar** el acceso y permisos de todos los demás roles
- **Personalizar** flujos de trabajo, campos y módulos según necesidades del negocio
- **Supervisar** la salud del sistema y tomar decisiones estratégicas basadas en datos
- **Administrar** usuarios, proveedores, clientes y toda la estructura organizacional

**Filosofía de diseño:** El Administrador debe poder gestionar el 95% de las configuraciones del sistema sin necesidad de soporte técnico o desarrollo adicional, a través de interfaces intuitivas de "apuntar y hacer clic".

---

## 2. Dashboard Principal del Administrador

### 2.1 Vista de Control Central

El dashboard del Administrador es diferente al de otros roles, mostrando:

```

┌─────────────────────────────────────────────────────────────────────┐
│ 🏢 PANEL DE CONTROL - ADMINISTRADOR [⚙️ Configurar] │
├─────────────────────────────────────────────────────────────────────┤
│ │
│ 📊 SALUD DEL SISTEMA (Última 24h) │
│ ┌───────────────────────────────────────────────────────────────┐ │
│ │ ✅ Sistema Operativo: 99.8% uptime │ │
│ │ 👥 Usuarios Activos: 24/30 (80%) │ │
│ │ 💾 Uso de Almacenamiento: 45GB / 100GB (45%) │ │
│ │ 🔄 Tareas Programadas: 12/12 ejecutadas correctamente │ │
│ │ ⚠️ Alertas Pendientes: 3 (2 medias, 1 baja) │ │
│ │ └─ [Ver Detalles] │ │
│ └───────────────────────────────────────────────────────────────┘ │
│ │
│ 💰 RESUMEN FINANCIERO (Mes Actual) │
│ ┌─────────────────────┬─────────────────────┬──────────────────┐ │
│ │ Proyectos Activos │ Facturación Mensual │ Margen Promedio │ │
│ │ 18 proyectos │ $125,000 USD │ +32.5% │ │
│ │ ↑ +3 vs mes pasado │ ↑ +15% vs objetivo │ ↓ -2.3% vs mes │ │
│ └─────────────────────┴─────────────────────┴──────────────────┘ │
│ │
│ 🎯 ACCIONES RÁPIDAS │
│ ┌───────────────────────────────────────────────────────────────┐ │
│ │ [👤 Gestionar Usuarios] [📋 Configurar Módulos] │ │
│ │ [🔧 Personalizar Campos] [📊 Ver Reportes Avanzados] │ │
│ │ [💼 Gestionar Proveedores] [🏗️ Configurar Flujos de Trabajo] │ │
│ └───────────────────────────────────────────────────────────────┘ │
│ │
│ 🚨 ALERTAS Y NOTIFICACIONES │
│ ┌───────────────────────────────────────────────────────────────┐ │
│ │ ⚠️ 2 proveedores con documentos por vencer en <7 días │ │
│ │ 📄 5 facturas pendientes de aprobación >3 días │ │
│ │ 👤 Usuario "juan.perez@empresa.com" inactivo >30 días │ │
│ │ 💾 Backup automático completado: 21/01/2026 02:00 AM │ │
│ └───────────────────────────────────────────────────────────────┘ │
│ │
│ 📈 MÉTRICAS DE ADOPCIÓN │
│ ┌───────────────────────────────────────────────────────────────┐ │
│ │ Proyectos gestionados en sistema: 100% (✅ Objetivo cumplido) │ │
│ │ Proveedores usando portal: 68% (⚠️ Meta: 70%) │ │
│ │ Gastos registrados automáticamente: 85% (✅) │ │
│ │ Tiempo promedio de aprobación de facturas: 2.1 días (✅) │ │
│ └───────────────────────────────────────────────────────────────┘ │
│ │
└─────────────────────────────────────────────────────────────────────┘

```

---

## 3. Módulos de Administración

### 3.1 Gestión de Usuarios

**Ubicación:** Panel de Control > Usuarios y Permisos

#### 3.1.1 Vista de Usuarios

```

┌─────────────────────────────────────────────────────────────────────┐
│ 👥 GESTIÓN DE USUARIOS [+ Nuevo Usuario] │
├─────────────────────────────────────────────────────────────────────┤
│ │
│ 🔍 Buscar: [___________] Filtros: [Todos ▼] [Activos ▼] [Rol ▼] │
│ │
│ ┌─────────────────────────────────────────────────────────────────┐│
│ │ Usuario │ Rol │ Estado │ Último Acceso││
│ ├─────────────────────┼────────────────┼───────────┼──────────────┤│
│ │ 👤 Juan Pérez │ Project Manager│ ✅ Activo │ Hoy 9:15 AM ││
│ │ juan.perez@... │ │ │ [⋮ Acciones] ││
│ ├─────────────────────┼────────────────┼───────────┼──────────────┤│
│ │ 👤 María González │ Project Manager│ ✅ Activo │ Hoy 8:45 AM ││
│ │ maria.gonzalez@... │ │ │ [⋮ Acciones] ││
│ ├─────────────────────┼────────────────┼───────────┼──────────────┤│
│ │ 👤 Ana López │ Administrativo │ ✅ Activo │ Hoy 10:30 AM ││
│ │ ana.lopez@... │ │ │ [⋮ Acciones] ││
│ ├─────────────────────┼────────────────┼───────────┼──────────────┤│
│ │ 👤 Pedro Ramírez │ Project Manager│ ⚠️ Inactiv│ 15 Dic 2025 ││
│ │ pedro.ramirez@... │ │ o >30d │ [⋮ Acciones] ││
│ └─────────────────────┴────────────────┴───────────┴──────────────┘│
│ │
│ Mostrando 4 de 30 usuarios [1] 2 3 ... 5 [→] │
└─────────────────────────────────────────────────────────────────────┘

```

**Menú de Acciones por Usuario (⋮):**
- 👁️ Ver Perfil Completo
- ✏️ Editar Usuario
- 🔑 Restablecer Contraseña
- 🔒 Bloquear / Desbloquear Cuenta
- 🗑️ Desactivar Usuario (soft delete)
- 📊 Ver Actividad Reciente
- 📧 Enviar Correo de Invitación

#### 3.1.2 Formulario de Creación/Edición de Usuario

```

┌─────────────────────────────────────────────────────────────────────┐
│ ➕ NUEVO USUARIO [Cancelar] [Guardar] │
├─────────────────────────────────────────────────────────────────────┤
│ │
│ 📋 DATOS PERSONALES │
│ ┌───────────────────────────────────────────────────────────────┐ │
│ │ Nombre Completo: [_______________________________] │ │
│ │ Email Corporativo: [_______________________________] │ │
│ │ Teléfono: [_______________________________] (opcional) │ │
│ │ Cargo/Posición: [_______________________________] │ │
│ └───────────────────────────────────────────────────────────────┘ │
│ │
│ 🔐 CONFIGURACIÓN DE ACCESO │
│ ┌───────────────────────────────────────────────────────────────┐ │
│ │ Rol: [Seleccionar Rol ▼] │ │
│ │ ◯ Administrador │ │
│ │ ◯ Project Manager │ │
│ │ ◉ Administrativo │ │
│ │ │ │
│ │ ☑️ Enviar invitación por email (link para crear contraseña) │ │
│ │ ☐ Requerir cambio de contraseña en primer acceso │ │
│ │ ☐ Activar autenticación de dos factores (2FA) │ │
│ └───────────────────────────────────────────────────────────────┘ │
│ │
│ 🎯 PERMISOS ESPECÍFICOS (Personalizar más allá del rol) │
│ ┌───────────────────────────────────────────────────────────────┐ │
│ │ Módulos Habilitados: │ │
│ │ ☑️ Proyectos (Gestión) │ │
│ │ ☑️ Finanzas (Solo lectura) │ │
│ │ ☑️ Proveedores (Aprobación de facturas) │ │
│ │ ☐ Reportes Avanzados │ │
│ │ ☐ Configuración del Sistema │ │
│ │ │ │
│ │ Límites de Aprobación: │ │
│ │ • Aprobar gastos hasta: [$________] USD │ │
│ │ • Aprobar ventas hasta: [$________] USD │ │
│ └───────────────────────────────────────────────────────────────┘ │
│ │
│ 📧 NOTIFICACIONES │
│ ┌───────────────────────────────────────────────────────────────┐ │
│ │ Recibir notificaciones por: │ │
│ │ ☑️ Email │ │
│ │ ☑️ En plataforma │ │
│ │ ☐ SMS (requiere configuración adicional) │ │
│ │ │ │
│ │ Frecuencia de resúmenes: │ │
│ │ ◯ Diario (9:00 AM) │ │
│ │ ◉ Semanal (Lunes 9:00 AM) │ │
│ │ ◯ Mensual │ │
│ │ ◯ Nunca │ │
│ └───────────────────────────────────────────────────────────────┘ │
│ │
│ [Cancelar] [Guardar Usuario] │
└─────────────────────────────────────────────────────────────────────┘

```

#### 3.1.3 Gestión de Roles y Permisos

**Ubicación:** Panel de Control > Usuarios y Permisos > Configurar Roles

```

┌─────────────────────────────────────────────────────────────────────┐
│ 🔐 CONFIGURACIÓN DE ROLES [+ Crear Rol] │
├─────────────────────────────────────────────────────────────────────┤
│ │
│ Roles del Sistema: │
│ │
│ ┌─────────────────────────────────────────────────────────────────┐│
│ │ 🛡️ ADMINISTRADOR [Editar] [Ver 2 👤]││
│ │ Acceso total al sistema. Puede configurar todos los módulos. ││
│ │ ────────────────────────────────────────────────────────────── ││
│ │ Permisos: ││
│ │ ✅ Gestión de Usuarios ✅ Configuración del Sistema ││
│ │ ✅ Proyectos (CRUD) ✅ Finanzas (Total) ││
│ │ ✅ Proveedores (Total) ✅ Reportes Avanzados ││
│ │ ✅ Chat Interno ✅ Logs de Auditoría ││
│ └─────────────────────────────────────────────────────────────────┘│
│ │
│ ┌─────────────────────────────────────────────────────────────────┐│
│ │ 👔 PROJECT MANAGER [Editar] [Ver 8 👤]││
│ │ Gestión de proyectos, gastos asociados y comunicación. ││
│ │ ────────────────────────────────────────────────────────────── ││
│ │ Permisos: ││
│ │ ❌ Gestión de Usuarios ❌ Configuración del Sistema ││
│ │ ✅ Proyectos (CRUD) ⚠️ Finanzas (Solo sus proyectos) ││
│ │ ⚠️ Proveedores (Invitar) ⚠️ Reportes (Solo sus proyectos) ││
│ │ ✅ Chat Interno ❌ Logs de Auditoría ││
│ │ ││
│ │ Límites: ││
│ │ • Aprobar gastos hasta: $500 USD ││
│ └─────────────────────────────────────────────────────────────────┘│
│ │
│ ┌─────────────────────────────────────────────────────────────────┐│
│ │ 💼 ADMINISTRATIVO [Editar] [Ver 3 👤]││
│ │ Validación financiera, aprobación de facturas y documentos. ││
│ │ ────────────────────────────────────────────────────────────── ││
│ │ Permisos: ││
│ │ ❌ Gestión de Usuarios ❌ Configuración del Sistema ││
│ │ ⚠️ Proyectos (Solo lectura) ✅ Finanzas (Total) ││
│ │ ✅ Proveedores (Aprobación) ✅ Reportes Financieros ││
│ │ ✅ Chat Interno (Canales Finanzas) ⚠️ Logs (Solo financieros) ││
│ │ ││
│ │ Límites: ││
│ │ • Aprobar gastos: Sin límite ││
│ │ • Aprobar ventas: Sin límite ││
│ └─────────────────────────────────────────────────────────────────┘│
│ │
│ ┌─────────────────────────────────────────────────────────────────┐│
│ │ 🤝 PROVEEDOR [Editar] [Ver 24 👤]││
│ │ Portal de autogestión para carga de documentos y facturas. ││
│ │ ────────────────────────────────────────────────────────────── ││
│ │ Permisos: ││
│ │ ❌ Gestión de Usuarios ❌ Configuración del Sistema ││
│ │ ❌ Proyectos ⚠️ Finanzas (Solo sus facturas) ││
│ │ ⚠️ Proveedores (Su perfil) ❌ Reportes ││
│ │ ⚠️ Chat Interno (Solo canales asignados) ❌ Logs ││
│ └─────────────────────────────────────────────────────────────────┘│
│ │
└─────────────────────────────────────────────────────────────────────┘

```

**Leyenda de Permisos:**
- ✅ **Acceso Total:** Crear, Leer, Actualizar, Eliminar
- ⚠️ **Acceso Parcial:** Solo ciertas acciones o datos específicos
- ❌ **Sin Acceso:** Módulo no visible para el rol

**Funcionalidad "Crear Rol Personalizado":**
El Administrador puede crear roles híbridos, por ejemplo:
- "Coordinador Editorial": PM + algunos permisos de Administrativo
- "Analista Financiero": Solo lectura en Finanzas + Reportes Avanzados

---

### 3.2 Configuración de Módulos

**Ubicación:** Panel de Control > Configuración del Sistema > Módulos

#### 3.2.1 Panel de Activación/Desactivación de Módulos

```

┌─────────────────────────────────────────────────────────────────────┐
│ 📋 GESTIÓN DE MÓDULOS │
├─────────────────────────────────────────────────────────────────────┤
│ │
│ Controla qué funcionalidades están disponibles para cada rol. │
│ Los cambios se aplican inmediatamente para todos los usuarios. │
│ │
│ ┌─────────────────────────────────────────────────────────────────┐│
│ │ MÓDULOS CORE (No se pueden desactivar) ││
│ │ ││
│ │ ✅ Gestión de Proyectos [🔒 Bloqueado] ││
│ │ └─ Vistas: Tabla, Kanban, Calendario, Gantt ││
│ │ ││
│ │ ✅ Gestión de Usuarios [🔒 Bloqueado] ││
│ │ └─ Solo visible para Administradores ││
│ └─────────────────────────────────────────────────────────────────┘│
│ │
│ ┌─────────────────────────────────────────────────────────────────┐│
│ │ MÓDULOS OPCIONALES ││
│ │ ││
│ │ ✅ Portal de Proveedores [⚙️ Configurar] ││
│ │ Permite a proveedores cargar facturas y documentos ││
│ │ └─ Roles afectados: Proveedor, Administrativo ││
│ │ └─ [Toggle ON/OFF] Actualmente: ✅ Activo ││
│ │ ││
│ │ ✅ Legalizador AI (OCR de Facturas) [⚙️ Configurar] ││
│ │ Extracción automática de datos de facturas ││
│ │ └─ Roles afectados: Administrativo ││
│ │ └─ [Toggle ON/OFF] Actualmente: ✅ Activo ││
│ │ └─ Estrategia: ◉ Híbrida (Texto + Visión) ◯ Solo Texto ││
│ │ ││
│ │ ✅ Chat Interno [⚙️ Configurar] ││
│ │ Sistema de comunicación estilo Discord ││
│ │ └─ Roles afectados: Todos menos Proveedor ││
│ │ └─ [Toggle ON/OFF] Actualmente: ✅ Activo ││
│ │ ││
│ │ ⚠️ Multi-moneda y TRM [⚙️ Configurar] ││
│ │ Gestión de múltiples divisas con conversión automática ││
│ │ └─ Roles afectados: Administrativo, Administrador ││
│ │ └─ [Toggle ON/OFF] Actualmente: ⚠️ Configuración Pendiente ││
│ │ └─ ⚙️ [Configurar API de TRM] ││
│ │ ││
│ │ ❌ Reportes Avanzados [⚙️ Configurar] ││
│ │ Dashboards personalizados y exportación masiva ││
│ │ └─ Roles afectados: Administrador, Administrativo ││
│ │ └─ [Toggle ON/OFF] Actualmente: ❌ Inactivo ││
│ │ └─ 💡 Requiere activación de módulo Multi-moneda ││
│ │ ││
│ │ ❌ Integración Contable (Fase 2) [🔜 Próximamente]││
│ │ Sincronización con software contable externo ││
│ │ └─ Disponible en versión 2.0 ││
│ └─────────────────────────────────────────────────────────────────┘│
│ │
│ 💡 Nota: Desactivar un módulo oculta toda su funcionalidad de │
│ los usuarios afectados, pero NO elimina los datos guardados. │
│ │
└─────────────────────────────────────────────────────────────────────┘

```

#### 3.2.2 Configuración Detallada de Módulos

**Ejemplo: Configurar Portal de Proveedores**

```

┌─────────────────────────────────────────────────────────────────────┐
│ ⚙️ CONFIGURACIÓN: Portal de Proveedores [Guardar Cambios] │
├─────────────────────────────────────────────────────────────────────┤
│ │
│ 🔐 CONTROL DE ACCESO │
│ ┌───────────────────────────────────────────────────────────────┐ │
│ │ ☑️ Permitir auto-registro de proveedores │ │
│ │ └─ URL pública: https://sistema.com/proveedor/registro │ │
│ │ └─ ☐ Requerir aprobación admin antes de activar cuenta │ │
│ │ │ │
│ │ ☑️ Permitir a PMs invitar proveedores directamente │ │
│ │ └─ Link de invitación válido por: [7] días │ │
│ └───────────────────────────────────────────────────────────────┘ │
│ │
│ 📋 DOCUMENTOS REQUERIDOS │
│ ┌───────────────────────────────────────────────────────────────┐ │
│ │ Para Persona Natural: │ │
│ │ ☑️ RUT (Obligatorio) │ │
│ │ ☑️ Cédula de Ciudadanía (Obligatorio) │ │
│ │ ☐ Certificación Bancaria (Opcional) │ │
│ │ │ │
│ │ Para Persona Jurídica: │ │
│ │ ☑️ RUT (Obligatorio) │ │
│ │ ☑️ Cámara de Comercio vigente <30 días (Obligatorio) │ │
│ │ ☑️ Cédula Representante Legal (Obligatorio) │ │
│ │ ☑️ Certificación Bancaria (Obligatorio) │ │
│ │ ☐ Pólizas de Cumplimiento (Opcional) │ │
│ │ │ │
│ │ [+ Agregar Documento Personalizado] │ │
│ └───────────────────────────────────────────────────────────────┘ │
│ │
│ ⏰ ALERTAS DE VENCIMIENTO │
│ ┌───────────────────────────────────────────────────────────────┐ │
│ │ Enviar recordatorio de actualización: │ │
│ │ ☑️ 30 días antes del vencimiento │ │
│ │ ☑️ 15 días antes del vencimiento │ │
│ │ ☑️ 7 días antes del vencimiento │ │
│ │ ☑️ El día del vencimiento │ │
│ │ │ │
│ │ Acción automática al vencer documento: │ │
│ │ ◉ Suspender cuenta (no puede cargar nuevas facturas) │ │
│ │ ◯ Solo alertar (permitir continuar) │ │
│ └───────────────────────────────────────────────────────────────┘ │
│ │
│ 💳 TÉRMINOS DE PAGO │
│ ┌───────────────────────────────────────────────────────────────┐ │
│ │ Plazo de pago por defecto: [30] días │ │
│ │ (El proveedor puede tener un término personalizado) │ │
│ │ │ │
│ │ ☑️ Permitir pago anticipado con descuento │ │
│ │ └─ Descuento si paga en <[10] días: [2]% │ │
│ └───────────────────────────────────────────────────────────────┘ │
│ │
│ 📧 NOTIFICACIONES │
│ ┌───────────────────────────────────────────────────────────────┐ │
│ │ Notificar a proveedor cuando: │ │
│ │ ☑️ Factura es aprobada │ │
│ │ ☑️ Factura es rechazada │ │
│ │ ☑️ Pago es programado │ │
│ │ ☑️ Pago es realizado │ │
│ │ ☑️ Documento está por vencer │ │
│ └───────────────────────────────────────────────────────────────┘ │
│ │
│ [Cancelar] [Guardar] │
└─────────────────────────────────────────────────────────────────────┘

```

---

### 3.3 Personalización de Campos y Formularios

**Ubicación:** Panel de Control > Configuración del Sistema > Campos Personalizados

#### 3.3.1 Gestión de Campos Personalizados

```

┌─────────────────────────────────────────────────────────────────────┐
│ 🔧 CAMPOS PERSONALIZADOS [+ Nuevo Campo] │
├─────────────────────────────────────────────────────────────────────┤
│ │
│ Crea campos adicionales para adaptarse a tus procesos de negocio. │
│ │
│ 📋 Campos para: [Proyectos ▼] │
│ │
│ ┌─────────────────────────────────────────────────────────────────┐│
│ │ CAMPOS ACTIVOS ││
│ │ ││
│ │ 🏷️ Código de Proyecto Interno [Editar] [⚙️] ││
│ │ Tipo: Texto │ Obligatorio: ☑️ │ Visible en: Tabla, Kanban││
│ │ Formato: PROJ-YYYY-NNN (ej: PROJ-2026-001) ││
│ │ └─ Usado en 45 proyectos ││
│ │ ││
│ │ 🌐 Idioma del Proyecto [Editar] [⚙️] ││
│ │ Tipo: Dropdown │ Obligatorio: ☐ │ Visible en: Tabla ││
│ │ Opciones: Español, Inglés, Portugués, Francés ││
│ │ └─ Usado en 23 proyectos ││
│ │ ││
│ │ 📊 Nivel de Complejidad [Editar] [⚙️] ││
│ │ Tipo: Radio │ Obligatorio: ☑️ │ Visible en: Kanban ││
│ │ Opciones: Baja, Media, Alta, Crítica ││
│ │ └─ Usado en 45 proyectos ││
│ │ ││
│ │ 📅 Fecha de Kick-off [Editar] [⚙️] ││
│ │ Tipo: Fecha │ Obligatorio: ☐ │ Visible en: Calendario ││
│ │ └─ Usado en 32 proyectos ││
│ └─────────────────────────────────────────────────────────────────┘│
│ │
│ ┌─────────────────────────────────────────────────────────────────┐│
│ │ CAMPOS INACTIVOS (Ocultos) ││
│ │ ││
│ │ 🔒 Presupuesto de Marketing [Activar] [🗑️] ││
│ │ Tipo: Dinero │ Creado: 15/11/2025 ││
│ │ └─ No usado en últimos 60 días ││
│ └─────────────────────────────────────────────────────────────────┘│
│ │
└─────────────────────────────────────────────────────────────────────┘

```

#### 3.3.2 Crear Campo Personalizado

```

┌─────────────────────────────────────────────────────────────────────┐
│ ➕ NUEVO CAMPO PERSONALIZADO [Cancelar] [Crear] │
├─────────────────────────────────────────────────────────────────────┤
│ │
│ 📝 INFORMACIÓN BÁSICA │
│ ┌───────────────────────────────────────────────────────────────┐ │
│ │ Aplicar a: [Proyectos ▼] │ │
│ │ Opciones: Proyectos, Gastos, Ventas, Proveedores │ │
│ │ │ │
│ │ Nombre del Campo: [_______________________________] │ │
│ │ Ej: "Código de Proyecto", "Nivel de Urgencia" │ │
│ │ │ │
│ │ Descripción/Ayuda: [_______________________________] │ │
│ │ Se muestra como tooltip al usuario │ │
│ └───────────────────────────────────────────────────────────────┘ │
│ │
│ 🎨 TIPO DE CAMPO │
│ ┌───────────────────────────────────────────────────────────────┐ │
│ │ Selecciona el tipo de dato: │ │
│ │ │ │
│ │ ◉ Texto corto (255 caracteres) │ │
│ │ └─ Ej: Nombres, códigos, URLs │ │
│ │ │ │
│ │ ◯ Texto largo (ilimitado) │ │
│ │ └─ Ej: Descripciones, notas extensas │ │
│ │ │ │
│ │ ◯ Número │ │
│ │ └─ Opciones: [Entero ▼] o [Decimal ▼] │ │
│ │ └─ Formato: [Sin formato ▼] o [Moneda ▼] o [Porcentaje ▼] │ │
│ │ │ │
│ │ ◯ Fecha │ │
│ │ └─ Opciones: [Fecha ▼] o [Fecha y Hora ▼] │ │
│ │ │ │
│ │ ◯ Dropdown (Lista desplegable) │ │
│ │ └─ [+ Agregar Opciones] │ │
│ │ │ │
│ │ ◯ Radio Buttons (Selección única) │ │
│ │ └─ [+ Agregar Opciones] │ │
│ │ │ │
│ │ ◯ Checkboxes (Selección múltiple) │ │
│ │ └─ [+ Agregar Opciones] │ │
│ │ │ │
│ │ ◯ Archivo Adjunto │ │
│ │ └─ Tipos permitidos: [PDF, Imágenes ▼] │ │
│ └───────────────────────────────────────────────────────────────┘ │
│ │
│ ⚙️ CONFIGURACIÓN AVANZADA │
│ ┌───────────────────────────────────────────────────────────────┐ │
│ │ ☑️ Campo obligatorio (requerido para guardar) │ │
│ │ ☐ Campo único (no permitir duplicados) │ │
│ │ ☑️ Mostrar en vista Tabla │ │
│ │ ☑️ Mostrar en vista Kanban │ │
│ │ ☐ Mostrar en vista Calendario │ │
│ │ ☐ Mostrar en vista Gantt │ │
│ │ │ │
│ │ Valor por defecto: [_______________________________] (opcional)│ │
│ │ │ │
│ │ Validaciones: │ │
│ │ ☐ Mínimo: [____] caracteres/valor │ │
│ │ ☐ Máximo: [____] caracteres/valor │ │
│ │ ☐ Expresión regular: [_________________] (avanzado) │ │
│ └───────────────────────────────────────────────────────────────┘ │
│ │
│ 🎯 VISIBILIDAD POR ROL │
│ ┌───────────────────────────────────────────────────────────────┐ │
│ │ Controla quién puede ver/editar este campo: │ │
│ │ │ │
│ │ Administrador: ☑️ Ver ☑️ Editar │ │
│ │ Project Manager: ☑️ Ver ☑️ Editar │ │
│ │ Administrativo: ☑️ Ver ☐ Editar │ │
│ │ Proveedor: ☐ Ver ☐ Editar │ │
│ └───────────────────────────────────────────────────────────────┘ │
│ │
│ [Cancelar] [Crear] │
└─────────────────────────────────────────────────────────────────────┘

```

---

### 3.4 Configuración de Flujos de Trabajo

**Ubicación:** Panel de Control > Configuración del Sistema > Flujos de Trabajo

#### 3.4.1 Gestión de Estados de Proyecto

```

┌─────────────────────────────────────────────────────────────────────┐
│ 🔄 FLUJOS DE TRABAJO: Proyectos [Guardar Cambios] │
├─────────────────────────────────────────────────────────────────────┤
│ │
│ Define los estados por los que pasa un proyecto desde inicio hasta │
│ completado. Los cambios se reflejan en todas las vistas. │
│ │
│ ESTADOS ACTUALES (Arrastra para reordenar): │
│ │
│ ┌───────────────────────────────────────────────────────────────┐ │
│ │ 1️⃣ 🔵 Brief [✏️] [🗑️] [⋮] │ │
│ │ Color: #3B82F6 (Azul) │ │
│ │ Descripción: Recopilación de requisitos y definición │ │
│ │ └─ 8 proyectos en este estado │ │
│ ├───────────────────────────────────────────────────────────────┤ │
│ │ ↓ │ │
│ ├───────────────────────────────────────────────────────────────┤ │
│ │ 2️⃣ 🟣 Diseño [✏️] [🗑️] [⋮] │ │
│ │ Color: #8B5CF6 (Morado) │ │
│ │ Descripción: Creación de propuestas visuales │ │
│ │ └─ 12 proyectos en este estado │ │
│ ├───────────────────────────────────────────────────────────────┤ │
│ │ ↓ │ │
│ ├───────────────────────────────────────────────────────────────┤ │
│ │ 3️⃣ 🟡 Aprobación Cliente [✏️] [🗑️] [⋮] │ │
│ │ Color: #F59E0B (Amarillo) │ │
│ │ Descripción: Esperando feedback del cliente │ │
│ │ ⚠️ Alerta: Si >7 días, notificar a PM │ │
│ │ └─ 5 proyectos en este estado │ │
│ ├───────────────────────────────────────────────────────────────┤ │
│ │ ↓ │ │
│ ├───────────────────────────────────────────────────────────────┤ │
│ │ 4️⃣ 🟠 Producción [✏️] [🗑️] [⋮] │ │
│ │ Color: #F97316 (Naranja) │ │
│ │ Descripción: Ejecución y producción final │ │
│ │ └─ 9 proyectos en este estado │ │
│ ├───────────────────────────────────────────────────────────────┤ │
│ │ ↓ │ │
│ ├───────────────────────────────────────────────────────────────┤ │
│ │ 5️⃣ 🟢 Completado [✏️] [🗑️] [⋮] │ │
│ │ Color: #10B981 (Verde) │ │
│ │ Descripción: Proyecto finalizado y entregado │ │
│ │ 🔔 Trigger: Notificar a Administrativo para facturación │ │
│ │ 🔒 Bloquear edición de gastos (requiere aprobación admin) │ │
│ │ └─ 3 proyectos en este estado │ │
│ ├───────────────────────────────────────────────────────────────┤ │
│ │ ↓ │ │
│ ├───────────────────────────────────────────────────────────────┤ │
│ │ 6️⃣ ✅ Facturado [✏️] [🗑️] [⋮] │ │
│ │ Color: #6B7280 (Gris) │ │
│ │ Descripción: Factura emitida y registrada │ │
│ │ 🔒 Proyecto archivado automáticamente │ │
│ │ └─ 45 proyectos en este estado │ │
│ └───────────────────────────────────────────────────────────────┘ │
│ │
│ [+ Agregar Estado] │
│ │
│ ⚙️ CONFIGURACIÓN AVANZADA │
│ ┌───────────────────────────────────────────────────────────────┐ │
│ │ ☑️ Permitir saltar estados (no requerir flujo secuencial) │ │
│ │ ☐ Requerir comentario al cambiar estado │ │
│ │ ☑️ Registrar historial de cambios (auditoría) │ │
│ │ ☐ Notificar a PM al cambiar estado │ │
│ └───────────────────────────────────────────────────────────────┘ │
│ │
│ [Cancelar] [Guardar] │
└─────────────────────────────────────────────────────────────────────┘

```

#### 3.4.2 Editar Estado Individual

```

┌─────────────────────────────────────────────────────────────────────┐
│ ✏️ EDITAR ESTADO: Diseño [Cancelar] [Guardar]│
├─────────────────────────────────────────────────────────────────────┤
│ │
│ 📝 INFORMACIÓN BÁSICA │
│ ┌───────────────────────────────────────────────────────────────┐ │
│ │ Nombre: [Diseño______________] │ │
│ │ │ │
│ │ Descripción: [__________________________________________] │ │
│ │ [__________________________________________] │ │
│ │ │ │
│ │ Color: [🎨] #8B5CF6 [🟣 Morado] │ │
│ │ └─ Se usa en tarjetas Kanban y etiquetas │ │
│ │ │ │
│ │ Icono (opcional): [🎨 ▼] Diseño │ │
│ └───────────────────────────────────────────────────────────────┘ │
│ │
│ ⚡ ACCIONES AUTOMÁTICAS │
│ ┌───────────────────────────────────────────────────────────────┐ │
│ │ Al entrar a este estado: │ │
│ │ ☐ Enviar notificación a PM │ │
│ │ ☐ Enviar notificación a Cliente │ │
│ │ ☑️ Iniciar contador de tiempo en estado │ │
│ │ ☐ Requerir carga de archivo adjunto │ │
│ │ │ │
│ │ Al salir de este estado: │ │
│ │ ☑️ Requerir confirmación │ │
│ │ └─ Mensaje: "¿Confirmas que el diseño está listo?" │ │
│ │ ☐ Requerir aprobación de superior │ │
│ └───────────────────────────────────────────────────────────────┘ │
│ │
│ ⏰ ALERTAS DE TIEMPO │
│ ┌───────────────────────────────────────────────────────────────┐ │
│ │ ☑️ Alertar si el proyecto permanece en este estado >X días │ │
│ │ └─ Días límite: [14] días │ │
│ │ └─ Notificar a: ☑️ PM ☐ Admin ☐ Cliente │ │
│ │ └─ Acción: [Enviar email de recordatorio ▼] │ │
│ └───────────────────────────────────────────────────────────────┘ │
│ │
│ 🔒 RESTRICCIONES │
│ ┌───────────────────────────────────────────────────────────────┐ │
│ │ Estados permitidos DESPUÉS de éste: │ │
│ │ ☑️ Aprobación Cliente │ │
│ │ ☐ Producción (salto directo) │ │
│ │ ☑️ Brief (regresar) │ │
│ │ ☐ Completado (no permitir salto) │ │
│ │ │ │
│ │ Roles que pueden mover A este estado: │ │
│ │ ☑️ Administrador │ │
│ │ ☑️ Project Manager │ │
│ │ ☐ Administrativo │ │
│ └───────────────────────────────────────────────────────────────┘ │
│ │
│ [Cancelar] [Guardar] │
└─────────────────────────────────────────────────────────────────────┘

```

---

### 3.5 Gestión de Proveedores (Administrador)

**Ubicación:** Panel de Control > Proveedores

```

┌─────────────────────────────────────────────────────────────────────┐
│ 🤝 GESTIÓN DE PROVEEDORES [+ Invitar Proveedor]│
├─────────────────────────────────────────────────────────────────────┤
│ │
│ 🔍 Buscar: [___________] Filtros: [Estado ▼] [Tipo ▼] [Categoría ▼]│
│ │
│ ESTADÍSTICAS RÁPIDAS: │
│ ┌─────────────┬──────────────┬──────────────┬─────────────────┐ │
│ │ Total │ Activos │ Pendientes │ Documentos │ │
│ │ 45 │ 38 │ 3 │ 5 por vencer │ │
│ └─────────────┴──────────────┴──────────────┴─────────────────┘ │
│ │
│ ┌─────────────────────────────────────────────────────────────────┐│
│ │ Proveedor │ Tipo │ Categoría │ Estado │ Acciones││
│ ├─────────────────┼───────────┼─────────────┼──────────┼─────────┤│
│ │ Imprenta Andes │ Jurídica │ Imprenta │ ✅ Activo│ [⋮] ││
│ │ NIT: 900123456 │ │ │ │ ││
│ │ 📄 Docs: ✅ OK │ │ Total: $45K │ Última: │ ││
│ │ │ │ │ 18/01/26 │ ││
│ ├─────────────────┼───────────┼─────────────┼──────────┼─────────┤│
│ │ Juan Pérez │ Natural │ Diseño │ ✅ Activo│ [⋮] ││
│ │ CC: 1012345678 │ │ Freelance │ │ ││
│ │ 📄 Docs: ⚠️ Vence│ │ Total: $12K │ Última: │ ││
│ │ CdC 25/01 │ │ │ 20/01/26 │ ││
│ ├─────────────────┼───────────┼─────────────┼──────────┼─────────┤│
│ │ Logística Plus │ Jurídica │ Logística │ ⚠️ Pend. │ [⋮] ││
│ │ NIT: 800456789 │ │ │ Aprobación│ ││
│ │ 📄 Docs: 🔄 Rev. │ │ Total: $0 │ Registr: │ ││
│ │ │ │ │ 19/01/26 │ ││
│ ├─────────────────┼───────────┼─────────────┼──────────┼─────────┤│
│ │ Diseños Modernos│ Jurídica │ Diseño │ 🔴 Suspnd│ [⋮] ││
│ │ NIT: 900789012 │ │ │ Docs Vnc.│ ││
│ │ 📄 Docs: ❌ Venc.│ │ Total: $8K │ Última: │ ││
│ │ CdC 10/01 │ │ │ 05/01/26 │ ││
│ └─────────────────┴───────────┴─────────────┴──────────┴─────────┘│
│ │
│ Mostrando 4 de 45 proveedores [1] 2 3 ... 8 [→] │
└─────────────────────────────────────────────────────────────────────┘

```

**Menú de Acciones (⋮):**
- 👁️ Ver Ficha Completa
- ✏️ Editar Información
- 📄 Gestionar Documentos
- 📊 Ver Historial de Facturas
- ✅ Aprobar Proveedor (si pendiente)
- 🔒 Suspender / Reactivar
- 📧 Enviar Recordatorio de Documentos
- 🗑️ Desactivar Proveedor

---

### 3.6 Configuración de Categorías de Gasto

**Ubicación:** Panel de Control > Configuración del Sistema > Categorías

```

┌─────────────────────────────────────────────────────────────────────┐
│ 📂 CATEGORÍAS DE GASTO [+ Nueva Categoría]│
├─────────────────────────────────────────────────────────────────────┤
│ │
│ Personaliza las categorías para clasificar gastos y generar │
│ reportes más precisos. │
│ │
│ ┌─────────────────────────────────────────────────────────────────┐│
│ │ CATEGORÍAS ACTIVAS ││
│ │ ││
│ │ 🖨️ Material Impreso [✏️] [↑] [↓] ││
│ │ Subcategorías: Offset, Digital, Gran formato ││
│ │ └─ Usado en 245 gastos │ Total: $125,000 USD ││
│ │ ││
│ │ 🎨 Diseño [✏️] [↑] [↓] ││
│ │ Subcategorías: Gráfico, UI/UX, 3D, Ilustración ││
│ │ └─ Usado en 180 gastos │ Total: $45,000 USD ││
│ │ ││
│ │ 🚚 Logística [✏️] [↑] [↓] ││
│ │ Subcategorías: Envíos, Almacenamiento, Transporte ││
│ │ └─ Usado en 120 gastos │ Total: $18,000 USD ││
│ │ ││
│ │ 💼 Servicios Profesionales [✏️] [↑] [↓] ││
│ │ Subcategorías: Consultoría, Legal, Contable ││
│ │ └─ Usado en 65 gastos │ Total: $32,000 USD ││
│ │ ││
│ │ 📸 Producción Audiovisual [✏️] [↑] [↓] ││
│ │ Subcategorías: Fotografía, Video, Edición ││
│ │ └─ Usado en 45 gastos │ Total: $22,000 USD ││
│ │ ││
│ │ 🌐 Marketing Digital [✏️] [↑] [↓] ││
│ │ Subcategorías: Pauta Social, SEM, Email Mktg ││
│ │ └─ Usado en 38 gastos │ Total: $15,000 USD ││
│ │ ││
│ │ 🔧 Otros Gastos [✏️] [↑] [↓] ││
│ │ └─ Usado en 12 gastos │ Total: $3,500 USD ││
│ └─────────────────────────────────────────────────────────────────┘│
│ │
│ ┌─────────────────────────────────────────────────────────────────┐│
│ │ CATEGORÍAS INACTIVAS ││
│ │ ││
│ │ 🔒 Eventos Presenciales [Activar] [🗑️] ││
│ │ └─ Sin uso en últimos 90 días ││
│ └─────────────────────────────────────────────────────────────────┘│
│ │
│ 💡 Nota: Eliminar una categoría no elimina los gastos asociados, │
│ pero los reclasificará como "Sin Categoría". │
│ │
└─────────────────────────────────────────────────────────────────────┘

```

---

### 3.7 Configuración del Sistema de Chat

**Ubicación:** Panel de Control > Configuración del Sistema > Chat Interno

```

┌─────────────────────────────────────────────────────────────────────┐
│ 💬 CONFIGURACIÓN: Chat Interno [Guardar Cambios] │
├─────────────────────────────────────────────────────────────────────┤
│ │
│ ⚡ ESTADO DEL MÓDULO │
│ ┌───────────────────────────────────────────────────────────────┐ │
│ │ Chat Interno: [🟢 Activo] [Desactivar Módulo] │ │
│ │ Usuarios conectados ahora: 12/30 │ │
│ │ Mensajes hoy: 145 │ │
│ │ Canales activos: 28 (18 proyectos, 5 clientes, 5 proveedores) │ │
│ └───────────────────────────────────────────────────────────────┘ │
│ │
│ 🏗️ CREACIÓN AUTOMÁTICA DE CANALES │
│ ┌───────────────────────────────────────────────────────────────┐ │
│ │ ☑️ Crear canal automáticamente al crear nuevo proyecto │ │
│ │ └─ Formato del nombre: [#proyecto-{nombre-proyecto}] │ │
│ │ └─ Miembros automáticos: PM, Admin, Administrativo │ │
│ │ │ │
│ │ ☑️ Crear canal al aprobar nuevo proveedor │ │
│ │ └─ Formato del nombre: [#proveedor-{nombre-proveedor}] │ │
│ │ └─ Miembros automáticos: Proveedor, Admin, Administrativo │ │
│ │ │ │
│ │ ☐ Crear canal al registrar nuevo cliente │ │
│ └───────────────────────────────────────────────────────────────┘ │
│ │
│ 🔒 PERMISOS Y PRIVACIDAD │
│ ┌───────────────────────────────────────────────────────────────┐ │
│ │ Proveedores pueden: │ │
│ │ ☑️ Ver mensajes en sus canales asignados │ │
│ │ ☑️ Escribir mensajes │ │
│ │ ☑️ Subir archivos (facturas, entregables) │ │
│ │ ☐ Ver canales de otros proyectos │ │
│ │ ☐ Mencionar a usuarios fuera de sus canales │ │
│ │ │ │
│ │ Project Managers pueden: │ │
│ │ ☑️ Crear canales de cliente │ │
│ │ ☐ Crear canales generales │ │
│ │ ☑️ Archivar canales de sus proyectos │ │
│ │ ☐ Eliminar mensajes de otros usuarios │ │
│ └───────────────────────────────────────────────────────────────┘ │
│ │
│ 📁 GESTIÓN DE ARCHIVOS │
│ ┌───────────────────────────────────────────────────────────────┐ │
│
│ └───────────────────────────────────────────────────────────────┘ │
│ │
│ 🔔 WEBHOOKS │
│ ┌───────────────────────────────────────────────────────────────┐ │
│ │ Envía notificaciones a URLs externas cuando ocurran eventos │ │
│ │ │ │
│ │ ┌─────────────────────────────────────────────────────────┐ │ │
│ │ │ Webhook #1: Slack - Canal #finanzas [✏️] [🗑️] │ │ │
│ │ │ URL: https://hooks.slack.com/services/T.../B.../x... │ │ │
│ │ │ Eventos: Gasto aprobado, Factura recibida │ │ │
│ │ │ Estado: ✅ Activo │ Última ejecución: Hoy 10:15 AM │ │ │
│ │ ├─────────────────────────────────────────────────────────┤ │ │
│ │ │ Webhook #2: Sistema Contable Externo [✏️] [🗑️] │ │ │
│ │ │ URL: https://api.contable.com/webhook │ │ │
│ │ │ Eventos: Proyecto facturado, Venta registrada │ │ │
│ │ │ Estado: ⚠️ Error │ Último intento: Hoy 09:00 AM │ │ │
│ │ │ └─ Error: Connection timeout (500) │ │ │
│ │ └─────────────────────────────────────────────────────────┘ │ │
│ │ │ │
│ │ [+ Crear Nuevo Webhook] │ │
│ └───────────────────────────────────────────────────────────────┘ │
│ │
│ 📖 DOCUMENTACIÓN DE API │
│ ┌───────────────────────────────────────────────────────────────┐ │
│ │ [📘 Ver Documentación Completa] │ │
│ │ [🧪 Explorador de API (Swagger UI)] │ │
│ └───────────────────────────────────────────────────────────────┘ │
│ │
└─────────────────────────────────────────────────────────────────────┘

```

---

## 5. Permisos Granulares del Administrador

### 5.1 Matriz Completa de Permisos

El Administrador tiene acceso total, pero puede delegar permisos específicos:

| Acción | Admin | PM | Administrativo | Proveedor |
|--------|-------|-----|----------------|-----------|
| **PROYECTOS** |
| Crear proyecto | ✅ | ✅ | ❌ | ❌ |
| Editar cualquier proyecto | ✅ | ⚠️ Solo suyos | ❌ | ❌ |
| Eliminar proyecto | ✅ | ❌ | ❌ | ❌ |
| Ver todos los proyectos | ✅ | ⚠️ Solo suyos | ✅ Solo lectura | ❌ |
| Cambiar PM de proyecto | ✅ | ❌ | ❌ | ❌ |
| Archivar proyecto | ✅ | ⚠️ Solo suyos | ❌ | ❌ |
| **GASTOS** |
| Registrar gasto | ✅ | ✅ | ✅ | ❌ |
| Aprobar gasto <$500 | ✅ | ✅ | ✅ | ❌ |
| Aprobar gasto >$500 | ✅ | ❌ | ✅ | ❌ |
| Editar gasto aprobado | ✅ | ❌ | ⚠️ Con justificación | ❌ |
| Eliminar gasto | ✅ | ❌ | ❌ | ❌ |
| **VENTAS/INGRESOS** |
| Registrar venta | ✅ | ❌ | ✅ | ❌ |
| Aprobar venta | ✅ | ❌ | ✅ | ❌ |
| Editar venta | ✅ | ❌ | ⚠️ Con justificación | ❌ |
| Marcar como cobrado | ✅ | ❌ | ✅ | ❌ |
| **PROVEEDORES** |
| Ver todos los proveedores | ✅ | ✅ | ✅ | ⚠️ Solo su perfil |
| Crear proveedor | ✅ | ⚠️ Invitar | ✅ | ❌ |
| Editar proveedor | ✅ | ❌ | ⚠️ Datos financieros | ⚠️ Su perfil |
| Aprobar proveedor | ✅ | ❌ | ✅ | ❌ |
| Suspender proveedor | ✅ | ❌ | ✅ | ❌ |
| Validar documentos | ✅ | ❌ | ✅ | ❌ |
| **USUARIOS** |
| Ver usuarios | ✅ | ❌ | ❌ | ❌ |
| Crear usuario | ✅ | ❌ | ❌ | ❌ |
| Editar usuario | ✅ | ❌ | ❌ | ❌ |
| Cambiar rol | ✅ | ❌ | ❌ | ❌ |
| Desactivar usuario | ✅ | ❌ | ❌ | ❌ |
| Ver logs de actividad | ✅ | ⚠️ Solo suyos | ⚠️ Solo financieros | ❌ |
| **CONFIGURACIÓN** |
| Modificar estados de proyecto | ✅ | ❌ | ❌ | ❌ |
| Crear campos personalizados | ✅ | ❌ | ❌ | ❌ |
| Activar/desactivar módulos | ✅ | ❌ | ❌ | ❌ |
| Configurar notificaciones | ✅ | ❌ | ❌ | ❌ |
| Acceder a logs de auditoría | ✅ | ❌ | ⚠️ Solo financieros | ❌ |
| Gestionar backups | ✅ | ❌ | ❌ | ❌ |
| Restaurar sistema | ✅ | ❌ | ❌ | ❌ |
| **REPORTES** |
| Ver dashboards básicos | ✅ | ✅ | ✅ | ⚠️ Solo sus datos |
| Generar reportes avanzados | ✅ | ⚠️ Solo sus proyectos | ✅ | ❌ |
| Exportar datos | ✅ | ⚠️ Solo sus proyectos | ✅ | ❌ |
| Ver flujo de caja | ✅ | ❌ | ✅ | ❌ |
| **CHAT INTERNO** |
| Ver todos los canales | ✅ | ⚠️ Solo asignados | ⚠️ Solo finanzas | ⚠️ Solo asignados |
| Crear canales | ✅ | ⚠️ Solo clientes | ❌ | ❌ |
| Eliminar mensajes | ✅ | ⚠️ Solo propios | ⚠️ Solo propios | ⚠️ Solo propios |
| Archivar canales | ✅ | ⚠️ Solo sus proyectos | ❌ | ❌ |

**Leyenda:**
- ✅ **Acceso Total**
- ⚠️ **Acceso Parcial** (con restricciones especificadas)
- ❌ **Sin Acceso**

---

## 6. Casos de Uso del Administrador

### 6.1 Onboarding de Nueva Empresa

**Escenario:** La empresa acaba de contratar el sistema. El Administrador debe configurarlo desde cero.

**Checklist de Configuración Inicial:**

```

☐ 1. Configurar Información de la Empresa
└─ Nombre, logo, colores corporativos

☐ 2. Crear Usuarios del Equipo Interno
└─ Administrador adicional (backup)
└─ Project Managers (2-3)
└─ Administrativo/Contable (1-2)

☐ 3. Configurar Flujo de Trabajo de Proyectos
└─ Definir estados personalizados
└─ Configurar alertas por estado
└─ Establecer triggers automáticos

☐ 4. Personalizar Categorías de Gasto
└─ Adaptar a rubros de la empresa
└─ Crear subcategorías relevantes

☐ 5. Configurar Multi-moneda (si aplica)
└─ Activar API de TRM
└─ Definir moneda base

☐ 6. Configurar Portal de Proveedores
└─ Definir documentos requeridos
└─ Establecer términos de pago
└─ Configurar alertas de vencimiento

☐ 7. Invitar Primeros Proveedores
└─ 5-10 proveedores piloto
└─ Hacer onboarding asistido

☐ 8. Configurar Notificaciones
└─ Email remitente
└─ Eventos que generan notificación
└─ Resúmenes programados

☐ 9. Activar Módulos Necesarios
└─ Chat Interno
└─ Legalizador AI
└─ Reportes Avanzados

☐ 10. Configurar Backups Automáticos
└─ Horario de backup
└─ Retención de archivos
└─ Probar restauración

☐ 11. Capacitar al Equipo
└─ Sesión con PMs
└─ Sesión con Administrativo
└─ Documentación entregada

☐ 12. Importar Datos Históricos (opcional)
└─ Proyectos del último año
└─ Proveedores activos

```

---

### 6.2 Resolución de Problemas Comunes

**Problema 1: Usuario reporta que no puede ver un proyecto**

**Solución del Administrador:**
1. Ir a **Usuarios > [Usuario]**
2. Verificar rol asignado
3. Si es PM: Ver si es el PM asignado al proyecto
4. Si no: Reasignar PM o dar permisos especiales
5. Usar "Vista Previa" para confirmar que ahora lo ve

**Problema 2: Proveedor suspendido por error**

**Solución del Administrador:**
1. Ir a **Proveedores > [Proveedor]**
2. Revisar documentos vencidos
3. Si documento fue actualizado pero no validado:
   - Ir a **Gestionar Documentos**
   - Validar manualmente el documento
4. Cambiar estado a "Activo"
5. Notificar al proveedor

**Problema 3: Factura perdida / no procesada por OCR**

**Solución del Administrador:**
1. Ir a **Gastos > Crear Gasto Manual**
2. Llenar datos de la factura
3. Adjuntar PDF manualmente
4. Marcar como "Revisión Manual" para auditoría
5. Investigar por qué OCR falló (revisar logs)

---

## 7. Mejores Prácticas para Administradores

### 7.1 Seguridad

✅ **Hacer:**
- Activar 2FA en cuenta de Administrador
- Cambiar contraseña cada 90 días
- Revisar logs de auditoría semanalmente
- Limitar número de usuarios con rol Admin (máximo 2-3)
- Hacer backup manual antes de cambios importantes

❌ **NO Hacer:**
- Compartir credenciales de Admin con otros
- Otorgar permisos de Admin por conveniencia
- Desactivar logs de auditoría
- Ignorar alertas de seguridad

### 7.2 Mantenimiento Regular

**Semanal:**
- Revisar facturas pendientes >3 días
- Verificar proveedores con documentos por vencer
- Revisar usuarios inactivos
- Monitorear uso de almacenamiento

**Mensual:**
- Generar reporte de auditoría completo
- Revisar permisos de usuarios
- Limpiar proyectos archivados antiguos
- Actualizar categorías de gasto si es necesario
- Revisar efectividad de flujos de trabajo

**Trimestral:**
- Capacitación de refuerzo al equipo
- Evaluación de adopción de módulos
- Revisión de backups y prueba de restauración
- Análisis de métricas de uso del sistema

### 7.3 Comunicación con el Equipo

**Al hacer cambios importantes:**
1. Notificar con 48h de anticipación
2. Explicar el porqué del cambio
3. Ofrecer sesión de Q&A
4. Documentar el cambio en el sistema
5. Dar período de adaptación (1-2 semanas)

**Ejemplo de comunicado:**
```

📢 CAMBIO EN EL SISTEMA - 23/01/2026

Hola equipo,

A partir del lunes 27/01 haremos un cambio en el flujo de proyectos:

✨ QUÉ CAMBIA:
• Nuevo estado "Validación Interna" entre "Diseño" y "Aprobación Cliente"
• Objetivo: Revisar calidad antes de enviar al cliente

👤 QUIÉN LE AFECTA:
• Project Managers: Deben mover proyectos al nuevo estado
• Diseñadores: Tendrán un checkpoint adicional

📅 CUÁNDO:
• Cambio activo desde el 27/01 a las 9:00 AM

💡 CAPACITACIÓN:
• Sesión virtual: Viernes 24/01 a las 3:00 PM (30 min)
• Link: [zoom.us/j/...]

❓ DUDAS:
• Responder a este mensaje o escribirme por el chat

Gracias por su colaboración,
[Nombre Administrador]

```

---

## 8. Conclusión

El rol de **Administrador** en el Sistema de Gestión Integrada es el más poderoso y versátil, diseñado para dar control total sobre la plataforma sin necesidad de conocimientos técnicos avanzados. Con las herramientas descritas en este PRD, el Administrador puede:

✅ **Configurar** el sistema completamente según las necesidades del negocio
✅ **Personalizar** campos, flujos de trabajo y categorías
✅ **Controlar** el acceso granular de todos los usuarios
✅ **Supervisar** la salud del sistema y tomar decisiones basadas en datos
✅ **Resolver** problemas de usuarios sin escalar a soporte técnico
✅ **Mantener** la seguridad y integridad de los datos
✅ **Escalar** el sistema conforme crece la operación

**Filosofía de diseño:** "Poder sin complejidad" - El Administrador tiene capacidades de superusuario, pero a través de interfaces intuitivas que no requieren conocimientos de programación.

-












### 2.2 Historias de Usuario Principales

**Como Administrador:**
> "Necesito ver cada lunes a las 9am un dashboard que me muestre: proyectos completados sin facturar, flujo de caja proyectado a 30 días, y los 3 proyectos menos rentables del mes."

**Como Project Manager:**
> "Cuando marco un proyecto como 'Completado', quiero que automáticamente se notifique a administrativa y que el proyecto aparezca en su cola de facturación, sin que yo tenga que enviar un correo aparte."

**Como Administrativo:**
> "Cuando llegue una factura de la imprenta a mi correo, quiero que el sistema la lea automáticamente y solo me pida confirmar a qué proyecto pertenece, en lugar de tener que tipear todo manualmente en Excel."

**Como Proveedor:**
> "Cuando termine un trabajo, necesito poder entrar a mi portal, subir mi factura y los documentos de entrega, y ver en qué fecha me van a pagar, sin tener que llamar cada semana para preguntar."

---

## 3. Requerimientos Funcionales (MVP)

### 3.1 Módulo: Gestión de Proyectos

#### 3.1.1 Vistas Múltiples de Proyectos (Inspirado en ClickUp)

**Concepto:** El usuario puede alternar entre 4 vistas diferentes del mismo conjunto de proyectos, manteniendo filtros y configuraciones. Cada vista está optimizada para diferentes necesidades de gestión.

**Selector de Vista (Toggle en la parte superior):**
```

[📋 Tabla] [📊 Kanban] [📅 Calendario] [📈 Gantt]

````

---

#### **Vista 1: Tabla (List View)**

**Propósito:** Análisis detallado y edición rápida de múltiples proyectos.

**Columnas Configurables (usuario puede mostrar/ocultar):**

| Campo | Tipo | Editable | Descripción |
|-------|------|----------|-------------|
| ☑️ Checkbox | - | ✅ | Selección múltiple para acciones en lote |
| 🔴 Estado | Badge | ✅ | Click para cambiar rápidamente |
| Nombre Proyecto | Texto | ✅ | Inline editing (doble click) |
| Cliente | Texto | ✅ | Autocompletado |
| Tipo Servicio | Tag | ✅ | Dropdown: Revista/Branding/Digital/Otro |
| Presupuesto | Dinero | ❌ | Formato: $2,500 USD (click abre modal) |
| Margen Real | % | ❌ | Calculado, color según performance |
| PM Responsable | Avatar | ✅ | Dropdown de usuarios |
| Fecha Inicio | Fecha | ✅ | Date picker |
| Fecha Entrega | Fecha | ✅ | Date picker, resalta si <7 días |
| Días en Estado | Número | ❌ | Calculado, alerta si >30 |
| Gastos Reales | Dinero | ❌ | Click muestra desglose |
| Archivos | Contador | ❌ | ej: "3 archivos" (click abre modal) |
| ... | Custom | ✅ | Campos personalizados (Fase 2 post-MVP) |

**Funcionalidades de Tabla:**

1. **Ordenamiento:**
   - Click en header de columna para ordenar ASC/DESC
   - Multi-ordenamiento: Shift+Click para orden secundario
   - Ejemplo: Ordenar por Estado, luego por Fecha de Entrega

2. **Filtros Avanzados:**
   - Panel lateral de filtros:
     ```
     🔍 Buscar por nombre...

     Estado: [Todos ▼]
       ☐ Brief
       ☐ Diseño
       ☑ En Producción
       ☐ Completado

     Cliente: [Todos ▼]

     Tipo Servicio: [Todos ▼]

     PM Responsable: [Todos ▼]

     Rango de Fechas:
       Desde: [__/__/____]
       Hasta: [__/__/____]

     Margen:
       ○ Todos
       ○ Solo rentables (>0%)
       ○ Solo en pérdida (<0%)

     [Limpiar Filtros] [Aplicar]
     ```

3. **Acciones en Lote (con checkboxes):**
   - Cambiar estado de múltiples proyectos
   - Asignar PM
   - Exportar selección a Excel/CSV
   - Eliminar (con confirmación)

4. **Edición Inline:**
   - Doble click en celda editable abre editor
   - Enter guarda, Esc cancela
   - Auto-save con indicador visual

5. **Agrupamiento (Opcional para Fase 2):**
   - Agrupar por: Estado, Cliente, PM, Tipo de Servicio
   - Vista colapsable por grupos

**Acciones por Fila:**
- Hover en fila muestra menú de acciones:
  - [👁️ Ver] [✏️ Editar] [📄 Duplicar] [🗑️ Eliminar]

---

#### **Vista 2: Kanban (Board View)**

**Propósito:** Gestión visual del flujo de trabajo y estado de proyectos.

**Estructura:**

````

┌────────────────┬────────────────┬────────────────┬────────────────┬────────────────┐
│ 📝 Brief │ 🎨 Diseño │ ✅ Aprobación │ 🖨️ Producción │ ✔️ Completado │
│ (3) │ (5) │ (2) │ (4) │ (8) │
├────────────────┼────────────────┼────────────────┼────────────────┼────────────────┤
│ ┌────────────┐ │ ┌────────────┐ │ ┌────────────┐ │ ┌────────────┐ │ ┌────────────┐ │
│ │ Campaña │ │ │ Revista │ │ │ Branding │ │ │ Catálogo │ │ │ Web App │ │
│ │ Navidad │ │ │ Ed. Mayo │ │ │ Acme Corp │ │ │ Productos │ │ │ Tech Inc │ │
│ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │
│ │ 👤 Juan │ │ │ 👤 María │ │ │ 👤 Pedro │ │ │ 👤 Ana │ │ │ 👤 Luis │ │
│ │ 📅 15/02 │ │ │ 📅 20/02 │ │ │ 📅 18/02 │ │ │ 📅 25/02 │ │ │ 📅 10/01 │ │
│ │ 💰 $2.5K │ │ │ 💰 $4K │ │ │ 💰 $8K │ │ │ 💰 $3K │ │ │ 💰 $12K │ │
│ │ 🏷️ Digital │ │ │ 🏷️ Revista │ │ │ 🏷️ Brand │ │ │ 🏷️ Print │ │ │ 🏷️ Digital │ │
│ └────────────┘ │ └────────────┘ │ └────────────┘ │ └────────────┘ │ └────────────┘ │
│ │ │ │ │ │
│ ┌────────────┐ │ ┌────────────┐ │ │ ┌────────────┐ │ ┌────────────┐ │
│ │ ... │ │ │ ... │ │ │ │ ... │ │ │ ... │ │
│ └────────────┘ │ └────────────┘ │ │ └────────────┘ │ └────────────┘ │
│ │ │ │ │ │
│ + Nuevo │ + Nuevo │ + Nuevo │ + Nuevo │ + Nuevo │
└────────────────┴────────────────┴────────────────┴────────────────┴────────────────┘

```

**Configuración de Columnas:**

- **Estados Predeterminados:**
  1. Brief (🔵 Azul)
  2. Diseño (🟣 Morado)
  3. Aprobación Cliente (🟡 Amarillo)
  4. Producción (🟠 Naranja)
  5. Completado (🟢 Verde)
  6. Facturado (✅ Gris) - Opcional, solo si admin quiere visualizarlo

- **Configuración Personalizable (Solo Admin):**
  - Agregar/eliminar columnas (estados)
  - Renombrar estados
  - Cambiar colores
  - Definir orden de columnas
  - **Límite WIP (Work In Progress):** Alertar si una columna tiene >X proyectos

**Tarjeta de Proyecto (Card):**

Información visible en la tarjeta:
```

┌─────────────────────────────┐
│ 🏷️ [Tag Tipo Servicio] │ <- Color según tipo
│ │
│ Nombre del Proyecto │ <- Título en bold
│ Cliente: ACME Corp │
│ │
│ 👤 Avatar PM 📅 15/02 │ <- PM y fecha entrega
│ 💰 $2,500 USD │ <- Presupuesto
│ 📊 Margen: +35% │ <- Verde si positivo, rojo si negativo
│ │
│ ⏱️ 12 días en estado │ <- Alerta si >30
│ 📎 3 archivos │
└─────────────────────────────┘

```

**Interacciones:**

1. **Drag & Drop:**
   - Arrastrar tarjeta entre columnas cambia el estado
   - Animación visual de transición
   - Si mueve a "Completado": Modal de confirmación + trigger de facturación
   - **Validación:** No permitir saltar estados críticos (ej: de Brief a Completado)

2. **Click en Tarjeta:**
   - Abre panel lateral (slide-in) con detalles completos:
     - Toda la info del proyecto
     - Sección de comentarios/notas
     - Timeline de cambios
     - Archivos adjuntos
     - Gastos asociados
     - Botones de acción: [Editar] [Cambiar Estado] [Ver Finanzas]

3. **Acciones Rápidas (Hover en tarjeta):**
   - [✏️ Editar] [👁️ Ver Detalles] [📄 Duplicar] [🗑️ Archivar]

4. **Agrupamiento Adicional:**
   - Toggle para "Agrupar por PM" o "Agrupar por Cliente"
   - Crea swim lanes horizontales

**Filtros en Vista Kanban:**
- Mismo panel de filtros que Vista Tabla
- Filtros se aplican a todas las vistas simultáneamente

---

#### **Vista 3: Calendario (Calendar View)**

**Propósito:** Visualización temporal y detección de cuellos de botella por fechas.

**Diseño de Calendario:**

```

                    Febrero 2026                           [Hoy] [Mes ◀ ▶]

─────────────────────────────────────────────────────────────────────────────
Lun Mar Mié Jue Vie Sáb Dom
─────────────────────────────────────────────────────────────────────────────
3 4 5 6 7 8 9

10 11 12 13 14 15 16
📦🎨 🎨🎨  
 2 ent 3 ent

17 18 19 20 21 22 23
🎨 🎨📦 📦 🎨  
 1 ent 2 ent 1 ent 1 ent

24 25 26 27 28
📦📦 📦🎨  
 3 ent 2 ent
─────────────────────────────────────────────────────────────────────────────

```

**Funcionalidades:**

1. **Vistas de Granularidad:**
   - **Mes:** Vista completa del mes (default)
   - **Semana:** Vista detallada de 7 días
   - **Día:** Agenda del día con timeline por horas (opcional para Fase 2)

2. **Eventos en el Calendario:**

   **Cada proyecto se representa según:**
   - **Fecha de Inicio:** Marca inicio (opcional, solo si está configurada)
   - **Fecha de Entrega:** Marca principal (la más importante)
   - **Rango de duración:** Barra que va de inicio a entrega (si ambas fechas existen)

   **Iconos/Tags por Tipo de Servicio:**
   - 🎨 Diseño
   - 📦 Producción/Imprenta
   - 📱 Digital
   - 📰 Revista

3. **Código de Colores:**
   - 🟢 Verde: Proyecto en tiempo (entrega en >7 días)
   - 🟡 Amarillo: Entrega en 3-7 días
   - 🔴 Rojo: Entrega en <3 días o vencida
   - ⚫ Gris: Proyecto completado

4. **Interacciones:**

   **Click en día del calendario:**
   - Muestra lista lateral de proyectos con entrega ese día
   - Opción "Crear Proyecto" con fecha pre-seleccionada

   **Click en proyecto (barra/evento):**
   - Abre panel lateral con detalles completos
   - Opción de arrastrar para cambiar fecha de entrega

   **Drag & Drop de fechas:**
   - Arrastrar barra de proyecto para reprogramar
   - Modal de confirmación al soltar: "¿Cambiar fecha de entrega a [nueva fecha]?"

5. **Vista de Densidad:**
   - Contador de proyectos por día
   - Alerta visual si un día tiene >5 entregas programadas
   - Ayuda a balancear carga de trabajo

6. **Filtros Específicos del Calendario:**
   - Mostrar solo: Fechas de entrega / Fechas de inicio / Ambas
   - Filtrar por PM (ver solo agenda de un PM específico)
   - Filtrar por tipo de servicio

---

#### **Vista 4: Gantt (Timeline View)**

**Propósito:** Planificación de dependencias, análisis de ruta crítica y gestión de recursos.

**Diseño de Gantt:**

```

Proyectos Enero Febrero Marzo
──────────────────────────────────────────────────────────────────────────
📦 Campaña Navidad ████████░░░░
👤 Juan | $2.5K │ │
01/01 15/01

🎨 Revista Edición Mayo ░░░░████████████
👤 María | $4K │ │
20/01 05/02

📱 Branding Acme Corp ░░████████████████░░
👤 Pedro | $8K │ │
25/01 20/02

📦 Catálogo Productos ░░░░████████
👤 Ana | $3K │ │
01/02 15/02

──────────────────────────────────────────────────────────────────────────
Leyenda:
████ Duración completada (progreso real)
░░░░ Duración pendiente
│ Milestone / Fecha clave

```

**Componentes de la Vista Gantt:**

1. **Panel Izquierdo (Lista Jerárquica):**
```

📂 Por Cliente (colapsable)
└ ACME Corp
├ 🎨 Branding Corporativo
└ 📦 Catálogo 2026
└ TechInc
├ 📱 App Móvil
└ 🌐 Sitio Web

📂 Por PM (colapsable)
└ Juan Pérez (4 proyectos)
└ María González (3 proyectos)

📂 Por Estado (colapsable)
└ En Diseño (5)
└ En Producción (3)

```

**Columnas en Panel Izquierdo:**
- Nombre Proyecto (con jerarquía visual)
- PM (avatar pequeño)
- Presupuesto
- % Progreso (barra visual)

2. **Panel Derecho (Timeline):**

**Escala Temporal:**
- Zoom dinámico: Días / Semanas / Meses / Trimestres
- Línea vertical "Hoy" destacada
- Fines de semana sombreados (opcional)

**Barra de Proyecto:**
```

░░░░████████████░░░░░░
│ │ │
Inicio Hoy Fin

```

**Información en Barra (Hover):**
- Nombre del proyecto
- Duración: X días
- Progreso: X%
- Fecha inicio - Fecha fin
- Días restantes / Días de retraso

3. **Funcionalidades Avanzadas:**

**a) Dependencias (Opcional - Fase 2 post-MVP):**
- Conectar proyectos con flechas (ej: Diseño debe terminar antes de Producción)
- Tipos de dependencia:
  - Finish-to-Start (más común)
  - Start-to-Start
  - Finish-to-Finish

**b) Progreso del Proyecto:**
- Barra con dos colores:
  - Parte completada (oscuro)
  - Parte pendiente (claro)
- Admin puede ajustar % manualmente o se calcula por tareas (Fase 2)

**c) Milestones:**
- Rombo/Diamante en timeline para fechas clave
- Ejemplos: Aprobación cliente, Fecha de imprenta, Entrega final
- Click para agregar/editar milestone

**d) Recursos (PM Assignment):**
- Toggle para ver "Vista por PM"
- Muestra carga de trabajo por PM en timeline
- Detecta sobrecargas (mismo PM con >3 proyectos simultáneos)

**e) Ruta Crítica (Opcional - Fase 2):**
- Resaltar en rojo proyectos que impactan fecha final si se retrasan
- Útil para priorización

4. **Interacciones en Gantt:**

**Drag & Drop:**
- Arrastrar barra horizontalmente = Cambiar fechas (mantiene duración)
- Arrastrar extremos de barra = Ajustar fecha inicio/fin
- Validación: No permitir fechas en el pasado

**Click en Barra:**
- Panel lateral con detalles completos
- Opción de editar fechas con precisión (date pickers)

**Zoom:**
- Botones [+ -] o scroll del mouse
- Atajos: Cmd/Ctrl + Scroll

**Navegación Temporal:**
- Botones [◀ Hoy ▶] para moverse en timeline
- Jump to date: Click en selector de fecha

5. **Filtros y Agrupamiento:**

**Agrupamiento:**
- Por Cliente
- Por PM
- Por Estado
- Por Tipo de Servicio
- Sin agrupar (lista plana)

**Filtros:**
- Mismo panel que otras vistas
- Filtro adicional: "Solo proyectos activos" (excluir completados/facturados)

6. **Indicadores Visuales:**

**Color de Barra según Estado:**
- Brief: Azul claro
- Diseño: Morado
- Aprobación: Amarillo
- Producción: Naranja
- Completado: Verde

**Alertas:**
- ⚠️ Proyecto retrasado (pasó fecha de entrega sin completar)
- 🔥 Entrega en <3 días
- ⏸️ Proyecto estancado (>30 días en mismo estado)

---

#### **Funcionalidades Transversales (Todas las Vistas)**

**1. Navegación entre Vistas:**
- Toggle en header persiste filtros y selección
- URL actualizada según vista (ej: `/projects?view=kanban`)
- Última vista usada se guarda en preferencias del usuario

**2. Búsqueda Global:**
```

🔍 Buscar proyectos por nombre, cliente, o palabra clave...

```
- Búsqueda en tiempo real (debounce de 300ms)
- Resultados resaltan término buscado
- Funciona en todas las vistas

**3. Acciones Globales (Header):**
```

[+ Nuevo Proyecto] [📥 Importar] [📤 Exportar] [⚙️ Configurar Vistas] [🔄 Refrescar]

```

**4. Configuración de Vistas (Gear Icon):**
- **Vista Tabla:** Elegir columnas visibles, orden de columnas
- **Vista Kanban:** Configurar estados, colores, límites WIP
- **Vista Calendario:** Granularidad default, eventos a mostrar
- **Vista Gantt:** Agrupamiento default, escala temporal default

**5. Exportación:**
- **Todas las vistas:** Excel, CSV, PDF
- **Vista Gantt:** Exportar como imagen PNG (para presentaciones)

**6. Permisos por Vista:**
- **PM:** Puede ver todas las vistas, editar solo sus proyectos
- **Administrativo:** Solo Vista Tabla (para validaciones financieras)
- **Administrador:** Acceso total, incluyendo configuración de estados

---

#### 3.1.2 Gestión de Proyectos con Triggers Inteligentes

**Funcionalidad Core:**
- Estados configurables según flujo de trabajo (ejemplo: Brief → Diseño → Aprobación Cliente → Producción → Completado → Facturado)
- **Trigger automático:** Al mover a "Completado", el sistema:
  1. Genera notificación push/email al rol Administrativo
  2. Crea registro en módulo "Pendientes por Facturar" con datos del proyecto
  3. Calcula margen real vs. presupuestado
  4. Bloquea edición de gastos (requiere aprobación de Administrador)

**Información por Proyecto:**
- Nombre, Cliente, Tipo de servicio (Revista/Branding/Digital/Otro)
- Presupuesto estimado (Ingresos y Egresos)
- Fecha de inicio y fecha de entrega comprometida
- Archivos adjuntos (brief, entregables finales)
- Timeline de cambios de estado (auditoría)

**Reglas de Validación:**
- No permitir mover a "Completado" si no hay al menos 1 entregable cargado
- Alerta si el proyecto lleva >30 días sin cambio de estado

#### 3.1.2 Centro de Costos por Proyecto

**Al crear un proyecto, registrar:**
- **Ingresos estimados:** Monto acordado con cliente (multi-moneda)
- **Egresos estimados:** Desglose por categoría:
  - Proveedores externos (imprenta, freelancers)
  - Costos internos (horas-equipo, opcional para MVP)
  - Logística y misceláneos

**Cálculos automáticos (actualizados en tiempo real):**
```

Margen Presupuestado = (Ingresos Estimados - Egresos Estimados) / Ingresos Estimados _ 100
Margen Real = (Ingresos Reales - Egresos Reales) / Ingresos Reales _ 100
Desviación = Margen Real - Margen Presupuestado

```

---

### 3.2 Módulo: Portal de Proveedores (Autogestión por el proveedor o tambien lo podra hacer el project manager)

#### 3.2.1 Registro y Onboarding de Proveedores

**Flujo de Alta de Proveedor:**

1. **Invitación desde el Sistema:**
   - Admin o PM envía invitación vía email desde el sistema
   - Link único de registro con token de seguridad (válido 7 días)
   - Email incluye: nombre de tu empresa, breve descripción del proceso

2. **Formulario de Registro (Paso 1 - Datos Básicos):**
```

Tipo de Proveedor:
○ Persona Natural
○ Persona Jurídica

Nombre/Razón Social: \***\*\_\_\_\*\***
Tipo de Servicio que Ofrece: [Dropdown: Imprenta, Diseño Freelance, Logística, etc.]
País: \***\*\_\_\_\*\***

```

3. **Formulario de Registro (Paso 2 - Datos Fiscales):**

**Si es Persona Natural:**
```

- Número de Cédula: \***\*\_\_\_\*\***
- Nombre Completo: \***\*\_\_\_\*\***
- Email de Contacto: \***\*\_\_\_\*\***
- Teléfono: \***\*\_\_\_\*\***
- Dirección : \***\*\_\_\_\*\***
  ciudad: \***\*\_\_\_\*\***
  departamento: \***\*\_\_\_\*\***
  pais: \***\*\_\_\_\*\***
- RUT (Registro Único Tributario): [Archivo PDF/Imagen - Obligatorio]
  └ Validaciones: Formato PDF/JPG/PNG, Max 5MB, debe estar vigente

```

**Si es Persona Jurídica:**
```

- NIT/RUT Empresa: \***\*\_\_\_\*\***
- Razón Social: \***\*\_\_\_\*\***
- Email Empresarial: \***\*\_\_\_\*\***
- Email facturacion: \***\*\_\_\_\*\***
- Teléfono Principal: \***\*\_\_\_\*\***
- Dirección : \***\*\_\_\_\*\***
  ciudad: \***\*\_\_\_\*\***
  departamento: \***\*\_\_\_\*\***
  pais: \***\*\_\_\_\*\***

**Persona de contacto:**

```
- Nombre Completo: ___________
- Email de Contacto: ___________
- Teléfono: ___________


DOCUMENTOS OBLIGATORIOS:
✅ RUT (Registro Único Tributario vigencia <30 días): [Subir archivo]
✅ Cámara de Comercio (vigencia <30 días): [Subir archivo]
✅ Cédula Representante Legal: [Subir archivo]
✅ habeas data: [Subir archivo]
✅ Release document: [Subir archivo]
✅ Certificación Bancaria: [Subir archivo]
✅ Soporte Pago Seguridad Social: [Subir archivo]

DOCUMENTOS OPCIONALES (pero recomendados):
   ○ Pólizas de Cumplimiento/Seguros: [Subir archivo]
```

4. **Formulario de Registro (Paso 3 - Datos Bancarios):**

   ```
   Banco: [Dropdown con bancos principales del país]
   Tipo de Cuenta: ○ Ahorros  ○ Corriente
   Número de Cuenta: ___________
   Titular de la Cuenta: ___________ (debe coincidir con razón social/nombre)
   ```

5. **Aceptación de Términos:**
   ```
   ☑ Acepto los términos y condiciones de proveedores
   ☑ Autorizo el tratamiento de datos personales según Ley 1581/2012 (RGPD)
   ☑ Confirmo que la información suministrada es verídica
   ```

**Validaciones del Sistema:**

- Verificar que RUT/NIT no esté duplicado en la base de datos
- Validación de formato de documentos (solo PDF, JPG, PNG)
- Validación de vigencia de Cámara de Comercio (fecha de expedición <30 días)
- Email de confirmación una vez aprobado

**Estados del Proveedor:**

- **Registro Incompleto:** Falta subir documentos obligatorios
- **Pendiente de Aprobación:** Documentos cargados, esperando validación del Administrativo
- **Aprobado - Activo:** Puede subir facturas y recibir pagos
- **Rechazado:** Documentación no válida (con nota de rechazo)
- **Suspendido:** Temporal (por documentos vencidos o incumplimientos)
- **Inactivo:** No ha tenido movimientos en 6+ meses

#### 3.2.2 Portal de Proveedores - Funcionalidades

**Dashboard del Proveedor (vista post-login):**

**Sección: Mi Perfil**

- Ver y actualizar datos de contacto
- Ver documentos cargados con estados:
  - ✅ Aprobado (fecha de aprobación)
  - ⏳ En revisión
  - ⚠️ Próximo a vencer (alerta a 30 días)
  - ❌ Vencido (bloquea carga de nuevas facturas)
- Botón "Actualizar Documento Vencido"

**Sección: Mis Facturas**

_Vista Tabla:_
| # Factura | Proyecto | Fecha Emisión | Monto | Estado | Fecha Pago Programada | Acciones |
|-----------|----------|---------------|-------|--------|----------------------|----------|
| 12345 | Campaña Navidad | 15/01/26 | $2,500 USD | Aprobada | 30/01/26 | [Ver] [Descargar] |
| 12344 | Revista Ed. 05 | 10/01/26 | $850 USD | En Revisión | - | [Ver] |

**Estados de Factura (desde perspectiva del proveedor):**

- **Cargada:** El proveedor la subió, esperando validación del cliente
- **En Revisión:** El administrativo está validando datos
- **Aprobada - Pago Programado:** Validada, con fecha estimada de pago
- **Pagada:** Pago efectuado (mostrar fecha real de pago)
- **Rechazada:** No aprobada (mostrar razón del rechazo)

**Formulario: Cargar Nuevo Gasto (Implementación Actual - ExpenseForm):**

```
1. Vinculación (Selectores Dinámicos):
   - Proveedor: Buscador dinámico de proveedores activos.
   - Proyecto: Vinculación directa a proyectos existentes.

2. Datos Financieros:
   - Valor Neto (USD/COP)
   - IVA: Cálculo automático del 19% (configurable)
   - Total con IVA: Calculado automáticamente
   - Categoría: [Material Impreso, Diseño Freelance, Logística, Servicios Generales]

3. Documentación y Control:
   - Código OC (Orden de Compra)
   - Código Release
   - Número de Factura Proveedor
   - Fecha Radicado
   - Fecha Límite de Pago

4. Estado de Pago y Validación:
   - Estado: [Pendiente, Solicite Documentos, Pagado]
   - Si estado es "Solicite Documentos":
     - Checklist de documentos faltantes (RUT, Cert. Bancaria, Factura Firmada, Acta Entrega)
     - Opción de enviar email automático de solicitud al proveedor.

5. Entregables Asociados (Gestión Múltiple):
   - Lista dinámica de entregables vinculados al gasto.
   - Campos: Nombre del entregable, Estado (Pendiente, Recibido, Aprobado).
   - Permite agregar/eliminar N entregables por gasto.

6. Observaciones Adicionales
```

**Lógica de Negocio Implementada:**

- **Sanitización:** Los campos vacíos se convierten automáticamente a `null` para integridad en BD.
- **Navegación:** Redirección automática al "Report Center" tras guardado exitoso (`onSuccess`).
- **Manejo de Errores:** Logs detallados de errores de Supabase y feedback visual al usuario.

**Después de Enviar:**

- Email de confirmación al proveedor: "Tu factura #12345 fue recibida y está en revisión"
- Notificación al Administrativo del sistema: "Nueva factura de [Proveedor] requiere validación"

**Sección: Histórico de Pagos**

- Reporte descargable (Excel/PDF) de todas las facturas pagadas
- Filtros por fecha, proyecto, monto
- Totales por año fiscal

**Sección: Documentos Legales**

- Descargar certificado de retención (si aplica)
- Descargar comprobantes de pago
- Acceso a términos y condiciones actualizados

#### 3.2.3 Validación de Facturas (Vista Administrativo)

**Dashboard "Facturas Pendientes de Aprobación":**

_Vista de Tarjetas (Card View):_

```
┌─────────────────────────────────────────┐
│ Factura #12345 - Imprenta Los Andes     │
│                                         │
│ Proyecto: Campaña Navidad 2026          │
│ Monto: $2,500 USD                       │
│ Fecha Emisión: 15/01/2026               │
│ Proveedor: ✅ Documentos al día         │
│                                         │
│ [Ver PDF] [Aprobar] [Rechazar] [Editar]│
└─────────────────────────────────────────┘
```

**Flujo de Aprobación:**

1. **Click en "Ver PDF":**
   - Visualizador inline del PDF de la factura
   - Datos extraídos por OCR mostrados al lado para comparación:
     ```
     OCR detectó:                Tu validación:
     Proveedor: Los Andes        [✓ Correcto] [✗ Corregir]
     Monto: $2,500              [✓ Correcto] [✗ Corregir: _____]
     Fecha: 15/01/26            [✓ Correcto] [✗ Corregir: _____]
     IVA: $475 (19%)            [✓ Correcto] [✗ Corregir: _____]
     ```

2. **Click en "Aprobar":**
   - Modal de confirmación:

     ```
     ¿Confirmar aprobación de factura #12345?
     Monto: $2,500 USD
     Proyecto: Campaña Navidad 2026

     Fecha de Pago Programada: [Date picker] (default: hoy + 30 días)
     Notas internas (opcional): [Text area]

     [Cancelar]  [Confirmar Aprobación]
     ```

   - Al confirmar:
     - Factura pasa a estado "Aprobada"
     - Se actualiza el flujo de caja proyectado
     - Email automático al proveedor: "Tu factura fue aprobada, pago programado para [fecha]"
     - Se registra en contabilidad (cuenta por pagar)

3. **Click en "Rechazar":**
   - Modal obligatorio con razón:

     ```
     Motivo del rechazo: [Dropdown]
       ○ Datos incorrectos en la factura
       ○ Monto no coincide con lo acordado
       ○ Proyecto no corresponde
       ○ Documento ilegible
       ○ Otro: [Text area obligatorio]

     [Cancelar]  [Confirmar Rechazo]
     ```

   - Email al proveedor con el motivo específico
   - Proveedor puede resubir versión corregida

4. **Click en "Editar":**
   - Permite al administrativo corregir datos menores (monto, fecha) sin rechazar
   - Requiere nota de justificación (auditoría)

**Alertas Automáticas para Administrativo:**

- 🔴 Factura cargada hace >3 días sin revisar
- 🟡 Proveedor tiene documentos que vencen en <15 días (bloquear nuevas facturas si vencen)
- 🟢 Todas las facturas de la semana revisadas

#### 3.2.4 Gestión de Documentos Legales (Vista Administrativo)

**Módulo: "Proveedores - Documentos"**

_Vista de Lista de Proveedores:_
| Proveedor | Tipo | RUT | Cámara Comercio | Cédula Rep. Legal | Estado | Acciones |
|-----------|------|-----|----------------|-------------------|--------|----------|
| Imprenta Los Andes | Jurídica | ✅ Vigente | ⚠️ Vence 05/02/26 | ✅ Vigente | Activo | [Ver] [Notificar] |
| Juan Pérez Diseño | Natural | ✅ Vigente | N/A | ✅ Vigente | Activo | [Ver] |
| Logística Express | Jurídica | ❌ Vencido | ❌ Vencido | ✅ Vigente | Suspendido | [Ver] [Reactivar] |

**Acciones Disponibles:**

- **Ver:** Abre ficha completa del proveedor con todos los documentos descargables
- **Notificar:** Envía email recordatorio de actualización de documentos
- **Suspender/Reactivar:** Cambiar estado (suspendidos no pueden cargar facturas)

**Automatizaciones:**

- Email automático al proveedor 30 días antes del vencimiento de Cámara de Comercio
- Email de recordatorio a 15 y 7 días antes del vencimiento
- Suspensión automática el día del vencimiento si no actualizan
- Notificación al Administrativo de proveedores suspendidos

### 3.3 Módulo: Gestión Financiera Multi-moneda

#### 3.2.1 Soporte de Monedas y TRM

**Monedas soportadas (MVP):**

- USD (Dólar estadounidense)
- COP (Peso colombiano) - asumiendo tu ubicación, utilizar po defecto
- Moneda base para reportes: **USD** (configurable)

**Integración TRM:**

- **API recomendada:** `exchangerate-api.com` (gratuita hasta 1,500 requests/mes)
- **Frecuencia de actualización:** Diaria a las 7:00 AM hora local
- **Almacenamiento histórico:** Guardar TRM del día de cada transacción para auditoría
- **Funcionalidad manual:** Permitir override de TRM para casos especiales (aprobación de Administrador)

**Conversión para Dashboards:**

- Todos los montos se convierten a USD usando la TRM del día de la transacción
- Opción de toggle para ver valores en moneda local

#### 3.2.2 Gestión de Gastos

**Tipos de Gasto:**

1. **Gastos de Proyecto:** Vinculados a un proyecto específico (proveedores, freelancers)
2. **Gastos Recurrentes:** Operativos sin vinculación a proyecto (arriendo, servicios, nómina)

**Información por Gasto:**

- Proveedor (autocompletado desde base de datos)
- Monto y moneda
- TRM aplicada (automática o manual)
- Categoría (Proveedores externos (imprenta, freelancers, modelos, videografo, fotografo, periodista, hotel, alimentacion, transporte terrestre, transporte aereo, pauta redes, diseño, publicidad, maquillaje, vestuario, coordinador revista, director arte revista,editor general revista, ilustrador,corrector estilo, impresion, comision x venta, etc)
  - Costos internos (horas-equipo, margne ganancia empresa, impuestos))
- Fecha de emisión y fecha de pago (proyectada/real)
- Estado: Pendiente / Pagado
- Archivo PDF de factura
- Notas adicionales

**Flujo de Aprobación:**

- Gastos <USD 500: Aprobación automática del PM al vincular
- Gastos ≥USD 500: Requiere aprobación explícita del Administrador

#### 3.2.3 Gestión de Ingresos

**Ciclo de Facturación:**

1. Proyecto se marca como "Completado" → Entra a cola de facturación
2. Administrativo genera factura (integración con software contable existente o generación manual)
3. Se registra en sistema:
   - Monto facturado (puede diferir del presupuestado)
   - Fecha de emisión
   - Plazo de pago (15/30/45/60 días)
   - Estado: Pendiente / Cobrado / Vencido
4. Alertas automáticas a 7 días antes y 3 días después de vencimiento

---

### 3.3 Módulo: Automatización Inteligente (OCR + Email)

#### 3.3.1 Integración con Gmail

**Configuración:**

- Email dedicado: `facturas@[tudominio].com` (crear cuenta Gmail específica)
- **Autenticación:** OAuth 2.0 con alcance de solo lectura de correos específicos
- **Filtrado:** Escanear solo correos de proveedores pre-autorizados o con palabras clave ("factura", "invoice", "cobro")

**Frecuencia de escaneo:**

- Polling cada 15 minutos durante horario laboral (8am-6pm)
- Webhook si proveedor de email lo soporta (Gmail Pub/Sub)

#### 3.3.2 Motor OCR

**Tecnología recomendada (evaluación):**

| Opción                  | Precisión | Costo (MVP)         | Idiomas           | Recomendación                  |
| ----------------------- | --------- | ------------------- | ----------------- | ------------------------------ |
| Google Document AI      | 95%+      | ~$1.50/1000 páginas | ES/EN             | ⭐ **Mejor opción**            |
| AWS Textract            | 93%+      | ~$1.50/1000 páginas | EN principalmente | Alternativa                    |
| Tesseract (Open Source) | 80-85%    | Gratis              | ES/EN             | Solo si presupuesto es crítico |

**Datos a Extraer (campos obligatorios):**

- ✅ Nombre del proveedor (validación contra base de datos)
- ✅ Número de factura
- ✅ Fecha de emisión
- ✅ Monto total
- ✅ Subtotal e impuestos (IVA)
- ✅ Moneda (detector automático: COP, USD, etc.)
- ⚠️ Conceptos/líneas de detalle (opcional para MVP)

**Flujo de Procesamiento:**

```
1. Email recibido → Descarga PDF/imagen
2. OCR extrae datos → Confianza >80% pasa a paso 3, <80% marca para revisión manual
3. Sistema crea "Gasto Borrador" con datos extraídos
4. Notifica a Administrativo para:
   - Validar datos (especialmente proveedor y monto)
   - Vincular a Proyecto (dropdown con búsqueda)
   - Confirmar categoría de gasto
5. Una vez confirmado → Gasto se registra oficialmente y afecta dashboard
```

**Manejo de Errores:**

- Si OCR falla 2 veces, marcar factura para procesamiento 100% manual
- Log de todas las facturas procesadas con nivel de confianza del OCR

---

### 3.4 Módulo: Dashboard y Reportes

#### 3.4.1 Dashboard Ejecutivo (Vista Administrador)

**Sección 1: Flujo de Caja (vista predeterminada)**

**Cálculo de Flujo Proyectado a 30 días:**

```
Flujo Neto Proyectado =
  (Efectivo Actual + Cuentas por Cobrar próximos 30 días)
  - (Cuentas por Pagar próximos 30 días + Gastos Recurrentes)
```

**Visualización:**

- Gráfico de cascada (waterfall chart) mostrando:
  - Posición de caja actual
  - Ingresos proyectados por semana
  - Egresos proyectados por semana
  - Posición final proyectada a 30 días
- Semáforo de alerta:
  - 🟢 Verde: Flujo proyectado >20% sobre gastos fijos
  - 🟡 Amarillo: Flujo proyectado entre 0-20% sobre gastos fijos
  - 🔴 Rojo: Flujo proyectado negativo

**Sección 2: Proyectos en Riesgo**

**Criterios de detección:**

- Proyectos completados hace >5 días sin facturar
- Proyectos con margen real <50% del margen presupuestado
- Proyectos en estado "Diseño" o anterior por >30 días

**Formato:**

- Tabla con: Proyecto, Cliente, Estado, Días en estado actual, Margen real vs. presupuestado
- Acción rápida: Botón para enviar recordatorio al PM responsable

**Sección 3: Top Insights del Mes**

- 🏆 Top 3 proyectos más rentables (margen real)
- ⚠️ Top 3 proyectos menos rentables
- 📊 Distribución de ingresos por tipo de servicio (gráfico de dona)
- 💸 Gasto promedio en proveedores externos por tipo de proyecto

#### 3.4.2 Reportes Exportables

**Formatos disponibles:** PDF, Excel, CSV

**Tipos de reporte (generables on-demand):**

1. **Reporte de Rentabilidad por Proyecto** (rango de fechas configurable)
2. **Estado de Cuentas por Cobrar** (con antigüedad: 0-30, 31-60, 61-90, >90 días)
3. **Estado de Cuentas por Pagar** (con antigüedad similar)
4. **Gastos por Proveedor** (consolidado mensual/anual)
5. **Comparativa Presupuesto vs. Real** (desviaciones por proyecto)

### 3.5 Módulo: Comunicación Interna (Tipo Discord)

#### 3.5.1 Arquitectura de Canales

**Propósito:** Centralizar todas las conversaciones relacionadas con proyectos, proveedores y gestión general, eliminando la fragmentación entre WhatsApp, email y otras herramientas.

**Jerarquía de Comunicación:**

```
🏢 Workspace: Tu Agencia
│
├── 📂 PROYECTOS (Categoría)
│   ├── #campaña-navidad-2026
│   ├── #revista-edicion-mayo
│   ├── #branding-acme-corp
│   └── #web-app-techinc
│
├── 💼 CLIENTES (Categoría)
│   ├── #cliente-acme-corp
│   ├── #cliente-techinc
│   └── #cliente-retail-express
│
├── 🤝 PROVEEDORES (Categoría)
│   ├── #imprenta-los-andes
│   ├── #diseñador-freelance-juan
│   └── #logistica-express
│
├── 🏛️ GENERAL (Categoría)
│   ├── #anuncios (solo-admins pueden escribir)
│   ├── #general
│   ├── #ideas-y-sugerencias
│   └── #random
│
├── 💰 FINANZAS (Categoría - Solo Admin/Contable)
│   ├── #facturas-pendientes
│   ├── #pagos-programados
│   └── #revisión-presupuestos
│
└── 🔒 MENSAJES DIRECTOS (DMs)
    ├── 👤 Juan Pérez (PM)
    ├── 👤 María González (PM)
    └── 👤 Ana López (Admin)
```

---

#### 3.5.2 Tipos de Canales y Creación

**1. Canales de Proyecto (Auto-generados)**

**Creación Automática:**

- Al crear un nuevo proyecto en cualquier vista, el sistema automáticamente:
  1. Crea un canal `#nombre-del-proyecto` (sanitizado, sin espacios ni caracteres especiales)
  2. Agrega al PM responsable como miembro
  3. Publica mensaje inicial automático:

  ```
  🎉 Canal creado para el proyecto: Campaña Navidad 2026

  📋 Detalles:
  • Cliente: ACME Corp
  • PM: @Juan Pérez
  • Fecha de entrega: 15/02/2026
  • Presupuesto: $2,500 USD

  🔗 [Ver Proyecto en Kanban] [Ver Finanzas]

  💡 Usa este canal para coordinar todo lo relacionado con este proyecto.
  ```

**Miembros Automáticos:**

- PM responsable (siempre)
- Admin (siempre)
- Administrativo/Contable (si hay gastos registrados)
- Proveedores asignados al proyecto (opcional, con permisos limitados)

**Ciclo de Vida del Canal:**

- **Activo:** Mientras el proyecto esté en Brief → Producción
- **Archivado:** Automáticamente cuando proyecto pasa a "Facturado"
- **Opción de reabrir:** Admin puede desarchivarlo si se reactiva proyecto

---

**2. Canales de Cliente**

**Creación Manual (por Admin/PM):**

- Botón en la barra lateral: `+ Crear Canal de Cliente`
- Formulario:

  ```
  Nombre del Cliente: __________
  Descripción: ________________
  Miembros iniciales: [Multiselect de usuarios]

  [Cancelar] [Crear Canal]
  ```

**Uso:**

- Conversaciones generales sobre el cliente (independientes de proyectos específicos)
- Historial de interacciones
- Notas de llamadas o reuniones
- Oportunidades futuras

**Vinculación con Proyectos:**

- Los canales de proyecto pueden "linkearse" al canal del cliente
- Widget lateral en canal de cliente muestra todos los proyectos activos

---

**3. Canales de Proveedor**

**Creación Automática:**

- Al aprobar un nuevo proveedor en el sistema, se crea:
  - Canal `#proveedor-nombre-proveedor`
  - El proveedor es agregado automáticamente (si tiene cuenta)

**Permisos del Proveedor:**

- ✅ Puede leer mensajes
- ✅ Puede escribir mensajes
- ✅ Puede subir archivos (facturas, comprobantes, entregables)
- ❌ No puede ver canales de otros proyectos donde no participa
- ❌ No puede ver canales de categoría FINANZAS

**Uso:**

- Coordinación de entregas
- Solicitud de cotizaciones
- Resolución de dudas técnicas
- Compartir especificaciones

---

**4. Canales Generales**

**Predefinidos en el Setup Inicial:**

**#anuncios** (Read-Only para staff)

- Solo Admin puede publicar
- Notificaciones importantes de la empresa
- Cambios de políticas
- Días festivos y cierres

**#general**

- Conversación libre del equipo
- Coordinación diaria
- Preguntas rápidas

**#ideas-y-sugerencias**

- Propuestas de mejora
- Feedback sobre procesos
- Innovaciones

**#random**

- Off-topic, memes, celebraciones
- Team building

---

**5. Canales de Finanzas (Privados)**

**Acceso Restringido:**

- Solo: Admin + Rol Administrativo/Contable
- No visibles para PMs ni Proveedores

**#facturas-pendientes**

- Notificaciones automáticas de facturas sin aprobar >3 días
- Discusión sobre facturas complejas
- Coordinación de aprobaciones

**#pagos-programados**

- Recordatorios de pagos próximos
- Confirmaciones de pagos realizados

**#revisión-presupuestos**

- Análisis de desviaciones
- Discusión de márgenes por proyecto

---

#### 3.5.3 Interfaz de Usuario

**Layout Principal (Tipo Discord):**

```
┌─────────────────────────────────────────────────────────────────────────┐
│ ☰ Tu Agencia          [@Usuario ▼]  [🔍]  [🔔3]  [⚙️]                   │
├────────────┬────────────────────────────────────────────────────────────┤
│            │  #campaña-navidad-2026                    👤3  📌2  [⋮]    │
│ 🔍 Buscar  ├────────────────────────────────────────────────────────────┤
│            │                                                            │
│ 📂 PROYECT │  Juan Pérez [PM]                          Hoy a las 10:15 │
│ ├ #campaña │  Hey equipo, la imprenta confirmó entrega para el 14/02.  │
│ ├ #revista │  📎 cotizacion_final.pdf                                  │
│ ├ #brandin │  [⭐ 2]  [💬 3 respuestas]                                │
│ └ + Nuevo  │                                                            │
│            │  María González                          Hoy a las 10:20  │
│ 💼 CLIENTE │  Perfecto! Ya actualicé la fecha en el proyecto.           │
│ ├ #cliente │  [Ver en Timeline →]                                       │
│ └ + Nuevo  │                                                            │
│            │  Sistema 🤖                              Hoy a las 10:21  │
│ 🤝 PROVEEDO│  ✅ @María cambió fecha de entrega a 14/02/2026           │
│ ├ #imprenta│  [Ver Proyecto]                                           │
│ └ + Nuevo  │                                                            │
│            │  Ana López [Admin]                       Hoy a las 11:00  │
│ 🏛️ GENERAL │  @Juan, podemos programar una call para revisar el brief? │
│ ├ #anuncio │  [📅 Agendar Reunión]                                     │
│ ├ #general │                                                            │
│ ├ #ideas   │  ┌──────────────────────────────────────┐                 │
│ └ #random  │  │ ✍️ Escribe un mensaje...              │                 │
│            │  │ [📎] [😊] [/]                    [➤] │                 │
│ 💰 FINANZA │  └──────────────────────────────────────┘                 │
│ ├ #factura │                                                            │
│ └ #pagos   │                                                            │
│            │                                                            │
│ 🔒 MENSAGE │                                                            │
│ ├ 👤 Juan  │                                                            │
│ ├ 👤 María │                                                            │
│ └ 👤 Ana   │                                                            │
│            │                                                            │
│ [+ Crear   │                                                            │
│  Canal]    │                                                            │
└────────────┴────────────────────────────────────────────────────────────┘
```

---

#### 3.5.4 Funcionalidades de Mensajería

**1. Composición de Mensajes**

**Editor de Texto Enriquecido:**

````
┌────────────────────────────────────────────────────┐
│ ✍️ Escribe un mensaje...                           │
│                                                    │
│ Soporta:                                           │
│ • **Negrita** _cursiva_ ~~tachado~~                │
│ • Menciones: @usuario @canal                       │
│ • Emojis: :smile: :fire: :check:                   │
│ • Código: `código inline` o ```bloque```          │
│ • Listas numeradas/viñetas                         │
│ • Links automáticos                                │
│                                                    │
│ [📎 Adjuntar] [😊 Emoji] [/ Comandos]       [➤]   │
└────────────────────────────────────────────────────┘
````

**Adjuntos Permitidos:**

- Imágenes: JPG, PNG, GIF (preview inline)
- Documentos: PDF, DOCX, XLSX, PPT
- Archivos comprimidos: ZIP, RAR
- Tamaño máximo: 25MB por archivo
- Drag & drop para subir

**Comandos Rápidos (Slash Commands):**

```
/proyecto [nombre]    → Crear link a proyecto
/factura [número]     → Link a factura específica
/recordatorio [texto] → Crear recordatorio en el canal
/encuesta [pregunta]  → Crear encuesta rápida
/reunion [fecha]      → Programar reunión (integra con calendario)
```

---

**2. Interacciones con Mensajes**

**Reacciones (Emojis):**

- Click en mensaje → aparece panel de emojis
- Emojis populares: ✅ ❌ 👍 👎 🎉 🔥 💯 👀 ⚡
- Contador de reacciones por tipo
- Hover muestra quién reaccionó

**Respuestas en Hilo (Threads):**

```
Juan Pérez                               10:15
La imprenta confirmó entrega para el 14/02.
📎 cotizacion_final.pdf
─────────────────────────────────────────
  💬 3 respuestas  •  Ver hilo →

  [Click abre panel lateral con el hilo]

  ┌─────────────────────────────────────┐
  │ 🧵 Hilo de Juan Pérez              │
  │                                     │
  │ [Mensaje original completo]         │
  │ ─────────────────────────────────   │
  │                                     │
  │ María                        10:20  │
  │ Perfecto, gracias!                  │
  │                                     │
  │ Ana                          10:25  │
  │ ¿Confirmamos pago contra entrega?   │
  │                                     │
  │ Juan                         10:30  │
  │ Sí, ya está coordinado.             │
  │                                     │
  │ ┌─────────────────────────────────┐ │
  │ │ Responder en el hilo...         │ │
  │ └─────────────────────────────────┘ │
  └─────────────────────────────────────┘
```

**Menú Contextual (Click derecho o ⋮):**

- 📌 Anclar mensaje (max 5 por canal)
- ✏️ Editar (solo autor, marca como "editado")
- 🗑️ Eliminar (solo autor + admins)
- 🔗 Copiar enlace del mensaje
- 📋 Citar en respuesta
- ⭐ Guardar en favoritos
- 🚩 Reportar (si es inapropiado)

---

**3. Mensajes del Sistema (Automatizados)**

**Tipos de Notificaciones Automáticas:**

**En Canales de Proyecto:**

```
🤖 Sistema                               Hoy 14:32
✅ @María cambió el estado a "Aprobación Cliente"
[Ver Proyecto en Kanban]
```

```
🤖 Sistema                               Hoy 16:45
💰 Nuevo gasto registrado: $450 USD - Imprenta Los Andes
[Ver Factura] [Aprobar Gasto]
```

```
🤖 Sistema                               Ayer 09:00
⚠️ Este proyecto lleva 15 días en "Diseño".
Considera actualizar el estado o contactar al equipo.
```

**En Canales de Proveedor:**

```
🤖 Sistema                               Hoy 11:20
📄 @Imprenta_Los_Andes cargó una nueva factura (#12345)
Proyecto: Campaña Navidad 2026
Monto: $2,500 USD
[Ver Factura] [Aprobar]
```

**En #facturas-pendientes:**

```
🤖 Sistema                               Hoy 09:00
📊 Resumen del día:
• 5 facturas pendientes de aprobación
• 3 facturas vencen en <7 días
• 2 proveedores con documentos por vencer

[Ver Dashboard de Facturas]
```

---

#### 3.5.5 Búsqueda y Navegación

**Búsqueda Global (Ctrl/Cmd + K):**

```
┌────────────────────────────────────────────────────┐
│ 🔍 Buscar en todos los canales...                  │
├────────────────────────────────────────────────────┤
│                                                    │
│ 📝 MENSAJES                                        │
│ ├ "cotización final" en #campaña-navidad (3)      │
│ ├ "fecha de entrega" en #revista-mayo (7)         │
│ └ "presupuesto" en #branding-acme (2)             │
│                                                    │
│ 📎 ARCHIVOS                                        │
│ ├ cotizacion_final.pdf (#campaña-navidad)         │
│ └ brief_v2.docx (#branding-acme)                  │
│                                                    │
│ 👤 PERSONAS                                        │
│ ├ Juan Pérez (PM)                                 │
│ └ María González (PM)                             │
│                                                    │
│ 📂 CANALES                                         │
│ └ #campaña-navidad-2026                           │
│                                                    │
└────────────────────────────────────────────────────┘
```

**Filtros de Búsqueda Avanzada:**

```
Filtros disponibles:
• de:@usuario          → Mensajes de usuario específico
• en:#canal           → Solo en un canal
• tiene:archivo       → Solo mensajes con adjuntos
• antes:2026-01-15    → Mensajes antes de una fecha
• después:2026-01-01  → Mensajes después de una fecha
• con:palabra         → Búsqueda exacta de palabra
```

**Navegación Rápida:**

- `Ctrl/Cmd + K`: Búsqueda global
- `Ctrl/Cmd + Shift + A`: Ver todos los mensajes no leídos
- `Alt + ↑/↓`: Navegar entre canales
- `Ctrl/Cmd + Shift + M`: Abrir lista de menciones
- `Esc`: Cerrar modal/panel actual

---

#### 3.5.6 Notificaciones y Menciones

**Sistema de Notificaciones Inteligente:**

**Niveles de Notificación por Canal:**

1. **Todas las notificaciones** (🔔)
   - Recibes notificación de cada mensaje nuevo
   - Usar solo para canales críticos

2. **Solo menciones** (🔕@) - **Default recomendado**
   - Solo te notifica si alguien te menciona (@tu-nombre) o menciona @todos
   - Útil para canales con mucho tráfico

3. **Silenciado** (🔇)
   - No recibes notificaciones, pero aparece badge de "no leído"
   - Útil para canales de referencia

**Tipos de Menciones:**

```
@juan                  → Menciona a Juan Pérez (notificación directa)
@todos / @everyone     → Menciona a todos en el canal (usar con moderación)
@pm                    → Menciona a todos los PMs (grupo)
@admin                 → Menciona a administradores (grupo)
#campaña-navidad       → Link a otro canal
```

**Reglas de Notificación Push:**

**En Navegador:**

- Desktop notification cuando:
  - Te mencionan directamente
  - Alguien responde a tu mensaje
  - Mensaje en DM
  - Mensaje en canal con "Todas las notificaciones"

**En Email (Configurable):**

- **Resumen diario:** Email a las 9 AM con actividad de ayer
- **Inmediato:** Para menciones directas (si no respondiste en 30 min)
- **Nunca:** Usuario puede desactivar emails completamente

**Badge de No Leídos:**

```
Sidebar:
📂 PROYECTOS
├ #campaña-navidad [3]      ← 3 mensajes nuevos
├ #revista-mayo             ← Al día
└ #branding-acme [12]       ← 12 mensajes nuevos

Prioridad visual:
[12] Blanco sobre rojo  → Mensaje con mención directa
[3]  Blanco sobre gris  → Mensajes nuevos sin menciones
```

---

#### 3.5.7 Integración con Módulos del Sistema

**1. Integración con Proyectos:**

**Desde Vista de Proyecto (Kanban/Tabla/etc):**

- Botón [💬 Abrir Chat] en header del proyecto
- Abre canal del proyecto en split-screen o panel lateral
- Permite chatear sin salir de la vista de trabajo

**Desde Canal de Proyecto:**

- Widget lateral mostrando:

  ```
  📊 PROYECTO: Campaña Navidad 2026
  ─────────────────────────────
  Estado: 🟡 Aprobación Cliente
  PM: @Juan Pérez
  Entrega: 15/02/2026 (25 días)
  Presupuesto: $2,500 USD
  Margen: +35% ✅

  [Ver en Kanban] [Ver Finanzas]
  ```

**Acciones Rápidas desde Chat:**

- `/cambiar-estado [nuevo-estado]` → Cambia estado del proyecto sin salir del chat
- `/agregar-gasto [monto]` → Registrar gasto rápido
- `/subir-entregable` → Abrir modal para subir archivo final

---

**2. Integración con Proveedores:**

**Notificaciones Bidireccionales:**

- Proveedor carga factura → Mensaje automático en su canal
- Admin aprueba factura → Notificación al proveedor en el chat
- Documento próximo a vencer → Recordatorio en el canal

**Desde Dashboard de Proveedor:**

- Botón [💬 Contactar] abre chat directo con el proveedor
- Historial completo de comunicación visible

---

**3. Integración con Finanzas:**

**Canales de Finanzas Automatizados:**

En **#facturas-pendientes**:

```
🤖 Sistema                               Lunes 9:00 AM
📊 Resumen Semanal de Facturas

⏳ PENDIENTES DE APROBACIÓN (5):
├ Imprenta Los Andes - $2,500 USD - 3 días esperando
├ Diseñador Juan - $800 USD - 1 día esperando
└ [Ver todas]

⚠️ PRÓXIMAS A VENCER (3):
├ Logística Express - Vence en 5 días
└ [Ver todas]

📅 PAGOS ESTA SEMANA (2):
├ Miércoles: $1,200 USD - Freelancer María
└ Viernes: $3,500 USD - Imprenta Los Andes

[Ir a Dashboard de Finanzas]
```

**Comandos de Finanzas:**

- `/aprobar-factura [número]` → Aprobación rápida desde chat
- `/programar-pago [proveedor] [fecha]` → Programar pago
- `/ver-flujo-caja` → Abre dashboard de flujo de caja

---

#### 3.5.8 Permisos y Seguridad

**Matriz de Permisos por Canal:**

| Acción                      | Admin | PM                      | Contable | Proveedor             |
| --------------------------- | ----- | ----------------------- | -------- | --------------------- |
| **Canales de Proyecto**     |
| Ver mensajes                | ✅    | ✅ (solo sus proyectos) | ✅       | ✅ (solo si asignado) |
| Escribir mensajes           | ✅    | ✅                      | ✅       | ✅                    |
| Subir archivos              | ✅    | ✅                      | ✅       | ✅                    |
| Crear canales               | ✅    | ❌                      | ❌       | ❌                    |
| Archivar canales            | ✅    | ❌                      | ❌       | ❌                    |
| Editar mensajes ajenos      | ✅    | ❌                      | ❌       | ❌                    |
| Eliminar mensajes ajenos    | ✅    | ❌                      | ❌       | ❌                    |
| **Canales de Cliente**      |
| Ver mensajes                | ✅    | ✅                      | ✅       | ❌                    |
| Escribir mensajes           | ✅    | ✅                      | ✅       | ❌                    |
| **Canales de Proveedor**    |
| Ver mensajes                | ✅    | ✅                      | ✅       | ✅ (solo su canal)    |
| Escribir mensajes           | ✅    | ✅                      | ✅       | ✅ (solo su canal)    |
| **Canales Generales**       |
| Ver mensajes                | ✅    | ✅                      | ✅       | ❌                    |
| Escribir en #anuncios       | ✅    | ❌                      | ❌       | ❌                    |
| Escribir en otros           | ✅    | ✅                      | ✅       | ❌                    |
| **Canales de Finanzas**     |
| Ver mensajes                | ✅    | ❌                      | ✅       | ❌                    |
| Escribir mensajes           | ✅    | ❌                      | ✅       | ❌                    |
| **Mensajes Directos (DMs)** |
| Iniciar DM con equipo       | ✅    | ✅                      | ✅       | ❌                    |
| Iniciar DM con proveedores  | ✅    | ✅                      | ✅       | N/A                   |

**Auditoría y Retención:**

- Todos los mensajes se guardan indefinidamente
- Log de ediciones y eliminaciones con timestamp
- Exportación de historial completo de canal (solo Admin)
- Cumplimiento RGPD: Usuario puede solicitar exportación de sus datos

---

#### 3.5.9 Funcionalidades Avanzadas

**1. Recordatorios y Tareas**

**Desde un Mensaje:**

- Click derecho → "Crear recordatorio"
- Modal:

  ```
  ⏰ Recordar este mensaje

  ¿Cuándo?
  ○ En 1 hora
  ○ Mañana a las 9 AM
  ○ En 3 días
  ● Personalizado: [Date/Time picker]

  Mensaje: "Revisar cotización de imprenta"

  [Cancelar] [Crear Recordatorio]
  ```

- El sistema envía DM cuando llega la hora

**Crear Tarea desde Chat:**

```
/tarea Revisar brief del cliente @juan #campaña-navidad
```

- Crea tarea vinculada al proyecto
- Aparece en checklist del proyecto
- Notifica al asignado

---

**2. Llamadas y Videollamadas (Fase 2 - Post MVP)**

**Integración con herramientas:**

- Botón [📞 Iniciar llamada] en header del canal
- Opciones:
  - Audio call (todos los miembros del canal)
  - Video call
  - Compartir pantalla

**Alternativa MVP:**

- Botón que genera link de Google Meet / Zoom
- Publica link automático en el canal

---

**3. Bots y Automatizaciones**

**Bot del Sistema (Built-in):**

- Nombre: "Sistema 🤖"
- Funciones:
  - Notificaciones de cambios en proyectos
  - Resúmenes diarios/semanales
  - Alertas de vencimientos
  - Recordatorios de tareas pendientes

**Comandos del Bot:**

```
/ayuda                    → Lista de comandos disponibles
/resumen-proyecto [nombre] → Resumen del estado del proyecto
/proximos-pagos           → Lista de pagos próximos 7 días
/facturas-pendientes      → Facturas sin aprobar
```

**Webhooks Salientes (Fase 2):**

- Integración con Slack (si el equipo prefiere seguir usando Slack)
- Integración con WhatsApp Business API
- Integración con Telegram

---

**4. Archivos y Media**

**Galería de Archivos por Canal:**

- Tab [📎 Archivos] en header del canal
- Vista de todos los archivos compartidos:

  ```
  Filtros: [Todos] [Imágenes] [Documentos] [PDFs]
  Ordenar: [Más reciente] [Más antiguo] [Mayor tamaño]

  ┌──────────────────────────────────────────┐
  │ 📄 cotizacion_final.pdf                  │
  │ Subido por Juan • 15/01/26 • 2.3 MB     │
  │ [Descargar] [Ver en contexto]            │
  ├──────────────────────────────────────────┤
  │ 🖼️ mockup_campaña_v3.png                │
  │ Subido por María • 14/01/26 • 5.1 MB    │
  │ [Descargar] [Ver en contexto]            │
  └──────────────────────────────────────────┘
  ```

**Preview Inline de Archivos:**

- **Imágenes:** Thumbnail clickeable para ver en tamaño completo
- **PDFs:** Primer página como preview, click abre visor completo
- **Videos:** Player inline (mp4, webm)
- **Links:** Preview card con título, descripción e imagen

---

#### 3.5.10 Modelo de Datos

**Tabla: canales**

```sql
id                UUID PRIMARY KEY
tipo              ENUM('Proyecto', 'Cliente', 'Proveedor', 'General', 'Finanzas', 'DM') NOT NULL
nombre            VARCHAR(100) NOT NULL
descripcion       TEXT
icono_emoji       VARCHAR(10) (ej: '📦')
categoria         VARCHAR(50) (PROYECTOS, CLIENTES, etc)
es_privado        BOOLEAN DEFAULT FALSE

-- Relaciones opcionales
proyecto_id       UUID FK → proyectos (NULL si no es canal de proyecto)
cliente_id        UUID (NULL si no es canal de cliente)
proveedor_id      UUID FK → proveedores (NULL si no es canal de proveedor)

-- Configuración
permitir_proveedores BOOLEAN DEFAULT FALSE
notificacion_default ENUM('Todas', 'Menciones', 'Silenciado') DEFAULT 'Menciones'
archivado         BOOLEAN DEFAULT FALSE
fecha_archivado   TIMESTAMP

-- Metadata
creado_por        UUID FK → usuarios
created_at        TIMESTAMP
updated_at        TIMESTAMP

UNIQUE(tipo, proyecto_id) WHERE proyecto_id IS NOT NULL
UNIQUE(tipo, proveedor_id) WHERE proveedor_id IS NOT NULL
```

**Tabla: mensajes**

```sql
id                UUID PRIMARY KEY
canal_id          UUID FK → canales NOT NULL
autor_id          UUID FK → usuarios/proveedores NOT NULL
tipo_autor        ENUM('Usuario', 'Proveedor', 'Sistema') NOT NULL
contenido         TEXT NOT NULL
contenido_html    TEXT (renderizado con markdown/menciones)

-- Threading
mensaje_padre_id  UUID FK → mensajes (NULL si no es respuesta)
num_respuestas    INT DEFAULT 0

-- Metadata
editado           BOOLEAN DEFAULT FALSE
fecha_edicion     TIMESTAMP
eliminado         BOOLEAN DEFAULT FALSE
fecha_eliminacion TIMESTAMP
anclado           BOOLEAN DEFAULT FALSE

-- Adjuntos
tiene_archivos    BOOLEAN DEFAULT FALSE

created_at        TIMESTAMP
updated_at        TIMESTAMP

INDEX idx_canal_fecha ON mensajes(canal_id, created_at DESC)
INDEX idx_autor ON mensajes(autor_id)
INDEX idx_padre ON mensajes(mensaje_padre_id) WHERE mensaje_padre_i# PRD: Sistema de Gestión Integrada - Agencia & Editorial
**Versión:** 1.0 MVP
**Fecha:** Enero 2026
**Propietario del Producto:** [Tu nombre]

---

## 1. Resumen Ejecutivo

### 1.1 Problema a Resolver
Las agencias creativas y editoriales enfrentan un desafío crítico: **desconexión entre la operación de proyectos y la realidad financiera**. Esto genera:
- Proyectos "completados" sin facturar durante semanas
- Gastos de proveedores registrados manualmente con error del 15-20%
- Cero visibilidad de rentabilidad real hasta cierre mensual
- Flujo de caja impredecible que impide decisiones estratégicas

### 1.2 Solución Propuesta
Plataforma centralizada que **unifica gestión de proyectos con inteligencia financiera automatizada**, eliminando el caos administrativo mediante:
- **Automatización OCR** de facturas vía email (reducción del 90% en entrada manual)
- **Trigger automático** de facturación al completar proyectos
- **Dashboard en tiempo real** de flujo de caja y rentabilidad por proyecto
- **Multi-moneda con TRM actualizada** para visión consolidada

### 1.3 Métricas de Éxito (3 meses post-lanzamiento)
- ⏱️ Reducción del 80% en tiempo de registro de gastos
- 💰 100% de proyectos completados facturados en <48h
- 📊 Visibilidad de flujo de caja proyectado a 30 días con precisión >85%
- ✅ Tasa de adopción del 100% entre los 3 roles definidos

---

## 2. Definición de Usuarios y Casos de Uso

### 2.1 Roles y Permisos

| Rol | Accesos | Responsabilidades Críticas |
|-----|---------|---------------------------|
| **Administrador** | Total | • Configuración de presupuestos por proyecto<br>• Aprobación de gastos >USD 500<br>• Análisis de rentabilidad y flujo de caja<br>• Validación final de nuevos proveedores |
| **Project Manager** | Proyectos + Entregables | • Gestión de estados del pipeline<br>• Carga de archivos finales<br>• Invitación de proveedores y asignación a proyectos |
| **Administrativo** | Finanzas + Validación | • Validación de facturas cargadas por proveedores<br>• Aprobación de documentos legales de proveedores<br>• Gestión de cuentas por pagar/cobrar<br>• Emisión de facturas a clientes |
| **Proveedor** | Portal Autogestión | • Registro y mantenimiento de datos fiscales<br>• Carga de documentos legales (RUT, Cámara Comercio, etc.)<br>• Carga de facturas por servicios prestados<br>• Consulta de estado de pagos |

### 2.2 Historias de Usuario Principales

**Como Administrador:**
> "Necesito ver cada lunes a las 9am un dashboard que me muestre: proyectos completados sin facturar, flujo de caja proyectado a 30 días, y los 3 proyectos menos rentables del mes."

**Como Project Manager:**
> "Cuando marco un proyecto como 'Completado', quiero que automáticamente se notifique a administrativa y que el proyecto aparezca en su cola de facturación, sin que yo tenga que enviar un correo aparte."

**Como Administrativo:**
> "Cuando llegue una factura de la imprenta a mi correo, quiero que el sistema la lea automáticamente y solo me pida confirmar a qué proyecto pertenece, en lugar de tener que tipear todo manualmente en Excel."

**Como Proveedor:**
> "Cuando termine un trabajo, necesito poder entrar a mi portal, subir mi factura y los documentos de entrega, y ver en qué fecha me van a pagar, sin tener que llamar cada semana para preguntar."

---

## 3. Requerimientos Funcionales (MVP)

### 3.1 Módulo: Gestión de Proyectos

#### 3.1.1 Vistas Múltiples de Proyectos (Inspirado en ClickUp)

**Concepto:** El usuario puede alternar entre 4 vistas diferentes del mismo conjunto de proyectos, manteniendo filtros y configuraciones. Cada vista está optimizada para diferentes necesidades de gestión.

**Selector de Vista (Toggle en la parte superior):**
```

[📋 Tabla] [📊 Kanban] [📅 Calendario] [📈 Gantt]

````

---

#### **Vista 1: Tabla (List View)**

**Propósito:** Análisis detallado y edición rápida de múltiples proyectos.

**Columnas Configurables (usuario puede mostrar/ocultar):**

| Campo | Tipo | Editable | Descripción |
|-------|------|----------|-------------|
| ☑️ Checkbox | - | ✅ | Selección múltiple para acciones en lote |
| 🔴 Estado | Badge | ✅ | Click para cambiar rápidamente |
| Nombre Proyecto | Texto | ✅ | Inline editing (doble click) |
| Cliente | Texto | ✅ | Autocompletado |
| Tipo Servicio | Tag | ✅ | Dropdown: Revista/Branding/Digital/Otro |
| Presupuesto | Dinero | ❌ | Formato: $2,500 USD (click abre modal) |
| Margen Real | % | ❌ | Calculado, color según performance |
| PM Responsable | Avatar | ✅ | Dropdown de usuarios |
| Fecha Inicio | Fecha | ✅ | Date picker |
| Fecha Entrega | Fecha | ✅ | Date picker, resalta si <7 días |
| Días en Estado | Número | ❌ | Calculado, alerta si >30 |
| Gastos Reales | Dinero | ❌ | Click muestra desglose |
| Archivos | Contador | ❌ | ej: "3 archivos" (click abre modal) |
| ... | Custom | ✅ | Campos personalizados (Fase 2 post-MVP) |

**Funcionalidades de Tabla:**

1. **Ordenamiento:**
   - Click en header de columna para ordenar ASC/DESC
   - Multi-ordenamiento: Shift+Click para orden secundario
   - Ejemplo: Ordenar por Estado, luego por Fecha de Entrega

2. **Filtros Avanzados:**
   - Panel lateral de filtros:
     ```
     🔍 Buscar por nombre...

     Estado: [Todos ▼]
       ☐ Brief
       ☐ Diseño
       ☑ En Producción
       ☐ Completado

     Cliente: [Todos ▼]

     Tipo Servicio: [Todos ▼]

     PM Responsable: [Todos ▼]

     Rango de Fechas:
       Desde: [__/__/____]
       Hasta: [__/__/____]

     Margen:
       ○ Todos
       ○ Solo rentables (>0%)
       ○ Solo en pérdida (<0%)

     [Limpiar Filtros] [Aplicar]
     ```

3. **Acciones en Lote (con checkboxes):**
   - Cambiar estado de múltiples proyectos
   - Asignar PM
   - Exportar selección a Excel/CSV
   - Eliminar (con confirmación)

4. **Edición Inline:**
   - Doble click en celda editable abre editor
   - Enter guarda, Esc cancela
   - Auto-save con indicador visual

5. **Agrupamiento (Opcional para Fase 2):**
   - Agrupar por: Estado, Cliente, PM, Tipo de Servicio
   - Vista colapsable por grupos

**Acciones por Fila:**
- Hover en fila muestra menú de acciones:
  - [👁️ Ver] [✏️ Editar] [📄 Duplicar] [🗑️ Eliminar]

---

#### **Vista 2: Kanban (Board View)**

**Propósito:** Gestión visual del flujo de trabajo y estado de proyectos.

**Estructura:**

````

┌────────────────┬────────────────┬────────────────┬────────────────┬────────────────┐
│ 📝 Brief │ 🎨 Diseño │ ✅ Aprobación │ 🖨️ Producción │ ✔️ Completado │
│ (3) │ (5) │ (2) │ (4) │ (8) │
├────────────────┼────────────────┼────────────────┼────────────────┼────────────────┤
│ ┌────────────┐ │ ┌────────────┐ │ ┌────────────┐ │ ┌────────────┐ │ ┌────────────┐ │
│ │ Campaña │ │ │ Revista │ │ │ Branding │ │ │ Catálogo │ │ │ Web App │ │
│ │ Navidad │ │ │ Ed. Mayo │ │ │ Acme Corp │ │ │ Productos │ │ │ Tech Inc │ │
│ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │
│ │ 👤 Juan │ │ │ 👤 María │ │ │ 👤 Pedro │ │ │ 👤 Ana │ │ │ 👤 Luis │ │
│ │ 📅 15/02 │ │ │ 📅 20/02 │ │ │ 📅 18/02 │ │ │ 📅 25/02 │ │ │ 📅 10/01 │ │
│ │ 💰 $2.5K │ │ │ 💰 $4K │ │ │ 💰 $8K │ │ │ 💰 $3K │ │ │ 💰 $12K │ │
│ │ 🏷️ Digital │ │ │ 🏷️ Revista │ │ │ 🏷️ Brand │ │ │ 🏷️ Print │ │ │ 🏷️ Digital │ │
│ └────────────┘ │ └────────────┘ │ └────────────┘ │ └────────────┘ │ └────────────┘ │
│ │ │ │ │ │
│ ┌────────────┐ │ ┌────────────┐ │ │ ┌────────────┐ │ ┌────────────┐ │
│ │ ... │ │ │ ... │ │ │ │ ... │ │ │ ... │ │
│ └────────────┘ │ └────────────┘ │ │ └────────────┘ │ └────────────┘ │
│ │ │ │ │ │
│ + Nuevo │ + Nuevo │ + Nuevo │ + Nuevo │ + Nuevo │
└────────────────┴────────────────┴────────────────┴────────────────┴────────────────┘

```

**Configuración de Columnas:**

- **Estados Predeterminados:**
  1. Brief (🔵 Azul)
  2. Diseño (🟣 Morado)
  3. Aprobación Cliente (🟡 Amarillo)
  4. Producción (🟠 Naranja)
  5. Completado (🟢 Verde)
  6. Facturado (✅ Gris) - Opcional, solo si admin quiere visualizarlo

- **Configuración Personalizable (Solo Admin):**
  - Agregar/eliminar columnas (estados)
  - Renombrar estados
  - Cambiar colores
  - Definir orden de columnas
  - **Límite WIP (Work In Progress):** Alertar si una columna tiene >X proyectos

**Tarjeta de Proyecto (Card):**

Información visible en la tarjeta:
```

┌─────────────────────────────┐
│ 🏷️ [Tag Tipo Servicio] │ <- Color según tipo
│ │
│ Nombre del Proyecto │ <- Título en bold
│ Cliente: ACME Corp │
│ │
│ 👤 Avatar PM 📅 15/02 │ <- PM y fecha entrega
│ 💰 $2,500 USD │ <- Presupuesto
│ 📊 Margen: +35% │ <- Verde si positivo, rojo si negativo
│ │
│ ⏱️ 12 días en estado │ <- Alerta si >30
│ 📎 3 archivos │
└─────────────────────────────┘

```

**Interacciones:**

1. **Drag & Drop:**
   - Arrastrar tarjeta entre columnas cambia el estado
   - Animación visual de transición
   - Si mueve a "Completado": Modal de confirmación + trigger de facturación
   - **Validación:** No permitir saltar estados críticos (ej: de Brief a Completado)

2. **Click en Tarjeta:**
   - Abre panel lateral (slide-in) con detalles completos:
     - Toda la info del proyecto
     - Sección de comentarios/notas
     - Timeline de cambios
     - Archivos adjuntos
     - Gastos asociados
     - Botones de acción: [Editar] [Cambiar Estado] [Ver Finanzas]

3. **Acciones Rápidas (Hover en tarjeta):**
   - [✏️ Editar] [👁️ Ver Detalles] [📄 Duplicar] [🗑️ Archivar]

4. **Agrupamiento Adicional:**
   - Toggle para "Agrupar por PM" o "Agrupar por Cliente"
   - Crea swim lanes horizontales

**Filtros en Vista Kanban:**
- Mismo panel de filtros que Vista Tabla
- Filtros se aplican a todas las vistas simultáneamente

---

#### **Vista 3: Calendario (Calendar View)**

**Propósito:** Visualización temporal y detección de cuellos de botella por fechas.

**Diseño de Calendario:**

```

                    Febrero 2026                           [Hoy] [Mes ◀ ▶]

─────────────────────────────────────────────────────────────────────────────
Lun Mar Mié Jue Vie Sáb Dom
─────────────────────────────────────────────────────────────────────────────
3 4 5 6 7 8 9

10 11 12 13 14 15 16
📦🎨 🎨🎨  
 2 ent 3 ent

17 18 19 20 21 22 23
🎨 🎨📦 📦 🎨  
 1 ent 2 ent 1 ent 1 ent

24 25 26 27 28
📦📦 📦🎨  
 3 ent 2 ent
─────────────────────────────────────────────────────────────────────────────

```

**Funcionalidades:**

1. **Vistas de Granularidad:**
   - **Mes:** Vista completa del mes (default)
   - **Semana:** Vista detallada de 7 días
   - **Día:** Agenda del día con timeline por horas (opcional para Fase 2)

2. **Eventos en el Calendario:**

   **Cada proyecto se representa según:**
   - **Fecha de Inicio:** Marca inicio (opcional, solo si está configurada)
   - **Fecha de Entrega:** Marca principal (la más importante)
   - **Rango de duración:** Barra que va de inicio a entrega (si ambas fechas existen)

   **Iconos/Tags por Tipo de Servicio:**
   - 🎨 Diseño
   - 📦 Producción/Imprenta
   - 📱 Digital
   - 📰 Revista

3. **Código de Colores:**
   - 🟢 Verde: Proyecto en tiempo (entrega en >7 días)
   - 🟡 Amarillo: Entrega en 3-7 días
   - 🔴 Rojo: Entrega en <3 días o vencida
   - ⚫ Gris: Proyecto completado

4. **Interacciones:**

   **Click en día del calendario:**
   - Muestra lista lateral de proyectos con entrega ese día
   - Opción "Crear Proyecto" con fecha pre-seleccionada

   **Click en proyecto (barra/evento):**
   - Abre panel lateral con detalles completos
   - Opción de arrastrar para cambiar fecha de entrega

   **Drag & Drop de fechas:**
   - Arrastrar barra de proyecto para reprogramar
   - Modal de confirmación al soltar: "¿Cambiar fecha de entrega a [nueva fecha]?"

5. **Vista de Densidad:**
   - Contador de proyectos por día
   - Alerta visual si un día tiene >5 entregas programadas
   - Ayuda a balancear carga de trabajo

6. **Filtros Específicos del Calendario:**
   - Mostrar solo: Fechas de entrega / Fechas de inicio / Ambas
   - Filtrar por PM (ver solo agenda de un PM específico)
   - Filtrar por tipo de servicio

---

#### **Vista 4: Gantt (Timeline View)**

**Propósito:** Planificación de dependencias, análisis de ruta crítica y gestión de recursos.

**Diseño de Gantt:**

```

Proyectos Enero Febrero Marzo
──────────────────────────────────────────────────────────────────────────
📦 Campaña Navidad ████████░░░░
👤 Juan | $2.5K │ │
01/01 15/01

🎨 Revista Edición Mayo ░░░░████████████
👤 María | $4K │ │
20/01 05/02

📱 Branding Acme Corp ░░████████████████░░
👤 Pedro | $8K │ │
25/01 20/02

📦 Catálogo Productos ░░░░████████
👤 Ana | $3K │ │
01/02 15/02

──────────────────────────────────────────────────────────────────────────
Leyenda:
████ Duración completada (progreso real)
░░░░ Duración pendiente
│ Milestone / Fecha clave

```

**Componentes de la Vista Gantt:**

1. **Panel Izquierdo (Lista Jerárquica):**
```

📂 Por Cliente (colapsable)
└ ACME Corp
├ 🎨 Branding Corporativo
└ 📦 Catálogo 2026
└ TechInc
├ 📱 App Móvil
└ 🌐 Sitio Web

📂 Por PM (colapsable)
└ Juan Pérez (4 proyectos)
└ María González (3 proyectos)

📂 Por Estado (colapsable)
└ En Diseño (5)
└ En Producción (3)

```

**Columnas en Panel Izquierdo:**
- Nombre Proyecto (con jerarquía visual)
- PM (avatar pequeño)
- Presupuesto
- % Progreso (barra visual)

2. **Panel Derecho (Timeline):**

**Escala Temporal:**
- Zoom dinámico: Días / Semanas / Meses / Trimestres
- Línea vertical "Hoy" destacada
- Fines de semana sombreados (opcional)

**Barra de Proyecto:**
```

░░░░████████████░░░░░░
│ │ │
Inicio Hoy Fin

```

**Información en Barra (Hover):**
- Nombre del proyecto
- Duración: X días
- Progreso: X%
- Fecha inicio - Fecha fin
- Días restantes / Días de retraso

3. **Funcionalidades Avanzadas:**

**a) Dependencias (Opcional - Fase 2 post-MVP):**
- Conectar proyectos con flechas (ej: Diseño debe terminar antes de Producción)
- Tipos de dependencia:
  - Finish-to-Start (más común)
  - Start-to-Start
  - Finish-to-Finish

**b) Progreso del Proyecto:**
- Barra con dos colores:
  - Parte completada (oscuro)
  - Parte pendiente (claro)
- Admin puede ajustar % manualmente o se calcula por tareas (Fase 2)

**c) Milestones:**
- Rombo/Diamante en timeline para fechas clave
- Ejemplos: Aprobación cliente, Fecha de imprenta, Entrega final
- Click para agregar/editar milestone

**d) Recursos (PM Assignment):**
- Toggle para ver "Vista por PM"
- Muestra carga de trabajo por PM en timeline
- Detecta sobrecargas (mismo PM con >3 proyectos simultáneos)

**e) Ruta Crítica (Opcional - Fase 2):**
- Resaltar en rojo proyectos que impactan fecha final si se retrasan
- Útil para priorización

4. **Interacciones en Gantt:**

**Drag & Drop:**
- Arrastrar barra horizontalmente = Cambiar fechas (mantiene duración)
- Arrastrar extremos de barra = Ajustar fecha inicio/fin
- Validación: No permitir fechas en el pasado

**Click en Barra:**
- Panel lateral con detalles completos
- Opción de editar fechas con precisión (date pickers)

**Zoom:**
- Botones [+ -] o scroll del mouse
- Atajos: Cmd/Ctrl + Scroll

**Navegación Temporal:**
- Botones [◀ Hoy ▶] para moverse en timeline
- Jump to date: Click en selector de fecha

5. **Filtros y Agrupamiento:**

**Agrupamiento:**
- Por Cliente
- Por PM
- Por Estado
- Por Tipo de Servicio
- Sin agrupar (lista plana)

**Filtros:**
- Mismo panel que otras vistas
- Filtro adicional: "Solo proyectos activos" (excluir completados/facturados)

6. **Indicadores Visuales:**

**Color de Barra según Estado:**
- Brief: Azul claro
- Diseño: Morado
- Aprobación: Amarillo
- Producción: Naranja
- Completado: Verde

**Alertas:**
- ⚠️ Proyecto retrasado (pasó fecha de entrega sin completar)
- 🔥 Entrega en <3 días
- ⏸️ Proyecto estancado (>30 días en mismo estado)

---

#### **Funcionalidades Transversales (Todas las Vistas)**

**1. Navegación entre Vistas:**
- Toggle en header persiste filtros y selección
- URL actualizada según vista (ej: `/projects?view=kanban`)
- Última vista usada se guarda en preferencias del usuario

**2. Búsqueda Global:**
```

🔍 Buscar proyectos por nombre, cliente, o palabra clave...

```
- Búsqueda en tiempo real (debounce de 300ms)
- Resultados resaltan término buscado
- Funciona en todas las vistas

**3. Acciones Globales (Header):**
```

[+ Nuevo Proyecto] [📥 Importar] [📤 Exportar] [⚙️ Configurar Vistas] [🔄 Refrescar]

```

**4. Configuración de Vistas (Gear Icon):**
- **Vista Tabla:** Elegir columnas visibles, orden de columnas
- **Vista Kanban:** Configurar estados, colores, límites WIP
- **Vista Calendario:** Granularidad default, eventos a mostrar
- **Vista Gantt:** Agrupamiento default, escala temporal default

**5. Exportación:**
- **Todas las vistas:** Excel, CSV, PDF
- **Vista Gantt:** Exportar como imagen PNG (para presentaciones)

**6. Permisos por Vista:**
- **PM:** Puede ver todas las vistas, editar solo sus proyectos
- **Administrativo:** Solo Vista Tabla (para validaciones financieras)
- **Administrador:** Acceso total, incluyendo configuración de estados

---

#### 3.1.2 Gestión de Proyectos con Triggers Inteligentes

**Funcionalidad Core:**
- Estados configurables según flujo de trabajo (ejemplo: Brief → Diseño → Aprobación Cliente → Producción → Completado → Facturado)
- **Trigger automático:** Al mover a "Completado", el sistema:
  1. Genera notificación push/email al rol Administrativo
  2. Crea registro en módulo "Pendientes por Facturar" con datos del proyecto
  3. Calcula margen real vs. presupuestado
  4. Bloquea edición de gastos (requiere aprobación de Administrador)

**Información por Proyecto:**
- Nombre, Cliente, Tipo de servicio (Revista/Branding/Digital/Otro)
- Presupuesto estimado (Ingresos y Egresos)
- Fecha de inicio y fecha de entrega comprometida
- Archivos adjuntos (brief, entregables finales)
- Timeline de cambios de estado (auditoría)

**Reglas de Validación:**
- No permitir mover a "Completado" si no hay al menos 1 entregable cargado
- Alerta si el proyecto lleva >30 días sin cambio de estado

#### 3.1.2 Centro de Costos por Proyecto

**Al crear un proyecto, registrar:**
- **Ingresos estimados:** Monto acordado con cliente (multi-moneda)
- **Egresos estimados:** Desglose por categoría:
  - Proveedores externos (imprenta, freelancers)
  - Costos internos (horas-equipo, opcional para MVP)
  - Logística y misceláneos

**Cálculos automáticos (actualizados en tiempo real):**
```

Margen Presupuestado = (Ingresos Estimados - Egresos Estimados) / Ingresos Estimados _ 100
Margen Real = (Ingresos Reales - Egresos Reales) / Ingresos Reales _ 100
Desviación = Margen Real - Margen Presupuestado

```

---

### 3.2 Módulo: Portal de Proveedores (Autogestión)

#### 3.2.1 Registro y Onboarding de Proveedores

**Flujo de Alta de Proveedor:**

1. **Invitación desde el Sistema:**
   - Admin o PM envía invitación vía email desde el sistema
   - Link único de registro con token de seguridad (válido 7 días)
   - Email incluye: nombre de tu empresa, breve descripción del proceso

2. **Formulario de Registro (Paso 1 - Datos Básicos):**
```

Tipo de Proveedor:
○ Persona Natural
○ Persona Jurídica

Nombre/Razón Social: \***\*\_\_\_\*\***
Tipo de Servicio que Ofrece: [Dropdown: Imprenta, Diseño Freelance, Logística, etc.]
País: \***\*\_\_\_\*\***

```

3. **Formulario de Registro (Paso 2 - Datos Fiscales):**

**Si es Persona Natural:**
```

- Número de Cédula: \***\*\_\_\_\*\***
- Nombre Completo: \***\*\_\_\_\*\***
- Email de Contacto: \***\*\_\_\_\*\***
- Teléfono: \***\*\_\_\_\*\***
- Dirección Fiscal: \***\*\_\_\_\*\***
- RUT (Registro Único Tributario): [Archivo PDF/Imagen - Obligatorio]
  └ Validaciones: Formato PDF/JPG/PNG, Max 5MB, debe estar vigente

```

**Si es Persona Jurídica:**
```

- NIT/RUT Empresa: \***\*\_\_\_\*\***
- Razón Social: \***\*\_\_\_\*\***
- Email Empresarial: \***\*\_\_\_\*\***
- Teléfono Principal: \***\*\_\_\_\*\***
- Dirección Fiscal: \***\*\_\_\_\*\***

DOCUMENTOS OBLIGATORIOS:
✅ RUT (Registro Único Tributario): [Subir archivo]
✅ Cámara de Comercio (vigencia <30 días): [Subir archivo]
✅ Cédula Representante Legal: [Subir archivo]

DOCUMENTOS OPCIONALES (pero recomendados):
○ Certificación Bancaria: [Subir archivo]
○ Pólizas de Cumplimiento/Seguros: [Subir archivo]

```

4. **Formulario de Registro (Paso 3 - Datos Bancarios):**
```

Banco: [Dropdown con bancos principales del país]
Tipo de Cuenta: ○ Ahorros ○ Corriente
Número de Cuenta: \***\*\_\_\_\*\***
Titular de la Cuenta: \***\*\_\_\_\*\*** (debe coincidir con razón social/nombre)

```

5. **Aceptación de Términos:**
```

☑ Acepto los términos y condiciones de proveedores
☑ Autorizo el tratamiento de datos personales según Ley 1581/2012 (RGPD)
☑ Confirmo que la información suministrada es verídica

```

**Validaciones del Sistema:**
- Verificar que RUT/NIT no esté duplicado en la base de datos
- Validación de formato de documentos (solo PDF, JPG, PNG)
- Validación de vigencia de Cámara de Comercio (fecha de expedición <30 días)
- Email de confirmación una vez aprobado

**Estados del Proveedor:**
- **Registro Incompleto:** Falta subir documentos obligatorios
- **Pendiente de Aprobación:** Documentos cargados, esperando validación del Administrativo
- **Aprobado - Activo:** Puede subir facturas y recibir pagos
- **Rechazado:** Documentación no válida (con nota de rechazo)
- **Suspendido:** Temporal (por documentos vencidos o incumplimientos)
- **Inactivo:** No ha tenido movimientos en 6+ meses

#### 3.2.2 Portal de Proveedores - Funcionalidades

**Dashboard del Proveedor (vista post-login):**

**Sección: Mi Perfil**
- Ver y actualizar datos de contacto
- Ver documentos cargados con estados:
- ✅ Aprobado (fecha de aprobación)
- ⏳ En revisión
- ⚠️ Próximo a vencer (alerta a 30 días)
- ❌ Vencido (bloquea carga de nuevas facturas)
- Botón "Actualizar Documento Vencido"

**Sección: Mis Facturas**

*Vista Tabla:*
| # Factura | Proyecto | Fecha Emisión | Monto | Estado | Fecha Pago Programada | Acciones |
|-----------|----------|---------------|-------|--------|----------------------|----------|
| 12345 | Campaña Navidad | 15/01/26 | $2,500 USD | Aprobada | 30/01/26 | [Ver] [Descargar] |
| 12344 | Revista Ed. 05 | 10/01/26 | $850 USD | En Revisión | - | [Ver] |

**Estados de Factura (desde perspectiva del proveedor):**
- **Cargada:** El proveedor la subió, esperando validación del cliente
- **En Revisión:** El administrativo está validando datos
- **Aprobada - Pago Programado:** Validada, con fecha estimada de pago
- **Pagada:** Pago efectuado (mostrar fecha real de pago)
- **Rechazada:** No aprobada (mostrar razón del rechazo)

**Formulario: Cargar Nueva Factura**
```

Proyecto Asociado: [Dropdown - solo proyectos donde es proveedor asignado]
Número de Factura: \***\*\_\_\_\*\***
Fecha de Emisión: [Date picker]
Fecha de Vencimiento: [Date picker] (default: +30 días)
Moneda: ○ USD ○ COP ○ Otra: **\_**
Subtotal: \***\*\_\_\_\*\***
IVA/Impuestos: \***\*\_\_\_\*\*** (%)
Total: \***\*\_\_\_\*\*** (calculado automáticamente)

Descripción del Servicio/Producto:
[Text area - max 500 caracteres]

Archivo de Factura: [Subir PDF - Obligatorio]
└ Validaciones: Solo PDF, max 10MB, debe tener número de factura visible

Archivos Adjuntos Opcionales:
[Subir archivos] (ej: remisiones, actas de entrega)
└ Max 3 archivos, 5MB c/u

[Botón: Enviar Factura para Aprobación]

```

**Después de Enviar:**
- Email de confirmación al proveedor: "Tu factura #12345 fue recibida y está en revisión"
- Notificación al Administrativo del sistema: "Nueva factura de [Proveedor] requiere validación"

**Sección: Histórico de Pagos**
- Reporte descargable (Excel/PDF) de todas las facturas pagadas
- Filtros por fecha, proyecto, monto
- Totales por año fiscal

**Sección: Documentos Legales**
- Descargar certificado de retención (si aplica)
- Descargar comprobantes de pago
- Acceso a términos y condiciones actualizados

#### 3.2.3 Validación de Facturas (Vista Administrativo)

**Dashboard "Facturas Pendientes de Aprobación":**

*Vista de Tarjetas (Card View):*
```

┌─────────────────────────────────────────┐
│ Factura #12345 - Imprenta Los Andes │
│ │
│ Proyecto: Campaña Navidad 2026 │
│ Monto: $2,500 USD │
│ Fecha Emisión: 15/01/2026 │
│ Proveedor: ✅ Documentos al día │
│ │
│ [Ver PDF] [Aprobar] [Rechazar] [Editar]│
└─────────────────────────────────────────┘

````

**Flujo de Aprobación:**

1. **Click en "Ver PDF":**
   - Visualizador inline del PDF de la factura
   - Datos extraídos por OCR mostrados al lado para comparación:
     ```
     OCR detectó:                Tu validación:
     Proveedor: Los Andes        [✓ Correcto] [✗ Corregir]
     Monto: $2,500              [✓ Correcto] [✗ Corregir: _____]
     Fecha: 15/01/26            [✓ Correcto] [✗ Corregir: _____]
     IVA: $475 (19%)            [✓ Correcto] [✗ Corregir: _____]
     ```

2. **Click en "Aprobar":**
   - Modal de confirmación:
     ```
     ¿Confirmar aprobación de factura #12345?
     Monto: $2,500 USD
     Proyecto: Campaña Navidad 2026

     Fecha de Pago Programada: [Date picker] (default: hoy + 30 días)
     Notas internas (opcional): [Text area]

     [Cancelar]  [Confirmar Aprobación]
     ```
   - Al confirmar:
     - Factura pasa a estado "Aprobada"
     - Se actualiza el flujo de caja proyectado
     - Email automático al proveedor: "Tu factura fue aprobada, pago programado para [fecha]"
     - Se registra en contabilidad (cuenta por pagar)

3. **Click en "Rechazar":**
   - Modal obligatorio con razón:
     ```
     Motivo del rechazo: [Dropdown]
       ○ Datos incorrectos en la factura
       ○ Monto no coincide con lo acordado
       ○ Proyecto no corresponde
       ○ Documento ilegible
       ○ Otro: [Text area obligatorio]

     [Cancelar]  [Confirmar Rechazo]
     ```
   - Email al proveedor con el motivo específico
   - Proveedor puede resubir versión corregida

4. **Click en "Editar":**
   - Permite al administrativo corregir datos menores (monto, fecha) sin rechazar
   - Requiere nota de justificación (auditoría)

**Alertas Automáticas para Administrativo:**
- 🔴 Factura cargada hace >3 días sin revisar
- 🟡 Proveedor tiene documentos que vencen en <15 días (bloquear nuevas facturas si vencen)
- 🟢 Todas las facturas de la semana revisadas

#### 3.2.4 Gestión de Documentos Legales (Vista Administrativo)

**Módulo: "Proveedores - Documentos"**

*Vista de Lista de Proveedores:*
| Proveedor | Tipo | RUT | Cámara Comercio | Cédula Rep. Legal | Estado | Acciones |
|-----------|------|-----|----------------|-------------------|--------|----------|
| Imprenta Los Andes | Jurídica | ✅ Vigente | ⚠️ Vence 05/02/26 | ✅ Vigente | Activo | [Ver] [Notificar] |
| Juan Pérez Diseño | Natural | ✅ Vigente | N/A | ✅ Vigente | Activo | [Ver] |
| Logística Express | Jurídica | ❌ Vencido | ❌ Vencido | ✅ Vigente | Suspendido | [Ver] [Reactivar] |

**Acciones Disponibles:**
- **Ver:** Abre ficha completa del proveedor con todos los documentos descargables
- **Notificar:** Envía email recordatorio de actualización de documentos
- **Suspender/Reactivar:** Cambiar estado (suspendidos no pueden cargar facturas)

**Automatizaciones:**
- Email automático al proveedor 30 días antes del vencimiento de Cámara de Comercio
- Email de recordatorio a 15 y 7 días antes del vencimiento
- Suspensión automática el día del vencimiento si no actualizan
- Notificación al Administrativo de proveedores suspendidos

### 3.3 Módulo: Gestión Financiera Multi-moneda

#### 3.2.1 Soporte de Monedas y TRM

**Monedas soportadas (MVP):**
- USD (Dólar estadounidense)
- COP (Peso colombiano) - asumiendo tu ubicación
- Moneda base para reportes: **USD** (configurable)

**Integración TRM:**
- **API recomendada:** `exchangerate-api.com` (gratuita hasta 1,500 requests/mes)
- **Frecuencia de actualización:** Diaria a las 7:00 AM hora local
- **Almacenamiento histórico:** Guardar TRM del día de cada transacción para auditoría
- **Funcionalidad manual:** Permitir override de TRM para casos especiales (aprobación de Administrador)

**Conversión para Dashboards:**
- Todos los montos se convierten a USD usando la TRM del día de la transacción
- Opción de toggle para ver valores en moneda local

#### 3.2.2 Gestión de Gastos

**Tipos de Gasto:**
1. **Gastos de Proyecto:** Vinculados a un proyecto específico (proveedores, freelancers)
2. **Gastos Recurrentes:** Operativos sin vinculación a proyecto (arriendo, servicios, nómina)

**Información por Gasto:**
- Proveedor (autocompletado desde base de datos)
- Monto y moneda
- TRM aplicada (automática o manual)
- Categoría (Material impreso, Diseño, Logística, Servicios, Otro)
- Fecha de emisión y fecha de pago (proyectada/real)
- Estado: Pendiente / Pagado
- Archivo PDF de factura
- Notas adicionales

**Flujo de Aprobación:**
- Gastos <USD 500: Aprobación automática del PM al vincular
- Gastos ≥USD 500: Requiere aprobación explícita del Administrador

#### 3.2.3 Gestión de Ingresos

**Ciclo de Facturación:**
1. Proyecto se marca como "Completado" → Entra a cola de facturación
2. Administrativo genera factura (integración con software contable existente o generación manual)
3. Se registra en sistema:
   - Monto facturado (puede diferir del presupuestado)
   - Fecha de emisión
   - Plazo de pago (15/30/45/60 días)
   - Estado: Pendiente / Cobrado / Vencido
4. Alertas automáticas a 7 días antes y 3 días después de vencimiento

---

### 3.3 Módulo: Automatización Inteligente (OCR + Email)

#### 3.3.1 Integración con Gmail

**Configuración:**
- Email dedicado: `facturas@[tudominio].com` (crear cuenta Gmail específica)
- **Autenticación:** OAuth 2.0 con alcance de solo lectura de correos específicos
- **Filtrado:** Escanear solo correos de proveedores pre-autorizados o con palabras clave ("factura", "invoice", "cobro")

**Frecuencia de escaneo:**
- Polling cada 15 minutos durante horario laboral (8am-6pm)
- Webhook si proveedor de email lo soporta (Gmail Pub/Sub)

#### 3.3.2 Motor OCR

**Tecnología recomendada (evaluación):**

| Opción | Precisión | Costo (MVP) | Idiomas | Recomendación |
|--------|-----------|-------------|---------|---------------|
| Google Document AI | 95%+ | ~$1.50/1000 páginas | ES/EN | ⭐ **Mejor opción** |
| AWS Textract | 93%+ | ~$1.50/1000 páginas | EN principalmente | Alternativa |
| Tesseract (Open Source) | 80-85% | Gratis | ES/EN | Solo si presupuesto es crítico |

**Datos a Extraer (campos obligatorios):**
- ✅ Nombre del proveedor (validación contra base de datos)
- ✅ Número de factura
- ✅ Fecha de emisión
- ✅ Monto total
- ✅ Subtotal e impuestos (IVA)
- ✅ Moneda (detector automático: COP, USD, etc.)
- ⚠️ Conceptos/líneas de detalle (opcional para MVP)

**Flujo de Procesamiento:**
````

1. Email recibido → Descarga PDF/imagen
2. OCR extrae datos → Confianza >80% pasa a paso 3, <80% marca para revisión manual
3. Sistema crea "Gasto Borrador" con datos extraídos
4. Notifica a Administrativo para:
   - Validar datos (especialmente proveedor y monto)
   - Vincular a Proyecto (dropdown con búsqueda)
   - Confirmar categoría de gasto
5. Una vez confirmado → Gasto se registra oficialmente y afecta dashboard

```

**Manejo de Errores:**
- Si OCR falla 2 veces, marcar factura para procesamiento 100% manual
- Log de todas las facturas procesadas con nivel de confianza del OCR

---

### 3.4 Módulo: Dashboard y Reportes

#### 3.4.1 Dashboard Ejecutivo (Vista Administrador)

**Sección 1: Flujo de Caja (vista predeterminada)**

**Cálculo de Flujo Proyectado a 30 días:**
```

Flujo Neto Proyectado =
(Efectivo Actual + Cuentas por Cobrar próximos 30 días)

- (Cuentas por Pagar próximos 30 días + Gastos Recurrentes)

```

**Visualización:**
- Gráfico de cascada (waterfall chart) mostrando:
  - Posición de caja actual
  - Ingresos proyectados por semana
  - Egresos proyectados por semana
  - Posición final proyectada a 30 días
- Semáforo de alerta:
  - 🟢 Verde: Flujo proyectado >20% sobre gastos fijos
  - 🟡 Amarillo: Flujo proyectado entre 0-20% sobre gastos fijos
  - 🔴 Rojo: Flujo proyectado negativo

**Sección 2: Proyectos en Riesgo**

**Criterios de detección:**
- Proyectos completados hace >5 días sin facturar
- Proyectos con margen real <50% del margen presupuestado
- Proyectos en estado "Diseño" o anterior por >30 días

**Formato:**
- Tabla con: Proyecto, Cliente, Estado, Días en estado actual, Margen real vs. presupuestado
- Acción rápida: Botón para enviar recordatorio al PM responsable

**Sección 3: Top Insights del Mes**

- 🏆 Top 3 proyectos más rentables (margen real)
- ⚠️ Top 3 proyectos menos rentables
- 📊 Distribución de ingresos por tipo de servicio (gráfico de dona)
- 💸 Gasto promedio en proveedores externos por tipo de proyecto

#### 3.4.2 Reportes Exportables

**Formatos disponibles:** PDF, Excel, CSV

**Tipos de reporte (generables on-demand):**
1. **Reporte de Rentabilidad por Proyecto** (rango de fechas configurable)
2. **Estado de Cuentas por Cobrar** (con antigüedad: 0-30, 31-60, 61-90, >90 días)
3. **Estado de Cuentas por Pagar** (con antigüedad similar)
4. **Gastos por Proveedor** (consolidado mensual/anual)
5. **Comparativa Presupuesto vs. Real** (desviaciones por proyecto)

---
### 3.6 Módulo: Gestión de Ventas y Gastos

#### 3.6.1 Objetivo del Módulo

**Propósito Central:**
Centralizar el registro, seguimiento y análisis de ingresos y egresos asociados a proyectos institucionales, permitiendo trazabilidad financiera completa, control de pagos, cálculo automatizado de comisiones y generación de reportes para gestión, auditoría y cumplimiento contractual.

**Diferenciador clave:** Este módulo transforma datos dispersos en inteligencia financiera accionable, conectando cada peso gastado y cada peso ingresado con su proyecto, cliente, marca y producto correspondiente.

---

#### 3.6.2 Integración con Gestión de Proyectos

**Flujo de Datos Bidireccional:**

El módulo de Ventas y Gastos se **alimenta automáticamente** del módulo de Gestión de Proyectos y, a su vez, **enriquece** la información financiera de cada proyecto en tiempo real.

**Sincronización Automática:**

1. **Al crear un proyecto** en el módulo de Gestión de Proyectos:
   - Se crea automáticamente un "centro de costos" en el módulo de Ventas y Gastos
   - Hereda los datos básicos:
     - Nombre del proyecto
     - Cliente asociado
     - PM Responsable
     - Fechas de inicio y entrega
   - Queda listo para registrar ventas y gastos vinculados

2. **Durante la vida del proyecto:**
   - Cada venta registrada actualiza el campo "Ingresos Reales" del proyecto
   - Cada gasto aprobado actualiza el campo "Egresos Reales" del proyecto
   - Los cálculos de margen, utilidad y rentabilidad se actualizan en tiempo real
   - Los estados de pago afectan el flujo de caja proyectado

3. **Al completar un proyecto:**
   - Trigger automático que solicita registro de venta final (si no existe)
   - Bloqueo de registro de nuevos gastos (requiere aprobación de Admin)
   - Cálculo de comisiones basado en utilidad real vs presupuestada

**Vista Consolidada en Proyecto:**

Desde cualquier vista del módulo de Proyectos (Tabla, Kanban, Calendario, Gantt), el usuario puede ver:

```

┌─────────────────────────────────────────────────┐
│ 📊 RESUMEN FINANCIERO: Campaña Navidad 2026 │
├─────────────────────────────────────────────────┤
│ VENTAS (sin IVA) │
│ • Total Facturado: $10,000 USD │
│ • Total Cobrado: $8,000 USD (80%) │
│ • Pendiente de cobro: $2,000 USD │
│ │
│ GASTOS (sin IVA) │
│ • Total Aprobado: $6,500 USD │
│ • Total Pagado: $5,000 USD (77%) │
│ • Pendiente de pago: $1,500 USD │
│ │
│ COMISIONES │
│ • Base comisionable: $3,500 USD │
│ • % Comisión: 15% │
│ • Valor comisión: $525 USD │
│ │
│ UTILIDAD NETA │
│ • Proyectada: $3,500 USD (35%) │
│ • Real (a la fecha): $2,475 USD (24.75%) │
│ • Desviación: -$1,025 USD (-10.25%) ⚠️ │
│ │
│ [Ver Detalle Completo] [Registrar Venta/Gasto] │
└─────────────────────────────────────────────────┘

```

**Atributos Adicionales por Proyecto:**

Para enriquecer el análisis financiero, cada proyecto puede asociarse a:

- **Línea de negocio:** (ej: Publicidad, Editorial, Digital, Eventos)
- **Periodo:** (ej: Q1 2026, Enero 2026, Año Fiscal 2026)
- **Cliente:** (heredado automáticamente del módulo de Proyectos)
- **Marca:** (del cliente, si aplica - ej: Coca-Cola del cliente The Coca-Cola Company)
- **Producto:** (específico de la marca - ej: Coca-Cola Zero)
- **Responsable (PM):** (heredado automáticamente del módulo de Proyectos)

Estos atributos permiten generar reportes multidimensionales como:
- "Ventas totales de la Línea de Publicidad en Q1 2026"
- "Gastos por Proveedor en proyectos de la Marca Coca-Cola"
- "Comisiones generadas por el PM Juan Pérez en el periodo"

---

#### 3.6.3 Registro de Ventas

**Propósito:** Documentar cada ingreso asociado a proyectos, desde la orden de compra hasta el pago final, con trazabilidad completa del ciclo de facturación y cobranza.

**Interfaz de Registro de Venta:**

```

┌────────────────────────────────────────────────────────────────┐
│ 💰 NUEVA VENTA [Guardar] [×] │
├────────────────────────────────────────────────────────────────┤
│ │
│ 🏢 INFORMACIÓN DEL PROYECTO │
│ ┌────────────────────────────────────────────────────────────┐ │
│ │ Línea de negocio: [Dropdown: Publicidad ▼] │ │
│ │ Proyecto: [Autocomplete: Campaña Navidad 2026] │ │
│ │ Cliente: ACME Corp (autocompletado) │ │
│ │ Marca: [Optional: Coca-Cola ▼] │ │
│ │ Producto: [Optional: Coca-Cola Zero ▼] │ │
│ │ PM Responsable: Juan Pérez (autocompletado) │ │
│ └────────────────────────────────────────────────────────────┘ │
│ │
│ 💵 DETALLES COMERCIALES │
│ ┌────────────────────────────────────────────────────────────┐ │
│ │ Valor de venta (sin IVA): [________] USD │ │
│ │ IVA (19%): $1,900 USD (calculado automáticamente) │ │
│ │ Total con IVA: $12,000 USD │ │
│ │ │ │
│ │ Estado OC: ○ OC recibida ○ Facturar sin OC │ │
│ │ Número de OC: [________] (opcional si "sin OC") │ │
│ └────────────────────────────────────────────────────────────┘ │
│ │
│ 📄 FACTURACIÓN │
│ ┌────────────────────────────────────────────────────────────┐ │
│ │ Número de factura: [________] │ │
│ │ Fecha de factura: [Date picker: __/__/____] │ │
│ │ Adjuntar factura: [📎 Subir PDF] │ │
│ │ Plazo de pago: [Dropdown: 30 días ▼] │ │
│ │ Opciones: 15 / 30 / 45 / 60 / 90 días │ │
│ │ Fecha de cobro estimada: 15/03/2026 (calculado) │ │
│ └────────────────────────────────────────────────────────────┘ │
│ │
│ 💳 COBRANZA Y PAGO │
│ ┌────────────────────────────────────────────────────────────┐ │
│ │ Fecha de pago real: [Date picker] (opcional hasta cobro) │ │
│ │ Valor pagado: [________] USD │ │
│ │ Estado de pago: │ │
│ │ ○ Pendiente ○ Parcial ○ Pagado │ │
│ │ │ │
│ │ ┌──────────────────────────────────────────────────────┐ │ │
│ │ │ Si estado = "Pagado": │ │ │
│ │ │ Calificación de cumplimiento: │ │ │
│ │ │ ○ Puntual (pagó antes/en fecha de cobro) │ │ │
│ │ │ ○ Impuntual (pagó después de fecha de cobro) │ │ │
│ │ │ │ │ │
│ │ │ Días de retraso: 5 días (calculado automáticamente) │ │ │
│ │ └──────────────────────────────────────────────────────┘ │ │
│ └────────────────────────────────────────────────────────────┘ │
│ │
│ 💼 COMISIONES │
│ ┌────────────────────────────────────────────────────────────┐ │
│ │ % Comisión: [___]% (ej: 15%) │ │
│ │ Valor comisión: $1,500 USD (calculado sobre venta sin IVA) │ │
│ │ Responsable de comisión: Juan Pérez (PM del proyecto) │ │
│ │ │ │
│ │ 💡 Nota: Si hay comisión escalonada (por margen), se │ │
│ │ recalcula automáticamente al cerrar el proyecto. │ │
│ └────────────────────────────────────────────────────────────┘ │
│ │
│ 📝 SEGUIMIENTO │
│ ┌────────────────────────────────────────────────────────────┐ │
│ │ Notas internas: │ │
│ │ [Text area para registrar contactos, correos enviados, │ │
│ │ seguimientos, alertas, etc.] │ │
│ │ │ │
│ │ Historial de seguimiento: (auto-generado) │ │
│ │ • 15/02/26: Factura emitida │ │
│ │ • 20/02/26: Correo de seguimiento enviado │ │
│ │ • 15/03/26: ⚠️ Fecha de cobro - recordatorio automático │ │
│ └────────────────────────────────────────────────────────────┘ │
│ │
│ [Cancelar] [Guardar Venta] │
└────────────────────────────────────────────────────────────────┘

```

**Funcionalidades Inteligentes:**

1. **Cálculo Automático de Fechas:**
   - Al ingresar "Fecha de factura" + "Plazo de pago", calcula "Fecha de cobro estimada"
   - Si "Fecha de pago real" > "Fecha de cobro estimada", marca automáticamente como "Impuntual"
   - Calcula días de retraso/adelanto

2. **Alertas Automáticas:**
   - **7 días antes de fecha de cobro:** Email al Administrativo recordando seguimiento
   - **Día de fecha de cobro:** Notificación en #finanzas y DM al Administrativo
   - **3 días después de vencimiento:** Alerta de cobro vencido + sugerencia de acciones

3. **Validaciones:**
   - No permitir registrar "Fecha de pago" sin "Valor pagado"
   - Si "Valor pagado" < "Valor de venta total", estado debe ser "Parcial" (no "Pagado")
   - Si "Estado = Pagado", requerir "Fecha de pago real" y "Calificación de cumplimiento"

4. **Comisiones Dinámicas:**
   - Opción de configurar % fijo por proyecto
   - Opción de % escalonado por margen (ej: si margen >30%, comisión = 20%; si margen 20-30%, comisión = 15%)
   - Recálculo automático al cerrar proyecto basado en margen real

---

#### 3.6.4 Registro de Gastos y Pagos a Proveedores

**Propósito:** Documentar todos los egresos asociados a proveedores, desde la contratación hasta el pago final, con validación de documentos y seguimiento de cumplimiento contractual.

**Nota:** Este módulo **complementa** el Portal de Proveedores (sección 3.2), agregando campos específicos para control financiero institucional.

**Interfaz de Registro de Gasto:**

```

┌────────────────────────────────────────────────────────────────┐
│ 🧾 NUEVO GASTO A PROVEEDOR [Guardar] [×] │
├────────────────────────────────────────────────────────────────┤
│ │
│ 🏢 INFORMACIÓN DEL PROVEEDOR │
│ ┌────────────────────────────────────────────────────────────┐ │
│ │ Proveedor: [Autocomplete con proveedores activos] │ │
│ │ → Si es nuevo, se crea automáticamente en BD │ │
│ │ │ │
│ │ Correo electrónico: proveedor@email.com (autocompletado) │ │
│ │ Descripción del servicio: │ │
│ │ [Text area: ej. "Diseño de material impreso para campaña"] │ │
│ └────────────────────────────────────────────────────────────┘ │
│ │
│ 🔗 VINCULACIÓN AL PROYECTO │
│ ┌────────────────────────────────────────────────────────────┐ │
│ │ Línea de negocio: [Dropdown: Publicidad ▼] │ │
│ │ Proyecto: [Autocomplete: Campaña Navidad 2026] │ │
│ │ Cliente: ACME Corp (heredado del proyecto) │ │
│ │ Marca: Coca-Cola (heredado o editable) │ │
│ │ Producto: Coca-Cola Zero (heredado o editable) │ │
│ └────────────────────────────────────────────────────────────┘ │
│ │
│ 💵 DETALLES FINANCIEROS │
│ ┌────────────────────────────────────────────────────────────┐ │
│ │ Valor total (sin IVA): [________] USD │ │
│ │ IVA (19%): $190 USD (calculado) │ │
│ │ Total con IVA: $1,190 USD │ │
│ │ │ │
│ │ Categoría de gasto: │ │
│ │ [Dropdown: Material Impreso ▼] │ │
│ │ Opciones: Diseño, Logística, Producción, Servicios, etc.│ │
│ └────────────────────────────────────────────────────────────┘ │
│ │
│ 📋 DOCUMENTACIÓN CONTRACTUAL │
│ ┌────────────────────────────────────────────────────────────┐ │
│ │ Código de orden de servicio (OC): [________] │ │
│ │ Código de release: [________] (opcional) │ │
│ │ Número de factura del proveedor: [________] │ │
│ │ Adjuntar factura: [📎 Subir PDF] │ │
│ │ │ │
│ │ Fecha de radicado: [Date picker: __/__/____] │ │
│ │ (Fecha en que se recibió la factura formalmente) │ │
│ │ │ │
│ │ Fecha para pago: [Date picker: __/__/____] │ │
│ │ (Según términos del contrato) │ │
│ └────────────────────────────────────────────────────────────┘ │
│ │
│ ✅ VALIDACIÓN Y ESTADO DE PAGO │
│ ┌────────────────────────────────────────────────────────────┐ │
│ │ Estado de pago: │ │
│ │ ○ Pendiente │ │
│ │ ○ Solicite documentos (falta algo para procesar pago) │ │
│ │ ○ Pagado │ │
│ │ │ │
│ │ ┌──────────────────────────────────────────────────────┐ │ │
│ │ │ Si estado = "Solicite documentos": │ │ │
│ │ │ Documentos faltantes: │ │ │
│ │ │ ☐ RUT actualizado │ │ │
│ │ │ ☐ Certificación bancaria │ │ │
│ │ │ ☐ Factura firmada │ │ │
│ │ │ ☐ Acta de entrega │ │ │
│ │ │ ☐ Otro: [____________] │ │ │
│ │ │ │ │ │
│ │ │ 📧 [Enviar Email al Proveedor] solicitando docs. │ │ │
│ │ └──────────────────────────────────────────────────────┘ │ │
│ │ │ │
│ │ ┌──────────────────────────────────────────────────────┐ │ │
│ │ │ Si estado = "Pagado": │ │ │
│ │ │ Fecha de pago real: [Date picker] │ │ │
│ │ │ Comprobante de pago: [📎 Subir] │ │ │
│ │ │ Método de pago: [Dropdown: Transferencia ▼] │ │ │
│ │ └──────────────────────────────────────────────────────┘ │ │
│ └────────────────────────────────────────────────────────────┘ │
│ │
│ 📦 ENTREGABLES (Opcional - para control de calidad) │
│ ┌────────────────────────────────────────────────────────────┐ │
│ │ ¿Este gasto incluye entregables? ○ Sí ○ No │ │
│ │ │ │
│ │ [+ Agregar Entregable] │ │
│ │ ┌────────────────────────────────────────────────────┐ │ │
│ │ │ Entregable 1: Diseños finales │ │ │
│ │ │ Fecha de entrega comprometida: [__/__/____] │ │ │
│ │ │ Fecha de entrega real: [__/__/____] │ │ │
│ │ │ Estado: ○ Pendiente ○ Recibido ○ Aprobado │ │ │
│ │ │ Archivos: [📎 archivo1.psd] [📎 archivo2.ai] │ │ │
│ │ └────────────────────────────────────────────────────┘ │ │
│ │ │ │
│ │ 💡 Nota: No se puede marcar gasto como "Pagado" si hay │ │
│ │ entregables en estado "Pendiente". │ │
│ └────────────────────────────────────────────────────────────┘ │
│ │
│ 📝 OBSERVACIONES Y SEGUIMIENTO │
│ ┌────────────────────────────────────────────────────────────┐ │
│ │ Observaciones: │ │
│ │ [Text area para notas internas, incidencias, etc.] │ │
│ │ │ │
│ │ Historial de seguimiento: (auto-generado) │ │
│ │ • 10/02/26: Gasto registrado │ │
│ │ • 12/02/26: Estado cambiado a "Solicite documentos" │ │
│ │ • 12/02/26: Email enviado solicitando RUT actualizado │ │
│ │ • 15/02/26: Documentos recibidos, estado "Pendiente" │ │
│ │ • 20/02/26: ⚠️ Fecha de pago - recordatorio automático │ │
│ │ • 22/02/26: Pago realizado │ │
│ └────────────────────────────────────────────────────────────┘ │
│ │
│ [Cancelar] [Guardar Gasto] │
└────────────────────────────────────────────────────────────────┘

```

**Funcionalidades Inteligentes:**

1. **Validación Pre-Pago:**
   - Sistema no permite cambiar estado a "Pagado" si:
     - Faltan documentos legales del proveedor (RUT, Cámara Comercio vencidos)
     - Hay entregables en estado "Pendiente"
     - No se ha adjuntado la factura del proveedor
   - Muestra checklist visual de requisitos cumplidos/pendientes

2. **Alertas de Pagos:**
   - **5 días antes de "Fecha para pago":** Notificación al Administrativo
   - **Día de "Fecha para pago":** Alerta en dashboard y canal #pagos-programados
   - **3 días después de vencimiento:** Alerta de pago vencido + impacto en relación con proveedor

3. **Gestión de Múltiples Entregables:**
   - Un gasto puede tener N entregables asociados
   - Cada entregable tiene su propio ciclo de seguimiento
   - Útil para contratos complejos (ej: agencia de diseño entrega brief, mockups, y archivos finales)

4. **Historial por Proveedor:**
   - Desde la ficha del proveedor, ver:
     - Total facturado históricamente
     - Promedio de días de pago
     - % de entregas puntuales
     - Gastos pendientes de pago
   - Ayuda a evaluar desempeño y confiabilidad

---

#### 3.6.5 Reportes y Exportación

**Propósito:** Convertir datos transaccionales en insights estratégicos mediante reportes multidimensionales y exportables.

**Centro de Reportes:**

```

┌─────────────────────────────────────────────────────────────────┐
│ 📊 CENTRO DE REPORTES - Ventas y Gastos │
├─────────────────────────────────────────────────────────────────┤
│ │
│ 🎯 REPORTES PREDEFINIDOS │
│ ┌───────────────────────────────────────────────────────────┐ │
│ │ │ │
│ │ 💰 Ventas y Cobranza │ │
│ │ ├ 📈 Ventas por Proyecto │ │
│ │ ├ 👥 Ventas por Cliente │ │
│ │ ├ 📅 Ventas por Periodo (mensual/trimestral/anual) │ │
│ │ ├ 🏷️ Ventas por Línea de Negocio │ │
│ │ ├ 🎯 Ventas por Marca/Producto │ │
│ │ ├ ⏰ Cuentas por Cobrar (aging report) │ │
│ │ ├ ⚠️ Clientes Impuntuales (retrasos >7 días) │ │
│ │ └ 💼 Comisiones por PM/Periodo │ │
│ │ │ │
│ │ 🧾 Gastos y Pagos │ │
│ │ ├ 📊 Gastos por Proyecto │ │
│ │ ├ 🏢 Gastos por Proveedor │ │
│ │ ├ 📂 Gastos por Categoría │ │
│ │ ├ 👥 Gastos por Cliente (indirecto vía proyecto) │ │
│ │ ├ 📅 Gastos por Periodo │ │
│ │ ├ ⏰ Cuentas por Pagar (aging report) │ │
│ │ ├ ⚠️ Pagos Vencidos │ │
│ │ └ 📋 Documentos Faltantes por Proveedor │ │
│ │ │ │
│ │ 📈 Rentabilidad y Márgenes │ │
│ │ ├ 💹 Utilidad Neta por Proyecto │ │
│ │ ├ 📊 Margen por Línea de Negocio │ │
│ │ ├ 👤 Rentabilidad por PM │ │
│ │ ├ 🏆 Top 10 Proyectos Más Rentables │ │
│ │ ├ ⚠️ Top 10 Proyectos Menos Rentables │ │
│ │ └ 📉 Análisis de Desviación Presupuesto vs Real │ │
│ │ │ │
│ │ 🔍 Auditoría y Cumplimiento │ │
│ │ ├ ✅ Facturas Emitidas vs Cobradas │ │
│ │ ├ 📋 Órdenes de Compra Recibidas vs Sin OC │ │
│ │ ├ ⏱️ Tiempo Promedio de Cobro por Cliente │ │
│ │ ├ ⏱️ Tiempo Promedio de Pago por Proveedor │ │
│ │ └ 📊 Cumplimiento Contractual (entregas puntuales) │ │
│ │ │ │
│ └───────────────────────────────────────────────────────────┘ │
│ │
│ 🔧 FILTROS AVANZADOS (Aplican a todos los reportes) │
│ ┌───────────────────────────────────────────────────────────┐ │
│ │ Periodo: [Desde: __/__/____] [Hasta: __/__/____] │ │
│ │ Línea de negocio: [Todas ▼] │ │
│ │ Proyecto: [Todos ▼] │ │
│ │ Cliente: [Todos ▼] │ │
│ │ Proveedor: [Todos ▼] │ │
│ │ Marca: [Todas ▼] │ │
│ │ Producto: [Todos ▼] │ │
│ │ PM Responsable: [Todos ▼] │ │
│ │ Estado de pago: [Todos ▼] (Pagado/Pendiente/Parcial) │ │
│ │ Cumplimiento: [Todos ▼] (Puntual/Impuntual) │ │
│ │ │ │
│ │ [Limpiar Filtros] [Aplicar Filtros] │ │
│ └───────────────────────────────────────────────────────────┘ │
│ │
│ 💾 EXPORTACIÓN │
│ ┌───────────────────────────────────────────────────────────┐ │
│ │ Formato: ○ Excel (.xlsx) ○ PDF ○ CSV ○ JSON │ │
│ │ Incluir: ☑ Gráficos ☑ Tablas detalladas ☑ Resumen │ │
│ │ │ │
│ │ [📥 Exportar Reporte Seleccionado] │ │
│ └───────────────────────────────────────────────────────────┘ │
│ │
└─────────────────────────────────────────────────────────────────┘

```

**Ejemplos de Reportes Clave:**

**1. Reporte: Ventas por Cliente (Mensual)**
```

┌─────────────────────────────────────────────────────────────────┐
│ 📊 VENTAS POR CLIENTE - Enero 2026 │
├─────────────────────────────────────────────────────────────────┤
│ Cliente │ # Proyectos │ Total Facturado │ Total Cobrado│
│──────────────────┼─────────────┼─────────────────┼──────### 3.5 Módulo: Comunicación Interna (Tipo Discord)

#### 3.5.1 Arquitectura de Canales

**Propósito:** Centralizar todas las conversaciones relacionadas con proyectos, proveedores y gestión general, eliminando la fragmentación entre WhatsApp, email y otras herramientas.

**Jerarquía de Comunicación:**

```
🏢 Workspace: Tu Agencia
│
├── 📂 PROYECTOS (Categoría)
│   ├── #campaña-navidad-2026
│   ├── #revista-edicion-mayo
│   ├── #branding-acme-corp
│   └── #web-app-techinc
│
├── 💼 CLIENTES (Categoría)
│   ├── #cliente-acme-corp
│   ├── #cliente-techinc
│   └── #cliente-retail-express
│
├── 🤝 PROVEEDORES (Categoría)
│   ├── #imprenta-los-andes
│   ├── #diseñador-freelance-juan
│   └── #logistica-express
│
├── 🏛️ GENERAL (Categoría)
│   ├── #anuncios (solo-admins pueden escribir)
│   ├── #general
│   ├── #ideas-y-sugerencias
│   └── #random
│
├── 💰 FINANZAS (Categoría - Solo Admin/Contable)
│   ├── #facturas-pendientes
│   ├── #pagos-programados
│   └── #revisión-presupuestos
│
└── 🔒 MENSAJES DIRECTOS (DMs)
    ├── 👤 Juan Pérez (PM)
    ├── 👤 María González (PM)
    └── 👤 Ana López (Admin)
```

---

#### 3.5.2 Tipos de Canales y Creación

**1. Canales de Proyecto (Auto-generados)**

**Creación Automática:**

- Al crear un nuevo proyecto en cualquier vista, el sistema automáticamente:
  1. Crea un canal `#nombre-del-proyecto` (sanitizado, sin espacios ni caracteres especiales)
  2. Agrega al PM responsable como miembro
  3. Publica mensaje inicial automático:

  ```
  🎉 Canal creado para el proyecto: Campaña Navidad 2026

  📋 Detalles:
  • Cliente: ACME Corp
  • PM: @Juan Pérez
  • Fecha de entrega: 15/02/2026
  • Presupuesto: $2,500 USD

  🔗 [Ver Proyecto en Kanban] [Ver Finanzas]

  💡 Usa este canal para coordinar todo lo relacionado con este proyecto.
  ```

**Miembros Automáticos:**

- PM responsable (siempre)
- Admin (siempre)
- Administrativo/Contable (si hay gastos registrados)
- Proveedores asignados al proyecto (opcional, con permisos limitados)

**Ciclo de Vida del Canal:**

- **Activo:** Mientras el proyecto esté en Brief → Producción
- **Archivado:** Automáticamente cuando proyecto pasa a "Facturado"
- **Opción de reabrir:** Admin puede desarchivarlo si se reactiva proyecto

---

**2. Canales de Cliente**

**Creación Manual (por Admin/PM):**

- Botón en la barra lateral: `+ Crear Canal de Cliente`
- Formulario:

  ```
  Nombre del Cliente: __________
  Descripción: ________________
  Miembros iniciales: [Multiselect de usuarios]

  [Cancelar] [Crear Canal]
  ```

**Uso:**

- Conversaciones generales sobre el cliente (independientes de proyectos específicos)
- Historial de interacciones
- Notas de llamadas o reuniones
- Oportunidades futuras

**Vinculación con Proyectos:**

- Los canales de proyecto pueden "linkearse" al canal del cliente
- Widget lateral en canal de cliente muestra todos los proyectos activos

---

**3. Canales de Proveedor**

**Creación Automática:**

- Al aprobar un nuevo proveedor en el sistema, se crea:
  - Canal `#proveedor-nombre-proveedor`
  - El proveedor es agregado automáticamente (si tiene cuenta)

**Permisos del Proveedor:**

- ✅ Puede leer mensajes
- ✅ Puede escribir mensajes
- ✅ Puede subir archivos (facturas, comprobantes, entregables)
- ❌ No puede ver canales de otros proyectos donde no participa
- ❌ No puede ver canales de categoría FINANZAS

**Uso:**

- Coordinación de entregas
- Solicitud de cotizaciones
- Resolución de dudas técnicas
- Compartir especificaciones

---

**4. Canales Generales**

**Predefinidos en el Setup Inicial:**

**#anuncios** (Read-Only para staff)

- Solo Admin puede publicar
- Notificaciones importantes de la empresa
- Cambios de políticas
- Días festivos y cierres

**#general**

- Conversación libre del equipo
- Coordinación diaria
- Preguntas rápidas

**#ideas-y-sugerencias**

- Propuestas de mejora
- Feedback sobre procesos
- Innovaciones

**#random**

- Off-topic, memes, celebraciones
- Team building

---

**5. Canales de Finanzas (Privados)**

**Acceso Restringido:**

- Solo: Admin + Rol Administrativo/Contable
- No visibles para PMs ni Proveedores

**#facturas-pendientes**

- Notificaciones automáticas de facturas sin aprobar >3 días
- Discusión sobre facturas complejas
- Coordinación de aprobaciones

**#pagos-programados**

- Recordatorios de pagos próximos
- Confirmaciones de pagos realizados

**#revisión-presupuestos**

- Análisis de desviaciones
- Discusión de márgenes por proyecto

---

#### 3.5.3 Interfaz de Usuario

**Layout Principal (Tipo Discord):**

```
┌─────────────────────────────────────────────────────────────────────────┐
│ ☰ Tu Agencia          [@Usuario ▼]  [🔍]  [🔔3]  [⚙️]                   │
├────────────┬────────────────────────────────────────────────────────────┤
│            │  #campaña-navidad-2026                    👤3  📌2  [⋮]    │
│ 🔍 Buscar  ├────────────────────────────────────────────────────────────┤
│            │                                                            │
│ 📂 PROYECT │  Juan Pérez [PM]                          Hoy a las 10:15 │
│ ├ #campaña │  Hey equipo, la imprenta confirmó entrega para el 14/02.  │
│ ├ #revista │  📎 cotizacion_final.pdf                                  │
│ ├ #brandin │  [⭐ 2]  [💬 3 respuestas]                                │
│ └ + Nuevo  │                                                            │
│            │  María González                          Hoy a las 10:20  │
│ 💼 CLIENTE │  Perfecto! Ya actualicé la fecha en el proyecto.           │
│ ├ #cliente │  [Ver en Timeline →]                                       │
│ └ + Nuevo  │                                                            │
│            │  Sistema 🤖                              Hoy a las 10:21  │
│ 🤝 PROVEEDO│  ✅ @María cambió fecha de entrega a 14/02/2026           │
│ ├ #imprenta│  [Ver Proyecto]                                           │
│ └ + Nuevo  │                                                            │
│            │  Ana López [Admin]                       Hoy a las 11:00  │
│ 🏛️ GENERAL │  @Juan, podemos programar una call para revisar el brief? │
│ ├ #anuncio │  [📅 Agendar Reunión]                                     │
│ ├ #general │                                                            │
│ ├ #ideas   │  ┌──────────────────────────────────────┐                 │
│ └ #random  │  │ ✍️ Escribe un mensaje...              │                 │
│            │  │ [📎] [😊] [/]                    [➤] │                 │
│ 💰 FINANZA │  └──────────────────────────────────────┘                 │
│ ├ #factura │                                                            │
│ └ #pagos   │                                                            │
│            │                                                            │
│ 🔒 MENSAGE │                                                            │
│ ├ 👤 Juan  │                                                            │
│ ├ 👤 María │                                                            │
│ └ 👤 Ana   │                                                            │
│            │                                                            │
│ [+ Crear   │                                                            │
│  Canal]    │                                                            │
└────────────┴────────────────────────────────────────────────────────────┘
```

---

#### 3.5.4 Funcionalidades de Mensajería

**1. Composición de Mensajes**

**Editor de Texto Enriquecido:**

````
┌────────────────────────────────────────────────────┐
│ ✍️ Escribe un mensaje...                           │
│                                                    │
│ Soporta:                                           │
│ • **Negrita** _cursiva_ ~~tachado~~                │
│ • Menciones: @usuario @canal                       │
│ • Emojis: :smile: :fire: :check:                   │
│ • Código: `código inline` o ```bloque```          │
│ • Listas numeradas/viñetas                         │
│ • Links automáticos                                │
│                                                    │
│ [📎 Adjuntar] [😊 Emoji] [/ Comandos]       [➤]   │
└────────────────────────────────────────────────────┘
````

**Adjuntos Permitidos:**

- Imágenes: JPG, PNG, GIF (preview inline)
- Documentos: PDF, DOCX, XLSX, PPT
- Archivos comprimidos: ZIP, RAR
- Tamaño máximo: 25MB por archivo
- Drag & drop para subir

**Comandos Rápidos (Slash Commands):**

```
/proyecto [nombre]    → Crear link a proyecto
/factura [número]     → Link a factura específica
/recordatorio [texto] → Crear recordatorio en el canal
/encuesta [pregunta]  → Crear encuesta rápida
/reunion [fecha]      → Programar reunión (integra con calendario)
```

---

**2. Interacciones con Mensajes**

**Reacciones (Emojis):**

- Click en mensaje → aparece panel de emojis
- Emojis populares: ✅ ❌ 👍 👎 🎉 🔥 💯 👀 ⚡
- Contador de reacciones por tipo
- Hover muestra quién reaccionó

**Respuestas en Hilo (Threads):**

```
Juan Pérez                               10:15
La imprenta confirmó entrega para el 14/02.
📎 cotizacion_final.pdf
─────────────────────────────────────────
  💬 3 respuestas  •  Ver hilo →

  [Click abre panel lateral con el hilo]

  ┌─────────────────────────────────────┐
  │ 🧵 Hilo de Juan Pérez              │
  │                                     │
  │ [Mensaje original completo]         │
  │ ─────────────────────────────────   │
  │                                     │
  │ María                        10:20  │
  │ Perfecto, gracias!                  │
  │                                     │
  │ Ana                          10:25  │
  │ ¿Confirmamos pago contra entrega?   │
  │                                     │
  │ Juan                         10:30  │
  │ Sí, ya está coordinado.             │
  │                                     │
  │ ┌─────────────────────────────────┐ │
  │ │ Responder en el hilo...         │ │
  │ └─────────────────────────────────┘ │
  └─────────────────────────────────────┘
```

**Menú Contextual (Click derecho o ⋮):**

- 📌 Anclar mensaje (max 5 por canal)
- ✏️ Editar (solo autor, marca como "editado")
- 🗑️ Eliminar (solo autor + admins)
- 🔗 Copiar enlace del mensaje
- 📋 Citar en respuesta
- ⭐ Guardar en favoritos
- 🚩 Reportar (si es inapropiado)

---

**3. Mensajes del Sistema (Automatizados)**

**Tipos de Notificaciones Automáticas:**

**En Canales de Proyecto:**

```
🤖 Sistema                               Hoy 14:32
✅ @María cambió el estado a "Aprobación Cliente"
[Ver Proyecto en Kanban]
```

```
🤖 Sistema                               Hoy 16:45
💰 Nuevo gasto registrado: $450 USD - Imprenta Los Andes
[Ver Factura] [Aprobar Gasto]
```

```
🤖 Sistema                               Ayer 09:00
⚠️ Este proyecto lleva 15 días en "Diseño".
Considera actualizar el estado o contactar al equipo.
```

**En Canales de Proveedor:**

```
🤖 Sistema                               Hoy 11:20
📄 @Imprenta_Los_Andes cargó una nueva factura (#12345)
Proyecto: Campaña Navidad 2026
Monto: $2,500 USD
[Ver Factura] [Aprobar]
```

**En #facturas-pendientes:**

```
🤖 Sistema                               Hoy 09:00
📊 Resumen del día:
• 5 facturas pendientes de aprobación
• 3 facturas vencen en <7 días
• 2 proveedores con documentos por vencer

[Ver Dashboard de Facturas]
```

---

#### 3.5.5 Búsqueda y Navegación

**Búsqueda Global (Ctrl/Cmd + K):**

```
┌────────────────────────────────────────────────────┐
│ 🔍 Buscar en todos los canales...                  │
├────────────────────────────────────────────────────┤
│                                                    │
│ 📝 MENSAJES                                        │
│ ├ "cotización final" en #campaña-navidad (3)      │
│ ├ "fecha de entrega" en #revista-mayo (7)         │
│ └ "presupuesto" en #branding-acme (2)             │
│                                                    │
│ 📎 ARCHIVOS                                        │
│ ├ cotizacion_final.pdf (#campaña-navidad)         │
│ └ brief_v2.docx (#branding-acme)                  │
│                                                    │
│ 👤 PERSONAS                                        │
│ ├ Juan Pérez (PM)                                 │
│ └ María González (PM)                             │
│                                                    │
│ 📂 CANALES                                         │
│ └ #campaña-navidad-2026                           │
│                                                    │
└────────────────────────────────────────────────────┘
```

**Filtros de Búsqueda Avanzada:**

```
Filtros disponibles:
• de:@usuario          → Mensajes de usuario específico
• en:#canal           → Solo en un canal
• tiene:archivo       → Solo mensajes con adjuntos
• antes:2026-01-15    → Mensajes antes de una fecha
• después:2026-01-01  → Mensajes después de una fecha
• con:palabra         → Búsqueda exacta de palabra
```

**Navegación Rápida:**

- `Ctrl/Cmd + K`: Búsqueda global
- `Ctrl/Cmd + Shift + A`: Ver todos los mensajes no leídos
- `Alt + ↑/↓`: Navegar entre canales
- `Ctrl/Cmd + Shift + M`: Abrir lista de menciones
- `Esc`: Cerrar modal/panel actual

---

#### 3.5.6 Notificaciones y Menciones

**Sistema de Notificaciones Inteligente:**

**Niveles de Notificación por Canal:**

1. **Todas las notificaciones** (🔔)
   - Recibes notificación de cada mensaje nuevo
   - Usar solo para canales críticos

2. **Solo menciones** (🔕@) - **Default recomendado**
   - Solo te notifica si alguien te menciona (@tu-nombre) o menciona @todos
   - Útil para canales con mucho tráfico

3. **Silenciado** (🔇)
   - No recibes notificaciones, pero aparece badge de "no leído"
   - Útil para canales de referencia

**Tipos de Menciones:**

```
@juan                  → Menciona a Juan Pérez (notificación directa)
@todos / @everyone     → Menciona a todos en el canal (usar con moderación)
@pm                    → Menciona a todos los PMs (grupo)
@admin                 → Menciona a administradores (grupo)
#campaña-navidad       → Link a otro canal
```

**Reglas de Notificación Push:**

**En Navegador:**

- Desktop notification cuando:
  - Te mencionan directamente
  - Alguien responde a tu mensaje
  - Mensaje en DM
  - Mensaje en canal con "Todas las notificaciones"

**En Email (Configurable):**

- **Resumen diario:** Email a las 9 AM con actividad de ayer
- **Inmediato:** Para menciones directas (si no respondiste en 30 min)
- **Nunca:** Usuario puede desactivar emails completamente

**Badge de No Leídos:**

```
Sidebar:
📂 PROYECTOS
├ #campaña-navidad [3]      ← 3 mensajes nuevos
├ #revista-mayo             ← Al día
└ #branding-acme [12]       ← 12 mensajes nuevos

Prioridad visual:
[12] Blanco sobre rojo  → Mensaje con mención directa
[3]  Blanco sobre gris  → Mensajes nuevos sin menciones
```

---

#### 3.5.7 Integración con Módulos del Sistema

**1. Integración con Proyectos:**

**Desde Vista de Proyecto (Kanban/Tabla/etc):**

- Botón [💬 Abrir Chat] en header del proyecto
- Abre canal del proyecto en split-screen o panel lateral
- Permite chatear sin salir de la vista de trabajo

**Desde Canal de Proyecto:**

- Widget lateral mostrando:

  ```
  📊 PROYECTO: Campaña Navidad 2026
  ─────────────────────────────
  Estado: 🟡 Aprobación Cliente
  PM: @Juan Pérez
  Entrega: 15/02/2026 (25 días)
  Presupuesto: $2,500 USD
  Margen: +35% ✅

  [Ver en Kanban] [Ver Finanzas]
  ```

**Acciones Rápidas desde Chat:**

- `/cambiar-estado [nuevo-estado]` → Cambia estado del proyecto sin salir del chat
- `/agregar-gasto [monto]` → Registrar gasto rápido
- `/subir-entregable` → Abrir modal para subir archivo final

---

**2. Integración con Proveedores:**

**Notificaciones Bidireccionales:**

- Proveedor carga factura → Mensaje automático en su canal
- Admin aprueba factura → Notificación al proveedor en el chat
- Documento próximo a vencer → Recordatorio en el canal

**Desde Dashboard de Proveedor:**

- Botón [💬 Contactar] abre chat directo con el proveedor
- Historial completo de comunicación visible

---

**3. Integración con Finanzas:**

**Canales de Finanzas Automatizados:**

En **#facturas-pendientes**:

```
🤖 Sistema                               Lunes 9:00 AM
📊 Resumen Semanal de Facturas

⏳ PENDIENTES DE APROBACIÓN (5):
├ Imprenta Los Andes - $2,500 USD - 3 días esperando
├ Diseñador Juan - $800 USD - 1 día esperando
└ [Ver todas]

⚠️ PRÓXIMAS A VENCER (3):
├ Logística Express - Vence en 5 días
└ [Ver todas]

📅 PAGOS ESTA SEMANA (2):
├ Miércoles: $1,200 USD - Freelancer María
└ Viernes: $3,500 USD - Imprenta Los Andes

[Ir a Dashboard de Finanzas]
```

**Comandos de Finanzas:**

- `/aprobar-factura [número]` → Aprobación rápida desde chat
- `/programar-pago [proveedor] [fecha]` → Programar pago
- `/ver-flujo-caja` → Abre dashboard de flujo de caja

---

#### 3.5.8 Permisos y Seguridad

**Matriz de Permisos por Canal:**

| Acción                      | Admin | PM                      | Contable | Proveedor             |
| --------------------------- | ----- | ----------------------- | -------- | --------------------- |
| **Canales de Proyecto**     |
| Ver mensajes                | ✅    | ✅ (solo sus proyectos) | ✅       | ✅ (solo si asignado) |
| Escribir mensajes           | ✅    | ✅                      | ✅       | ✅                    |
| Subir archivos              | ✅    | ✅                      | ✅       | ✅                    |
| Crear canales               | ✅    | ❌                      | ❌       | ❌                    |
| Archivar canales            | ✅    | ❌                      | ❌       | ❌                    |
| Editar mensajes ajenos      | ✅    | ❌                      | ❌       | ❌                    |
| Eliminar mensajes ajenos    | ✅    | ❌                      | ❌       | ❌                    |
| **Canales de Cliente**      |
| Ver mensajes                | ✅    | ✅                      | ✅       | ❌                    |
| Escribir mensajes           | ✅    | ✅                      | ✅       | ❌                    |
| **Canales de Proveedor**    |
| Ver mensajes                | ✅    | ✅                      | ✅       | ✅ (solo su canal)    |
| Escribir mensajes           | ✅    | ✅                      | ✅       | ✅ (solo su canal)    |
| **Canales Generales**       |
| Ver mensajes                | ✅    | ✅                      | ✅       | ❌                    |
| Escribir en #anuncios       | ✅    | ❌                      | ❌       | ❌                    |
| Escribir en otros           | ✅    | ✅                      | ✅       | ❌                    |
| **Canales de Finanzas**     |
| Ver mensajes                | ✅    | ❌                      | ✅       | ❌                    |
| Escribir mensajes           | ✅    | ❌                      | ✅       | ❌                    |
| **Mensajes Directos (DMs)** |
| Iniciar DM con equipo       | ✅    | ✅                      | ✅       | ❌                    |
| Iniciar DM con proveedores  | ✅    | ✅                      | ✅       | N/A                   |

**Auditoría y Retención:**

- Todos los mensajes se guardan indefinidamente
- Log de ediciones y eliminaciones con timestamp
- Exportación de historial completo de canal (solo Admin)
- Cumplimiento RGPD: Usuario puede solicitar exportación de sus datos

---

#### 3.5.9 Funcionalidades Avanzadas

**1. Recordatorios y Tareas**

**Desde un Mensaje:**

- Click derecho → "Crear recordatorio"
- Modal:

  ```
  ⏰ Recordar este mensaje

  ¿Cuándo?
  ○ En 1 hora
  ○ Mañana a las 9 AM
  ○ En 3 días
  ● Personalizado: [Date/Time picker]

  Mensaje: "Revisar cotización de imprenta"

  [Cancelar] [Crear Recordatorio]
  ```

- El sistema envía DM cuando llega la hora

**Crear Tarea desde Chat:**

```
/tarea Revisar brief del cliente @juan #campaña-navidad
```

- Crea tarea vinculada al proyecto
- Aparece en checklist del proyecto
- Notifica al asignado

---

**2. Llamadas y Videollamadas (Fase 2 - Post MVP)**

**Integración con herramientas:**

- Botón [📞 Iniciar llamada] en header del canal
- Opciones:
  - Audio call (todos los miembros del canal)
  - Video call
  - Compartir pantalla

**Alternativa MVP:**

- Botón que genera link de Google Meet / Zoom
- Publica link automático en el canal

---

**3. Bots y Automatizaciones**

**Bot del Sistema (Built-in):**

- Nombre: "Sistema 🤖"
- Funciones:
  - Notificaciones de cambios en proyectos
  - Resúmenes diarios/semanales
  - Alertas de vencimientos
  - Recordatorios de tareas pendientes

**Comandos del Bot:**

```
/ayuda                    → Lista de comandos disponibles
/resumen-proyecto [nombre] → Resumen del estado del proyecto
/proximos-pagos           → Lista de pagos próximos 7 días
/facturas-pendientes      → Facturas sin aprobar
```

**Webhooks Salientes (Fase 2):**

- Integración con Slack (si el equipo prefiere seguir usando Slack)
- Integración con WhatsApp Business API
- Integración con Telegram

---

**4. Archivos y Media**

**Galería de Archivos por Canal:**

- Tab [📎 Archivos] en header del canal
- Vista de todos los archivos compartidos:

  ```
  Filtros: [Todos] [Imágenes] [Documentos] [PDFs]
  Ordenar: [Más reciente] [Más antiguo] [Mayor tamaño]

  ┌──────────────────────────────────────────┐
  │ 📄 cotizacion_final.pdf                  │
  │ Subido por Juan • 15/01/26 • 2.3 MB     │
  │ [Descargar] [Ver en contexto]            │
  ├──────────────────────────────────────────┤
  │ 🖼️ mockup_campaña_v3.png                │
  │ Subido por María • 14/01/26 • 5.1 MB    │
  │ [Descargar] [Ver en contexto]            │
  └──────────────────────────────────────────┘
  ```

**Preview Inline de Archivos:**

- **Imágenes:** Thumbnail clickeable para ver en tamaño completo
- **PDFs:** Primer página como preview, click abre visor completo
- **Videos:** Player inline (mp4, webm)
- **Links:** Preview card con título, descripción e imagen

---

#### 3.5.10 Modelo de Datos

**Tabla: canales**

```sql
id                UUID PRIMARY KEY
tipo              ENUM('Proyecto', 'Cliente', 'Proveedor', 'General', 'Finanzas', 'DM') NOT NULL
nombre            VARCHAR(100) NOT NULL
descripcion       TEXT
icono_emoji       VARCHAR(10) (ej: '📦')
categoria         VARCHAR(50) (PROYECTOS, CLIENTES, etc)
es_privado        BOOLEAN DEFAULT FALSE

-- Relaciones opcionales
proyecto_id       UUID FK → proyectos (NULL si no es canal de proyecto)
cliente_id        UUID (NULL si no es canal de cliente)
proveedor_id      UUID FK → proveedores (NULL si no es canal de proveedor)

-- Configuración
permitir_proveedores BOOLEAN DEFAULT FALSE
notificacion_default ENUM('Todas', 'Menciones', 'Silenciado') DEFAULT 'Menciones'
archivado         BOOLEAN DEFAULT FALSE
fecha_archivado   TIMESTAMP

-- Metadata
creado_por        UUID FK → usuarios
created_at        TIMESTAMP
updated_at        TIMESTAMP

UNIQUE(tipo, proyecto_id) WHERE proyecto_id IS NOT NULL
UNIQUE(tipo, proveedor_id) WHERE proveedor_id IS NOT NULL
```

**Tabla: mensajes**

```sql
id                UUID PRIMARY KEY
canal_id          UUID FK → canales NOT NULL
autor_id          UUID FK → usuarios/proveedores NOT NULL
tipo_autor        ENUM('Usuario', 'Proveedor', 'Sistema') NOT NULL
contenido         TEXT NOT NULL
contenido_html    TEXT (renderizado con markdown/menciones)

-- Threading
mensaje_padre_id  UUID FK → mensajes (NULL si no es respuesta)
num_respuestas    INT DEFAULT 0

-- Metadata
editado           BOOLEAN DEFAULT FALSE
fecha_edicion     TIMESTAMP
eliminado         BOOLEAN DEFAULT FALSE
fecha_eliminacion TIMESTAMP
anclado           BOOLEAN DEFAULT FALSE

-- Adjuntos
tiene_archivos    BOOLEAN DEFAULT FALSE

created_at        TIMESTAMP
updated_at        TIMESTAMP

INDEX idx_canal_fecha ON mensajes(canal_id, created_at DESC)
INDEX idx_autor ON mensajes(autor_id)
INDEX idx_padre ON mensajes(mensaje_padre_id) WHERE mensaje_padre_i# PRD: Sistema de Gestión Integrada - Agencia & Editorial
**Versión:** 1.0 MVP
**Fecha:** Enero 2026
**Propietario del Producto:** [Tu nombre]

---

## 1. Resumen Ejecutivo

### 1.1 Problema a Resolver
Las agencias creativas y editoriales enfrentan un desafío crítico: **desconexión entre la operación de proyectos y la realidad financiera**. Esto genera:
- Proyectos "completados" sin facturar durante semanas
- Gastos de proveedores registrados manualmente con error del 15-20%
- Cero visibilidad de rentabilidad real hasta cierre mensual
- Flujo de caja impredecible que impide decisiones estratégicas

### 1.2 Solución Propuesta
Plataforma centralizada que **unifica gestión de proyectos con inteligencia financiera automatizada**, eliminando el caos administrativo mediante:
- **Automatización OCR** de facturas vía email (reducción del 90% en entrada manual)
- **Trigger automático** de facturación al completar proyectos
- **Dashboard en tiempo real** de flujo de caja y rentabilidad por proyecto
- **Multi-moneda con TRM actualizada** para visión consolidada

### 1.3 Métricas de Éxito (3 meses post-lanzamiento)
- ⏱️ Reducción del 80% en tiempo de registro de gastos
- 💰 100% de proyectos completados facturados en <48h
- 📊 Visibilidad de flujo de caja proyectado a 30 días con precisión >85%
- ✅ Tasa de adopción del 100% entre los 3 roles definidos

---

## 2. Definición de Usuarios y Casos de Uso

### 2.1 Roles y Permisos

| Rol | Accesos | Responsabilidades Críticas |
|-----|---------|---------------------------|
| **Administrador** | Total | • Configuración de presupuestos por proyecto<br>• Aprobación de gastos >USD 500<br>• Análisis de rentabilidad y flujo de caja<br>• Validación final de nuevos proveedores |
| **Project Manager** | Proyectos + Entregables | • Gestión de estados del pipeline<br>• Carga de archivos finales<br>• Invitación de proveedores y asignación a proyectos |
| **Administrativo** | Finanzas + Validación | • Validación de facturas cargadas por proveedores<br>• Aprobación de documentos legales de proveedores<br>• Gestión de cuentas por pagar/cobrar<br>• Emisión de facturas a clientes |
| **Proveedor** | Portal Autogestión | • Registro y mantenimiento de datos fiscales<br>• Carga de documentos legales (RUT, Cámara Comercio, etc.)<br>• Carga de facturas por servicios prestados<br>• Consulta de estado de pagos |

### 2.2 Historias de Usuario Principales

**Como Administrador:**
> "Necesito ver cada lunes a las 9am un dashboard que me muestre: proyectos completados sin facturar, flujo de caja proyectado a 30 días, y los 3 proyectos menos rentables del mes."

**Como Project Manager:**
> "Cuando marco un proyecto como 'Completado', quiero que automáticamente se notifique a administrativa y que el proyecto aparezca en su cola de facturación, sin que yo tenga que enviar un correo aparte."

**Como Administrativo:**
> "Cuando llegue una factura de la imprenta a mi correo, quiero que el sistema la lea automáticamente y solo me pida confirmar a qué proyecto pertenece, en lugar de tener que tipear todo manualmente en Excel."

**Como Proveedor:**
> "Cuando termine un trabajo, necesito poder entrar a mi portal, subir mi factura y los documentos de entrega, y ver en qué fecha me van a pagar, sin tener que llamar cada semana para preguntar."

---

## 3. Requerimientos Funcionales (MVP)

### 3.1 Módulo: Gestión de Proyectos

#### 3.1.1 Vistas Múltiples de Proyectos (Inspirado en ClickUp)

**Concepto:** El usuario puede alternar entre 4 vistas diferentes del mismo conjunto de proyectos, manteniendo filtros y configuraciones. Cada vista está optimizada para diferentes necesidades de gestión.

**Selector de Vista (Toggle en la parte superior):**
```

[📋 Tabla] [📊 Kanban] [📅 Calendario] [📈 Gantt]

````

---

#### **Vista 1: Tabla (List View)**

**Propósito:** Análisis detallado y edición rápida de múltiples proyectos.

**Columnas Configurables (usuario puede mostrar/ocultar):**

| Campo | Tipo | Editable | Descripción |
|-------|------|----------|-------------|
| ☑️ Checkbox | - | ✅ | Selección múltiple para acciones en lote |
| 🔴 Estado | Badge | ✅ | Click para cambiar rápidamente |
| Nombre Proyecto | Texto | ✅ | Inline editing (doble click) |
| Cliente | Texto | ✅ | Autocompletado |
| Tipo Servicio | Tag | ✅ | Dropdown: Revista/Branding/Digital/Otro |
| Presupuesto | Dinero | ❌ | Formato: $2,500 USD (click abre modal) |
| Margen Real | % | ❌ | Calculado, color según performance |
| PM Responsable | Avatar | ✅ | Dropdown de usuarios |
| Fecha Inicio | Fecha | ✅ | Date picker |
| Fecha Entrega | Fecha | ✅ | Date picker, resalta si <7 días |
| Días en Estado | Número | ❌ | Calculado, alerta si >30 |
| Gastos Reales | Dinero | ❌ | Click muestra desglose |
| Archivos | Contador | ❌ | ej: "3 archivos" (click abre modal) |
| ... | Custom | ✅ | Campos personalizados (Fase 2 post-MVP) |

**Funcionalidades de Tabla:**

1. **Ordenamiento:**
   - Click en header de columna para ordenar ASC/DESC
   - Multi-ordenamiento: Shift+Click para orden secundario
   - Ejemplo: Ordenar por Estado, luego por Fecha de Entrega

2. **Filtros Avanzados:**
   - Panel lateral de filtros:
     ```
     🔍 Buscar por nombre...

     Estado: [Todos ▼]
       ☐ Brief
       ☐ Diseño
       ☑ En Producción
       ☐ Completado

     Cliente: [Todos ▼]

     Tipo Servicio: [Todos ▼]

     PM Responsable: [Todos ▼]

     Rango de Fechas:
       Desde: [__/__/____]
       Hasta: [__/__/____]

     Margen:
       ○ Todos
       ○ Solo rentables (>0%)
       ○ Solo en pérdida (<0%)

     [Limpiar Filtros] [Aplicar]
     ```

3. **Acciones en Lote (con checkboxes):**
   - Cambiar estado de múltiples proyectos
   - Asignar PM
   - Exportar selección a Excel/CSV
   - Eliminar (con confirmación)

4. **Edición Inline:**
   - Doble click en celda editable abre editor
   - Enter guarda, Esc cancela
   - Auto-save con indicador visual

5. **Agrupamiento (Opcional para Fase 2):**
   - Agrupar por: Estado, Cliente, PM, Tipo de Servicio
   - Vista colapsable por grupos

**Acciones por Fila:**
- Hover en fila muestra menú de acciones:
  - [👁️ Ver] [✏️ Editar] [📄 Duplicar] [🗑️ Eliminar]

---

#### **Vista 2: Kanban (Board View)**

**Propósito:** Gestión visual del flujo de trabajo y estado de proyectos.

**Estructura:**

````

┌────────────────┬────────────────┬────────────────┬────────────────┬────────────────┐
│ 📝 Brief │ 🎨 Diseño │ ✅ Aprobación │ 🖨️ Producción │ ✔️ Completado │
│ (3) │ (5) │ (2) │ (4) │ (8) │
├────────────────┼────────────────┼────────────────┼────────────────┼────────────────┤
│ ┌────────────┐ │ ┌────────────┐ │ ┌────────────┐ │ ┌────────────┐ │ ┌────────────┐ │
│ │ Campaña │ │ │ Revista │ │ │ Branding │ │ │ Catálogo │ │ │ Web App │ │
│ │ Navidad │ │ │ Ed. Mayo │ │ │ Acme Corp │ │ │ Productos │ │ │ Tech Inc │ │
│ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │
│ │ 👤 Juan │ │ │ 👤 María │ │ │ 👤 Pedro │ │ │ 👤 Ana │ │ │ 👤 Luis │ │
│ │ 📅 15/02 │ │ │ 📅 20/02 │ │ │ 📅 18/02 │ │ │ 📅 25/02 │ │ │ 📅 10/01 │ │
│ │ 💰 $2.5K │ │ │ 💰 $4K │ │ │ 💰 $8K │ │ │ 💰 $3K │ │ │ 💰 $12K │ │
│ │ 🏷️ Digital │ │ │ 🏷️ Revista │ │ │ 🏷️ Brand │ │ │ 🏷️ Print │ │ │ 🏷️ Digital │ │
│ └────────────┘ │ └────────────┘ │ └────────────┘ │ └────────────┘ │ └────────────┘ │
│ │ │ │ │ │
│ ┌────────────┐ │ ┌────────────┐ │ │ ┌────────────┐ │ ┌────────────┐ │
│ │ ... │ │ │ ... │ │ │ │ ... │ │ │ ... │ │
│ └────────────┘ │ └────────────┘ │ │ └────────────┘ │ └────────────┘ │
│ │ │ │ │ │
│ + Nuevo │ + Nuevo │ + Nuevo │ + Nuevo │ + Nuevo │
└────────────────┴────────────────┴────────────────┴────────────────┴────────────────┘

```

**Configuración de Columnas:**

- **Estados Predeterminados:**
  1. Brief (🔵 Azul)
  2. Diseño (🟣 Morado)
  3. Aprobación Cliente (🟡 Amarillo)
  4. Producción (🟠 Naranja)
  5. Completado (🟢 Verde)
  6. Facturado (✅ Gris) - Opcional, solo si admin quiere visualizarlo

- **Configuración Personalizable (Solo Admin):**
  - Agregar/eliminar columnas (estados)
  - Renombrar estados
  - Cambiar colores
  - Definir orden de columnas
  - **Límite WIP (Work In Progress):** Alertar si una columna tiene >X proyectos

**Tarjeta de Proyecto (Card):**

Información visible en la tarjeta:
```

┌─────────────────────────────┐
│ 🏷️ [Tag Tipo Servicio] │ <- Color según tipo
│ │
│ Nombre del Proyecto │ <- Título en bold
│ Cliente: ACME Corp │
│ │
│ 👤 Avatar PM 📅 15/02 │ <- PM y fecha entrega
│ 💰 $2,500 USD │ <- Presupuesto
│ 📊 Margen: +35% │ <- Verde si positivo, rojo si negativo
│ │
│ ⏱️ 12 días en estado │ <- Alerta si >30
│ 📎 3 archivos │
└─────────────────────────────┘

```

**Interacciones:**

1. **Drag & Drop:**
   - Arrastrar tarjeta entre columnas cambia el estado
   - Animación visual de transición
   - Si mueve a "Completado": Modal de confirmación + trigger de facturación
   - **Validación:** No permitir saltar estados críticos (ej: de Brief a Completado)

2. **Click en Tarjeta:**
   - Abre panel lateral (slide-in) con detalles completos:
     - Toda la info del proyecto
     - Sección de comentarios/notas
     - Timeline de cambios
     - Archivos adjuntos
     - Gastos asociados
     - Botones de acción: [Editar] [Cambiar Estado] [Ver Finanzas]

3. **Acciones Rápidas (Hover en tarjeta):**
   - [✏️ Editar] [👁️ Ver Detalles] [📄 Duplicar] [🗑️ Archivar]

4. **Agrupamiento Adicional:**
   - Toggle para "Agrupar por PM" o "Agrupar por Cliente"
   - Crea swim lanes horizontales

**Filtros en Vista Kanban:**
- Mismo panel de filtros que Vista Tabla
- Filtros se aplican a todas las vistas simultáneamente

---

#### **Vista 3: Calendario (Calendar View)**

**Propósito:** Visualización temporal y detección de cuellos de botella por fechas.

**Diseño de Calendario:**

```

                    Febrero 2026                           [Hoy] [Mes ◀ ▶]

─────────────────────────────────────────────────────────────────────────────
Lun Mar Mié Jue Vie Sáb Dom
─────────────────────────────────────────────────────────────────────────────
3 4 5 6 7 8 9

10 11 12 13 14 15 16
📦🎨 🎨🎨  
 2 ent 3 ent

17 18 19 20 21 22 23
🎨 🎨📦 📦 🎨  
 1 ent 2 ent 1 ent 1 ent

24 25 26 27 28
📦📦 📦🎨  
 3 ent 2 ent
─────────────────────────────────────────────────────────────────────────────

```

**Funcionalidades:**

1. **Vistas de Granularidad:**
   - **Mes:** Vista completa del mes (default)
   - **Semana:** Vista detallada de 7 días
   - **Día:** Agenda del día con timeline por horas (opcional para Fase 2)

2. **Eventos en el Calendario:**

   **Cada proyecto se representa según:**
   - **Fecha de Inicio:** Marca inicio (opcional, solo si está configurada)
   - **Fecha de Entrega:** Marca principal (la más importante)
   - **Rango de duración:** Barra que va de inicio a entrega (si ambas fechas existen)

   **Iconos/Tags por Tipo de Servicio:**
   - 🎨 Diseño
   - 📦 Producción/Imprenta
   - 📱 Digital
   - 📰 Revista

3. **Código de Colores:**
   - 🟢 Verde: Proyecto en tiempo (entrega en >7 días)
   - 🟡 Amarillo: Entrega en 3-7 días
   - 🔴 Rojo: Entrega en <3 días o vencida
   - ⚫ Gris: Proyecto completado

4. **Interacciones:**

   **Click en día del calendario:**
   - Muestra lista lateral de proyectos con entrega ese día
   - Opción "Crear Proyecto" con fecha pre-seleccionada

   **Click en proyecto (barra/evento):**
   - Abre panel lateral con detalles completos
   - Opción de arrastrar para cambiar fecha de entrega

   **Drag & Drop de fechas:**
   - Arrastrar barra de proyecto para reprogramar
   - Modal de confirmación al soltar: "¿Cambiar fecha de entrega a [nueva fecha]?"

5. **Vista de Densidad:**
   - Contador de proyectos por día
   - Alerta visual si un día tiene >5 entregas programadas
   - Ayuda a balancear carga de trabajo

6. **Filtros Específicos del Calendario:**
   - Mostrar solo: Fechas de entrega / Fechas de inicio / Ambas
   - Filtrar por PM (ver solo agenda de un PM específico)
   - Filtrar por tipo de servicio

---

#### **Vista 4: Gantt (Timeline View)**

**Propósito:** Planificación de dependencias, análisis de ruta crítica y gestión de recursos.

**Diseño de Gantt:**

```

Proyectos Enero Febrero Marzo
──────────────────────────────────────────────────────────────────────────
📦 Campaña Navidad ████████░░░░
👤 Juan | $2.5K │ │
01/01 15/01

🎨 Revista Edición Mayo ░░░░████████████
👤 María | $4K │ │
20/01 05/02

📱 Branding Acme Corp ░░████████████████░░
👤 Pedro | $8K │ │
25/01 20/02

📦 Catálogo Productos ░░░░████████
👤 Ana | $3K │ │
01/02 15/02

──────────────────────────────────────────────────────────────────────────
Leyenda:
████ Duración completada (progreso real)
░░░░ Duración pendiente
│ Milestone / Fecha clave

```

**Componentes de la Vista Gantt:**

1. **Panel Izquierdo (Lista Jerárquica):**
```

📂 Por Cliente (colapsable)
└ ACME Corp
├ 🎨 Branding Corporativo
└ 📦 Catálogo 2026
└ TechInc
├ 📱 App Móvil
└ 🌐 Sitio Web

📂 Por PM (colapsable)
└ Juan Pérez (4 proyectos)
└ María González (3 proyectos)

📂 Por Estado (colapsable)
└ En Diseño (5)
└ En Producción (3)

```

**Columnas en Panel Izquierdo:**
- Nombre Proyecto (con jerarquía visual)
- PM (avatar pequeño)
- Presupuesto
- % Progreso (barra visual)

2. **Panel Derecho (Timeline):**

**Escala Temporal:**
- Zoom dinámico: Días / Semanas / Meses / Trimestres
- Línea vertical "Hoy" destacada
- Fines de semana sombreados (opcional)

**Barra de Proyecto:**
```

░░░░████████████░░░░░░
│ │ │
Inicio Hoy Fin

```

**Información en Barra (Hover):**
- Nombre del proyecto
- Duración: X días
- Progreso: X%
- Fecha inicio - Fecha fin
- Días restantes / Días de retraso

3. **Funcionalidades Avanzadas:**

**a) Dependencias (Opcional - Fase 2 post-MVP):**
- Conectar proyectos con flechas (ej: Diseño debe terminar antes de Producción)
- Tipos de dependencia:
  - Finish-to-Start (más común)
  - Start-to-Start
  - Finish-to-Finish

**b) Progreso del Proyecto:**
- Barra con dos colores:
  - Parte completada (oscuro)
  - Parte pendiente (claro)
- Admin puede ajustar % manualmente o se calcula por tareas (Fase 2)

**c) Milestones:**
- Rombo/Diamante en timeline para fechas clave
- Ejemplos: Aprobación cliente, Fecha de imprenta, Entrega final
- Click para agregar/editar milestone

**d) Recursos (PM Assignment):**
- Toggle para ver "Vista por PM"
- Muestra carga de trabajo por PM en timeline
- Detecta sobrecargas (mismo PM con >3 proyectos simultáneos)

**e) Ruta Crítica (Opcional - Fase 2):**
- Resaltar en rojo proyectos que impactan fecha final si se retrasan
- Útil para priorización

4. **Interacciones en Gantt:**

**Drag & Drop:**
- Arrastrar barra horizontalmente = Cambiar fechas (mantiene duración)
- Arrastrar extremos de barra = Ajustar fecha inicio/fin
- Validación: No permitir fechas en el pasado

**Click en Barra:**
- Panel lateral con detalles completos
- Opción de editar fechas con precisión (date pickers)

**Zoom:**
- Botones [+ -] o scroll del mouse
- Atajos: Cmd/Ctrl + Scroll

**Navegación Temporal:**
- Botones [◀ Hoy ▶] para moverse en timeline
- Jump to date: Click en selector de fecha

5. **Filtros y Agrupamiento:**

**Agrupamiento:**
- Por Cliente
- Por PM
- Por Estado
- Por Tipo de Servicio
- Sin agrupar (lista plana)

**Filtros:**
- Mismo panel que otras vistas
- Filtro adicional: "Solo proyectos activos" (excluir completados/facturados)

6. **Indicadores Visuales:**

**Color de Barra según Estado:**
- Brief: Azul claro
- Diseño: Morado
- Aprobación: Amarillo
- Producción: Naranja
- Completado: Verde

**Alertas:**
- ⚠️ Proyecto retrasado (pasó fecha de entrega sin completar)
- 🔥 Entrega en <3 días
- ⏸️ Proyecto estancado (>30 días en mismo estado)

---

#### **Funcionalidades Transversales (Todas las Vistas)**

**1. Navegación entre Vistas:**
- Toggle en header persiste filtros y selección
- URL actualizada según vista (ej: `/projects?view=kanban`)
- Última vista usada se guarda en preferencias del usuario

**2. Búsqueda Global:**
```

🔍 Buscar proyectos por nombre, cliente, o palabra clave...

```
- Búsqueda en tiempo real (debounce de 300ms)
- Resultados resaltan término buscado
- Funciona en todas las vistas

**3. Acciones Globales (Header):**
```

[+ Nuevo Proyecto] [📥 Importar] [📤 Exportar] [⚙️ Configurar Vistas] [🔄 Refrescar]

```

**4. Configuración de Vistas (Gear Icon):**
- **Vista Tabla:** Elegir columnas visibles, orden de columnas
- **Vista Kanban:** Configurar estados, colores, límites WIP
- **Vista Calendario:** Granularidad default, eventos a mostrar
- **Vista Gantt:** Agrupamiento default, escala temporal default

**5. Exportación:**
- **Todas las vistas:** Excel, CSV, PDF
- **Vista Gantt:** Exportar como imagen PNG (para presentaciones)

**6. Permisos por Vista:**
- **PM:** Puede ver todas las vistas, editar solo sus proyectos
- **Administrativo:** Solo Vista Tabla (para validaciones financieras)
- **Administrador:** Acceso total, incluyendo configuración de estados

---

#### 3.1.2 Gestión de Proyectos con Triggers Inteligentes

**Funcionalidad Core:**
- Estados configurables según flujo de trabajo (ejemplo: Brief → Diseño → Aprobación Cliente → Producción → Completado → Facturado)
- **Trigger automático:** Al mover a "Completado", el sistema:
  1. Genera notificación push/email al rol Administrativo
  2. Crea registro en módulo "Pendientes por Facturar" con datos del proyecto
  3. Calcula margen real vs. presupuestado
  4. Bloquea edición de gastos (requiere aprobación de Administrador)

**Información por Proyecto:**
- Nombre, Cliente, Tipo de servicio (Revista/Branding/Digital/Otro)
- Presupuesto estimado (Ingresos y Egresos)
- Fecha de inicio y fecha de entrega comprometida
- Archivos adjuntos (brief, entregables finales)
- Timeline de cambios de estado (auditoría)

**Reglas de Validación:**
- No permitir mover a "Completado" si no hay al menos 1 entregable cargado
- Alerta si el proyecto lleva >30 días sin cambio de estado

#### 3.1.2 Centro de Costos por Proyecto

**Al crear un proyecto, registrar:**
- **Ingresos estimados:** Monto acordado con cliente (multi-moneda)
- **Egresos estimados:** Desglose por categoría:
  - Proveedores externos (imprenta, freelancers)
  - Costos internos (horas-equipo, opcional para MVP)
  - Logística y misceláneos

**Cálculos automáticos (actualizados en tiempo real):**
```

Margen Presupuestado = (Ingresos Estimados - Egresos Estimados) / Ingresos Estimados _ 100
Margen Real = (Ingresos Reales - Egresos Reales) / Ingresos Reales _ 100
Desviación = Margen Real - Margen Presupuestado

```

---

### 3.2 Módulo: Portal de Proveedores (Autogestión)

#### 3.2.1 Registro y Onboarding de Proveedores

**Flujo de Alta de Proveedor:**

1. **Invitación desde el Sistema:**
   - Admin o PM envía invitación vía email desde el sistema
   - Link único de registro con token de seguridad (válido 7 días)
   - Email incluye: nombre de tu empresa, breve descripción del proceso

2. **Formulario de Registro (Paso 1 - Datos Básicos):**
```

Tipo de Proveedor:
○ Persona Natural
○ Persona Jurídica

Nombre/Razón Social: \***\*\_\_\_\*\***
Tipo de Servicio que Ofrece: [Dropdown: Imprenta, Diseño Freelance, Logística, etc.]
País: \***\*\_\_\_\*\***

```

3. **Formulario de Registro (Paso 2 - Datos Fiscales):**

**Si es Persona Natural:**
```

- Número de Cédula: \***\*\_\_\_\*\***
- Nombre Completo: \***\*\_\_\_\*\***
- Email de Contacto: \***\*\_\_\_\*\***
- Teléfono: \***\*\_\_\_\*\***
- Dirección Fiscal: \***\*\_\_\_\*\***
- RUT (Registro Único Tributario): [Archivo PDF/Imagen - Obligatorio]
  └ Validaciones: Formato PDF/JPG/PNG, Max 5MB, debe estar vigente

```

**Si es Persona Jurídica:**
```

- NIT/RUT Empresa: \***\*\_\_\_\*\***
- Razón Social: \***\*\_\_\_\*\***
- Email Empresarial: \***\*\_\_\_\*\***
- Teléfono Principal: \***\*\_\_\_\*\***
- Dirección Fiscal: \***\*\_\_\_\*\***

DOCUMENTOS OBLIGATORIOS:
✅ RUT (Registro Único Tributario): [Subir archivo]
✅ Cámara de Comercio (vigencia <30 días): [Subir archivo]
✅ Cédula Representante Legal: [Subir archivo]

DOCUMENTOS OPCIONALES (pero recomendados):
○ Certificación Bancaria: [Subir archivo]
○ Pólizas de Cumplimiento/Seguros: [Subir archivo]

```

4. **Formulario de Registro (Paso 3 - Datos Bancarios):**
```

Banco: [Dropdown con bancos principales del país]
Tipo de Cuenta: ○ Ahorros ○ Corriente
Número de Cuenta: \***\*\_\_\_\*\***
Titular de la Cuenta: \***\*\_\_\_\*\*** (debe coincidir con razón social/nombre)

```

5. **Aceptación de Términos:**
```

☑ Acepto los términos y condiciones de proveedores
☑ Autorizo el tratamiento de datos personales según Ley 1581/2012 (RGPD)
☑ Confirmo que la información suministrada es verídica

```

**Validaciones del Sistema:**
- Verificar que RUT/NIT no esté duplicado en la base de datos
- Validación de formato de documentos (solo PDF, JPG, PNG)
- Validación de vigencia de Cámara de Comercio (fecha de expedición <30 días)
- Email de confirmación una vez aprobado

**Estados del Proveedor:**
- **Registro Incompleto:** Falta subir documentos obligatorios
- **Pendiente de Aprobación:** Documentos cargados, esperando validación del Administrativo
- **Aprobado - Activo:** Puede subir facturas y recibir pagos
- **Rechazado:** Documentación no válida (con nota de rechazo)
- **Suspendido:** Temporal (por documentos vencidos o incumplimientos)
- **Inactivo:** No ha tenido movimientos en 6+ meses

#### 3.2.2 Portal de Proveedores - Funcionalidades

**Dashboard del Proveedor (vista post-login):**

**Sección: Mi Perfil**
- Ver y actualizar datos de contacto
- Ver documentos cargados con estados:
- ✅ Aprobado (fecha de aprobación)
- ⏳ En revisión
- ⚠️ Próximo a vencer (alerta a 30 días)
- ❌ Vencido (bloquea carga de nuevas facturas)
- Botón "Actualizar Documento Vencido"

**Sección: Mis Facturas**

*Vista Tabla:*
| # Factura | Proyecto | Fecha Emisión | Monto | Estado | Fecha Pago Programada | Acciones |
|-----------|----------|---------------|-------|--------|----------------------|----------|
| 12345 | Campaña Navidad | 15/01/26 | $2,500 USD | Aprobada | 30/01/26 | [Ver] [Descargar] |
| 12344 | Revista Ed. 05 | 10/01/26 | $850 USD | En Revisión | - | [Ver] |

**Estados de Factura (desde perspectiva del proveedor):**
- **Cargada:** El proveedor la subió, esperando validación del cliente
- **En Revisión:** El administrativo está validando datos
- **Aprobada - Pago Programado:** Validada, con fecha estimada de pago
- **Pagada:** Pago efectuado (mostrar fecha real de pago)
- **Rechazada:** No aprobada (mostrar razón del rechazo)

**Formulario: Cargar Nueva Factura**
```

Proyecto Asociado: [Dropdown - solo proyectos donde es proveedor asignado]
Número de Factura: \***\*\_\_\_\*\***
Fecha de Emisión: [Date picker]
Fecha de Vencimiento: [Date picker] (default: +30 días)
Moneda: ○ USD ○ COP ○ Otra: **\_**
Subtotal: \***\*\_\_\_\*\***
IVA/Impuestos: \***\*\_\_\_\*\*** (%)
Total: \***\*\_\_\_\*\*** (calculado automáticamente)

Descripción del Servicio/Producto:
[Text area - max 500 caracteres]

Archivo de Factura: [Subir PDF - Obligatorio]
└ Validaciones: Solo PDF, max 10MB, debe tener número de factura visible

Archivos Adjuntos Opcionales:
[Subir archivos] (ej: remisiones, actas de entrega)
└ Max 3 archivos, 5MB c/u

[Botón: Enviar Factura para Aprobación]

```

**Después de Enviar:**
- Email de confirmación al proveedor: "Tu factura #12345 fue recibida y está en revisión"
- Notificación al Administrativo del sistema: "Nueva factura de [Proveedor] requiere validación"

**Sección: Histórico de Pagos**
- Reporte descargable (Excel/PDF) de todas las facturas pagadas
- Filtros por fecha, proyecto, monto
- Totales por año fiscal

**Sección: Documentos Legales**
- Descargar certificado de retención (si aplica)
- Descargar comprobantes de pago
- Acceso a términos y condiciones actualizados

#### 3.2.3 Validación de Facturas (Vista Administrativo)

**Dashboard "Facturas Pendientes de Aprobación":**

*Vista de Tarjetas (Card View):*
```

┌─────────────────────────────────────────┐
│ Factura #12345 - Imprenta Los Andes │
│ │
│ Proyecto: Campaña Navidad 2026 │
│ Monto: $2,500 USD │
│ Fecha Emisión: 15/01/2026 │
│ Proveedor: ✅ Documentos al día │
│ │
│ [Ver PDF] [Aprobar] [Rechazar] [Editar]│
└─────────────────────────────────────────┘

````

**Flujo de Aprobación:**

1. **Click en "Ver PDF":**
   - Visualizador inline del PDF de la factura
   - Datos extraídos por OCR mostrados al lado para comparación:
     ```
     OCR detectó:                Tu validación:
     Proveedor: Los Andes        [✓ Correcto] [✗ Corregir]
     Monto: $2,500              [✓ Correcto] [✗ Corregir: _____]
     Fecha: 15/01/26            [✓ Correcto] [✗ Corregir: _____]
     IVA: $475 (19%)            [✓ Correcto] [✗ Corregir: _____]
     ```

2. **Click en "Aprobar":**
   - Modal de confirmación:
     ```
     ¿Confirmar aprobación de factura #12345?
     Monto: $2,500 USD
     Proyecto: Campaña Navidad 2026

     Fecha de Pago Programada: [Date picker] (default: hoy + 30 días)
     Notas internas (opcional): [Text area]

     [Cancelar]  [Confirmar Aprobación]
     ```
   - Al confirmar:
     - Factura pasa a estado "Aprobada"
     - Se actualiza el flujo de caja proyectado
     - Email automático al proveedor: "Tu factura fue aprobada, pago programado para [fecha]"
     - Se registra en contabilidad (cuenta por pagar)

3. **Click en "Rechazar":**
   - Modal obligatorio con razón:
     ```
     Motivo del rechazo: [Dropdown]
       ○ Datos incorrectos en la factura
       ○ Monto no coincide con lo acordado
       ○ Proyecto no corresponde
       ○ Documento ilegible
       ○ Otro: [Text area obligatorio]

     [Cancelar]  [Confirmar Rechazo]
     ```
   - Email al proveedor con el motivo específico
   - Proveedor puede resubir versión corregida

4. **Click en "Editar":**
   - Permite al administrativo corregir datos menores (monto, fecha) sin rechazar
   - Requiere nota de justificación (auditoría)

**Alertas Automáticas para Administrativo:**
- 🔴 Factura cargada hace >3 días sin revisar
- 🟡 Proveedor tiene documentos que vencen en <15 días (bloquear nuevas facturas si vencen)
- 🟢 Todas las facturas de la semana revisadas

#### 3.2.4 Gestión de Documentos Legales (Vista Administrativo)

**Módulo: "Proveedores - Documentos"**

*Vista de Lista de Proveedores:*
| Proveedor | Tipo | RUT | Cámara Comercio | Cédula Rep. Legal | Estado | Acciones |
|-----------|------|-----|----------------|-------------------|--------|----------|
| Imprenta Los Andes | Jurídica | ✅ Vigente | ⚠️ Vence 05/02/26 | ✅ Vigente | Activo | [Ver] [Notificar] |
| Juan Pérez Diseño | Natural | ✅ Vigente | N/A | ✅ Vigente | Activo | [Ver] |
| Logística Express | Jurídica | ❌ Vencido | ❌ Vencido | ✅ Vigente | Suspendido | [Ver] [Reactivar] |

**Acciones Disponibles:**
- **Ver:** Abre ficha completa del proveedor con todos los documentos descargables
- **Notificar:** Envía email recordatorio de actualización de documentos
- **Suspender/Reactivar:** Cambiar estado (suspendidos no pueden cargar facturas)

**Automatizaciones:**
- Email automático al proveedor 30 días antes del vencimiento de Cámara de Comercio
- Email de recordatorio a 15 y 7 días antes del vencimiento
- Suspensión automática el día del vencimiento si no actualizan
- Notificación al Administrativo de proveedores suspendidos

### 3.3 Módulo: Gestión Financiera Multi-moneda

#### 3.2.1 Soporte de Monedas y TRM

**Monedas soportadas (MVP):**
- USD (Dólar estadounidense)
- COP (Peso colombiano) - asumiendo tu ubicación
- Moneda base para reportes: **USD** (configurable)

**Integración TRM:**
- **API recomendada:** `exchangerate-api.com` (gratuita hasta 1,500 requests/mes)
- **Frecuencia de actualización:** Diaria a las 7:00 AM hora local
- **Almacenamiento histórico:** Guardar TRM del día de cada transacción para auditoría
- **Funcionalidad manual:** Permitir override de TRM para casos especiales (aprobación de Administrador)

**Conversión para Dashboards:**
- Todos los montos se convierten a USD usando la TRM del día de la transacción
- Opción de toggle para ver valores en moneda local

#### 3.2.2 Gestión de Gastos

**Tipos de Gasto:**
1. **Gastos de Proyecto:** Vinculados a un proyecto específico (proveedores, freelancers)
2. **Gastos Recurrentes:** Operativos sin vinculación a proyecto (arriendo, servicios, nómina)

**Información por Gasto:**
- Proveedor (autocompletado desde base de datos)
- Monto y moneda
- TRM aplicada (automática o manual)
- Categoría (Material impreso, Diseño, Logística, Servicios, Otro)
- Fecha de emisión y fecha de pago (proyectada/real)
- Estado: Pendiente / Pagado
- Archivo PDF de factura
- Notas adicionales

**Flujo de Aprobación:**
- Gastos <USD 500: Aprobación automática del PM al vincular
- Gastos ≥USD 500: Requiere aprobación explícita del Administrador

#### 3.2.3 Gestión de Ingresos

**Ciclo de Facturación:**
1. Proyecto se marca como "Completado" → Entra a cola de facturación
2. Administrativo genera factura (integración con software contable existente o generación manual)
3. Se registra en sistema:
   - Monto facturado (puede diferir del presupuestado)
   - Fecha de emisión
   - Plazo de pago (15/30/45/60 días)
   - Estado: Pendiente / Cobrado / Vencido
4. Alertas automáticas a 7 días antes y 3 días después de vencimiento

---

### 3.3 Módulo: Automatización Inteligente (OCR + Email)

#### 3.3.1 Integración con Gmail

**Configuración:**
- Email dedicado: `facturas@[tudominio].com` (crear cuenta Gmail específica)
- **Autenticación:** OAuth 2.0 con alcance de solo lectura de correos específicos
- **Filtrado:** Escanear solo correos de proveedores pre-autorizados o con palabras clave ("factura", "invoice", "cobro")

**Frecuencia de escaneo:**
- Polling cada 15 minutos durante horario laboral (8am-6pm)
- Webhook si proveedor de email lo soporta (Gmail Pub/Sub)

#### 3.3.2 Motor OCR

**Tecnología recomendada (evaluación):**

| Opción | Precisión | Costo (MVP) | Idiomas | Recomendación |
|--------|-----------|-------------|---------|---------------|
| Google Document AI | 95%+ | ~$1.50/1000 páginas | ES/EN | ⭐ **Mejor opción** |
| AWS Textract | 93%+ | ~$1.50/1000 páginas | EN principalmente | Alternativa |
| Tesseract (Open Source) | 80-85% | Gratis | ES/EN | Solo si presupuesto es crítico |

**Datos a Extraer (campos obligatorios):**
- ✅ Nombre del proveedor (validación contra base de datos)
- ✅ Número de factura
- ✅ Fecha de emisión
- ✅ Monto total
- ✅ Subtotal e impuestos (IVA)
- ✅ Moneda (detector automático: COP, USD, etc.)
- ⚠️ Conceptos/líneas de detalle (opcional para MVP)

**Flujo de Procesamiento:**
````

1. Email recibido → Descarga PDF/imagen
2. OCR extrae datos → Confianza >80% pasa a paso 3, <80% marca para revisión manual
3. Sistema crea "Gasto Borrador" con datos extraídos
4. Notifica a Administrativo para:
   - Validar datos (especialmente proveedor y monto)
   - Vincular a Proyecto (dropdown con búsqueda)
   - Confirmar categoría de gasto
5. Una vez confirmado → Gasto se registra oficialmente y afecta dashboard

```

**Manejo de Errores:**
- Si OCR falla 2 veces, marcar factura para procesamiento 100% manual
- Log de todas las facturas procesadas con nivel de confianza del OCR

---

### 3.4 Módulo: Dashboard y Reportes

#### 3.4.1 Dashboard Ejecutivo (Vista Administrador)

**Sección 1: Flujo de Caja (vista predeterminada)**

**Cálculo de Flujo Proyectado a 30 días:**
```

Flujo Neto Proyectado =
(Efectivo Actual + Cuentas por Cobrar próximos 30 días)

- (Cuentas por Pagar próximos 30 días + Gastos Recurrentes)

```

**Visualización:**
- Gráfico de cascada (waterfall chart) mostrando:
  - Posición de caja actual
  - Ingresos proyectados por semana
  - Egresos proyectados por semana
  - Posición final proyectada a 30 días
- Semáforo de alerta:
  - 🟢 Verde: Flujo proyectado >20% sobre gastos fijos
  - 🟡 Amarillo: Flujo proyectado entre 0-20% sobre gastos fijos
  - 🔴 Rojo: Flujo proyectado negativo

**Sección 2: Proyectos en Riesgo**

**Criterios de detección:**
- Proyectos completados hace >5 días sin facturar
- Proyectos con margen real <50% del margen presupuestado
- Proyectos en estado "Diseño" o anterior por >30 días

**Formato:**
- Tabla con: Proyecto, Cliente, Estado, Días en estado actual, Margen real vs. presupuestado
- Acción rápida: Botón para enviar recordatorio al PM responsable

**Sección 3: Top Insights del Mes**

- 🏆 Top 3 proyectos más rentables (margen real)
- ⚠️ Top 3 proyectos menos rentables
- 📊 Distribución de ingresos por tipo de servicio (gráfico de dona)
- 💸 Gasto promedio en proveedores externos por tipo de proyecto

#### 3.4.2 Reportes Exportables

**Formatos disponibles:** PDF, Excel, CSV

**Tipos de reporte (generables on-demand):**
1. **Reporte de Rentabilidad por Proyecto** (rango de fechas configurable)
2. **Estado de Cuentas por Cobrar** (con antigüedad: 0-30, 31-60, 61-90, >90 días)
3. **Estado de Cuentas por Pagar** (con antigüedad similar)
4. **Gastos por Proveedor** (consolidado mensual/anual)
5. **Comparativa Presupuesto vs. Real** (desviaciones por proyecto)

---

## 4. Arquitectura Técnica

### 4.1 Stack Tecnológico Recomendado

**Frontend:**
```

Framework: Next.js 14+ (React)
Ventajas:

- SSR para dashboards más rápidos
- API routes integradas
- Ecosistema maduro para dashboards (Recharts, Tremor)

UI Components: shadcn/ui + Tailwind CSS
State Management: Zustand (más ligero que Redux para MVP)
Visualización de Datos: Recharts o Tremor

Librerías específicas para Gestión de Proyectos:

- @dnd-kit/core: Drag & drop para Kanban y Gantt
- react-big-calendar: Base para Vista Calendario
- gantt-schedule-timeline-calendar: Vista Gantt (o custom con D3.js)
- react-table / tanstack-table: Vista Tabla con sorting/filtering avanzado

```

**Backend:**
```

Framework: Python FastAPI
Ventajas:

- Superior para procesamiento OCR (librerías de CV y ML)
- Integración nativa con pandas para cálculos financieros
- Validación de datos con Pydantic
- Documentación automática (Swagger UI)

Alternativa: Node.js (Express/NestJS) si el equipo tiene más experiencia JS

```

**Base de Datos:**
```

Principal: PostgreSQL 15+
Ventajas:

- ACID para transacciones financieras
- Tipos de datos JSON para metadata flexible
- Extensiones útiles: pg_cron (tareas programadas)

Caché (opcional para MVP): Redis

- Cacheo de TRM diaria
- Sesiones de usuario

```

**Almacenamiento de Archivos:**
```

Solución: AWS S3 o Cloudflare R2 (más barato)
Estructura de carpetas:
/facturas/{año}/{mes}/{proyecto_id}/{archivo.pdf}
/entregables/{año}/{mes}/{proyecto_id}/{archivo}

```

**OCR y Procesamiento:**
```

Opción 1 (recomendada): Google Document AI

- Mejor precisión en español
- Pricing predecible

Opción 2 (alternativa): AWS Textract

- Buen ecosistema AWS si ya lo usan

```

**Integraciones:**
```

Email: Gmail API (OAuth 2.0)
TRM: exchangerate-api.com o API del Banco de la República (Colombia)
Notificaciones:

- SendGrid (email transaccional)
- Opcional: Slack/WhatsApp Business API

```

### 4.2 Modelo de Datos (Entidades Principales)

**Diagrama de Relaciones:**

```

┌─────────────┐ ┌──────────────┐ ┌─────────────┐
│ Proyecto │ 1───N │facturas_prov.│ N───1 │ Proveedor │
└─────────────┘ └──────────────┘ └─────────────┘
│ │ │
│ 1 │ 1 │ 1
│ │ │
│ N │ N │ N
┌─────────────┐ ┌──────────────┐ ┌─────────────┐
│ Ingreso │ │ Usuario │ │ docs_prov. │
│ (Factura) │ │ (Auditoría)│ │ │
└─────────────┘ └──────────────┘ └─────────────┘

````

**Esquemas Detallados:**

**Tabla: proyectos**
```sql
id                UUID PRIMARY KEY
nombre            VARCHAR(255) NOT NULL
cliente           VARCHAR(255) NOT NULL
tipo_servicio     ENUM('Revista', 'Branding', 'Digital', 'Otro')
estado            VARCHAR(50) NOT NULL
presupuesto_ingreso_monto    DECIMAL(12,2)
presupuesto_ingreso_moneda   VARCHAR(3)
presupuesto_egreso_monto     DECIMAL(12,2)
presupuesto_egreso_moneda    VARCHAR(3)
fecha_inicio      DATE
fecha_entrega     DATE
responsable_pm_id UUID FK → usuarios

-- Campos para vistas avanzadas
progreso_porcentaje INT DEFAULT 0 CHECK (progreso_porcentaje >= 0 AND progreso_porcentaje <= 100)
prioridad         ENUM('Baja', 'Media', 'Alta', 'Urgente') DEFAULT 'Media'
color_etiqueta    VARCHAR(7) (hex color, ej: #FF5733)
posicion_kanban   INTEGER (para ordenamiento manual en columnas)

-- Timestamps y auditoría
created_at        TIMESTAMP
updated_at        TIMESTAMP
metadata          JSONB (campos personalizados)

-- Índices para optimizar vistas
INDEX idx_estado ON proyectos(estado)
INDEX idx_fecha_entrega ON proyectos(fecha_entrega)
INDEX idx_pm ON proyectos(responsable_pm_id)
````

**Tabla: gastos**

```sql
id                UUID PRIMARY KEY
proyecto_id       UUID FK → proyectos (NULL si es gasto recurrente)
proveedor_id      UUID FK → proveedores
tipo              ENUM('Proyecto', 'Recurrente')
categoria         ENUM('Material Impreso', 'Diseño', 'Logística', 'Servicios', 'Otro')
monto             DECIMAL(12,2) NOT NULL
moneda            VARCHAR(3) NOT NULL
trm_aplicada      DECIMAL(10,4) NOT NULL
monto_usd         DECIMAL(12,2) GENERATED (monto / trm_aplicada si moneda != USD)
fecha_emision     DATE NOT NULL
fecha_pago_proyectada DATE
fecha_pago_real   DATE
estado            ENUM('Pendiente', 'Pagado')
archivo_pdf_url   VARCHAR(500)
ocr_confidence    DECIMAL(3,2) (0.00 a 1.00)
aprobado_por      UUID FK → usuarios
notas             TEXT
created_at        TIMESTAMP
```

**Tabla: proveedores**

```sql
id                UUID PRIMARY KEY
tipo_persona      ENUM('Natural', 'Juridica') NOT NULL
nombre            VARCHAR(255) UNIQUE NOT NULL
tax_id            VARCHAR(50) NOT NULL (NIT/Cédula)
categoria         ENUM('Imprenta', 'Freelancer', 'Logística', 'Servicios', 'Otro')
pais              VARCHAR(100)
direccion_fiscal  VARCHAR(500)
contacto_email    VARCHAR(255) NOT NULL
contacto_telefono VARCHAR(20)
termino_pago_dias INT DEFAULT 30

-- Datos bancarios
banco             VARCHAR(100)
tipo_cuenta       ENUM('Ahorros', 'Corriente')
numero_cuenta     VARCHAR(50)
titular_cuenta    VARCHAR(255)

-- Estado y auditoría
estado            ENUM('Registro_Incompleto', 'Pendiente_Aprobacion', 'Activo', 'Rechazado', 'Suspendido', 'Inactivo') DEFAULT 'Registro_Incompleto'
fecha_aprobacion  DATE
aprobado_por      UUID FK → usuarios
motivo_rechazo    TEXT
total_facturado   DECIMAL(12,2) DEFAULT 0 (calculado)
ultima_factura    DATE (fecha de última factura cargada)

-- Credenciales para portal
password_hash     VARCHAR(255) (bcrypt)
ultimo_acceso     TIMESTAMP
token_registro    VARCHAR(255) (para link de invitación)
token_expiracion  TIMESTAMP

created_at        TIMESTAMP
updated_at        TIMESTAMP
```

**Tabla: documentos_proveedor**

```sql
id                UUID PRIMARY KEY
proveedor_id      UUID FK → proveedores NOT NULL
tipo_documento    ENUM('RUT', 'Camara_Comercio', 'Cedula_Rep_Legal', 'Cert_Bancaria', 'Poliza', 'Otro') NOT NULL
archivo_url       VARCHAR(500) NOT NULL
fecha_expedicion  DATE
fecha_vencimiento DATE (NULL si no aplica)
estado            ENUM('En_Revision', 'Aprobado', 'Rechazado', 'Vencido') DEFAULT 'En_Revision'
validado_por      UUID FK → usuarios
fecha_validacion  DATE
motivo_rechazo    TEXT
notas             TEXT
created_at        TIMESTAMP
updated_at        TIMESTAMP

-- Índice para alertas de vencimiento
INDEX idx_vencimiento ON documentos_proveedor(fecha_vencimiento) WHERE estado = 'Aprobado'
```

**Tabla: facturas_proveedor** (separada de "gastos" para mayor trazabilidad)

```sql
id                UUID PRIMARY KEY
proveedor_id      UUID FK → proveedores NOT NULL
proyecto_id       UUID FK → proyectos NOT NULL
numero_factura    VARCHAR(100) NOT NULL
fecha_emision     DATE NOT NULL
fecha_vencimiento DATE NOT NULL
subtotal          DECIMAL(12,2) NOT NULL
impuestos         DECIMAL(12,2) NOT NULL
total             DECIMAL(12,2) NOT NULL
moneda            VARCHAR(3) NOT NULL
trm_aplicada      DECIMAL(10,4)
total_usd         DECIMAL(12,2) (calculado)

descripcion       TEXT
archivo_pdf_url   VARCHAR(500) NOT NULL
archivos_adjuntos JSONB (array de URLs de archivos adicionales)

-- Estados y flujo
estado            ENUM('Cargada', 'En_Revision', 'Aprobada', 'Rechazada', 'Pagada') DEFAULT 'Cargada'
fecha_aprobacion  DATE
aprobado_por      UUID FK → usuarios
fecha_pago_programada DATE
fecha_pago_real   DATE
motivo_rechazo    TEXT
notas_internas    TEXT

-- OCR data (si aplica)
ocr_confianza     DECIMAL(3,2)
ocr_datos_raw     JSONB (datos extraídos sin procesar)

created_at        TIMESTAMP (cuando proveedor la cargó)
updated_at        TIMESTAMP

UNIQUE(proveedor_id, numero_factura) -- No permitir duplicados
```

**Tabla: ingresos**

```sql
id                UUID PRIMARY KEY
proyecto_id       UUID FK → proyectos NOT NULL
monto             DECIMAL(12,2) NOT NULL
moneda            VARCHAR(3) NOT NULL
trm_aplicada      DECIMAL(10,4) NOT NULL
fecha_emision     DATE NOT NULL
fecha_vencimiento DATE NOT NULL
fecha_cobro       DATE (NULL si pendiente)
estado            ENUM('Pendiente', 'Cobrado', 'Vencido')
numero_factura    VARCHAR(100)
notas             TEXT
created_at        TIMESTAMP
```

**Tabla: trm_historica** (caché de tasas de cambio)

```sql
id                UUID PRIMARY KEY
fecha             DATE UNIQUE NOT NULL
moneda_origen     VARCHAR(3) DEFAULT 'COP'
moneda_destino    VARCHAR(3) DEFAULT 'USD'
tasa              DECIMAL(10,4) NOT NULL
fuente            VARCHAR(100) (nombre del API)
created_at        TIMESTAMP
```

### 4.3 Seguridad y Cumplimiento

**Autenticación y Autorización:**

- Autenticación: JWT con refresh tokens
- MFA opcional (recomendado para Administrador)
- RBAC (Role-Based Access Control) estricto según tabla de permisos

**Protección de Datos:**

- Encriptación en tránsito: TLS 1.3
- Encriptación en reposo: AWS S3 server-side encryption
- Datos financieros sensibles: Hashing de tax IDs

**Auditoría:**

- Log de todas las acciones financieras (quién, qué, cuándo)
- Retención de logs: 7 años (estándar contable)

**Backup:**

- Backup diario de base de datos (retención 30 días)
- Backup semanal de archivos (retención 90 días)

---

## 5. Plan de Implementación (Roadmap MVP)

### Fase 1: Fundación (Semanas 1-3)

**Objetivos:**

- Infraestructura base desplegada
- Autenticación funcionando
- Modelo de datos implementado

**Entregables:**

- ✅ Setup de repositorio (frontend/backend)
- ✅ DB Schema en producción
- ✅ Sistema de login con 3 roles
- ✅ Diseño UI/UX de dashboards (Figma)

### Fase 2: Core Operativo (Semanas 4-8)

**Objetivos:**

- **Gestión de proyectos con 4 vistas funcionando**
- Portal de proveedores operativo
- Registro de gastos/ingresos

**Entregables:**

- ✅ **Vista Tabla:** Completa con sorting, filtros, edición inline
- ✅ **Vista Kanban:** Drag & drop funcional, tarjetas con info clave
- ✅ **Vista Calendario:** Mes/Semana funcional con drag & drop de fechas
- ✅ **Vista Gantt:** Timeline básico con barras de progreso
- ✅ CRUD de proyectos con presupuestos
- ✅ **Portal de Proveedores completo:**
  - Sistema de registro e invitaciones
  - Carga de documentos legales
  - Carga de facturas por proveedores
  - Dashboard de proveedores
- ✅ Módulo de validación de documentos (Administrativo)
- ✅ Módulo de aprobación de facturas de proveedores
- ✅ Cálculo básico de rentabilidad por proyecto

### Fase 3: Inteligencia Financiera (Semanas 9-11)

**Objetivos:**

- Dashboard ejecutivo operativo
- Multi-moneda y TRM funcionando

**Entregables:**

- ✅ Integración con API de TRM
- ✅ Conversión automática de monedas
- ✅ Dashboard de flujo de caja
- ✅ Reportes de rentabilidad exportables
- ✅ Trigger automático de facturación al completar proyecto

### Fase 4: Automatización OCR (Semanas 12-14)

**Objetivos:**

- OCR de facturas funcionando con 85%+ precisión
- Complementar carga manual de proveedores

**Entregables:**

- ✅ Integración Gmail API (como canal alternativo de recepción)
- ✅ Integración Google Document AI
- ✅ Flujo de validación de gastos OCR
- ✅ Testing con 50 facturas reales
- ✅ **Nota:** OCR funciona en paralelo al portal de proveedores, no lo reemplaza

### Fase 5: Refinamiento y Lanzamiento (Semanas 15-18)

**Objetivos:**

- Sistema estable y optimizado
- Usuarios entrenados

**Entregables:**

- ✅ Testing de carga y optimización
- ✅ **Refinamiento de UX de las 4 vistas de proyectos**
- ✅ Documentación de usuario (4 roles: Admin, PM, Administrativo, Proveedor)
- ✅ Sesiones de capacitación (todos los roles)
- ✅ Onboarding de primeros 5-10 proveedores piloto
- ✅ Go-live con acompañamiento primera semana

**Duración total estimada: 18 semanas (~4.5 meses)**

---

## 6. Riesgos y Mitigaciones

| Riesgo                                           | Probabilidad | Impacto | Mitigación                                                                                           |
| ------------------------------------------------ | ------------ | ------- | ---------------------------------------------------------------------------------------------------- |
| OCR con baja precisión en facturas locales       | Media        | Alto    | Fase de pruebas extendida con 100+ facturas reales antes de automatizar                              |
| Resistencia de proveedores a usar portal digital | Alta         | Alto    | Onboarding asistido + soporte telefónico primera semana + incentivo (pago más rápido si usan portal) |
| Resistencia al cambio de usuarios internos       | Alta         | Medio   | Capacitación práctica + periodo de uso dual (Excel + Sistema) de 2 semanas                           |
| Complejidad de multi-moneda                      | Baja         | Alto    | Usar librería de manejo de money types (money.js) + testing exhaustivo                               |
| Proveedores cargan facturas duplicadas           | Media        | Medio   | Validación única por (proveedor_id + numero_factura) en BD                                           |
| Documentos legales vencidos sin actualizar       | Alta         | Alto    | Sistema de alertas automáticas a 30/15/7 días + suspensión automática                                |
| API de TRM caída                                 | Baja         | Medio   | Fallback a entrada manual + caché de última TRM válida                                               |
| Sobrecarga de correo facturas@                   | Media        | Bajo    | Filtros inteligentes + límite de procesamiento de 100 facturas/día                                   |

---

## 7. Criterios de Aceptación del MVP

**El MVP se considera exitoso si cumple:**

✅ **Funcionalidad Core:**

- [x] 100% de proyectos gestionados en el sistema (0 en Excel)
- [x] Gestión de Tareas Jerárquicas (3 niveles)
- [x] Dashboard de Administración Operativo
- [x] Sistema de Logs de Auditoría
- [ ] 80%+ de facturas procesadas vía portal de proveedores
- [ ] 70%+ de proveedores activos usando el portal (resto por email+OCR)
- [ ] Dashboard de flujo de caja actualizado en tiempo real (<5 min delay)
- [ ] 0 proyectos completados sin facturar por >7 días
- [ ] 0 proveedores activos con documentos legales vencidos

✅ **Rendimiento:**

- [ ] Tiempo de carga del dashboard <3 segundos
- [ ] Procesamiento OCR de factura <30 segundos
- [ ] Sistema disponible 99%+ del tiempo laboral

✅ **Adopción:**

- [ ] 100% de usuarios internos acceden al sistema al menos 1x/día
- [ ] 70%+ de proveedores recurrentes registrados en el portal
- [ ] <10% de facturas registradas manualmente (fuera de portal o OCR)

---

## 8. Post-MVP: Evolución Futura

**Funcionalidades candidatas para Fase 2 (6 meses post-lanzamiento):**

1. **Gestión de Proyectos Avanzada:**
   - Dependencias entre proyectos en Vista Gantt
   - ✅ **Subtareas/Checklist jerárquicas (3 niveles):** Implementado
   - Comentarios y menciones (@usuario)
   - ✅ **Campos personalizados (Infraestructura):** Implementado
   - Plantillas de proyectos (ej: "Nueva Edición Revista")

2. **Integración Contable Avanzada:**
   - Sincronización bidireccional con software contable (ej: Alegra, Siigo)
   - Generación automática de facturas electrónicas

3. **Gestión de Recursos Internos:**
   - Registro de horas por proyecto (timesheets)
   - Cálculo de costo interno por hora-equipo
   - Vista de capacidad por PM (workload balancing)

4. **Predicción con ML:**
   - Modelo predictivo de rentabilidad en fase de brief
   - Alertas tempranas de proyectos en riesgo de pérdida

5. **Mobile App:**
   - App nativa para aprobación de gastos on-the-go
   - Escaneo de facturas con cámara del celular
   - Notificaciones push de cambios de estado

6. **Colaboración con Clientes:**
   - Portal de cliente para tracking de proyectos
   - Aprobaciones digitales de propuestas

---

## 9. Anexos

### 9.1 Glosario de Términos

- **TRM:** Tasa Representativa del Mercado (tasa de cambio oficial)
- **OCR:** Optical Character Recognition (reconocimiento óptico de caracteres)
- **RBAC:** Role-Based Access Control
- **MFA:** Multi-Factor Authentication
- **Waterfall Chart:** Gráfico de cascada para visualizar cambios acumulativos

### 9.2 Referencias de Diseño

- **Dashboard de inspiración:** [Nexus SaaS Marketing Dashboard](https://dribbble.com/shots/23038744-Nexus-Saas-Marketing-Dashboard)
- **Paleta de colores sugerida:**
  - Primario: #3B82F6 (Azul confianza)
  - Éxito: #10B981 (Verde)
  - Alerta: #F59E0B (Ámbar)
  - Error: #EF4444 (Rojo)
  - Neutral: Escala de grises

## 4. Arquitectura Técnica

### 4.1 Stack Tecnológico Recomendado

**Frontend:**

```
Framework: Next.js 14+ (React)
Ventajas:
  - SSR para dashboards más rápidos
  - API routes integradas
  - Ecosistema maduro para dashboards (Recharts, Tremor)

UI Components: shadcn/ui + Tailwind CSS
State Management: Zustand (más ligero que Redux para MVP)
Visualización de Datos: Recharts o Tremor

Librerías específicas para Gestión de Proyectos:
  - @dnd-kit/core: Drag & drop para Kanban y Gantt
  - react-big-calendar: Base para Vista Calendario
  - gantt-schedule-timeline-calendar: Vista Gantt (o custom con D3.js)
  - react-table / tanstack-table: Vista Tabla con sorting/filtering avanzado
```

**Backend:**

```
Framework: Python FastAPI
Ventajas:
  - Superior para procesamiento OCR (librerías de CV y ML)
  - Integración nativa con pandas para cálculos financieros
  - Validación de datos con Pydantic
  - Documentación automática (Swagger UI)

Alternativa: Node.js (Express/NestJS) si el equipo tiene más experiencia JS
```

**Base de Datos:**

```
Principal: PostgreSQL 15+
Ventajas:
  - ACID para transacciones financieras
  - Tipos de datos JSON para metadata flexible
  - Extensiones útiles: pg_cron (tareas programadas)

Caché (opcional para MVP): Redis
  - Cacheo de TRM diaria
  - Sesiones de usuario
```

**Almacenamiento de Archivos:**

```
Solución: AWS S3 o Cloudflare R2 (más barato)
Estructura de carpetas:
  /facturas/{año}/{mes}/{proyecto_id}/{archivo.pdf}
  /entregables/{año}/{mes}/{proyecto_id}/{archivo}
```

**OCR y Procesamiento:**

```
Opción 1 (recomendada): Google Document AI
  - Mejor precisión en español
  - Pricing predecible

Opción 2 (alternativa): AWS Textract
  - Buen ecosistema AWS si ya lo usan
```

**Integraciones:**

```
Email: Gmail API (OAuth 2.0)
TRM: exchangerate-api.com o API del Banco de la República (Colombia)
Notificaciones:
  - SendGrid (email transaccional)
  - Opcional: Slack/WhatsApp Business API
```

### 4.2 Modelo de Datos (Entidades Principales)

**Diagrama de Relaciones:**

```
┌─────────────┐         ┌──────────────┐         ┌─────────────┐
│  Proyecto   │ 1───N   │facturas_prov.│ N───1   │  Proveedor  │
└─────────────┘         └──────────────┘         └─────────────┘
      │                        │                        │
      │ 1                      │ 1                      │ 1
      │                        │                        │
      │ N                      │ N                      │ N
┌─────────────┐         ┌──────────────┐         ┌─────────────┐
│  Ingreso    │         │   Usuario    │         │ docs_prov.  │
│ (Factura)   │         │   (Auditoría)│         │             │
└─────────────┘         └──────────────┘         └─────────────┘
```

**Esquemas Detallados:**

**Tabla: proyectos**

```sql
id                UUID PRIMARY KEY
nombre            VARCHAR(255) NOT NULL
cliente           VARCHAR(255) NOT NULL
tipo_servicio     ENUM('Revista', 'Branding', 'Digital', 'Otro')
estado            VARCHAR(50) NOT NULL
presupuesto_ingreso_monto    DECIMAL(12,2)
presupuesto_ingreso_moneda   VARCHAR(3)
presupuesto_egreso_monto     DECIMAL(12,2)
presupuesto_egreso_moneda    VARCHAR(3)
fecha_inicio      DATE
fecha_entrega     DATE
responsable_pm_id UUID FK → usuarios

-- Campos para vistas avanzadas
progreso_porcentaje INT DEFAULT 0 CHECK (progreso_porcentaje >= 0 AND progreso_porcentaje <= 100)
prioridad         ENUM('Baja', 'Media', 'Alta', 'Urgente') DEFAULT 'Media'
color_etiqueta    VARCHAR(7) (hex color, ej: #FF5733)
posicion_kanban   INTEGER (para ordenamiento manual en columnas)

-- Timestamps y auditoría
created_at        TIMESTAMP
updated_at        TIMESTAMP
metadata          JSONB (campos personalizados)

-- Índices para optimizar vistas
INDEX idx_estado ON proyectos(estado)
INDEX idx_fecha_entrega ON proyectos(fecha_entrega)
INDEX idx_pm ON proyectos(responsable_pm_id)
```

**Tabla: gastos**

```sql
id                UUID PRIMARY KEY
proyecto_id       UUID FK → proyectos (NULL si es gasto recurrente)
proveedor_id      UUID FK → proveedores
tipo              ENUM('Proyecto', 'Recurrente')
categoria         ENUM('Material Impreso', 'Diseño', 'Logística', 'Servicios', 'Otro')
monto             DECIMAL(12,2) NOT NULL
moneda            VARCHAR(3) NOT NULL
trm_aplicada      DECIMAL(10,4) NOT NULL
monto_usd         DECIMAL(12,2) GENERATED (monto / trm_aplicada si moneda != USD)
fecha_emision     DATE NOT NULL
fecha_pago_proyectada DATE
fecha_pago_real   DATE
estado            ENUM('Pendiente', 'Pagado')
archivo_pdf_url   VARCHAR(500)
ocr_confidence    DECIMAL(3,2) (0.00 a 1.00)
aprobado_por      UUID FK → usuarios
notas             TEXT
created_at        TIMESTAMP
```

**Tabla: proveedores**

```sql
id                UUID PRIMARY KEY
tipo_persona      ENUM('Natural', 'Juridica') NOT NULL
nombre            VARCHAR(255) UNIQUE NOT NULL
tax_id            VARCHAR(50) NOT NULL (NIT/Cédula)
categoria         ENUM('Imprenta', 'Freelancer', 'Logística', 'Servicios', 'Otro')
pais              VARCHAR(100)
direccion_fiscal  VARCHAR(500)
contacto_email    VARCHAR(255) NOT NULL
contacto_telefono VARCHAR(20)
termino_pago_dias INT DEFAULT 30

-- Datos bancarios
banco             VARCHAR(100)
tipo_cuenta       ENUM('Ahorros', 'Corriente')
numero_cuenta     VARCHAR(50)
titular_cuenta    VARCHAR(255)

-- Estado y auditoría
estado            ENUM('Registro_Incompleto', 'Pendiente_Aprobacion', 'Activo', 'Rechazado', 'Suspendido', 'Inactivo') DEFAULT 'Registro_Incompleto'
fecha_aprobacion  DATE
aprobado_por      UUID FK → usuarios
motivo_rechazo    TEXT
total_facturado   DECIMAL(12,2) DEFAULT 0 (calculado)
ultima_factura    DATE (fecha de última factura cargada)

-- Credenciales para portal
password_hash     VARCHAR(255) (bcrypt)
ultimo_acceso     TIMESTAMP
token_registro    VARCHAR(255) (para link de invitación)
token_expiracion  TIMESTAMP

created_at        TIMESTAMP
updated_at        TIMESTAMP
```

**Tabla: documentos_proveedor**

```sql
id                UUID PRIMARY KEY
proveedor_id      UUID FK → proveedores NOT NULL
tipo_documento    ENUM('RUT', 'Camara_Comercio', 'Cedula_Rep_Legal', 'Cert_Bancaria', 'Poliza', 'Otro') NOT NULL
archivo_url       VARCHAR(500) NOT NULL
fecha_expedicion  DATE
fecha_vencimiento DATE (NULL si no aplica)
estado            ENUM('En_Revision', 'Aprobado', 'Rechazado', 'Vencido') DEFAULT 'En_Revision'
validado_por      UUID FK → usuarios
fecha_validacion  DATE
motivo_rechazo    TEXT
notas             TEXT
created_at        TIMESTAMP
updated_at        TIMESTAMP

-- Índice para alertas de vencimiento
INDEX idx_vencimiento ON documentos_proveedor(fecha_vencimiento) WHERE estado = 'Aprobado'
```

**Tabla: facturas_proveedor** (separada de "gastos" para mayor trazabilidad)

```sql
id                UUID PRIMARY KEY
proveedor_id      UUID FK → proveedores NOT NULL
proyecto_id       UUID FK → proyectos NOT NULL
numero_factura    VARCHAR(100) NOT NULL
fecha_emision     DATE NOT NULL
fecha_vencimiento DATE NOT NULL
subtotal          DECIMAL(12,2) NOT NULL
impuestos         DECIMAL(12,2) NOT NULL
total             DECIMAL(12,2) NOT NULL
moneda            VARCHAR(3) NOT NULL
trm_aplicada      DECIMAL(10,4)
total_usd         DECIMAL(12,2) (calculado)

descripcion       TEXT
archivo_pdf_url   VARCHAR(500) NOT NULL
archivos_adjuntos JSONB (array de URLs de archivos adicionales)

-- Estados y flujo
estado            ENUM('Cargada', 'En_Revision', 'Aprobada', 'Rechazada', 'Pagada') DEFAULT 'Cargada'
fecha_aprobacion  DATE
aprobado_por      UUID FK → usuarios
fecha_pago_programada DATE
fecha_pago_real   DATE
motivo_rechazo    TEXT
notas_internas    TEXT

-- OCR data (si aplica)
ocr_confianza     DECIMAL(3,2)
ocr_datos_raw     JSONB (datos extraídos sin procesar)

created_at        TIMESTAMP (cuando proveedor la cargó)
updated_at        TIMESTAMP

UNIQUE(proveedor_id, numero_factura) -- No permitir duplicados
```

**Tabla: ingresos**

```sql
id                UUID PRIMARY KEY
proyecto_id       UUID FK → proyectos NOT NULL
monto             DECIMAL(12,2) NOT NULL
moneda            VARCHAR(3) NOT NULL
trm_aplicada      DECIMAL(10,4) NOT NULL
fecha_emision     DATE NOT NULL
fecha_vencimiento DATE NOT NULL
fecha_cobro       DATE (NULL si pendiente)
estado            ENUM('Pendiente', 'Cobrado', 'Vencido')
numero_factura    VARCHAR(100)
notas             TEXT
created_at        TIMESTAMP
```

**Tabla: trm_historica** (caché de tasas de cambio)

```sql
id                UUID PRIMARY KEY
fecha             DATE UNIQUE NOT NULL
moneda_origen     VARCHAR(3) DEFAULT 'COP'
moneda_destino    VARCHAR(3) DEFAULT 'USD'
tasa              DECIMAL(10,4) NOT NULL
fuente            VARCHAR(100) (nombre del API)
created_at        TIMESTAMP
```

### 4.3 Seguridad y Cumplimiento

**Autenticación y Autorización:**

- Autenticación: JWT con refresh tokens
- MFA opcional (recomendado para Administrador)
- RBAC (Role-Based Access Control) estricto según tabla de permisos

**Protección de Datos:**

- Encriptación en tránsito: TLS 1.3
- Encriptación en reposo: AWS S3 server-side encryption
- Datos financieros sensibles: Hashing de tax IDs

**Auditoría:**

- Log de todas las acciones financieras (quién, qué, cuándo)
- Retención de logs: 7 años (estándar contable)

**Backup:**

- Backup diario de base de datos (retención 30 días)
- Backup semanal de archivos (retención 90 días)

---

## 5. Plan de Implementación (Roadmap MVP)

### Fase 1: Fundación (Semanas 1-3)

**Objetivos:**

- Infraestructura base desplegada
- Autenticación funcionando
- Modelo de datos implementado

**Entregables:**

- ✅ Setup de repositorio (frontend/backend)
- ✅ DB Schema en producción
- ✅ Sistema de login con 3 roles
- ✅ Diseño UI/UX de dashboards (Figma)

### Fase 2: Core Operativo (Semanas 4-8)

**Objetivos:**

- **Gestión de proyectos con 4 vistas funcionando**
- Portal de proveedores operativo
- Registro de gastos/ingresos

**Entregables:**

- ✅ **Vista Tabla:** Completa con sorting, filtros, edición inline
- ✅ **Vista Kanban:** Drag & drop funcional, tarjetas con info clave
- ✅ **Vista Calendario:** Mes/Semana funcional con drag & drop de fechas
- ✅ **Vista Gantt:** Timeline básico con barras de progreso
- ✅ CRUD de proyectos con presupuestos
- ✅ **Portal de Proveedores completo:**
  - Sistema de registro e invitaciones
  - Carga de documentos legales
  - Carga de facturas por proveedores
  - Dashboard de proveedores
- ✅ Módulo de validación de documentos (Administrativo)
- ✅ Módulo de aprobación de facturas de proveedores
- ✅ Cálculo básico de rentabilidad por proyecto

### Fase 3: Inteligencia Financiera (Semanas 9-11)

**Objetivos:**

- Dashboard ejecutivo operativo
- Multi-moneda y TRM funcionando

**Entregables:**

- ✅ Integración con API de TRM
- ✅ Conversión automática de monedas
- ✅ Dashboard de flujo de caja
- ✅ Reportes de rentabilidad exportables
- ✅ Trigger automático de facturación al completar proyecto

### Fase 4: Automatización OCR (Semanas 12-14)

**Objetivos:**

- OCR de facturas funcionando con 85%+ precisión
- Complementar carga manual de proveedores

**Entregables:**

- ✅ Integración Gmail API (como canal alternativo de recepción)
- ✅ Integración Google Document AI
- ✅ Flujo de validación de gastos OCR
- ✅ Testing con 50 facturas reales
- ✅ **Nota:** OCR funciona en paralelo al portal de proveedores, no lo reemplaza

### Fase 5: Refinamiento y Lanzamiento (Semanas 15-18)

**Objetivos:**

- Sistema estable y optimizado
- Usuarios entrenados

**Entregables:**

- ✅ Testing de carga y optimización
- ✅ **Refinamiento de UX de las 4 vistas de proyectos**
- ✅ Documentación de usuario (4 roles: Admin, PM, Administrativo, Proveedor)
- ✅ Sesiones de capacitación (todos los roles)
- ✅ Onboarding de primeros 5-10 proveedores piloto
- ✅ Go-live con acompañamiento primera semana

**Duración total estimada: 18 semanas (~4.5 meses)**

---

## 6. Riesgos y Mitigaciones

| Riesgo                                           | Probabilidad | Impacto | Mitigación                                                                                           |
| ------------------------------------------------ | ------------ | ------- | ---------------------------------------------------------------------------------------------------- |
| OCR con baja precisión en facturas locales       | Media        | Alto    | Fase de pruebas extendida con 100+ facturas reales antes de automatizar                              |
| Resistencia de proveedores a usar portal digital | Alta         | Alto    | Onboarding asistido + soporte telefónico primera semana + incentivo (pago más rápido si usan portal) |
| Resistencia al cambio de usuarios internos       | Alta         | Medio   | Capacitación práctica + periodo de uso dual (Excel + Sistema) de 2 semanas                           |
| Complejidad de multi-moneda                      | Baja         | Alto    | Usar librería de manejo de money types (money.js) + testing exhaustivo                               |
| Proveedores cargan facturas duplicadas           | Media        | Medio   | Validación única por (proveedor_id + numero_factura) en BD                                           |
| Documentos legales vencidos sin actualizar       | Alta         | Alto    | Sistema de alertas automáticas a 30/15/7 días + suspensión automática                                |
| API de TRM caída                                 | Baja         | Medio   | Fallback a entrada manual + caché de última TRM válida                                               |
| Sobrecarga de correo facturas@                   | Media        | Bajo    | Filtros inteligentes + límite de procesamiento de 100 facturas/día                                   |

---

## 7. Criterios de Aceptación del MVP

**El MVP se considera exitoso si cumple:**

✅ **Funcionalidad Core:**

- [ ] 100% de proyectos gestionados en el sistema (0 en Excel)
- [ ] 80%+ de facturas procesadas vía portal de proveedores
- [ ] 70%+ de proveedores activos usando el portal (resto por email+OCR)
- [ ] Dashboard de flujo de caja actualizado en tiempo real (<5 min delay)
- [ ] 0 proyectos completados sin facturar por >7 días
- [ ] 0 proveedores activos con documentos legales vencidos

✅ **Rendimiento:**

- [ ] Tiempo de carga del dashboard <3 segundos
- [ ] Procesamiento OCR de factura <30 segundos
- [ ] Sistema disponible 99%+ del tiempo laboral

✅ **Adopción:**

- [ ] 100% de usuarios internos acceden al sistema al menos 1x/día
- [ ] 70%+ de proveedores recurrentes registrados en el portal
- [ ] <10% de facturas registradas manualmente (fuera de portal o OCR)

---

## 8. Post-MVP: Evolución Futura

**Funcionalidades candidatas para Fase 2 (6 meses post-lanzamiento):**

1. **Gestión de Proyectos Avanzada:**
   - Dependencias entre proyectos en Vista Gantt
   - Subtareas/Checklist dentro de cada proyecto
   - Comentarios y menciones (@usuario)
   - Campos personalizados configurables
   - Plantillas de proyectos (ej: "Nueva Edición Revista")

2. **Integración Contable Avanzada:**
   - Sincronización bidireccional con software contable (ej: Alegra, Siigo)
   - Generación automática de facturas electrónicas

3. **Gestión de Recursos Internos:**
   - Registro de horas por proyecto (timesheets)
   - Cálculo de costo interno por hora-equipo
   - Vista de capacidad por PM (workload balancing)

4. **Predicción con ML:**
   - Modelo predictivo de rentabilidad en fase de brief
   - Alertas tempranas de proyectos en riesgo de pérdida

5. **Mobile App:**
   - App nativa para aprobación de gastos on-the-go
   - Escaneo de facturas con cámara del celular
   - Notificaciones push de cambios de estado

6. **Colaboración con Clientes:**
   - Portal de cliente para tracking de proyectos
   - Aprobaciones digitales de propuestas

---

## 9. Anexos

### 9.1 Glosario de Términos

- **TRM:** Tasa Representativa del Mercado (tasa de cambio oficial)
- **OCR:** Optical Character Recognition (reconocimiento óptico de caracteres)
- **RBAC:** Role-Based Access Control
- **MFA:** Multi-Factor Authentication
- **Waterfall Chart:** Gráfico de cascada para visualizar cambios acumulativos

### 9.2 Referencias de Diseño la aplicacion debe ser totalmente resonsiva y adaptable a dispositivos moviles, iphone y android

- **Dashboard de inspiración:** [Nexus SaaS Marketing Dashboard](https://dribbble.com/shots/23038744-Nexus-Saas-Marketing-Dashboard)
- **Paleta de colores sugerida:**
  - Primario: #3B82F6 (Azul confianza)
  - Éxito: #10B981 (Verde)
  - Alerta: #F59E0B (Ámbar)
  - Error: #EF4444 (Rojo)
  - Neutral: Escala de grises

https://cdn.dribbble.com/userupload/45308781/file/ea99b44eec9553a046b64ce31fd28030.png?resize=1600x962&vertical=center

### 9.3 Contactos y Recursos

- **Product Owner:** [Tu contacto]
- **Repositorio de diseño:** [Link Figma cuando exista]
- **Repositorio de código:** [Link GitHub cuando exista]
- **Canal de Slack:** #proyecto-gestion-integrada

---

\*\*

## 4. Arquitectura Técnica

### 4.1 Stack Tecnológico Recomendado

**Frontend:**

```
Framework: Next.js 14+ (React)
Ventajas:
  - SSR para dashboards más rápidos
  - API routes integradas
  - Ecosistema maduro para dashboards (Recharts, Tremor)

UI Components: shadcn/ui + Tailwind CSS
State Management: Zustand (más ligero que Redux para MVP)
Visualización de Datos: Recharts o Tremor

Librerías específicas para Gestión de Proyectos:
  - @dnd-kit/core: Drag & drop para Kanban y Gantt
  - react-big-calendar: Base para Vista Calendario
  - gantt-schedule-timeline-calendar: Vista Gantt (o custom con D3.js)
  - react-table / tanstack-table: Vista Tabla con sorting/filtering avanzado
```

**Backend:**

```
Framework: Python FastAPI
Ventajas:
  - Superior para procesamiento OCR (librerías de CV y ML)
  - Integración nativa con pandas para cálculos financieros
  - Validación de datos con Pydantic
  - Documentación automática (Swagger UI)

Alternativa: Node.js (Express/NestJS) si el equipo tiene más experiencia JS
```

**Base de Datos:**

```
Principal: PostgreSQL 15+
Ventajas:
  - ACID para transacciones financieras
  - Tipos de datos JSON para metadata flexible
  - Extensiones útiles: pg_cron (tareas programadas)

Caché (opcional para MVP): Redis
  - Cacheo de TRM diaria
  - Sesiones de usuario
```

**Almacenamiento de Archivos:**

```
Solución: AWS S3 o Cloudflare R2 (más barato)
Estructura de carpetas:
  /facturas/{año}/{mes}/{proyecto_id}/{archivo.pdf}
  /entregables/{año}/{mes}/{proyecto_id}/{archivo}
```

**OCR y Procesamiento:**

```
Opción 1 (recomendada): Google Document AI
  - Mejor precisión en español
  - Pricing predecible

Opción 2 (alternativa): AWS Textract
  - Buen ecosistema AWS si ya lo usan
```

**Integraciones:**

```
Email: Gmail API (OAuth 2.0)
TRM: exchangerate-api.com o API del Banco de la República (Colombia)
Notificaciones:
  - SendGrid (email transaccional)
  - Opcional: Slack/WhatsApp Business API
```

### 4.2 Modelo de Datos (Entidades Principales)

**Diagrama de Relaciones:**

```
┌─────────────┐         ┌──────────────┐         ┌─────────────┐
│  Proyecto   │ 1───N   │facturas_prov.│ N───1   │  Proveedor  │
└─────────────┘         └──────────────┘         └─────────────┘
      │                        │                        │
      │ 1                      │ 1                      │ 1
      │                        │                        │
      │ N                      │ N                      │ N
┌─────────────┐         ┌──────────────┐         ┌─────────────┐
│  Ingreso    │         │   Usuario    │         │ docs_prov.  │
│ (Factura)   │         │   (Auditoría)│         │             │
└─────────────┘         └──────────────┘         └─────────────┘
```

**Esquemas Detallados:**

**Tabla: proyectos**

```sql
id                UUID PRIMARY KEY
nombre            VARCHAR(255) NOT NULL
cliente           VARCHAR(255) NOT NULL
tipo_servicio     ENUM('Revista', 'Branding', 'Digital', 'Otro')
estado            VARCHAR(50) NOT NULL
presupuesto_ingreso_monto    DECIMAL(12,2)
presupuesto_ingreso_moneda   VARCHAR(3)
presupuesto_egreso_monto     DECIMAL(12,2)
presupuesto_egreso_moneda    VARCHAR(3)
fecha_inicio      DATE
fecha_entrega     DATE
responsable_pm_id UUID FK → usuarios

-- Campos para vistas avanzadas
progreso_porcentaje INT DEFAULT 0 CHECK (progreso_porcentaje >= 0 AND progreso_porcentaje <= 100)
prioridad         ENUM('Baja', 'Media', 'Alta', 'Urgente') DEFAULT 'Media'
color_etiqueta    VARCHAR(7) (hex color, ej: #FF5733)
posicion_kanban   INTEGER (para ordenamiento manual en columnas)

-- Timestamps y auditoría
created_at        TIMESTAMP
updated_at        TIMESTAMP
metadata          JSONB (campos personalizados)

-- Índices para optimizar vistas
INDEX idx_estado ON proyectos(estado)
INDEX idx_fecha_entrega ON proyectos(fecha_entrega)
INDEX idx_pm ON proyectos(responsable_pm_id)
```

**Tabla: gastos**

```sql
id                UUID PRIMARY KEY
proyecto_id       UUID FK → proyectos (NULL si es gasto recurrente)
proveedor_id      UUID FK → proveedores
tipo              ENUM('Proyecto', 'Recurrente')
categoria         ENUM('Material Impreso', 'Diseño', 'Logística', 'Servicios', 'Otro')
monto             DECIMAL(12,2) NOT NULL
moneda            VARCHAR(3) NOT NULL
trm_aplicada      DECIMAL(10,4) NOT NULL
monto_usd         DECIMAL(12,2) GENERATED (monto / trm_aplicada si moneda != USD)
fecha_emision     DATE NOT NULL
fecha_pago_proyectada DATE
fecha_pago_real   DATE
estado            ENUM('Pendiente', 'Pagado')
archivo_pdf_url   VARCHAR(500)
ocr_confidence    DECIMAL(3,2) (0.00 a 1.00)
aprobado_por      UUID FK → usuarios
notas             TEXT
created_at        TIMESTAMP
```

**Tabla: proveedores**

```sql
id                UUID PRIMARY KEY
tipo_persona      ENUM('Natural', 'Juridica') NOT NULL
nombre            VARCHAR(255) UNIQUE NOT NULL
tax_id            VARCHAR(50) NOT NULL (NIT/Cédula)
categoria         ENUM('Imprenta', 'Freelancer', 'Logística', 'Servicios', 'Otro')
pais              VARCHAR(100)
direccion_fiscal  VARCHAR(500)
contacto_email    VARCHAR(255) NOT NULL
contacto_telefono VARCHAR(20)
termino_pago_dias INT DEFAULT 30

-- Datos bancarios
banco             VARCHAR(100)
tipo_cuenta       ENUM('Ahorros', 'Corriente')
numero_cuenta     VARCHAR(50)
titular_cuenta    VARCHAR(255)

-- Estado y auditoría
estado            ENUM('Registro_Incompleto', 'Pendiente_Aprobacion', 'Activo', 'Rechazado', 'Suspendido', 'Inactivo') DEFAULT 'Registro_Incompleto'
fecha_aprobacion  DATE
aprobado_por      UUID FK → usuarios
motivo_rechazo    TEXT
total_facturado   DECIMAL(12,2) DEFAULT 0 (calculado)
ultima_factura    DATE (fecha de última factura cargada)

-- Credenciales para portal
password_hash     VARCHAR(255) (bcrypt)
ultimo_acceso     TIMESTAMP
token_registro    VARCHAR(255) (para link de invitación)
token_expiracion  TIMESTAMP

created_at        TIMESTAMP
updated_at        TIMESTAMP
```

**Tabla: documentos_proveedor**

```sql
id                UUID PRIMARY KEY
proveedor_id      UUID FK → proveedores NOT NULL
tipo_documento    ENUM('RUT', 'Camara_Comercio', 'Cedula_Rep_Legal', 'Cert_Bancaria', 'Poliza', 'Otro') NOT NULL
archivo_url       VARCHAR(500) NOT NULL
fecha_expedicion  DATE
fecha_vencimiento DATE (NULL si no aplica)
estado            ENUM('En_Revision', 'Aprobado', 'Rechazado', 'Vencido') DEFAULT 'En_Revision'
validado_por      UUID FK → usuarios
fecha_validacion  DATE
motivo_rechazo    TEXT
notas             TEXT
created_at        TIMESTAMP
updated_at        TIMESTAMP

-- Índice para alertas de vencimiento
INDEX idx_vencimiento ON documentos_proveedor(fecha_vencimiento) WHERE estado = 'Aprobado'
```

**Tabla: facturas_proveedor** (separada de "gastos" para mayor trazabilidad)

```sql
id                UUID PRIMARY KEY
proveedor_id      UUID FK → proveedores NOT NULL
proyecto_id       UUID FK → proyectos NOT NULL
numero_factura    VARCHAR(100) NOT NULL
fecha_emision     DATE NOT NULL
fecha_vencimiento DATE NOT NULL
subtotal          DECIMAL(12,2) NOT NULL
impuestos         DECIMAL(12,2) NOT NULL
total             DECIMAL(12,2) NOT NULL
moneda            VARCHAR(3) NOT NULL
trm_aplicada      DECIMAL(10,4)
total_usd         DECIMAL(12,2) (calculado)

descripcion       TEXT
archivo_pdf_url   VARCHAR(500) NOT NULL
archivos_adjuntos JSONB (array de URLs de archivos adicionales)

-- Estados y flujo
estado            ENUM('Cargada', 'En_Revision', 'Aprobada', 'Rechazada', 'Pagada') DEFAULT 'Cargada'
fecha_aprobacion  DATE
aprobado_por      UUID FK → usuarios
fecha_pago_programada DATE
fecha_pago_real   DATE
motivo_rechazo    TEXT
notas_internas    TEXT

-- OCR data (si aplica)
ocr_confianza     DECIMAL(3,2)
ocr_datos_raw     JSONB (datos extraídos sin procesar)

created_at        TIMESTAMP (cuando proveedor la cargó)
updated_at        TIMESTAMP

UNIQUE(proveedor_id, numero_factura) -- No permitir duplicados
```

**Tabla: ingresos**

```sql
id                UUID PRIMARY KEY
proyecto_id       UUID FK → proyectos NOT NULL
monto             DECIMAL(12,2) NOT NULL
moneda            VARCHAR(3) NOT NULL
trm_aplicada      DECIMAL(10,4) NOT NULL
fecha_emision     DATE NOT NULL
fecha_vencimiento DATE NOT NULL
fecha_cobro       DATE (NULL si pendiente)
estado            ENUM('Pendiente', 'Cobrado', 'Vencido')
numero_factura    VARCHAR(100)
notas             TEXT
created_at        TIMESTAMP
```

**Tabla: trm_historica** (caché de tasas de cambio)

```sql
id                UUID PRIMARY KEY
fecha             DATE UNIQUE NOT NULL
moneda_origen     VARCHAR(3) DEFAULT 'COP'
moneda_destino    VARCHAR(3) DEFAULT 'USD'
tasa              DECIMAL(10,4) NOT NULL
fuente            VARCHAR(100) (nombre del API)
created_at        TIMESTAMP
```

### 4.3 Seguridad y Cumplimiento

**Autenticación y Autorización:**

- Autenticación: JWT con refresh tokens
- MFA opcional (recomendado para Administrador)
- RBAC (Role-Based Access Control) estricto según tabla de permisos

**Protección de Datos:**

- Encriptación en tránsito: TLS 1.3
- Encriptación en reposo: AWS S3 server-side encryption
- Datos financieros sensibles: Hashing de tax IDs

**Auditoría:**

- Log de todas las acciones financieras (quién, qué, cuándo)
- Retención de logs: 7 años (estándar contable)

**Backup:**

- Backup diario de base de datos (retención 30 días)
- Backup semanal de archivos (retención 90 días)

---

## 5. Plan de Implementación (Roadmap MVP)

### Fase 1: Fundación (Semanas 1-3)

**Objetivos:**

- Infraestructura base desplegada
- Autenticación funcionando
- Modelo de datos implementado

**Entregables:**

- ✅ Setup de repositorio (frontend/backend)
- ✅ DB Schema en producción
- ✅ Sistema de login con 3 roles
- ✅ Diseño UI/UX de dashboards (Figma)

### Fase 2: Core Operativo (Semanas 4-8)

**Objetivos:**

- **Gestión de proyectos con 4 vistas funcionando**
- Portal de proveedores operativo
- Registro de gastos/ingresos

**Entregables:**

- ✅ **Vista Tabla:** Completa con sorting, filtros, edición inline
- ✅ **Vista Kanban:** Drag & drop funcional, tarjetas con info clave
- ✅ **Vista Calendario:** Mes/Semana funcional con drag & drop de fechas
- ✅ **Vista Gantt:** Timeline básico con barras de progreso
- ✅ CRUD de proyectos con presupuestos
- ✅ **Portal de Proveedores completo:**
  - Sistema de registro e invitaciones
  - Carga de documentos legales
  - Carga de facturas por proveedores
  - Dashboard de proveedores
- ✅ Módulo de validación de documentos (Administrativo)
- ✅ Módulo de aprobación de facturas de proveedores
- ✅ Cálculo básico de rentabilidad por proyecto

### Fase 3: Inteligencia Financiera (Semanas 9-11)

**Objetivos:**

- Dashboard ejecutivo operativo
- Multi-moneda y TRM funcionando

**Entregables:**

- ✅ Integración con API de TRM
- ✅ Conversión automática de monedas
- ✅ Dashboard de flujo de caja
- ✅ Reportes de rentabilidad exportables
- ✅ Trigger automático de facturación al completar proyecto

### Fase 4: Módulo Legalizador AI & Extracción Híbrida (Implementado v1.2)

**Objetivos:**

- Procesamiento inteligente de documentos con alta precisión y bajos costos.
- Capacidad de manejar tanto PDFs nativos (digitales) como escaneados (imágenes).

**Implementación Actual (Hybrid Extraction Strategy):**

1. **Selector Inteligente de Estrategia:**
   - El sistema analiza el tipo de archivo subido.
   - **PDF Nativo:** Utiliza extracción de texto directa (rápida, costo cero, 100% precisión en caracteres).
   - **Imagen/PDF Escaneado:** Utiliza Vision AI (LLM multimodal) para "ver" y entender el documento.

2. **Flujo de Trabajo "One-Shot" (Review before Save):**
   - **Paso 1:** Usuario carga el documento.
   - **Paso 2:** IA extrae los datos y prellena el formulario de Gasto/Factura.
   - **Paso 3 (Crítico):** Usuario revisa los datos en una UI de edición.
   - **Paso 4:** Usuario confirma y guarda en BD.

3. **Capacidades del Legalizador AI:**
   - Detección automática de: Proveedor (NIT/Nombre), Fecha, N° Factura, Valor Total, IVA.
   - Mapeo inteligente a categorías de gasto del sistema.
   - Detección de anomalías o documentos ilegibles.

**Entregables:**

- ✅ Worker de PDF.js configurado para extracción local.
- ✅ Integración con LLMs para interpretación semántica.
- ✅ Interfaz "ExpenseCapture" con vista dual (Documento + Formulario).
- ✅ Feedback loop: El usuario corrige a la IA, asegurando la calidad del dato.

### Fase 5: Refinamiento y Lanzamiento (Semanas 15-18)

**Objetivos:**

- Sistema estable y optimizado
- Usuarios entrenados

**Entregables:**

- ✅ Testing de carga y optimización
- ✅ **Refinamiento de UX de las 4 vistas de proyectos**
- ✅ Documentación de usuario (4 roles: Admin, PM, Administrativo, Proveedor)
- ✅ Sesiones de capacitación (todos los roles)
- ✅ Onboarding de primeros 5-10 proveedores piloto
- ✅ Go-live con acompañamiento primera semana

**Duración total estimada: 18 semanas (~4.5 meses)**

---

## 6. Riesgos y Mitigaciones

| Riesgo                                           | Probabilidad | Impacto | Mitigación                                                                                           |
| ------------------------------------------------ | ------------ | ------- | ---------------------------------------------------------------------------------------------------- |
| OCR con baja precisión en facturas locales       | Media        | Alto    | Fase de pruebas extendida con 100+ facturas reales antes de automatizar                              |
| Resistencia de proveedores a usar portal digital | Alta         | Alto    | Onboarding asistido + soporte telefónico primera semana + incentivo (pago más rápido si usan portal) |
| Resistencia al cambio de usuarios internos       | Alta         | Medio   | Capacitación práctica + periodo de uso dual (Excel + Sistema) de 2 semanas                           |
| Complejidad de multi-moneda                      | Baja         | Alto    | Usar librería de manejo de money types (money.js) + testing exhaustivo                               |
| Proveedores cargan facturas duplicadas           | Media        | Medio   | Validación única por (proveedor_id + numero_factura) en BD                                           |
| Documentos legales vencidos sin actualizar       | Alta         | Alto    | Sistema de alertas automáticas a 30/15/7 días + suspensión automática                                |
| API de TRM caída                                 | Baja         | Medio   | Fallback a entrada manual + caché de última TRM válida                                               |
| Sobrecarga de correo facturas@                   | Media        | Bajo    | Filtros inteligentes + límite de procesamiento de 100 facturas/día                                   |

---

## 7. Criterios de Aceptación del MVP

**El MVP se considera exitoso si cumple:**

✅ **Funcionalidad Core:**

- [ ] 100% de proyectos gestionados en el sistema (0 en Excel)
- [ ] 80%+ de facturas procesadas vía portal de proveedores
- [ ] 70%+ de proveedores activos usando el portal (resto por email+OCR)
- [ ] Dashboard de flujo de caja actualizado en tiempo real (<5 min delay)
- [ ] 0 proyectos completados sin facturar por >7 días
- [ ] 0 proveedores activos con documentos legales vencidos

✅ **Rendimiento:**

- [ ] Tiempo de carga del dashboard <3 segundos
- [ ] Procesamiento OCR de factura <30 segundos
- [ ] Sistema disponible 99%+ del tiempo laboral

✅ **Adopción:**

- [ ] 100% de usuarios internos acceden al sistema al menos 1x/día
- [ ] 70%+ de proveedores recurrentes registrados en el portal
- [ ] <10% de facturas registradas manualmente (fuera de portal o OCR)

---

## 8. Post-MVP: Evolución Futura

**Funcionalidades candidatas para Fase 2 (6 meses post-lanzamiento):**

1. **Gestión de Proyectos Avanzada:**
   - Dependencias entre proyectos en Vista Gantt
   - ✅ **Subtareas/Checklist jerárquicas (3 niveles):** Implementado
   - Comentarios y menciones (@usuario)
   - ✅ **Campos personalizados (Infraestructura):** Implementado
   - Plantillas de proyectos (ej: "Nueva Edición Revista")

2. **Integración Contable Avanzada:**
   - Sincronización bidireccional con software contable (ej: Alegra, Siigo)
   - Generación automática de facturas electrónicas

3. **Gestión de Recursos Internos:**
   - Registro de horas por proyecto (timesheets)
   - Cálculo de costo interno por hora-equipo
   - Vista de capacidad por PM (workload balancing)

4. **Predicción con ML:**
   - Modelo predictivo de rentabilidad en fase de brief
   - Alertas tempranas de proyectos en riesgo de pérdida

5. **Mobile App:**
   - App nativa para aprobación de gastos on-the-go
   - Escaneo de facturas con cámara del celular
   - Notificaciones push de cambios de estado

6. **Colaboración con Clientes:**
   - Portal de cliente para tracking de proyectos
   - Aprobaciones digitales de propuestas

---

## 9. Anexos

### 9.1 Glosario de Términos

- **TRM:** Tasa Representativa del Mercado (tasa de cambio oficial)
- **OCR:** Optical Character Recognition (reconocimiento óptico de caracteres)
- **RBAC:** Role-Based Access Control
- **MFA:** Multi-Factor Authentication
- **Waterfall Chart:** Gráfico de cascada para visualizar cambios acumulativos

### 9.2 Referencias de Diseño

- **Dashboard de inspiración:** [Nexus SaaS Marketing Dashboard](https://dribbble.com/shots/23038744-Nexus-Saas-Marketing-Dashboard)
- **Paleta de colores sugerida:**
  - Primario: #3B82F6 (Azul confianza)
  - Éxito: #10B981 (Verde)
  - Alerta: #F59E0B (Ámbar)
  - Error: #EF4444 (Rojo)
  - Neutral: Escala de grises

### 9.3 Contactos y Recursos

- **Product Owner:** [Tu contacto]
- **Repositorio de diseño:** [Link Figma cuando exista]
- **Repositorio de código:** [Link GitHub cuando exista]
- **Canal de Slack:** #proyecto-gestion-integrada

---

**Última actualización:** Enero 2026  
**Próxima revisión:** Al finalizar Fase 2 del roadmap
