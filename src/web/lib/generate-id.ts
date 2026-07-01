/** ID temporal para seeds y utilidades de desarrollo local. */
export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
}
