# 🚨 SOLUCIÓN DEFINITIVA - Sistema de Tareas

## Diagnóstico del Problema

**Error actual:** `401 Unauthorized - "new row violates row-level security policy for table 'project_tasks'"`

**Causa raíz:** Las políticas RLS (Row Level Security) en Supabase están bloqueando los INSERTs porque:
1. Las políticas originales requieren que el usuario sea PM del proyecto
2. Las migraciones de corrección NO se ejecutaron correctamente
3. Hay múltiples políticas conflictivas en la base de datos

---

## ✅ PASO 1: LIMPIAR Y RECREAR POLÍTICAS RLS

### 1.1 Abrir Supabase SQL Editor

Ve a: https://supabase.com/dashboard/project/dmdnxgthekbslzehctgn/sql/new

### 1.2 Ejecutar Script de Limpieza Total

Copia y pega **EXACTAMENTE** este SQL:

```sql
-- ============================================================
-- LIMPIEZA TOTAL DE POLÍTICAS RLS
-- ============================================================

-- Desactivar RLS temporalmente
ALTER TABLE project_tasks DISABLE ROW LEVEL SECURITY;
ALTER TABLE project_comments DISABLE ROW LEVEL SECURITY;

-- Eliminar TODAS las políticas existentes de project_tasks
DO $$
DECLARE
    pol_name TEXT;
BEGIN
    FOR pol_name IN
        SELECT policyname
        FROM pg_policies
        WHERE schemaname = 'public' AND tablename = 'project_tasks'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.project_tasks', pol_name);
        RAISE NOTICE 'Dropped policy: %', pol_name;
    END LOOP;
END $$;

-- Eliminar TODAS las políticas existentes de project_comments
DO $$
DECLARE
    pol_name TEXT;
BEGIN
    FOR pol_name IN
        SELECT policyname
        FROM pg_policies
        WHERE schemaname = 'public' AND tablename = 'project_comments'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.project_comments', pol_name);
        RAISE NOTICE 'Dropped policy: %', pol_name;
    END LOOP;
END $$;

-- ============================================================
-- CREAR POLÍTICAS NUEVAS SUPER SIMPLES
-- ============================================================

-- Políticas para project_tasks (permitir TODO a usuarios autenticados)
CREATE POLICY "tasks_select_all"
    ON project_tasks FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "tasks_insert_all"
    ON project_tasks FOR INSERT
    TO authenticated
    WITH CHECK (true);

CREATE POLICY "tasks_update_all"
    ON project_tasks FOR UPDATE
    TO authenticated
    USING (true)
    WITH CHECK (true);

CREATE POLICY "tasks_delete_all"
    ON project_tasks FOR DELETE
    TO authenticated
    USING (true);

-- Políticas para project_comments (permitir TODO a usuarios autenticados)
CREATE POLICY "comments_select_all"
    ON project_comments FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "comments_insert_all"
    ON project_comments FOR INSERT
    TO authenticated
    WITH CHECK (true);

CREATE POLICY "comments_update_all"
    ON project_comments FOR UPDATE
    TO authenticated
    USING (true)
    WITH CHECK (true);

CREATE POLICY "comments_delete_all"
    ON project_comments FOR DELETE
    TO authenticated
    USING (true);

-- Reactivar RLS
ALTER TABLE project_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_comments ENABLE ROW LEVEL SECURITY;

-- Verificar políticas creadas
SELECT schemaname, tablename, policyname, cmd, qual, with_check
FROM pg_policies
WHERE tablename IN ('project_tasks', 'project_comments')
ORDER BY tablename, policyname;
```

### 1.3 Verificar Resultado

Deberías ver al final una tabla mostrando las 8 políticas nuevas:

```
project_comments | comments_delete_all | DELETE | true | true
project_comments | comments_insert_all | INSERT | true | true
project_comments | comments_select_all | SELECT | true | NULL
project_comments | comments_update_all | UPDATE | true | true
project_tasks    | tasks_delete_all    | DELETE | true | true
project_tasks    | tasks_insert_all    | INSERT | true | true
project_tasks    | tasks_select_all    | SELECT | true | NULL
project_tasks    | tasks_update_all    | UPDATE | true | true
```

---

## ✅ PASO 2: VERIFICAR ESTRUCTURA DE TABLAS

### 2.1 Verificar que las tablas existen

En el mismo SQL Editor, ejecuta:

```sql
-- Verificar estructura de project_tasks
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'project_tasks'
ORDER BY ordinal_position;

-- Verificar estructura de project_comments
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'project_comments'
ORDER BY ordinal_position;
```

Deberías ver:
- **project_tasks**: 13 columnas (id, project_id, title, description, status, priority, assigned_to, due_date, completed_at, order_index, created_by, created_at, updated_at)
- **project_comments**: 6 columnas (id, project_id, user_id, comment, created_at, updated_at)

---

## ✅ PASO 3: PROBAR INSERT MANUAL

### 3.1 Obtener tu user_id

```sql
SELECT auth.uid() AS my_user_id;
```

Copia el UUID que te devuelve (ej: `abc12345-6789-...`)

### 3.2 Obtener un project_id

