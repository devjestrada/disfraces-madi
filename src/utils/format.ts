export function formatCOP(amount: number) {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatCOPInput(rawDigits: string) {
  if (!rawDigits) {
    return '';
  }
  return `$ ${new Intl.NumberFormat('es-CO').format(Number(rawDigits))}`;
}

export function parseCOPInput(value: string) {
  return value.replace(/\D/g, '');
}
