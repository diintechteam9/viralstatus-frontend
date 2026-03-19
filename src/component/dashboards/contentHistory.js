const HISTORY_KEY = "contentToolsHistory";

export function saveToHistory(toolName, input, output, meta = {}) {
  try {
    const existing = JSON.parse(localStorage.getItem(HISTORY_KEY) || "[]");
    const entry = {
      id: Date.now(),
      toolName,
      input: typeof input === "string" ? input.slice(0, 200) : String(input).slice(0, 200),
      output,
      meta,
      createdAt: new Date().toISOString(),
    };
    const updated = [entry, ...existing].slice(0, 200);
    localStorage.setItem(HISTORY_KEY, JSON.stringify(updated));
  } catch (_) {}
}

export { HISTORY_KEY };
