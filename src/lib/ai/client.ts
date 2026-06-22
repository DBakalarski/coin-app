import Anthropic from "@anthropic-ai/sdk";
import type { AiCaller } from "@/lib/ai/identifyCoin";

export function getModel(): string {
  return process.env.CLAUDE_MODEL || "claude-opus-4-8";
}

export function getAiCaller(): AiCaller {
  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  return (params) => client.messages.create(params as any) as any;
}
