import { createFileRoute } from "@tanstack/react-router";

const MODEL = "gemini-2.5-flash";

async function callModel(prompt: string): Promise<string> {
  const key = process.env.GOOGLE_API_KEY;
  if (!key) throw new Error("API key is not configured");
  const r = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-goog-api-key": key },
      body: JSON.stringify({
        contents: [{ role: "user", parts: [{ text: prompt }] }],
      }),
    },
  );
  const data = (await r.json().catch(() => ({}))) as {
    candidates?: { content?: { parts?: { text?: string }[] } }[];
    error?: { message?: string };
  };
  if (!r.ok) throw new Error(data.error?.message ?? `Model request failed: ${r.status}`);
  const text = data.candidates?.[0]?.content?.parts?.map((p) => p.text ?? "").join("");
  if (!text) throw new Error("No data returned");
  return text;
}

export const Route = createFileRoute("/api/fix-code")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          const body = (await request.json()) as {
            code?: string;
            language?: string;
          };
          const code = (body.code ?? "").toString();
          const language = (body.language ?? "auto").toString();
          if (!code.trim()) {
            return Response.json({ error: "Code is required" }, { status: 400 });
          }
          const prompt = `You are an expert code reviewer. Fix all bugs, syntax errors, and issues in the following ${language} code. Return ONLY the corrected code inside a single fenced code block, followed by a short bulleted list of the changes you made.\n\nCode:\n\`\`\`${language === "auto" ? "" : language}\n${code}\n\`\`\``;
          const result = await callModel(prompt);
          return Response.json({ result });
        } catch (e) {
          const message = e instanceof Error ? e.message : "Unknown error";
          return Response.json({ error: message }, { status: 500 });
        }
      },
    },
  },
});
