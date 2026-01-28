/**
 * Validadores Zod centralizados para todas las entidades
 * Fase 1 del Plan de Mejoramiento - Validación type-safe
 */

import { z } from "zod";

// ============================================
// ENUMS Y TIPOS BASE
// ============================================

export const TaskStatusSchema = z.enum([
  "todo",
  "in_progress",
  "review",
  "done",
]);
export const TaskPrioritySchema = z.enum(["low", "medium", "high", "urgent"]);
export const ProjectStatusSchema = z.enum([
  "pendiente",
  "en_progreso",
  "completado",
  "cancelado",
]);
export const PersonTypeSchema = z.enum(["natural", "juridica"]);
export const DocumentTypeSchema = z.enum([
  "nit",
  "cedula_ciudadania",
  "cedula_extranjeria",
  "pasaporte",
]);
export const ProviderDocTypeSchema = z.enum([
  "RUT",
  "Camara_Comercio",
  "Cedula_Rep_Legal",
  "Cert_Bancaria",
  "Poliza",
  "Habeas_Data",
  "Release_Document",
  "Soporte_Seguridad_Social",
]);
export const DocumentStatusSchema = z.enum([
  "en_revision",
  "aprobado",
  "rechazado",
  "vencido",
]);
export const PaymentMethodSchema = z.enum([
  "efectivo",
  "transferencia",
  "tarjeta",
  "cheque",
  "otro",
]);
export const PaymentStatusSchema = z.enum(["pendiente", "parcial", "pagado"]);
export const UserRoleSchema = z.enum(["admin", "pm", "user", "administrativo"]);

// ============================================
// HELPERS
// ============================================

const uuidSchema = z.string().uuid("ID inválido");
const emailSchema = z
  .string()
  .email("Email inválido")
  .optional()
  .or(z.literal(""));
const phoneSchema = z
  .string()
  .regex(/^[\d\s\-+()]*$/, "Teléfono inválido")
  .optional()
  .or(z.literal(""));
const moneySchema = z.number().min(0, "El valor debe ser positivo");
const percentageSchema = z
  .number()
  .min(0)
  .max(100, "Porcentaje debe estar entre 0 y 100");
const dateSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Formato de fecha inválido (YYYY-MM-DD)");

// ============================================
// PROVIDERS (Proveedores/Clientes)
// ============================================

export const CreateProviderSchema = z.object({
  business_name: z
    .string()
    .min(2, "Nombre debe tener al menos 2 caracteres")
    .max(200),
  contact_name: z.string().max(100).optional(),
  contact_email: emailSchema,
  contact_phone: phoneSchema,
  is_client: z.boolean().default(false),
  is_provider: z.boolean().default(true),
  person_type: PersonTypeSchema.optional(),
  document_type: DocumentTypeSchema.optional(),
  document_number: z.string().max(20).optional(),
  billing_email: emailSchema,
  address: z.string().max(300).optional(),
  city: z.string().max(100).optional(),
  department: z.string().max(100).optional(),
  country: z.string().max(100).default("Colombia"),
});

export const UpdateProviderSchema = CreateProviderSchema.partial();

// ============================================
// PROJECTS (Proyectos)
// ============================================

const ProjectBaseSchema = z.object({
  name: z.string().min(3, "Nombre debe tener al menos 3 caracteres").max(200),
  description: z.string().max(2000).optional(),
  client_id: uuidSchema.optional(),
  pm_id: uuidSchema.optional(),
  status: ProjectStatusSchema.default("pendiente"),
  start_date: dateSchema.optional(),
  end_date: dateSchema.optional(),
  budget: moneySchema.optional(),
});

export const CreateProjectSchema = ProjectBaseSchema.refine(
  (data) => {
    if (data.start_date && data.end_date) {
      return new Date(data.start_date) <= new Date(data.end_date);
    }
    return true;
  },
  {
    message: "La fecha de inicio debe ser anterior a la fecha de fin",
    path: ["end_date"],
  },
);

export const UpdateProjectSchema = ProjectBaseSchema.partial().refine(
  (data) => {
    if (data.start_date && data.end_date) {
      return new Date(data.start_date) <= new Date(data.end_date);
    }
    return true;
  },
  {
    message: "La fecha de inicio debe ser anterior a la fecha de fin",
    path: ["end_date"],
  },
);

// ============================================
// TASKS (Tareas)
// ============================================

export const CreateTaskSchema = z.object({
  project_id: uuidSchema,
  title: z.string().min(1, "El título es requerido").max(300),
  description: z.string().max(5000).optional(),
  status: TaskStatusSchema.default("todo"),
  priority: TaskPrioritySchema.default("medium"),
  assigned_to: uuidSchema.optional(),
  due_date: dateSchema.optional(),
  order_index: z.number().int().min(0).default(0),
  parent_task_id: uuidSchema.nullable().optional(),
  depth_level: z.number().int().min(0).max(2).default(0),
});

export const UpdateTaskSchema = CreateTaskSchema.omit({
  project_id: true,
}).partial();

export const UpdateTaskStatusSchema = z.object({
  task_id: uuidSchema,
  new_status: TaskStatusSchema,
});

// ============================================
// COMMENTS (Comentarios)
// ============================================

export const CreateCommentSchema = z.object({
  project_id: uuidSchema,
  comment: z.string().min(1, "El comentario no puede estar vacío").max(5000),
});

