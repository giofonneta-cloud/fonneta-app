# 🎯 Sistema de Subtareas - Instrucciones de Instalación

## ✅ Implementado

Sistema de subtareas jerárquicas con **3 niveles de profundidad**:
- **Nivel 0:** Tarea raíz (macro)
- **Nivel 1:** Subtarea
- **Nivel 2:** Sub-subtarea

---

## 📋 PASO 1: Ejecutar Migración SQL

### Abrir Supabase SQL Editor:
https://supabase.com/dashboard/project/dmdnxgthekbslzehctgn/sql/new

### Ejecutar este SQL:

```sql
-- ============================================================
-- MIGRACIÓN: Agregar Soporte para Subtareas (3 Niveles)
-- ============================================================

-- Agregar columnas para jerarquía de tareas
ALTER TABLE project_tasks
ADD COLUMN IF NOT EXISTS parent_task_id UUID REFERENCES project_tasks(id) ON DELETE CASCADE,
ADD COLUMN IF NOT EXISTS depth_level INTEGER DEFAULT 0 CHECK (depth_level >= 0 AND depth_level <= 2);

-- Crear índice para búsquedas eficientes por parent
CREATE INDEX IF NOT EXISTS idx_project_tasks_parent_id ON project_tasks(parent_task_id);

-- Crear índice compuesto para optimizar queries jerárquicas
CREATE INDEX IF NOT EXISTS idx_project_tasks_hierarchy ON project_tasks(project_id, parent_task_id, depth_level);

-- Función para calcular el nivel de profundidad automáticamente
CREATE OR REPLACE FUNCTION calculate_task_depth()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.parent_task_id IS NULL THEN
        -- Tarea raíz (nivel 0)
        NEW.depth_level := 0;
    ELSE
        -- Obtener el nivel del padre y sumar 1
        SELECT depth_level + 1
        INTO NEW.depth_level
        FROM project_tasks
        WHERE id = NEW.parent_task_id;

        -- Validar que no exceda 3 niveles (0, 1, 2)
        IF NEW.depth_level > 2 THEN
            RAISE EXCEPTION 'No se pueden crear subtareas más allá del nivel 3';
        END IF;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para calcular depth_level automáticamente
DROP TRIGGER IF EXISTS trigger_calculate_task_depth ON project_tasks;
CREATE TRIGGER trigger_calculate_task_depth
    BEFORE INSERT OR UPDATE OF parent_task_id ON project_tasks
    FOR EACH ROW
    EXECUTE FUNCTION calculate_task_depth();

-- Función recursiva para obtener todas las subtareas
CREATE OR REPLACE FUNCTION get_task_subtree(task_id UUID)
RETURNS TABLE (
    id UUID,
    parent_task_id UUID,
    depth_level INTEGER,
    title TEXT,
    status TEXT
) AS $$
BEGIN
    RETURN QUERY
    WITH RECURSIVE task_tree AS (
        SELECT
            t.id,
            t.parent_task_id,
            t.depth_level,
            t.title,
            t.status
        FROM project_tasks t
        WHERE t.id = task_id

        UNION ALL

        SELECT
            t.id,
            t.parent_task_id,
            t.depth_level,
            t.title,
            t.status
        FROM project_tasks t
        INNER JOIN task_tree tt ON t.parent_task_id = tt.id
    )
    SELECT * FROM task_tree;
END;
$$ LANGUAGE plpgsql;
```

**Resultado esperado:** `Success. No rows returned`

---

## 🧪 PASO 2: Probar el Sistema

### 1. Recarga la página
Presiona `Ctrl + Shift + R` para limpiar caché

### 2. Crear una tarea raíz (Nivel 0)
1. Abre el panel de detalles de un proyecto
2. Ve a "Tareas"
3. Clic en "Nueva Tarea"
4. Crea una tarea macro: `"Diseñar interfaz del producto"`

### 3. Agregar subtarea (Nivel 1)
1. Pasa el mouse sobre la tarea recién creada
2. Aparecerá un botón "Agregar subtarea" debajo
3. Haz clic y crea: `"Wireframes baja fidelidad"`

