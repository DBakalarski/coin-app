import type { CoinIdentity, ValueEstimate } from "@/lib/types";
import type { AiCaller } from "@/lib/ai/identifyCoin";

const ESTIMATE_SCHEMA = {
  type: "object",
  additionalProperties: false,
  properties: { value: { type: "number" } },
  required: ["value"],
} as const;

export function parseEstimateResponse(text: string): ValueEstimate {
  const raw = JSON.parse(text);
  return {
    value: typeof raw.value === "number" ? raw.value : 0,
    currency: "PLN",
    source: "ai_estimate",
  };
}

export async function estimateValue(
  client: AiCaller, model: string, frontB64: string, backB64: string,
  identity: CoinIdentity,
): Promise<ValueEstimate> {
  const ctx = `${identity.country}, ${identity.year ?? "?"}, ${identity.denomination}`;
  const res = await client({
    model,
    max_tokens: 512,
    thinking: { type: "adaptive" as const },
    output_config: { format: { type: "json_schema", schema: ESTIMATE_SCHEMA } },
    messages: [
      {
        role: "user" as const,
        content: [
          { type: "image", source: { type: "base64", media_type: "image/jpeg", data: frontB64 } },
          { type: "image", source: { type: "base64", media_type: "image/jpeg", data: backB64 } },
          { type: "text", text:
            `Brak tej monety w katalogu cenowym. Oszacuj orientacyjną wartość ` +
            `rynkową w PLN dla monety: ${ctx}. Zwróć tylko liczbę 'value'.` },
        ],
      },
    ],
  });
  const text = res.content.find((c) => c.type === "text")?.text ?? "{}";
  return parseEstimateResponse(text);
}
