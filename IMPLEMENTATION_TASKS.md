# Sistema de Tareas por Proyecto - Guía de Implementación

## 🎯 Resumen de Implementación

Se ha implementado un **sistema completo de tareas por proyecto estilo ClickUp** con las siguientes funcionalidades:

✅ **Completado:**
- Sistema de tareas con CRUD completo
- Panel de detalles slide-in con tabs (Resumen, Tareas, Comentarios)
- Indicadores de progreso en tarjetas de proyectos
- Edición inline de tareas
- Estados, prioridades y asignación de responsables
- Fechas de entrega y alertas de vencimiento
- Sistema de comentarios en proyectos
- Integración completa con el Kanban existente

---

## 📂 Archivos Creados

### Base de Datos
- `supabase/migrations/20260121_create_project_tasks.sql`
  - Tabla `project_tasks` con campos completos
  - Tabla `project_comments` para comentarios
  - RLS policies configuradas
  - Índices optimizados
  - Triggers para updated_at

### Types
- `src/features/projects/types/task.types.ts`
  - Tipos para tareas y comentarios
  - Enums y constantes UI
  - Tipos de entrada para formularios

### Services
- `src/features/projects/services/taskService.ts`
  - CRUD de tareas
  - CRUD de comentarios
  - Cálculo de estadísticas
  - Reordenamiento de tareas

### Hooks
- `src/features/projects/hooks/useProjectTasks.ts`
  - Gestión de estado de tareas
  - Gestión de estado de comentarios
  - Operaciones optimistas
  - Manejo de errores

### Componentes
1. `src/features/projects/components/TaskStats.tsx` - Widget de estadísticas (compacto y completo)
2. `src/features/projects/components/TaskItem.tsx` - Item de tarea con edición inline
3. `src/features/projects/components/TaskForm.tsx` - Modal crear/editar tarea
4. `src/features/projects/components/ProjectTaskList.tsx` - Lista de tareas agrupadas
5. `src/features/projects/components/ProjectComments.tsx` - Sistema de comentarios
6. `src/features/projects/components/ProjectDetailPanel.tsx` - Panel principal con tabs

### Componentes Modificados
- `src/features/projects/components/ProjectCard.tsx` - Agregado indicador de progreso
- `src/features/projects/components/ProjectBoard.tsx` - Agregado onProjectClick
- `src/features/projects/components/ProjectTable.tsx` - Agregado onProjectClick
- `src/features/projects/components/ProjectListView.tsx` - Integrado panel de detalles

---

## 🚀 Pasos para Completar la Implementación

### 1. Ejecutar Migración de Base de Datos

```bash
cd Fonnetapp

# Opción A: Si tienes Supabase CLI configurado
supabase db push

# Opción B: Ejecutar manualmente en Supabase Dashboard
# 1. Ve a: https://app.supabase.com/project/<tu-proyecto>/sql
# 2. Copia y pega el contenido de: supabase/migrations/20260121_create_project_tasks.sql
# 3. Ejecuta el SQL
```

### 2. Verificar Variables de Entorno

Asegúrate de tener configuradas estas variables en `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=tu_url_aqui
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu_key_aqui
```

### 3. Instalar Dependencias (si es necesario)

```bash
npm install
# o
pnpm install
# o
yarn install
```

### 4. Iniciar Servidor de Desarrollo

```bash
npm run dev
```

La aplicación debería iniciar en `http://localhost:3000` (o el puerto que detecte automáticamente entre 3000-3006).

### 5. Testing Básico

1. **Navegar a Proyectos:**
   - Ve a `/dashboard/projects`
   - Deberías ver el Kanban con tus proyectos

2. **Abrir Panel de Detalles:**
   - Click en cualquier proyecto
   - Debería aparecer el panel slide-in desde la derecha

3. **Crear una Tarea:**
   - En el panel, ve a la tab "Tareas"
   - Click en "Nueva Tarea"
   - Llena el formulario y guarda

4. **Verificar Progreso:**
   - Marca alguna tarea como completada (checkbox)
   - Verifica que el progreso se refleje en la tarjeta del Kanban

5. **Comentarios:**
   - Ve a la tab "Comentarios"
   - Agrega un comentario
   - Debería aparecer inmediatamente

---

## 🐛 Troubleshooting

### Error: "relation project_tasks does not exist"

**Solución:** La migración no se ejecutó correctamente.
```bash
# Verifica la conexión a Supabase
supabase status

# Ejecuta la migración manualmente desde el dashboard
```

### Error: "RLS policies blocking access"

**Solución:** Verifica que el usuario autenticado tenga el rol correcto.
```sql
-- En Supabase SQL Editor, verifica:
SELECT * FROM auth.users WHERE id = auth.uid();

-- Las policies requieren que el usuario sea PM del proyecto o esté asignado a la tarea
```

### Panel de Detalles no Abre

**Solución:** Verifica que ProjectListView esté pasando correctamente `onProjectClick`.

```typescript
// En ProjectListView.tsx debe estar:
const handleProjectClick = (project: Project) => {
    setSelectedProject(project);
    setIsDetailPanelOpen(true);
};
```

