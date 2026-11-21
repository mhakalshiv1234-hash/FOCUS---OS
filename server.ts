import 'dotenv/config';
import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI } from '@google/genai';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PORT = Number(process.env.PORT || 3000);

interface MentorChatTurn {
  role: 'user' | 'assistant';
  text: string;
}

function buildMentorSystemInstruction(contextSnapshot: unknown): string {
  const safeContext =
    contextSnapshot && typeof contextSnapshot === 'object'
      ? JSON.stringify(contextSnapshot, null, 2).slice(0, 12000)
      : '{}';

  return [
    'You are FOCUS//OS — the user’s personal AI operating system, productivity strategist, academic mentor, intelligence analyst, and personal development assistant.',
    '',
    'COMMUNICATION RULES:',
    '- Talk naturally, like an intelligent friend. Avoid robotic corporate phrasing and generic assistant clichés.',
    '- Be direct, clear, practical, and honest. Explain complex math or strategy cleanly.',
    '- Challenge excuses constructively when you see slippage; never blindly agree just to flatter.',
    '- Encourage with substance, not fake motivation. Never label the user as "lazy".',
    '- Diagnose patterns cleanly: (1) Actual problem, (2) Cause, (3) Practical fix, (4) Recovery plan, (5) Tracking metric.',
    '- Never create unrealistic timetables just to look productive. Respect evening/night preferences, Library for Math vs Home for GAT/English/revision, and 3-hour JEE Math lectures.',
    '- Treat MUN (Joint Crisis Committee / Cold War / DCI) as a developing interest, NOT a daily mandatory burden.',
    '- STRICT HONESTY: Use ONLY the recorded numbers in the LIVE TELEMETRY & PROFILE CONTEXT below. Never fabricate completed lectures, mock scores, focus minutes, or streak counts.',
    '- Core creed: DISCIPLINE OVER MOTIVATION · CONSISTENCY OVER INTENSITY · PROGRESS OVER PERFECTION · CHARACTER OVER EGO.',
    '',
    'LIVE TELEMETRY & PROFILE CONTEXT (JSON):',
    safeContext,
  ].join('\n');
}

function parseApiError(err: unknown): { status: number; message: string } {
  const errObj = err && typeof err === 'object' ? (err as { status?: number; message?: string }) : {};
  const rawMessage = err instanceof Error ? err.message : String(err);
  const sdkStatus = typeof errObj.status === 'number' ? errObj.status : 0;
  console.error('[api/mentor] Gemini call failed:', sdkStatus || 'unknown', rawMessage.slice(0, 300));

  if (sdkStatus === 400 || /API_KEY_INVALID|API key not valid/i.test(rawMessage)) {
    return {
      status: 400,
      message:
        'The configured Gemini API key appears invalid. Please verify GEMINI_API_KEY in Settings > Secrets.',
    };
  }
  if (sdkStatus === 403 || /PERMISSION_DENIED|403/i.test(rawMessage)) {
    return {
      status: 403,
      message:
        'Gemini API permission was denied. Check your API key in Settings > Secrets.',
    };
  }
  if (sdkStatus === 429 || /RESOURCE_EXHAUSTED|429/i.test(rawMessage)) {
    return {
      status: 429,
      message:
        'Gemini API quota limit reached. Wait briefly or check quota in Settings > Secrets.',
    };
  }
  if (sdkStatus === 404 || /NOT_FOUND|404/i.test(rawMessage)) {
    return {
      status: 404,
      message: 'Requested Gemini model could not be found. Check model configuration.',
    };
  }
  return {
    status: 500,
    message: `Unable to reach Gemini right now (${rawMessage.slice(0, 140)}).`,
  };
}

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '64kb' }));

  app.get('/api/health', (_req, res) => {
    res.json({
      ok: true,
      mentorConfigured: Boolean(process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== 'MY_GEMINI_API_KEY'),
    });
  });

  app.post('/api/mentor', async (req, res) => {
    const apiKey = process.env.GEMINI_API_KEY?.trim();
    if (!apiKey || apiKey === 'MY_GEMINI_API_KEY') {
      res.status(503).json({
        error:
          'Personal AI Mentor requires GEMINI_API_KEY on the server. Add your key in Settings > Secrets.',
      });
      return;
    }

    const body = req.body as {
      messages?: unknown;
      contextSnapshot?: unknown;
    };

    if (!Array.isArray(body?.messages) || body.messages.length === 0) {
      res.status(400).json({ error: 'Provide at least one message for your mentor.' });
      return;
    }

    const sanitizedTurns: MentorChatTurn[] = [];
    for (const item of body.messages.slice(-12)) {
      if (!item || typeof item !== 'object') continue;
      const candidate = item as { role?: unknown; text?: unknown };
      const role = candidate.role === 'assistant' ? 'assistant' : 'user';
      const text = typeof candidate.text === 'string' ? candidate.text.trim().slice(0, 4000) : '';
      if (text.length > 0) {
        sanitizedTurns.push({ role, text });
      }
    }

    if (sanitizedTurns.length === 0) {
      res.status(400).json({ error: 'Message text cannot be empty.' });
      return;
    }

    try {
      const ai = new GoogleGenAI({
        apiKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          },
        },
      });

      const contents = sanitizedTurns.map((turn) => ({
        role: turn.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: turn.text }],
      }));

      const response = await ai.models.generateContent({
        model: 'gemini-4-hydrogen',
        contents,
        config: {
          systemInstruction: buildMentorSystemInstruction(body.contextSnapshot),
        },
      });

      const replyText = response.text?.trim();
      if (!replyText) {
        res.status(502).json({ error: 'Mentor returned an empty response. Try asking again.' });
        return;
      }

      res.json({ reply: replyText });
    } catch (err) {
      const mapped = parseApiError(err);
      res.status(mapped.status).json({ error: mapped.message });
    }
  });

  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distDir = path.resolve(__dirname, 'dist');
    app.use(express.static(distDir));
    app.get('*', (_req, res) => {
      const indexPath = path.join(distDir, 'index.html');
      if (fs.existsSync(indexPath)) {
        res.sendFile(indexPath);
      } else {
        res.status(404).send('Build output not found. Run npm run build first.');
      }
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`FOCUS//OS server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start FOCUS//OS server:', err);
  process.exit(1);
});
