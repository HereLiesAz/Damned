
import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // --- CTI Collection API ---
  // Proxies real intel from Abuse.ch
  app.get("/api/collect", async (req, res) => {
    try {
      // URLhaus: recent URLs
      const response = await fetch("https://urlhaus-api.abuse.ch/v1/urls/recent/");
      if (!response.ok) {
        throw new Error(`External API error: ${response.statusText}`);
      }
      const data = await response.json();
      
      // Map to consistent internal format
      // urlhaus returns { query_status: "ok", urls: [...] }
      const urls = (data as any).urls || [];
      const tasks = urls.slice(0, 10).map((u: any) => ({
        id: u.id,
        source: "URLhaus Feed",
        target: u.url,
        type: "URL",
        timestamp: u.dateadded,
        threat_type: u.threat || "Unknown",
        reporter: u.reporter,
        status: "pending",
        progress: 0
      }));

      res.json({ tasks });
    } catch (error) {
      console.error("Collection error:", error);
      res.status(500).json({ error: "Failed to collect intel" });
    }
  });

  // --- Application Serving ---
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Sentinel Infrastructure active on http://0.0.0.0:${PORT}`);
  });
}

startServer();
