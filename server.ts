
import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import { GoogleGenAI, Type } from "@google/genai";

dotenv.config();

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // --- Health Check ---
  app.get("/api/health", (req, res) => res.json({ status: "ok", mode: process.env.NODE_ENV }));

  // --- State Management ---
  let campaignState = [
    { id: 'CAM-01', name: 'NIGHTFALL', status: 'active', success_rate: 82, dwell_time: '14d', targets_compromised: 12, last_activity: '2m ago' },
    { id: 'CAM-02', name: 'GHOST-C2', status: 'planning', success_rate: 0, dwell_time: '0d', targets_compromised: 0, last_activity: 'Just now' },
  ];

  let operationState = [
    { id: 'OP-A1', campaign_id: 'CAM-01', type: 'Phishing', target: 'finance.corp.net', status: 'completed', progress: 100, technique: 'Spear Phishing' },
    { id: 'OP-B1', campaign_id: 'CAM-01', type: 'Exploit', target: 'srv-04.dc.corp', status: 'processing', progress: 45, technique: 'CVE-2023-1284' },
    { id: 'OP-C1', campaign_id: 'CAM-01', type: 'Exfiltration', target: 'db.corp.net', status: 'pending', progress: 0 },
  ];

  let payloadState = [
    { id: 'P-1', name: 'cobalt_beacon.exe', type: 'C2', size: '1.2MB', uploaded_at: '2024-04-26' },
    { id: 'P-2', name: 'shadow_inject.ps1', type: 'Loader', size: '14KB', uploaded_at: '2024-04-26' },
    { id: 'P-3', name: 'exfil_routine.py', type: 'Lateral', size: '256KB', uploaded_at: '2024-04-26' },
  ];

  const generateFallbackTasks = () => {
    const timestamp = Date.now();
    return [
      {
        id: `MOCK-${timestamp}-${Math.floor(Math.random() * 10000)}`,
        source: 'System Cache',
        target: 'http://malicious-example.com/payload.exe',
        type: 'URL',
        timestamp: new Date().toISOString(),
        threat_type: 'Malware Distribution',
        status: 'pending',
        progress: 0
      },
      {
        id: `MOCK-${timestamp}-${Math.floor(Math.random() * 10000 + 10000)}`,
        source: 'System Cache',
        target: 'http://phish-gate.net/login',
        type: 'URL',
        timestamp: new Date().toISOString(),
        threat_type: 'Phishing',
        status: 'pending',
        progress: 0
      }
    ];
  };

  // --- AI Interactions API ---
  app.post("/api/ai/target-intel", async (req, res) => {
    try {
      const { targetVal } = req.body;
      const prompt = `Perform a deep offensive intelligence analysis on the following target: "${targetVal}".

      Objectives:
      1. Create a "Target Profile" (likely business role, technologies used, online presence).
      2. Identify 3 "Personalized Attack Vectors" (phishing lures, specific exploits based on likely tech stack).
      3. Suggest a "Recommended Payload" type.

      Return the data in a clear, structured JSON format with keys: "profile", "vectors" (array of {title, description, platform}), and "recommendation".`;

      const result = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              profile: { type: Type.STRING },
              vectors: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    title: { type: Type.STRING },
                    description: { type: Type.STRING },
                    platform: { type: Type.STRING }
                  },
                  required: ["title", "description", "platform"]
                }
              },
              recommendation: { type: Type.STRING }
            },
            required: ["profile", "vectors", "recommendation"]
          }
        }
      });

      const intel = JSON.parse(result.text || "{}");
      res.json(intel);
    } catch (err: any) {
      console.error("[AI] Error generating target intel:", err);
      res.status(500).json({ error: err.message });
    }
  });

  app.post("/api/ai/analyze-task", async (req, res) => {
    try {
      const { target, threat_type } = req.body;
      const prompt = `Analyze this Cyber Threat Intelligence (CTI) entry from URLhaus.
      URL: ${target}
      Reported Threat: ${threat_type}

      Tasks:
      1. Explain what this threat likely is based on the reported type.
      2. Identify potential business impact (Low, Medium, High).
      3. Assign a numeric risk score (0-100).

      Return as JSON with keys: "summary", "impact", "risk_score".`;

      const result = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              summary: { type: Type.STRING },
              impact: { type: Type.STRING },
              risk_score: { type: Type.NUMBER }
            },
            required: ["summary", "impact", "risk_score"]
          }
        }
      });

      const analysis = JSON.parse(result.text || "{}");
      res.json(analysis);
    } catch (err: any) {
      console.error("[AI] Error analyzing task:", err);
      res.status(500).json({ error: err.message });
    }
  });

  // --- CTI Collection API ---
  app.get("/api/collect", async (req, res) => {
    console.log("[CTI] Collection request received");
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 8000);

      const response = await fetch("https://urlhaus-api.abuse.ch/v1/urls/recent/", {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        },
        signal: controller.signal
      });
      clearTimeout(timeout);
      
      if (!response.ok) {
        console.warn(`[CTI] URLhaus API returned ${response.status}. Using fallback data.`);
        return res.json({ 
          tasks: generateFallbackTasks(), 
          warning: `Upstream API status: ${response.status}` 
        });
      }
      
      const data = await response.json();
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
      console.error("[CTI] Error collecting intel:", error);
      // Fallback mock data if external API fails
      res.json({ tasks: generateFallbackTasks(), warning: "Using fallback data due to API connectivity issues" });
    }
  });

  // --- Attack Infrastructure API ---
  app.get("/api/campaigns", (req, res) => res.json(campaignState));
  
  app.get("/api/payloads", (req, res) => res.json(payloadState));

  app.post("/api/payloads/upload", (req, res) => {
    const { name, size, type, encrypted } = req.body;
    const newPayload = {
      id: `P-${Math.random().toString(36).substr(2, 4).toUpperCase()}`,
      name: name || 'artifact.bin',
      type: type || 'Unknown',
      size: size || '0KB',
      uploaded_at: new Date().toISOString().split('T')[0],
      encrypted: encrypted || false
    };
    payloadState.unshift(newPayload);
    res.json(newPayload);
  });

  app.delete("/api/payloads/:id", (req, res) => {
    payloadState = payloadState.filter(p => p.id !== req.params.id);
    res.json({ status: 'deleted' });
  });

  app.get("/api/operations", (req, res) => res.json(operationState));

  app.post("/api/operations/dispatch", async (req, res) => {
    const { target, type, platform, payload, technique, config } = req.body;
    
    const newOp = {
      id: `OP-${Math.random().toString(36).substr(2, 4).toUpperCase()}`,
      campaign_id: 'CAM-01',
      type: type || 'Phishing',
      target: target,
      status: 'processing' as const,
      progress: 0,
      config: config,
      technique: technique || (
        platform === 'facebook' ? 'Messenger Lure' :
        platform === 'whatsapp' ? 'Smishing / WhatsApp Redirect' :
        type === 'Exploit' ? 'CVE-2023-RCE' : 
        type === 'Exfiltration' ? 'DNS Tunneling' : 
        type === 'Scan' ? 'Nmap / Service Recon' :
        'Social Engineering'
      )
    };

    operationState.unshift(newOp);
    if (operationState.length > 20) operationState.pop();

    console.log(`[DISPATCH] [${platform.toUpperCase()}] type=${type} target=${target} tech=${newOp.technique}`);
    if (config) console.log(`[CONFIG] ${JSON.stringify(config)}`);

    // Platform-specific delivery (SMS/WhatsApp/Facebook)
    let finalPayload = payload;
    if (!finalPayload) {
      if (type === 'Phishing') {
        if (platform === 'whatsapp') finalPayload = "SECURITY: Your WhatsApp account requires immediate verification. Click to secure: https://wa-verify.net/reset";
        else if (platform === 'facebook') finalPayload = "ATTENTION: We've detected an unauthorized login to your Facebook account. Review here: https://fb-security.com/alert";
        else {
          const baseUrl = process.env.PHISHING_BASE_URL || 'https://damned-auth.net';
          finalPayload = `ALERT: Cloud infrastructure breach detected. Authorize access here: ${baseUrl}`;
        }
      } else if (type === 'Exploit') {
        finalPayload = `Payload delivery initiated. Module: ${newOp.technique}. Vector: ${platform}. CVE: ${config?.cve || 'N/A'}. Ldr: ${config?.payload_type || 'N/A'}.`;
      } else if (type === 'Exfiltration') {
        finalPayload = `Establishing tunnel via ${newOp.technique}. Dest: ${config?.destination || 'N/A'}. Proto: ${config?.protocol || 'N/A'}. Chunk: ${config?.chunking || 'N/A'}.`;
      } else if (type === 'Scan') {
        finalPayload = `Initiating recon: ${newOp.technique} against target ${target}. Mapping attack surface.`;
      } else {
        finalPayload = `Automated ${type} module triggered against ${target} via ${platform}.`;
      }
    }

    if (platform === 'whatsapp' || platform === 'sms') {
      const twilioSid = process.env.TWILIO_ACCOUNT_SID;
      const twilioToken = process.env.TWILIO_AUTH_TOKEN;

      if (twilioSid && twilioToken) {
        const to = platform === 'whatsapp' ? `whatsapp:${target}` : target;
        const from = platform === 'whatsapp' ? `whatsapp:${process.env.TWILIO_WHATSAPP_NUMBER}` : process.env.TWILIO_FROM_NUMBER;

        try {
          const twilioUrl = `https://api.twilio.com/2010-04-01/Accounts/${twilioSid}/Messages.json`;
          const auth = Buffer.from(`${twilioSid}:${twilioToken}`).toString('base64');
          
          await fetch(twilioUrl, {
            method: 'POST',
            headers: {
              'Authorization': `Basic ${auth}`,
              'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: new URLSearchParams({
              To: to,
              From: from!,
              Body: finalPayload,
            }),
          });
        } catch (err) {
          console.error("Twilio delivery failed:", err);
        }
      }
    } else if (platform === 'facebook') {
      const fbToken = process.env.FACEBOOK_PAGE_ACCESS_TOKEN;
      if (fbToken) {
        try {
          const fbUrl = `https://graph.facebook.com/v19.0/me/messages?access_token=${fbToken}`;
          await fetch(fbUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              recipient: { id: target },
              message: { text: finalPayload }
            })
          });
        } catch (err) {
          console.error("Facebook delivery failed:", err);
        }
      }
    }

    // Simulate progress
    const timer = setInterval(() => {
      const op = operationState.find(o => o.id === newOp.id);
      if (op) {
        op.progress += 10;
        if (op.progress >= 100) {
          op.progress = 100;
          op.status = 'completed';
          clearInterval(timer);
          
          // Update campaign stats
          const campaign = campaignState.find(c => c.id === op.campaign_id);
          if (campaign) {
            campaign.targets_compromised += 1;
            campaign.last_activity = 'Just now';
          }
        }
      } else {
        clearInterval(timer);
      }
    }, 2000);

    res.json({ 
      status: "dispatched", 
      message: `${type} operation ${newOp.id} initialized against ${target}.`,
      operation: newOp
    });
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
    console.log(`Damned Infrastructure active on http://0.0.0.0:${PORT}`);
  });
}

startServer();
