import type { CoinIdentity } from "@/lib/types";

export type AiCaller = (params: any) => Promise<{
  content: Array<{ type: string; text?: string }>;
}>;

export const IDENTITY_SCHEMA = {
  type: "object",
  additionalProperties: false,
  properties: {
    country: { type: "string" },
    year: { type: ["integer", "null"] },
    denomination: { type: "string" },
    name: { type: "string" },
    material: { type: ["string", "null"] },
    mint_mark: { type: ["string", "null"] },
    confidence: { type: "string", enum: ["high", "low"] },
  },
  required: ["country", "denomination", "name", "confidence"],
} as const;

const PROMPT =
  "Rozpoznaj monetę na zdjęciach (pierwsze = awers, drugie = rewers). " +
  "Podaj kraj, rok (liczba lub null jeśli nieczytelny), nominał, nazwę, " +
  "materiał i znak menniczy jeśli widoczne. Ustaw confidence na 'high' tylko " +
  "gdy masz pewność co do kraju, roku i nominału; w razie wątpliwości 'low'.";

export function buildIdentifyParams(model: string, frontB64: string, backB64: string) {
  return {
    model,
    max_tokens: 1024,
    thinking: { type: "adaptive" as const },
    output_config: { format: { type: "json_schema", schema: IDENTITY_SCHEMA } },
    messages: [
      {
        role: "user" as const,
        content: [
          { type: "image", source: { type: "base64", media_type: "image/jpeg", data: frontB64 } },
          { type: "image", source: { type: "base64", media_type: "image/jpeg", data: backB64 } },
          { type: "text", text: PROMPT },
        ],
      },
    ],
  };
}

export function parseIdentityResponse(text: string): CoinIdentity {
  const raw = JSON.parse(text);
  return {
    country: String(raw.country ?? "").trim(),
    year: typeof raw.year === "number" ? raw.year : null,
    denomination: String(raw.denomination ?? "").trim(),
    name: String(raw.name ?? "").trim(),
    material: raw.material ? String(raw.material).trim() : null,
    mintMark: raw.mint_mark ? String(raw.mint_mark).trim() : null,
    confidence: raw.confidence === "high" ? "high" : "low",
  };
}

export async function identifyCoin(
  client: AiCaller, model: string, frontB64: string, backB64: string,
): Promise<CoinIdentity> {
  const res = await client(buildIdentifyParams(model, frontB64, backB64));
  const text = res.content.find((c) => c.type === "text")?.text ?? "{}";
  return parseIdentityResponse(text);
}
