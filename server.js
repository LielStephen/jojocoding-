import express from 'express';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import fs from 'node:fs';

dotenv.config({ path: '.env.local', quiet: true });
dotenv.config({ quiet: true });

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const apiPort = Number(process.env.API_PORT ?? process.env.PORT ?? 3001);
const model = process.env.GEMINI_MODEL ?? 'gemini-2.5-flash';
const apiKey = process.env.GEMINI_API_KEY;

const app = express();
app.use(express.json({ limit: '1mb' }));

const responseSchema = {
  type: 'object',
  additionalProperties: false,
  required: [
    'summary',
    'intent',
    'confidence',
    'whatItDoes',
    'importantLines',
    'risks',
    'improvements',
    'nextStep',
  ],
  properties: {
    summary: {
      type: 'string',
    },
    intent: {
      type: 'string',
    },
    confidence: {
      type: 'string',
      enum: ['high', 'medium', 'low'],
    },
    whatItDoes: {
      type: 'array',
      minItems: 2,
      maxItems: 6,
      items: {
        type: 'string',
      },
    },
    importantLines: {
      type: 'array',
      minItems: 1,
      maxItems: 4,
      items: {
        type: 'object',
        additionalProperties: false,
        required: ['label', 'snippet', 'why'],
        properties: {
          label: {
            type: 'string',
          },
          snippet: {
            type: 'string',
          },
          why: {
            type: 'string',
          },
        },
      },
    },
    risks: {
      type: 'array',
      minItems: 1,
      maxItems: 5,
      items: {
        type: 'string',
      },
    },
    improvements: {
      type: 'array',
      minItems: 1,
      maxItems: 5,
      items: {
        type: 'string',
      },
    },
    nextStep: {
      type: 'string',
    },
  },
};

app.get('/api/health', (_request, response) => {
  response.json({
    ok: true,
    configured: Boolean(apiKey),
    model,
  });
});

app.post('/api/analyze', async (request, response) => {
  const code = typeof request.body?.code === 'string' ? request.body.code.trim() : '';
  const mode = typeof request.body?.mode === 'string' ? request.body.mode.trim() : 'explain';
  const question =
    typeof request.body?.question === 'string' ? request.body.question.trim() : '';

  if (!code) {
    response.status(400).json({
      error: 'No code was provided.',
    });
    return;
  }

  if (!apiKey) {
    response.status(500).json({
      error: 'Missing GEMINI_API_KEY. Add it to your environment before using the analyzer.',
    });
    return;
  }

  try {
    const ai = new GoogleGenAI({ apiKey });
    const prompt = [
      'You are a precise senior software engineer.',
      'Analyze only the supplied code and the user request.',
      'Avoid generic advice, filler, and hype.',
      'If the snippet is incomplete, say that clearly and lower confidence.',
      `Mode: ${mode}`,
      `User request: ${question || 'No extra question provided.'}`,
      'Return concise, specific findings.',
      'Code:',
      code,
    ].join('\n\n');

    const result = await ai.models.generateContent({
      model,
      contents: prompt,
      config: {
        temperature: 0.2,
        responseMimeType: 'application/json',
        responseJsonSchema: responseSchema,
      },
    });

    if (!result.text) {
      throw new Error('The model returned an empty response.');
    }

    response.json({
      analysis: JSON.parse(result.text),
      model,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'The analyzer could not complete the request.';

    response.status(500).json({
      error: message,
    });
  }
});

const distPath = path.join(__dirname, 'dist');
const hasBuild = fs.existsSync(path.join(distPath, 'index.html'));

if (hasBuild) {
  app.use(express.static(distPath));

  app.get('*', (request, response, next) => {
    if (request.path.startsWith('/api/')) {
      next();
      return;
    }

    response.sendFile(path.join(distPath, 'index.html'));
  });
}

app.listen(apiPort, () => {
  console.log(`Code Stand API listening on http://localhost:${apiPort}`);
});
