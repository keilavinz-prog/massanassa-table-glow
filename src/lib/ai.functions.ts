import { createServerFn } from "@tanstack/react-start";

/** Indica si el asistente de redacción está configurado en este entorno. */
export const getAiAssistantStatus = createServerFn({ method: "GET" }).handler(async () => {
  const { requireAdminUser } = await import("./current-user.server");
  await requireAdminUser();
  return { configured: Boolean(process.env["ANTHROPIC_API_KEY"]) };
});

/**
 * Sugiere una descripción de plato. Solo admin. Nunca guarda nada: devuelve
 * texto para que el administrador lo revise y edite antes de guardar.
 */
export const suggestDishDescription = createServerFn({ method: "POST" })
  .inputValidator(async (data: unknown) => {
    const { suggestInputSchema } = await import("./ai.server");
    return suggestInputSchema.parse(data);
  })
  .handler(async ({ data }) => {
    const { requireAdminUser } = await import("./current-user.server");
    await requireAdminUser();
    const { requestDishDescription } = await import("./ai.server");
    return { suggestion: await requestDishDescription(data) };
  });
