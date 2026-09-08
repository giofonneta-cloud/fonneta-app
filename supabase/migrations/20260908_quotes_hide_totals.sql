alter table public.quotes
  add column hide_totals boolean not null default false;

comment on column public.quotes.hide_totals is 'Cuando es true, el documento enviado al cliente oculta la caja de Subtotal/IVA/TOTAL agregada (usado en cotizaciones con opciones alternativas donde sumar no aplica).';
