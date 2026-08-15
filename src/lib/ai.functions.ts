import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const suggestInputSchema = z.object({
  name: z.string().trim().min(2).max(120),
  category: z.string().trim().max(120).default(""),
  allergens: z.array(z.string().trim().max(40)).max(20).default([]),
});

const MODEL = "claude-sonnet-4-5-20250929";

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
  .inputValidator((data: unknown) => suggestInputSchema.parse(data))
  .handler(async ({ data }) => {
    const { requireAdminUser } = await import("./current-user.server");
    await requireAdminUser();

    const apiKey = process.env["ANTHROPIC_API_KEY"];
    if (!apiKey) {
      throw new Error("Asistente IA no disponible");
    }

    const category = data.category || "cocina tradicional valenciana";
    const allergens =
      data.allergens.length > 0
        ? ` Alérgenos declarados del plato: ${data.allergens.join(", ")}.`
        : "";

    const prompt =
      `Escribe una descripción apetitosa de máximo 25 palabras en español de España ` +
      `para un plato de restaurante tradicional valenciano llamado "${data.name}" ` +
      `de la categoría "${category}", sin inventar ingredientes que no sean típicos ` +
      `de esa categoría.${allergens} Responde solo con la descripción, sin comillas ni prefijos.`;

    let response: Response;
    try {
      response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-api-key": apiKey,
          "anthropic-version": "2023-06-01",
        },
        body: JSON.stringify({
          model: MODEL,
          max_tokens: 200,
          temperature: 0.7,
          messages: [{ role: "user", content: prompt }],
        }),
      });
    } catch (error) {
      console.error("[ai] fallo de red llamando a Anthropic", error);
      throw new Error("El asistente IA no responde ahora mismo. Inténtalo de nuevo.");
    }

    if (!response.ok) {
      const detail = await response.text().catch(() => "");
      console.error("[ai] Anthropic respondió", response.status, detail.slice(0, 500));
      if (response.status === 401 || response.status === 403) {
        throw new Error("Asistente IA no disponible");
      }
      throw new Error("El asistente IA no pudo generar la descripción.");
    }

    const payload = (await response.json()) as {
      content?: { type: string; text?: string }[];
    };
    const suggestion = (payload.content ?? [])
      .filter((block) => block.type === "text")
      .map((block) => block.text ?? "")
      .join(" ")
      .replace(/^["'«]|["'»]$/g, "")
      .trim();

    if (!suggestion) throw new Error("El asistente IA no devolvió texto.");

    return { suggestion };
  });
