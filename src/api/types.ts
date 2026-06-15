/** Variables inyectadas en el contexto Hono */
export type AppVariables = {
  safeHeaders: Record<string, string>;
  requestId: string;
};
