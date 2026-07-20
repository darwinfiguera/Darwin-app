export function formatMoney(amount: number): string {
  return `$${Math.round(amount).toLocaleString("es-AR")}`;
}
