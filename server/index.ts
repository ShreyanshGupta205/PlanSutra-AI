import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import crypto from 'crypto';
import {
  CreateEventRequestSchema,
  AIStructuredPlanResponseSchema,
  AIChatRequestSchema,
  AdminLoginRequestSchema,
} from '../src/schemas';
import { generateFallbackPlan } from './aiFallback';
import { SEEDED_ADMIN_TEMPLATES } from '../src/features/events/sampleData';
import { AdminAuditLog, SystemHealthMetrics, AdminTemplate } from '../src/types';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || '';
const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-3.5-flash-lite';

// Server-side Admin Master Secret
// In production or development, this MUST be configured in environment variables.
// If unset, admin authentication fails closed to prevent unauthorized access.
const ADMIN_SECRET_KEY = process.env.ADMIN_SECRET_KEY ? process.env.ADMIN_SECRET_KEY.trim() : '';

if (!ADMIN_SECRET_KEY) {
  console.warn('⚠️  SECURITY WARNING: ADMIN_SECRET_KEY is not configured in .env. Admin portal will fail closed.');
}

// Security Headers Middleware
app.use((_req: Request, res: Response, next: NextFunction) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  next();
});

// Middleware
app.use(cors());
app.use(express.json({ limit: '2mb' }));

// Safe JSON Parse Error Handler
app.use((err: any, _req: Request, res: Response, next: NextFunction) => {
  if (err instanceof SyntaxError && 'body' in err) {
    return res.status(400).json({ error: 'Malformed JSON request body.' });
  }
  next(err);
});

// In-Memory Storage for Admin Templates & System Health
let adminTemplates: AdminTemplate[] = JSON.parse(JSON.stringify(SEEDED_ADMIN_TEMPLATES));
const auditLogs: AdminAuditLog[] = [
  {
    id: 'audit-init',
    actor: 'system',
    action: 'SYSTEM_BOOT',
    target: 'PlanSutra Server',
    timestamp: new Date().toISOString(),
    outcome: 'success',
    details: 'PlanSutra AI backend initialized securely.',
  },
];

// Ephemeral Admin Sessions Store (SessionToken -> { createdAt, expiresAt, ip })
interface AdminSession {
  createdAt: number;
  expiresAt: number;
  ip: string;
}
const adminSessions = new Map<string, AdminSession>();

// Failed Login Attempts Tracker (IP -> { count, lockedUntil })
interface LoginAttemptRecord {
  count: number;
  firstAttemptAt: number;
  lockedUntil?: number;
}
const loginAttempts = new Map<string, LoginAttemptRecord>();

// Aggregate AI & System Health Metrics (Zero PII logged)
const healthMetrics: SystemHealthMetrics = {
  aiRequestCount: 0,
  aiFailureCount: 0,
  averageLatencyMs: 0,
  errorCategories: {},
  lastHealthCheck: new Date().toISOString(),
  serverStatus: 'healthy',
  uptimeSeconds: 0,
};

let totalLatencyAccumulator = 0;
const serverStartTime = Date.now();

// Rate limiter for AI endpoints (30 requests/min per IP)
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();

function checkRateLimit(req: Request, res: Response, next: NextFunction) {
  const ip = req.ip || req.socket.remoteAddress || 'unknown';
  const now = Date.now();
  const limitWindow = 60 * 1000; // 1 minute
  const maxRequests = 30;

  const userRecord = rateLimitMap.get(ip);
  if (!userRecord || now > userRecord.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + limitWindow });
    return next();
  }

  if (userRecord.count >= maxRequests) {
    return res.status(429).json({
      error: 'Rate limit exceeded. Please wait a moment before sending another AI request.',
    });
  }

  userRecord.count += 1;
  next();
}

