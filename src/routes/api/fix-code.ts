import { createFileRoute } from "@tanstack/react-router";

const SPACE = "https://mohamedamine2011-ai.hf.space";

async function callModel(message: string): Promise<string> {
  const r = await fetch(`${SPACE}/gradio_api/call/chat_function`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ data: [message] }),
  });
  if (!r.ok) throw new Error(`Model request failed: ${r.status}`);
  const { event_id } = (await r.json()) as { event_id: string };

  const stream = await fetch(
    `${SPACE}/gradio_api/call/chat_function/${event_id}`,
  );
  if (!stream.ok || !stream.body) throw new Error("Stream failed");
  const text = await stream.text();

  // Parse SSE: find last "data:" line
  const lines = text.split("\n").filter((l) => l.startsWith("data:"));
  if (!lines.length) throw new Error("No data returned");
  const last = lines[lines.length - 1].slice(5).trim();
  const parsed = JSON.parse(last);
  const content = Array.isArray(parsed) ? parsed[0] : parsed;
  return typeof content === "string" ? content : JSON.stringify(content);
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
