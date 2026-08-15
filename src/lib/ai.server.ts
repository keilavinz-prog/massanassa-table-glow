import { z } from "zod";

export const suggestInputSchema = z.object({
  name: z.string().trim().min(2).max(120),
  category: z.string().trim().max(120).default(""),
  allergens: z.array(z.string().trim().max(40)).max(20).default([]),
});

export type SuggestInput = z.infer<typeof suggestInputSchema>;

const MODEL = "claude-sonnet-4-5-20250929";

function buildPrompt(data: SuggestInput) {
  const category = data.category || "cocina tradicional valenciana";
  const allergens =
    data.allergens.length > 0
      ? ` Alérgenos declarados del plato: ${data.allergens.join(", ")}.`
      : "";
  return (
    `Escribe una descripción apetitosa de máximo 25 palabras en español de España ` +
    `para un plato de restaurante tradicional valenciano llamado "${data.name}" ` +
    `de la categoría "${category}", sin inventar ingredientes que no sean típicos ` +
    `de esa categoría.${allergens} Responde solo con la descripción, sin comillas ni prefijos.`
  );
}

/** Llama a la API de Anthropic y devuelve texto plano listo para revisar. */
export async function requestDishDescription(data: SuggestInput): Promise<string> {
  const apiKey = process.env["ANTHROPIC_API_KEY"];
  if (!apiKey) throw new Error("Asistente IA no disponible");

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
        messages: [{ role: "user", content: buildPrompt(data) }],
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

  const payload = (await response.json()) as { content?: { type: string; text?: string }[] };
  const suggestion = (payload.content ?? [])
    .filter((block) => block.type === "text")
    .map((block) => block.text ?? "")
    .join(" ")
    .replace(/^["'«]|["'»]$/g, "")
    .trim();

  if (!suggestion) throw new Error("El asistente IA no devolvió texto.");
  return suggestion;
}
