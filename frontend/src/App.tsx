import { useEffect, useState } from "react";

const API_BASE = "http://127.0.0.1:8000";

type Tool = {
  name: string;
  description?: string;
};

function App() {
  const [tools, setTools] = useState<Tool[]>([]);
  const [selectedTool, setSelectedTool] = useState<string>("");
  const [args, setArgs] = useState<string>("{}");
  const [result, setResult] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>("");

  useEffect(() => {
    const fetchTools = async () => {
      try {
        const res = await fetch(`${API_BASE}/tools`);
        const data = await res.json();
        setTools(data.tools || []);
      } catch (err: any) {
        console.error("Error fetching tools", err);
        setError("Failed to load tools from backend");
      }
    };

    fetchTools();
  }, []);

  const callTool = async () => {
    setLoading(true);
    setError("");
    setResult("");

    try {
      const parsedArgs = args ? JSON.parse(args) : {};
      const payload = {
        name: selectedTool,
        args: parsedArgs,
      };
      const res = await fetch(`${API_BASE}/call-tool`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const text = await res.text();
        throw new Error(`Backend error (${res.status}): ${text}`);
      }

      const data = await res.json();
      setResult(JSON.stringify(data, null, 2));
    } catch (err: any) {
      console.error("Error calling tool", err);
      setError(err.message || "Failed to call tool");
    } finally {
      setLoading(false);
    }
  };

  const setPreset = (tool: string, presetArgs: object) => {
    setSelectedTool(tool);
    setArgs(JSON.stringify(presetArgs, null, 2));
    setResult("");
    setError("");
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#0f172a",
        color: "#e5e7eb",
        fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI'",
        padding: "2rem",
      }}
    >
      <div
        style={{
          maxWidth: "960px",
          margin: "0 auto",
        }}
      >
        <header style={{ marginBottom: "2rem" }}>
          <h1 style={{ fontSize: "1.8rem", marginBottom: "0.5rem" }}>
            MCP Demo Console
          </h1>
          <p style={{ color: "#9ca3af" }}>
            Interact with MCP tools exposed by your local server.
          </p>
        </header>

        <main
          style={{
            display: "grid",
            gridTemplateColumns: "1.2fr 1fr",
            gap: "1.5rem",
            alignItems: "flex-start",
          }}
        >
          {/* Left column: controls */}
          <section
            style={{
              background: "#020617",
              borderRadius: "0.75rem",
              padding: "1.25rem",
              border: "1px solid #1f2937",
            }}
          >
            <h2 style={{ fontSize: "1.1rem", marginBottom: "1rem" }}>
              Tool & Arguments
            </h2>

            {/* Tool selector */}
            <div style={{ marginBottom: "1rem" }}>
              <label
                style={{
                  display: "block",
                  marginBottom: "0.5rem",
                  fontSize: "0.9rem",
                  color: "#9ca3af",
                }}
              >
                Select tool
              </label>
              <select
                value={selectedTool}
                onChange={(e) => setSelectedTool(e.target.value)}
                style={{
                  width: "100%",
                  padding: "0.5rem 0.75rem",
                  borderRadius: "0.5rem",
                  border: "1px solid #374151",
                  backgroundColor: "#020617",
                  color: "#e5e7eb",
                }}
              >
                <option value="">Choose a tool…</option>
                {tools.map((t) => (
                  <option key={t.name} value={t.name}>
                    {t.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Presets */}
            <div style={{ marginBottom: "1rem" }}>
              <label
                style={{
                  display: "block",
                  marginBottom: "0.5rem",
                  fontSize: "0.9rem",
                  color: "#9ca3af",
                }}
              >
                Quick presets
              </label>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
                <button
                  type="button"
                  onClick={() =>
                    setPreset("greet", { name: "Nitesh" })
                  }
                  style={presetButtonStyle}
                >
                  Greet
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setPreset("list_files", { path: "." })
                  }
                  style={presetButtonStyle}
                >
                  List current dir
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setPreset("read_file", { path: "../mcp_server/server.py" })
                  }
                  style={presetButtonStyle}
                >
                  Read server.py
                </button>
              </div>
            </div>

            {/* Args textarea */}
            <div style={{ marginBottom: "1rem" }}>
              <label
                style={{
                  display: "block",
                  marginBottom: "0.5rem",
                  fontSize: "0.9rem",
                  color: "#9ca3af",
                }}
              >
                Arguments (JSON)
              </label>
              <textarea
                style={{
                  width: "100%",
                  minHeight: "180px",
                  padding: "0.75rem",
                  borderRadius: "0.5rem",
                  border: "1px solid #374151",
                  backgroundColor: "#020617",
                  color: "#e5e7eb",
                  fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco",
                  fontSize: "0.85rem",
                }}
                value={args}
                onChange={(e) => setArgs(e.target.value)}
              />
            </div>

            {/* Call button */}
            <button
              type="button"
              onClick={callTool}
              disabled={!selectedTool || loading}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "0.5rem",
                padding: "0.55rem 1.1rem",
                borderRadius: "999px",
                border: "none",
                background:
                  !selectedTool || loading ? "#6b7280" : "#2563eb",
                color: "#f9fafb",
                fontWeight: 500,
                cursor:
                  !selectedTool || loading ? "not-allowed" : "pointer",
              }}
            >
              {loading ? "Running..." : "Run tool"}
            </button>

            {error && (
              <p style={{ marginTop: "0.75rem", color: "#f97373", fontSize: "0.85rem" }}>
                {error}
              </p>
            )}
          </section>

          {/* Right column: result */}
          <section
            style={{
              background: "#020617",
              borderRadius: "0.75rem",
              padding: "1.25rem",
              border: "1px solid #1f2937",
            }}
          >
            <h2 style={{ fontSize: "1.1rem", marginBottom: "0.75rem" }}>
              Result
            </h2>
            <div
              style={{
                backgroundColor: "#020617",
                borderRadius: "0.5rem",
                border: "1px solid #374151",
                minHeight: "220px",
                padding: "0.75rem",
                fontFamily:
                  "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas",
                fontSize: "0.85rem",
                overflowX: "auto",
                whiteSpace: "pre-wrap",
                wordBreak: "break-word",
              }}
            >
              {result || (!error && "Run a tool to see output here.")}
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}

const presetButtonStyle: React.CSSProperties = {
  padding: "0.35rem 0.75rem",
  borderRadius: "999px",
  border: "1px solid #374151",
  backgroundColor: "#020617",
  color: "#e5e7eb",
  fontSize: "0.8rem",
  cursor: "pointer",
};

export default App;
