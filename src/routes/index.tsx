import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "2t Fix — AI Code Repair" },
      {
        name: "description",
        content:
          "Paste broken code and get a clean, fixed version instantly. Powered by AI.",
      },
      { property: "og:title", content: "2t Fix — AI Code Repair" },
      {
        property: "og:description",
        content: "Paste broken code, get it fixed instantly.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

const LANGUAGES = [
  "auto",
  "javascript",
  "typescript",
  "python",
  "java",
  "c",
  "cpp",
  "csharp",
  "go",
  "rust",
  "php",
  "ruby",
  "swift",
  "kotlin",
  "sql",
  "html",
  "css",
  "bash",
];

function extractCodeBlock(text: string): { code: string; notes: string } {
  const match = text.match(/```[a-zA-Z0-9_-]*\n([\s\S]*?)```/);
  if (!match) return { code: text, notes: "" };
  const code = match[1].trimEnd();
  const notes = text.replace(match[0], "").trim();
  return { code, notes };
}

function Index() {
  const [code, setCode] = useState("");
  const [language, setLanguage] = useState("auto");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{ code: string; notes: string } | null>(
    null,
  );
  const [copied, setCopied] = useState(false);

  async function handleFix() {
    if (!code.trim()) return;
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const r = await fetch("/api/fix-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code, language }),
      });
      const data = (await r.json()) as { result?: string; error?: string };
      if (!r.ok || data.error) throw new Error(data.error || "Request failed");
      setResult(extractCodeBlock(data.result ?? ""));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }

  async function handleCopy() {
    if (!result) return;
    await navigator.clipboard.writeText(result.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-md bg-foreground text-background font-mono text-sm font-bold">
              {"</>"}
            </div>
            <span className="text-lg font-semibold tracking-tight">2t Fix</span>
          </div>
          <a
            href="https://huggingface.co/spaces/mohamedamine2011/ai"
            target="_blank"
            rel="noreferrer"
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            Model ↗
          </a>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 py-12">
        <div className="mb-10 max-w-2xl">
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
            Fix broken code in seconds.
          </h1>
          <p className="mt-3 text-base text-muted-foreground">
            Paste your code, pick the language, and let AI clean up the bugs,
            syntax errors, and rough edges.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* Input */}
          <section className="rounded-xl border border-border bg-card">
            <div className="flex items-center justify-between border-b border-border px-4 py-3">
              <span className="text-sm font-medium">Your code</span>
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                className="rounded-md border border-border bg-background px-2 py-1 text-xs font-mono text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              >
                {LANGUAGES.map((l) => (
                  <option key={l} value={l}>
                    {l}
                  </option>
                ))}
              </select>
            </div>
            <textarea
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="Paste your broken code here…"
              spellCheck={false}
              className="h-96 w-full resize-none bg-transparent px-4 py-3 font-mono text-sm leading-relaxed text-foreground placeholder:text-muted-foreground focus:outline-none"
            />
            <div className="flex items-center justify-between border-t border-border px-4 py-3">
              <span className="text-xs text-muted-foreground">
                {code.length} characters
              </span>
              <button
                onClick={handleFix}
                disabled={loading || !code.trim()}
                className="inline-flex items-center gap-2 rounded-md bg-foreground px-4 py-2 text-sm font-medium text-background transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
              >
                {loading ? "Fixing…" : "Fix code"}
              </button>
            </div>
          </section>

          {/* Output */}
          <section className="rounded-xl border border-border bg-card">
            <div className="flex items-center justify-between border-b border-border px-4 py-3">
              <span className="text-sm font-medium">Fixed code</span>
              {result && (
                <button
                  onClick={handleCopy}
                  className="rounded-md border border-border px-2 py-1 text-xs font-medium hover:bg-accent transition-colors"
                >
                  {copied ? "Copied ✓" : "Copy"}
                </button>
              )}
            </div>
            <div className="h-96 overflow-auto px-4 py-3">
              {loading && (
                <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <span className="h-2 w-2 animate-pulse rounded-full bg-foreground" />
                    Analyzing your code…
                  </div>
                </div>
              )}
              {!loading && error && (
                <div className="rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">
                  {error}
                </div>
              )}
              {!loading && !error && !result && (
                <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                  The fixed code will appear here.
                </div>
              )}
              {!loading && result && (
                <pre className="whitespace-pre-wrap font-mono text-sm leading-relaxed text-foreground">
                  {result.code}
                </pre>
              )}
            </div>
            {result?.notes && (
              <div className="border-t border-border px-4 py-3">
                <p className="mb-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Changes
                </p>
                <div className="whitespace-pre-wrap text-sm text-foreground/80">
                  {result.notes}
                </div>
              </div>
            )}
          </section>
        </div>

        <footer className="mt-16 border-t border-border pt-6 text-center text-xs text-muted-foreground">
          Powered by Med Amine Mokni AI
        </footer>
      </main>
    </div>
  );
}