// Server-Verified Admin Authorization Middleware
function requireAdminAuth(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).json({ error: 'Missing authorization header.' });
  }

  const token = authHeader.replace(/^Bearer\s+/i, '').trim();
  if (!token) {
    return res.status(401).json({ error: 'Authorization token required.' });
  }

  const session = adminSessions.get(token);
  const now = Date.now();

  if (!session || now > session.expiresAt) {
    if (session) {
      adminSessions.delete(token); // Clean up expired session
    }
    auditLogs.push({
      id: `audit-${Date.now()}`,
      actor: 'unauthorized_session',
      action: 'ADMIN_ACCESS_ATTEMPT',
      target: req.originalUrl,
      timestamp: new Date().toISOString(),
      outcome: 'failure',
      details: 'Expired or invalid session token provided.',
    });
    return res.status(403).json({ error: 'Forbidden: Invalid or expired administrator session.' });
  }

  next();
}

// ----------------------------------------------------
// Health Check Endpoint
// ----------------------------------------------------
app.get('/api/health', (_req: Request, res: Response) => {
  healthMetrics.uptimeSeconds = Math.round((Date.now() - serverStartTime) / 1000);
  healthMetrics.lastHealthCheck = new Date().toISOString();

  res.json({
    status: 'healthy',
    timestamp: healthMetrics.lastHealthCheck,
    uptimeSeconds: healthMetrics.uptimeSeconds,
    geminiConfigured: !!GEMINI_API_KEY,
    adminConfigured: !!ADMIN_SECRET_KEY,
    metrics: healthMetrics,
  });
});

