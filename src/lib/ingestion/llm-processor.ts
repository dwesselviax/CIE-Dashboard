import OpenAI from "openai";

const client = new OpenAI({
  apiKey: process.env.DEEPSEEK_API_KEY,
  baseURL: "https://api.deepseek.com",
});

export interface LLMResult {
  summary: string;
  actionItems: { text: string; assignee?: string; done: boolean }[];
  keyTopics: string[];
}

const SYSTEM_PROMPT = `You are a meeting notes analyst. Given meeting notes in markdown, extract:
1. A concise 2-3 sentence summary of the key discussion points and outcomes
2. Action items with assignee (if mentioned) and completion status (assume not done unless marked)
3. 3-6 key topics discussed (short phrases)

Respond in JSON only, no markdown wrapping:
{"summary":"...","actionItems":[{"text":"...","assignee":"...","done":false}],"keyTopics":["..."]}`;

export async function processNoteWithLLM(
  title: string,
  body: string,
  attendeeNames: string[]
): Promise<LLMResult> {
  const userPrompt = `Meeting: ${title}
Attendees: ${attendeeNames.join(", ")}

${body}`;

  const response = await client.chat.completions.create({
    model: "deepseek-chat",
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: userPrompt },
    ],
    temperature: 0.3,
    max_tokens: 1000,
  });

  const text = response.choices[0]?.message?.content || "{}";

  try {
    // Strip markdown code fences if present
    const cleaned = text.replace(/^```json?\n?/m, "").replace(/\n?```$/m, "").trim();
    const parsed = JSON.parse(cleaned) as LLMResult;
    return {
      summary: parsed.summary || "",
      actionItems: Array.isArray(parsed.actionItems) ? parsed.actionItems : [],
      keyTopics: Array.isArray(parsed.keyTopics) ? parsed.keyTopics : [],
    };
  } catch {
    console.warn(`Failed to parse LLM response for "${title}", using fallback`);
    return { summary: "", actionItems: [], keyTopics: [] };
  }
}