export const UpdateCommentSchema = z.object({
  comment: z.string().min(1).max(5000),
});

// ============================================
// VENTAS (Sales)
// ============================================

export const CreateVentaSchema = z.object({
  project_id: uuidSchema,
  client_id: uuidSchema,
  descripcion: z.string().min(1, "Descripción requerida").max(500),
  monto_base: moneySchema,
  iva_porcentaje: percentageSchema.default(19),
  retencion_porcentaje: percentageSchema.default(0),
  fecha_venta: dateSchema,
  fecha_vencimiento: dateSchema.optional(),
  metodo_pago: PaymentMethodSchema.optional(),
  notas: z.string().max(1000).optional(),
});

export const UpdateVentaSchema = CreateVentaSchema.partial();

export const RegistrarPagoSchema = z.object({
  venta_id: uuidSchema,
  monto: moneySchema.positive("El monto debe ser mayor a 0"),
  metodo_pago: PaymentMethodSchema,
  referencia: z.string().max(100).optional(),
  notas: z.string().max(500).optional(),
});

// ============================================
// GASTOS (Expenses)
// ============================================

export const EntregableSchema = z.object({
  descripcion: z.string().min(1, "Descripción requerida").max(300),
  cantidad: z.number().int().positive("Cantidad debe ser positiva"),
  valor_unitario: moneySchema,
});

export const CreateGastoSchema = z.object({
  project_id: uuidSchema,
  provider_id: uuidSchema,
  descripcion: z.string().min(1, "Descripción requerida").max(500),
  monto: moneySchema,
  fecha_gasto: dateSchema,
  categoria: z.string().max(100).optional(),
  factura_numero: z.string().max(50).optional(),
  notas: z.string().max(1000).optional(),
  entregables: z.array(EntregableSchema).optional(),
});

export const UpdateGastoSchema = CreateGastoSchema.omit({
  entregables: true,
}).partial();

export const CreateGastoWithEntregablesSchema = z.object({
  project_id: uuidSchema,
  provider_id: uuidSchema,
  descripcion: z.string().min(1).max(500),
  fecha_gasto: dateSchema,
  categoria: z.string().max(100).optional(),
  factura_numero: z.string().max(50).optional(),
  notas: z.string().max(1000).optional(),
  entregables: z
    .array(EntregableSchema)
    .min(1, "Debe incluir al menos un entregable"),
});

// ============================================
// FILTERS (Filtros para listados)
// ============================================

export const ProjectFiltersSchema = z.object({
  status: z.array(ProjectStatusSchema).optional(),
  pm_id: uuidSchema.optional(),
  client_id: uuidSchema.optional(),
  search: z.string().max(100).optional(),
  dateFrom: dateSchema.optional(),
  dateTo: dateSchema.optional(),
});

export const TaskFiltersSchema = z.object({
  status: z.array(TaskStatusSchema).optional(),
  priority: z.array(TaskPrioritySchema).optional(),
  assigned_to: uuidSchema.optional(),
  overdue: z.boolean().optional(),
  search: z.string().max(100).optional(),
});

export const TransactionFiltersSchema = z.object({
  type: z.enum(["venta", "gasto", "all"]).optional(),
  status: z.array(PaymentStatusSchema).optional(),
  dateFrom: dateSchema.optional(),
  dateTo: dateSchema.optional(),
  project_id: uuidSchema.optional(),
  provider_id: uuidSchema.optional(),
});

// ============================================
// TYPE EXPORTS (inferidos de los schemas)
// ============================================

export type CreateProviderInput = z.infer<typeof CreateProviderSchema>;
export type UpdateProviderInput = z.infer<typeof UpdateProviderSchema>;
export type CreateProjectInput = z.infer<typeof CreateProjectSchema>;
export type UpdateProjectInput = z.infer<typeof UpdateProjectSchema>;
export type CreateTaskInput = z.infer<typeof CreateTaskSchema>;
export type UpdateTaskInput = z.infer<typeof UpdateTaskSchema>;
export type CreateCommentInput = z.infer<typeof CreateCommentSchema>;
export type CreateVentaInput = z.infer<typeof CreateVentaSchema>;
export type RegistrarPagoInput = z.infer<typeof RegistrarPagoSchema>;
export type CreateGastoInput = z.infer<typeof CreateGastoSchema>;
export type CreateGastoWithEntregablesInput = z.infer<
  typeof CreateGastoWithEntregablesSchema
>;
export type ProjectFilters = z.infer<typeof ProjectFiltersSchema>;
export type TaskFilters = z.infer<typeof TaskFiltersSchema>;
export type TransactionFilters = z.infer<typeof TransactionFiltersSchema>;

// ============================================
// VALIDATION HELPERS
// ============================================

/**
 * Valida datos y retorna resultado tipado o errores formateados
 */
export function validateWithErrors<T>(
  schema: z.ZodSchema<T>,
  data: unknown,
):
  | { success: true; data: T }
  | { success: false; errors: Record<string, string> } {
  const result = schema.safeParse(data);

  if (result.success) {
    return { success: true, data: result.data };
  }

  const errors: Record<string, string> = {};
  result.error.issues.forEach((err) => {
    const path = err.path.join(".");
    errors[path] = err.message;
  });

  return { success: false, errors };
}

/**
 * Valida y lanza error si es inválido (para server actions)
 */
export function validateOrThrow<T>(schema: z.ZodSchema<T>, data: unknown): T {
  return schema.parse(data);
}
