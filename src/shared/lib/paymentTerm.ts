// Fonneta paga a 30 días contados desde la radicación de la factura en el sistema
// (no desde la fecha de emisión ni desde la aprobación).
export const DEFAULT_PAYMENT_TERM_DAYS = 30;

const TIME_ZONE = 'America/Bogota';

// Fecha calendario (YYYY-MM-DD) en hora de Colombia: new Date().toISOString() cambia de día a las 7 p.m.
export function toBogotaDateISO(value: string | Date): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date(value));
}

export function addDaysISO(dateISO: string, days: number): string {
  const [year, month, day] = dateISO.split('-').map(Number);
  return new Date(Date.UTC(year, month - 1, day + days)).toISOString().split('T')[0];
}

// Fecha límite de pago: día de radicación + plazo.
export function paymentDueDateISO(radicationDate: string | Date, termDays: number): string {
  return addDaysISO(toBogotaDateISO(radicationDate), termDays);
}

export function formatLongDateES(dateISO: string): string {
  const [year, month, day] = dateISO.split('-').map(Number);
  return new Date(Date.UTC(year, month - 1, day)).toLocaleDateString('es-CO', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  });
}