### Tareas no Cargan

**Solución:** Verifica en la consola del navegador si hay errores de red.

```javascript
// Abre DevTools (F12) y ve a la tab Console
// Deberías ver requests a /rest/v1/project_tasks
```

---

## 🎨 Personalización

### Cambiar Estados de Tareas

Edita `src/features/projects/types/task.types.ts`:

```typescript
export type TaskStatus = 'todo' | 'in_progress' | 'review' | 'done' | 'tu_nuevo_estado';

export const TASK_STATUS_LABELS: Record<TaskStatus, string> = {
    todo: 'Por Hacer',
    in_progress: 'En Progreso',
    review: 'En Revisión',
    done: 'Completada',
    tu_nuevo_estado: 'Tu Label',
};
```

**Importante:** También debes actualizar el CHECK constraint en la base de datos:

```sql
ALTER TABLE project_tasks DROP CONSTRAINT IF EXISTS project_tasks_status_check;
ALTER TABLE project_tasks ADD CONSTRAINT project_tasks_status_check
CHECK (status IN ('todo', 'in_progress', 'review', 'done', 'tu_nuevo_estado'));
```

### Agregar Campos Adicionales

1. **En la base de datos:**
```sql
ALTER TABLE project_tasks ADD COLUMN tu_nuevo_campo TEXT;
```

2. **En los tipos:**
```typescript
// task.types.ts
export interface ProjectTask {
    // ... campos existentes
    tu_nuevo_campo?: string;
}
```

3. **En el formulario:**
```typescript
// TaskForm.tsx
// Agrega el input correspondiente
```

---

## 📊 Funcionalidades Implementadas

### ✅ Tareas
- [x] Crear, editar, eliminar tareas
- [x] Estados: Todo, In Progress, Review, Done
- [x] Prioridades: Low, Medium, High, Urgent
- [x] Asignación a miembros del equipo
- [x] Fechas de entrega
- [x] Alertas de vencimiento
- [x] Edición inline (título, estado, prioridad, asignado)
- [x] Reordenamiento manual (order_index)
- [x] Agrupamiento por estado

### ✅ Comentarios
- [x] Crear, eliminar comentarios
- [x] Timestamp automático
- [x] Avatar del usuario
- [x] Formato de texto preservado (whitespace)

### ✅ Panel de Detalles
- [x] Slide-in desde la derecha
- [x] 3 tabs: Resumen, Tareas, Comentarios
- [x] Cierre con Escape o overlay
- [x] Información completa del proyecto
- [x] Estadísticas de tareas en tiempo real

### ✅ Indicadores de Progreso
- [x] Barra de progreso en tarjetas del Kanban
- [x] Contador "X/Y completadas"
- [x] Alerta de tareas vencidas
- [x] Widget de estadísticas detalladas

---

## 🔜 Próximos Pasos (Fase 2)

Las siguientes funcionalidades quedaron fuera del scope inicial pero pueden implementarse en el futuro:

### Drag & Drop Avanzado
- [ ] Drag & drop funcional en Kanban para cambiar estados
- [ ] Validaciones de transición
- [ ] Modal de confirmación al mover a "Completado"

### Archivos Adjuntos
- [ ] Upload de archivos (brief, entregables)
- [ ] Integración con Supabase Storage
- [ ] Preview de archivos

### Historial de Auditoría
- [ ] Timeline de cambios de estado
- [ ] Registro de quién hizo qué y cuándo

### Vistas Adicionales
- [ ] Vista Calendario con fechas de entrega
- [ ] Vista Gantt con timeline

### Triggers Inteligentes
- [ ] Notificaciones automáticas
- [ ] Cálculo de márgenes al completar
- [ ] Bloqueo de edición de gastos

---

## 📝 Notas Técnicas

### RLS Policies
Las políticas de seguridad están configuradas para:
- **SELECT**: Los PMs pueden ver tareas de sus proyectos, y los usuarios asignados pueden ver sus tareas
- **INSERT**: Solo los PMs pueden crear tareas en sus proyectos
- **UPDATE**: Creadores, asignados y PMs pueden actualizar tareas
- **DELETE**: Solo los PMs pueden eliminar tareas

### Performance
- Las queries incluyen JOINs con `auth.users` para obtener nombres
- Índices configurados en: `project_id`, `assigned_to`, `status`, `due_date`
- El hook usa optimistic updates para mejor UX

### Estado Local vs Servidor
- Los cambios se reflejan inmediatamente en la UI (optimistic)
- En caso de error, se revierte automáticamente
- Los stats se recalculan en tiempo real

---

## 📞 Soporte

Si encuentras problemas durante la implementación:

1. **Revisa la consola del navegador** (F12 → Console)
2. **Revisa los logs de Supabase** (Dashboard → Logs → API)
3. **Verifica las RLS policies** (Dashboard → Authentication → Policies)
4. **Comprueba la migración** (Dashboard → SQL Editor → History)

---

**¡Listo para Testing!** 🚀

Una vez completados los pasos 1-4, la funcionalidad completa de tareas estará operativa.