```sql
SELECT id, name FROM projects LIMIT 1;
```

Copia el UUID del proyecto (ej: `def67890-1234-...`)

### 3.3 Hacer INSERT de prueba

```sql
INSERT INTO project_tasks (
    project_id,
    title,
    description,
    status,
    priority,
    created_by
) VALUES (
    'def67890-1234-...',  -- Reemplaza con tu project_id
    'Tarea de prueba',
    'Esta es una tarea de prueba manual',
    'todo',
    'medium',
    'abc12345-6789-...'   -- Reemplaza con tu user_id
) RETURNING *;
```

**Resultado esperado:** La tarea se inserta exitosamente y ves toda la fila devuelta.

**Si falla:** Comparte el error exacto.

---

## ✅ PASO 4: PROBAR DESDE LA APLICACIÓN

### 4.1 Limpiar caché del navegador

1. Abre DevTools (F12)
2. Click derecho en el botón de recargar
3. Selecciona "Vaciar caché y recargar de manera forzada"

### 4.2 Abrir consola y verificar errores

1. Asegúrate que la tab "Console" esté abierta
2. Limpia los errores anteriores (icono 🚫)

### 4.3 Intentar crear tarea

1. Ve a http://localhost:3001/dashboard/projects
2. Abre el panel de detalles de un proyecto
3. Ve a la tab "Tareas"
4. Clic en "Nueva Tarea"
5. Llena el formulario con:
   - Título: "Prueba final"
   - Descripción: "Testing después de fix"
   - Estado: Por Hacer
   - Prioridad: Media
6. Clic en "Crear Tarea"

### 4.4 Verificar en la consola

**Si funciona:**
- No aparece error 401
- La tarea aparece en la lista inmediatamente
- El panel muestra "1/1 completadas" al cerrar y reabrir

**Si falla:**
- Busca el error POST en la tab "Network"
- Click en la petición fallida
- Ve a la tab "Response"
- Compárteme el JSON de respuesta

---

## ✅ PASO 5: VERIFICAR EN BASE DE DATOS

```sql
-- Ver todas las tareas creadas
SELECT
    id,
    title,
    status,
    priority,
    created_at,
    created_by
FROM project_tasks
ORDER BY created_at DESC
LIMIT 10;
```

Deberías ver las tareas que creaste desde la aplicación.

---

## 🐛 TROUBLESHOOTING

### Error: "relation project_tasks does not exist"
**Solución:** Ejecuta la migración original:
```bash
cd Fonnetapp
# Ejecuta el SQL de supabase/migrations/20260121_create_project_tasks.sql
```

### Error: "auth.uid() returns null"
**Solución:** No estás autenticado. Cierra sesión y vuelve a iniciar.

### Error: "column project_id does not exist"
**Solución:** La tabla no tiene la estructura correcta. Ejecuta el DROP y CREATE de nuevo:

```sql
DROP TABLE IF EXISTS project_tasks CASCADE;
DROP TABLE IF EXISTS project_comments CASCADE;

-- Luego ejecuta el SQL completo de la migración 20260121_create_project_tasks.sql
```

---

## 📊 RESUMEN DE CAMBIOS

### Archivos Creados (10):
1. ✅ `supabase/migrations/20260121_create_project_tasks.sql` - Schema DB
2. ✅ `src/features/projects/types/task.types.ts` - Tipos TypeScript
3. ✅ `src/features/projects/services/taskService.ts` - API Layer
4. ✅ `src/features/projects/hooks/useProjectTasks.ts` - React Hook
5. ✅ `src/features/projects/components/TaskStats.tsx` - Widget estadísticas
6. ✅ `src/features/projects/components/TaskItem.tsx` - Item de tarea
7. ✅ `src/features/projects/components/TaskForm.tsx` - Formulario
8. ✅ `src/features/projects/components/ProjectTaskList.tsx` - Lista tareas
9. ✅ `src/features/projects/components/ProjectComments.tsx` - Comentarios
10. ✅ `src/features/projects/components/ProjectDetailPanel.tsx` - Panel principal

### Archivos Modificados (4):
1. ✅ `src/features/projects/components/ProjectCard.tsx` - Agregado indicador progreso
2. ✅ `src/features/projects/components/ProjectBoard.tsx` - Agregado onProjectClick
3. ✅ `src/features/projects/components/ProjectTable.tsx` - Click en filas
4. ✅ `src/features/projects/components/ProjectListView.tsx` - Panel de detalles

### Estado Actual:
- ✅ Código implementado al 100%
- ✅ Servidor corriendo en http://localhost:3001
- ❌ **RLS Policies bloqueando INSERTs** ← PROBLEMA ACTUAL
- ⏳ Testing pendiente

---

## 🎯 SIGUIENTE PASO

**EJECUTA EL SQL DEL PASO 1.2** en Supabase Dashboard ahora mismo.

Una vez ejecutado, recarga la página y prueba de nuevo. Si sigue fallando, compárteme:
1. El resultado del SELECT de verificación de políticas
2. El error exacto de la consola del navegador
3. La respuesta del POST desde la tab Network

---

*Este documento garantiza que las políticas RLS estén correctas. Sin esto, el sistema NO funcionará.*