### 4. Agregar sub-subtarea (Nivel 2)
1. Pasa el mouse sobre la subtarea
2. Clic en "Agregar subtarea"
3. Crea: `"Wireframe de home page"`

### 5. Intentar agregar nivel 4 (debe fallar)
1. Intenta agregar subtarea a la sub-subtarea
2. NO debería aparecer el botón "Agregar subtarea" (máximo 3 niveles)

---

## 🎨 Características Visuales

### Indentación Automática
- **Nivel 0:** Sin indentación
- **Nivel 1:** `ml-8` (32px a la derecha)
- **Nivel 2:** `ml-16` (64px a la derecha)

### Expandir/Colapsar
- **Botón ▼** cuando la tarea tiene subtareas
- Click para colapsar/expandir el árbol
- Estado expandido por defecto

### Borde Visual
- Línea vertical gris conectando subtareas
- Ayuda a visualizar la jerarquía

---

## 📊 Estructura de Datos

### Ejemplo en Base de Datos:

```
project_tasks:
id                                | title                    | parent_task_id | depth_level
----------------------------------|--------------------------|----------------|------------
abc-123                           | Diseñar interfaz         | NULL           | 0
def-456                           | Wireframes baja fidelidad| abc-123        | 1
ghi-789                           | Wireframe home page      | def-456        | 2
```

### Estructura en Frontend (Árbol):

```typescript
{
  id: 'abc-123',
  title: 'Diseñar interfaz',
  depth_level: 0,
  parent_task_id: null,
  subtasks: [
    {
      id: 'def-456',
      title: 'Wireframes baja fidelidad',
      depth_level: 1,
      parent_task_id: 'abc-123',
      subtasks: [
        {
          id: 'ghi-789',
          title: 'Wireframe home page',
          depth_level: 2,
          parent_task_id: 'def-456',
          subtasks: []
        }
      ]
    }
  ]
}
```

---

## 🔧 Archivos Modificados

### Creados (3 archivos):
1. `supabase/migrations/20260121_add_subtasks.sql` - Schema DB
2. `src/features/projects/components/TaskItemWithSubtasks.tsx` - Componente recursivo
3. `SUBTAREAS_INSTRUCCIONES.md` - Este documento

### Modificados (3 archivos):
1. `src/features/projects/types/task.types.ts` - Agregados campos de jerarquía
2. `src/features/projects/services/taskService.ts` - Función buildTaskTree
3. `src/features/projects/components/ProjectTaskList.tsx` - Usa TaskItemWithSubtasks

---

## ⚠️ Validaciones Implementadas

### En Base de Datos:
- ✅ Trigger valida máximo 3 niveles
- ✅ Eliminar tarea padre elimina todas las subtareas (CASCADE)
- ✅ depth_level se calcula automáticamente

### En Frontend:
- ✅ Botón "Agregar subtarea" solo aparece hasta nivel 2
- ✅ Confirmación al eliminar incluye advertencia de subtareas

---

## 🐛 Troubleshooting

### Error: "column parent_task_id does not exist"
**Solución:** La migración no se ejecutó. Ejecuta el SQL del Paso 1.

### Error: "No se pueden crear subtareas más allá del nivel 3"
**Solución:** Esto es correcto. El sistema está limitado a 3 niveles.

### Las subtareas no se expanden
**Solución:**
1. Verifica que la función `buildTaskTree` se ejecute correctamente
2. Revisa la consola del navegador por errores
3. Verifica que `parent_task_id` tenga valores correctos en la DB

### Componente TaskItemWithSubtasks no existe
**Solución:** El Hot Reload puede fallar. Reinicia el servidor:
```bash
# Detén el servidor (Ctrl+C)
npm run dev
```

---

## ✅ Resultado Final

Al terminar, deberías poder:
- ✅ Crear tareas macro (nivel 0)
- ✅ Agregar subtareas (nivel 1)
- ✅ Agregar sub-subtareas (nivel 2)
- ✅ Expandir/colapsar árboles de subtareas
- ✅ Ver indentación visual clara
- ✅ Eliminar tareas y sus subtareas automáticamente
- ❌ NO poder crear más de 3 niveles

---

**¡Listo! Ahora tienes un sistema de tareas jerárquicas completo.** 🎉