// ----------------------------------------------------
// AI Plan Generation Endpoint (Structured Output + Zod)
// ----------------------------------------------------
app.post('/api/ai/generate-plan', checkRateLimit, async (req: Request, res: Response) => {
  const startTime = Date.now();
  healthMetrics.aiRequestCount += 1;

  // 1. Validate Input Payload with Zod
  const parseResult = CreateEventRequestSchema.safeParse(req.body);
  if (!parseResult.success) {
    healthMetrics.aiFailureCount += 1;
    healthMetrics.errorCategories['INVALID_INPUT'] = (healthMetrics.errorCategories['INVALID_INPUT'] || 0) + 1;
    return res.status(400).json({
      error: 'Invalid event specifications.',
      details: parseResult.error.issues.map(i => `${i.path.join('.')}: ${i.message}`),
    });
  }

  const eventBrief = parseResult.data;

  // 2. If no GEMINI_API_KEY is configured, engage deterministic blueprint engine
  if (!GEMINI_API_KEY) {
    const fallbackPlan = generateFallbackPlan(eventBrief);
    const latency = Date.now() - startTime;
    totalLatencyAccumulator += latency;
    healthMetrics.averageLatencyMs = Math.round(totalLatencyAccumulator / healthMetrics.aiRequestCount);

    return res.json({
      success: true,
      isDemoPlan: true,
      generator: 'deterministic_engine',
      plan: fallbackPlan,
      notice: 'Generated using PlanSutra deterministic blueprint engine (Demo mode: No Gemini API key provided).',
    });
  }

  // 3. Invoke Google Gemini API with Structured Schema
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000); // 15-second timeout

    const systemPrompt = `You are PlanSutra AI, an expert celebration and event planning architect.
Return ONLY valid JSON matching this schema:
{
  "themeConcept": string,
  "paletteSuggestions": string[],
  "budgetCategories": [{ "name": string, "allocated": number, "notes": string, "costPerGuestApplicable": boolean, "costPerGuestAmount": number }],
  "tasks": [{ "title": string, "description": string, "phase": "initial_planning"|"budget_venue"|"vendor_selection"|"invitations_guests"|"final_confirmations"|"final_week"|"day_of"|"post_event", "daysBeforeEvent": number, "priority": "low"|"medium"|"high"|"critical", "reason": string }],
  "vendorChecklist": [{ "category": string, "suggestedName": string, "estimatedCost": number, "keyServices": string[], "questionsToAsk": string[], "negotiationTips": string[] }],
  "dayOfSchedule": [{ "time": "HH:MM", "endTime": "HH:MM", "activity": string, "owner": string, "notes": string }],
  "assumptions": string[],
  "identifiedRisks": string[]
}
Budget rules: The sum of budgetCategories "allocated" values MUST equal exactly ${eventBrief.totalBudget - Math.round(eventBrief.totalBudget * (eventBrief.contingencyReservePercent / 100))}. Include a dedicated "Contingency Reserve (${eventBrief.contingencyReservePercent}%)" category with allocated ${Math.round(eventBrief.totalBudget * (eventBrief.contingencyReservePercent / 100))}.
Do NOT output markdown code fences, backticks, or extra commentary. Return pure JSON.`;

    const userPrompt = `Create a complete event plan for:
Event Name: ${eventBrief.name}
Event Type: ${eventBrief.type}
Date: ${eventBrief.date}
Location: ${eventBrief.city}
Guest Count: ${eventBrief.guestCount}
Total Budget: INR ${eventBrief.totalBudget}
Setting: ${eventBrief.setting}
Spending Level: ${eventBrief.spendingLevel}
Personalization: ${JSON.stringify(eventBrief.personalization)}`;

    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`;
    
    const geminiResponse = await fetch(geminiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [
          { role: 'user', parts: [{ text: `${systemPrompt}\n\n${userPrompt}` }] }
        ],
        generationConfig: {
          temperature: 0.3,
          maxOutputTokens: 4000,
          responseMimeType: 'application/json',
        },
      }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!geminiResponse.ok) {
      throw new Error(`Gemini API returned status ${geminiResponse.status}: ${geminiResponse.statusText}`);
    }

    const rawData = await geminiResponse.json();
    const candidateText = rawData?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!candidateText) {
      throw new Error('Empty response from Gemini API.');
    }

    const cleanedJson = candidateText.replace(/^```json\s*/i, '').replace(/```\s*$/i, '').trim();
    const parsedJson = JSON.parse(cleanedJson);

    // 4. Validate Structured Output via Zod
    const validationResult = AIStructuredPlanResponseSchema.safeParse(parsedJson);
    if (!validationResult.success) {
      console.warn('AI output failed schema validation. Falling back to deterministic plan.');
      healthMetrics.errorCategories['SCHEMA_MISMATCH'] = (healthMetrics.errorCategories['SCHEMA_MISMATCH'] || 0) + 1;
      
      const fallbackPlan = generateFallbackPlan(eventBrief);
      return res.json({
        success: true,
        isDemoPlan: true,
        generator: 'deterministic_engine_fallback',
        plan: fallbackPlan,
        notice: 'Model output did not strictly conform to financial schema; verified fallback plan returned.',
      });
    }

    const latency = Date.now() - startTime;
    totalLatencyAccumulator += latency;
    healthMetrics.averageLatencyMs = Math.round(totalLatencyAccumulator / healthMetrics.aiRequestCount);

    return res.json({
      success: true,
      isDemoPlan: false,
      generator: GEMINI_MODEL,
      plan: validationResult.data,
    });
  } catch (err: any) {
    healthMetrics.aiFailureCount += 1;
    const errType = err.name === 'AbortError' ? 'TIMEOUT' : 'API_ERROR';
    healthMetrics.errorCategories[errType] = (healthMetrics.errorCategories[errType] || 0) + 1;

    // Graceful recovery: return verified deterministic blueprint so user flow is never disrupted
    const fallbackPlan = generateFallbackPlan(eventBrief);
    return res.json({
      success: true,
      isDemoPlan: true,
      generator: 'deterministic_engine_fallback',
      plan: fallbackPlan,
      notice: `AI service unavailable (${errType}). PlanSutra deterministic fallback blueprint applied.`,
    });
  }
});

// ----------------------------------------------------
// AI In-Workspace Chat Assistant Endpoint
// ----------------------------------------------------
app.post('/api/ai/chat', checkRateLimit, async (req: Request, res: Response) => {
  healthMetrics.aiRequestCount += 1;
  const parseResult = AIChatRequestSchema.safeParse(req.body);
  if (!parseResult.success) {
    return res.status(400).json({ error: 'Invalid chat request structure.' });
  }

  const { userMessage, eventContext } = parseResult.data;

  if (!GEMINI_API_KEY) {
    let reply = `Regarding **${eventContext.name}** in ${eventContext.city}:\n\n`;
    const lower = userMessage.toLowerCase();

    if (lower.includes('budget') || lower.includes('cost') || lower.includes('save')) {
      reply += `Your total budget is ₹${eventContext.totalBudget.toLocaleString('en-IN')}. For ${eventContext.guestCount} guests, the most variable category is Catering. To trim expenses without sacrificing quality, consider buffet service with seasonal ingredients and replace imported florals with local marigold/jasmine.`;
    } else if (lower.includes('doctor') || lower.includes('issue') || lower.includes('risk') || lower.includes('blocker')) {
      if (eventContext.criticalBlockers.length > 0) {
        reply += `Plan Doctor currently flags ${eventContext.criticalBlockers.length} critical issue(s): ${eventContext.criticalBlockers.join(', ')}. Resolving these before vendor sign-off is strongly recommended.`;
      } else {
        reply += `Plan Doctor reports your core parameters are in good standing! Keep quotations updated to avoid surprise cost overruns.`;
      }
    } else if (lower.includes('vendor') || lower.includes('negotiate') || lower.includes('quote')) {
      reply += `When negotiating with vendors in ${eventContext.city}, always request all-inclusive quotes covering taxes, setup, transport, and overtime rates. Avoid signing without a clear cancellation clause.`;
    } else {
      reply += `I'm tracking your event for ${eventContext.guestCount} guests. You can ask me to evaluate budget trade-offs, draft negotiation checklists, or run Plan Doctor simulations.`;
    }

    return res.json({
      success: true,
      reply,
      isDemo: true,
    });
  }

  // Live Gemini Chat invocation
  try {
    const prompt = `You are PlanSutra AI Assistant. Event context:
- Name: ${eventContext.name} (${eventContext.type})
- Guest count: ${eventContext.guestCount}
- Budget: INR ${eventContext.totalBudget}
- Location: ${eventContext.city}
- Known blockers: ${eventContext.criticalBlockers.join(', ') || 'None'}

User asks: "${userMessage}"
Provide a concise, practical, helpful response in markdown with bullet points where helpful.`;

    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`;
    const geminiResponse = await fetch(geminiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
      }),
    });

    const data = await geminiResponse.json();
    const reply = data?.candidates?.[0]?.content?.parts?.[0]?.text || 'I could not generate an answer at this moment.';
    return res.json({ success: true, reply, isDemo: false });
  } catch (err: any) {
    return res.json({
      success: true,
      reply: `I encountered a network issue communicating with the AI model. For ${eventContext.name}, please refer to your Plan Doctor findings for immediate action items.`,
      isDemo: true,
    });
  }
});

// ----------------------------------------------------
// Admin Routes (Server-Verified Security & Session Auth)
// ----------------------------------------------------
app.post('/api/admin/login', (req: Request, res: Response) => {
  const ip = req.ip || req.socket.remoteAddress || 'unknown';
  const now = Date.now();

  // 1. Check brute force lockout
  const attemptRecord = loginAttempts.get(ip);
  if (attemptRecord?.lockedUntil && now < attemptRecord.lockedUntil) {
    const remainingMin = Math.ceil((attemptRecord.lockedUntil - now) / 60000);
    return res.status(429).json({
      error: `Too many failed login attempts. Account access is temporarily locked. Please retry in ${remainingMin} minute(s).`,
    });
  }

  // 2. Validate request payload
  const parseResult = AdminLoginRequestSchema.safeParse(req.body);
  if (!parseResult.success) {
    return res.status(400).json({ error: 'Secret key is required.' });
  }

  // 3. If ADMIN_SECRET_KEY is unconfigured, fail closed securely
  if (!ADMIN_SECRET_KEY) {
    return res.status(503).json({
      error: 'Administrative access is not configured on this server. Please define ADMIN_SECRET_KEY in server environment.',
    });
  }

  const { secretKey } = parseResult.data;

  // 4. Timing-safe comparison to prevent side-channel timing attacks
  const inputBuffer = Buffer.from(secretKey);
  const secretBuffer = Buffer.from(ADMIN_SECRET_KEY);
  const isMatch = inputBuffer.length === secretBuffer.length && crypto.timingSafeEqual(inputBuffer, secretBuffer);

  if (!isMatch) {
    // Record failed attempt
    const record = attemptRecord && (now - attemptRecord.firstAttemptAt < 15 * 60 * 1000)
      ? { ...attemptRecord, count: attemptRecord.count + 1 }
      : { count: 1, firstAttemptAt: now };

    if (record.count >= 5) {
      record.lockedUntil = now + (15 * 60 * 1000); // 15-minute lockout
    }
    loginAttempts.set(ip, record);

    auditLogs.push({
      id: `audit-${Date.now()}`,
      actor: 'unauthorized_ip',
      action: 'ADMIN_LOGIN_FAILURE',
      target: 'Admin Portal',
      timestamp: new Date().toISOString(),
      outcome: 'failure',
      details: `Failed admin login attempt from ${ip} (attempt ${record.count}/5).`,
    });

    return res.status(401).json({ error: 'Invalid administrator credentials.' });
  }

  // 5. Successful login: reset failed attempt counter and issue ephemeral random session token
  loginAttempts.delete(ip);

  const sessionToken = crypto.randomBytes(32).toString('hex');
  const sessionTTLMs = 2 * 60 * 60 * 1000; // 2 hours
  adminSessions.set(sessionToken, {
    createdAt: now,
    expiresAt: now + sessionTTLMs,
    ip,
  });

  auditLogs.push({
    id: `audit-${Date.now()}`,
    actor: 'admin_user',
    action: 'ADMIN_LOGIN_SUCCESS',
    target: 'Admin Portal',
    timestamp: new Date().toISOString(),
    outcome: 'success',
    details: 'New secure administrator session established.',
  });

  return res.json({
    success: true,
    token: sessionToken,
    expiresIn: Math.round(sessionTTLMs / 1000),
    message: 'Admin authorization granted. Session token established.',
  });
});

app.post('/api/admin/logout', requireAdminAuth, (req: Request, res: Response) => {
  const authHeader = req.headers.authorization || '';
  const token = authHeader.replace(/^Bearer\s+/i, '').trim();
  
  if (token) {
    adminSessions.delete(token);
    auditLogs.push({
      id: `audit-${Date.now()}`,
      actor: 'admin_user',
      action: 'ADMIN_LOGOUT',
      target: 'Admin Portal',
      timestamp: new Date().toISOString(),
      outcome: 'success',
      details: 'Administrator session invalidated.',
    });
  }

  res.json({ success: true, message: 'Logged out successfully.' });
});

app.get('/api/admin/verify', requireAdminAuth, (_req: Request, res: Response) => {
  res.json({ authorized: true, user: 'Admin Operator' });
});

app.get('/api/admin/templates', requireAdminAuth, (_req: Request, res: Response) => {
  res.json({ templates: adminTemplates });
});

app.post('/api/admin/templates', requireAdminAuth, (req: Request, res: Response) => {
  const template = req.body as AdminTemplate;
  if (!template || !template.name || !template.eventType) {
    return res.status(400).json({ error: 'Invalid template specification.' });
  }

  const existingIndex = adminTemplates.findIndex(t => t.id === template.id);
  if (existingIndex >= 0) {
    adminTemplates[existingIndex] = {
      ...template,
      updatedAt: new Date().toISOString(),
    };
  } else {
    adminTemplates.push({
      ...template,
      id: template.id || `tpl-${Date.now()}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
  }

  auditLogs.push({
    id: `audit-${Date.now()}`,
    actor: 'admin_user',
    action: existingIndex >= 0 ? 'UPDATE_TEMPLATE' : 'CREATE_TEMPLATE',
    target: template.name,
    timestamp: new Date().toISOString(),
    outcome: 'success',
  });

  res.json({ success: true, templates: adminTemplates });
});

app.get('/api/admin/audit', requireAdminAuth, (_req: Request, res: Response) => {
  res.json({ auditLogs: auditLogs.slice(-50).reverse() });
});

app.get('/api/admin/metrics', requireAdminAuth, (_req: Request, res: Response) => {
  healthMetrics.uptimeSeconds = Math.round((Date.now() - serverStartTime) / 1000);
  res.json({ metrics: healthMetrics });
});

// Start Server locally (Vercel serverless functions export app handler without app.listen)
if (!process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log(`PlanSutra AI server listening on port ${PORT}`);
  });
}

export default app;
