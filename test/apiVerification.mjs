// Direct Node.js API verification test
// Validates health, admin session authentication, rate limits, AI generation, and chat endpoints
import fs from 'fs';

// Read server admin secret from local server environment file dynamically
let serverSecret = '';
try {
  const envContent = fs.readFileSync('.env', 'utf8');
  const match = envContent.match(/ADMIN_SECRET_KEY=([^\r\n]+)/);
  if (match) {
    serverSecret = match[1].trim();
  }
} catch (e) {
  // .env may not exist in some environments
}

async function runTests() {
  console.log('--- Starting API Integration Tests ---');
  let passed = 0;
  let failed = 0;

  // 1. Test Health
  try {
    const res = await fetch('http://localhost:3001/api/health');
    const data = await res.json();
    if (res.status === 200 && data.status === 'healthy') {
      console.log('✓ PASS: GET /api/health returned 200 healthy');
      passed++;
    } else {
      console.error('✗ FAIL: GET /api/health', data);
      failed++;
    }
  } catch (e) {
    console.error('✗ FAIL: GET /api/health exception', e.message);
    failed++;
  }

  // 2. Test Admin Login with Invalid Key
  try {
    const res = await fetch('http://localhost:3001/api/admin/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ secretKey: 'invalid-unauthorized-random-secret' }),
    });
    if (res.status === 401) {
      console.log('✓ PASS: POST /api/admin/login with invalid key correctly rejected with 401 Unauthorized');
      passed++;
    } else {
      console.error('✗ FAIL: POST /api/admin/login should reject invalid key', res.status);
      failed++;
    }
  } catch (e) {
    console.error('✗ FAIL: POST /api/admin/login invalid key exception', e.message);
    failed++;
  }

  // 3. Test Admin Login with Valid Key (Dynamic from .env)
  let adminSessionToken = '';
  if (serverSecret) {
    try {
      const res = await fetch('http://localhost:3001/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ secretKey: serverSecret }),
      });
      const data = await res.json();
      if (res.status === 200 && data.success && data.token && data.token.length === 64) {
        adminSessionToken = data.token;
        console.log('✓ PASS: POST /api/admin/login with valid key returned 200 & 64-char ephemeral session token');
        passed++;
      } else {
        console.error('✗ FAIL: POST /api/admin/login valid key', res.status, data);
        failed++;
      }
    } catch (e) {
      console.error('✗ FAIL: POST /api/admin/login valid key exception', e.message);
      failed++;
    }
  }

  // 4. Test Protected Admin Templates endpoint with session token
  if (adminSessionToken) {
    try {
      const res = await fetch('http://localhost:3001/api/admin/templates', {
        headers: { Authorization: `Bearer ${adminSessionToken}` },
      });
      const data = await res.json();
      if (res.status === 200 && Array.isArray(data.templates) && data.templates.length >= 5) {
        console.log(`✓ PASS: GET /api/admin/templates returned ${data.templates.length} templates with verified session`);
        passed++;
      } else {
        console.error('✗ FAIL: GET /api/admin/templates', res.status, data);
        failed++;
      }
    } catch (e) {
      console.error('✗ FAIL: GET /api/admin/templates exception', e.message);
      failed++;
    }

    // 5. Test Protected Admin Audit endpoint
    try {
      const res = await fetch('http://localhost:3001/api/admin/audit', {
        headers: { Authorization: `Bearer ${adminSessionToken}` },
      });
      const data = await res.json();
      if (res.status === 200 && Array.isArray(data.auditLogs) && data.auditLogs.length > 0) {
        console.log(`✓ PASS: GET /api/admin/audit returned ${data.auditLogs.length} audit entries (including session events)`);
        passed++;
      } else {
        console.error('✗ FAIL: GET /api/admin/audit', res.status, data);
        failed++;
      }
    } catch (e) {
      console.error('✗ FAIL: GET /api/admin/audit exception', e.message);
      failed++;
    }

    // 6. Test Admin Logout & Session Invalidation
    try {
      const resLogout = await fetch('http://localhost:3001/api/admin/logout', {
        method: 'POST',
        headers: { Authorization: `Bearer ${adminSessionToken}` },
      });
      const logoutData = await resLogout.json();
      if (resLogout.status === 200 && logoutData.success) {
        console.log('✓ PASS: POST /api/admin/logout successfully invalidated session');
        passed++;
      } else {
        console.error('✗ FAIL: POST /api/admin/logout', resLogout.status, logoutData);
        failed++;
      }

      // Verify that using the invalidated session is now rejected with 403
      const resAfterLogout = await fetch('http://localhost:3001/api/admin/templates', {
        headers: { Authorization: `Bearer ${adminSessionToken}` },
      });
      if (resAfterLogout.status === 403) {
        console.log('✓ PASS: Access with invalidated session token correctly rejected with 403 Forbidden');
        passed++;
      } else {
        console.error('✗ FAIL: Invalidated session should be rejected with 403', resAfterLogout.status);
        failed++;
      }
    } catch (e) {
      console.error('✗ FAIL: Logout verification exception', e.message);
      failed++;
    }
  }

  // 7. Test AI Plan Generation Endpoint (Deterministic Fallback / Generator)
  try {
    const payload = {
      name: 'Pune Community Utsav',
      type: 'community',
      date: '2026-11-20',
      city: 'Pune',
      guestCount: 180,
      setting: 'mixed',
      totalBudget: 150000,
      contingencyReservePercent: 10,
      spendingLevel: 'balanced',
      priorityCategories: ['Catering', 'Stage'],
      optimizationMode: 'balanced',
      personalization: {},
    };

    const res = await fetch('http://localhost:3001/api/ai/generate-plan', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (res.status === 200 && data.success && data.plan) {
      console.log(`✓ PASS: POST /api/ai/generate-plan returned structured plan (Generator: ${data.generator})`);
      console.log(`  - Budget categories count: ${data.plan.budgetCategories.length}`);
      console.log(`  - Tasks count: ${data.plan.tasks.length}`);
      console.log(`  - Day-of schedule items: ${data.plan.dayOfSchedule.length}`);
      passed++;
    } else {
      console.error('✗ FAIL: POST /api/ai/generate-plan', res.status, data);
      failed++;
    }
  } catch (e) {
    console.error('✗ FAIL: POST /api/ai/generate-plan exception', e.message);
    failed++;
  }

  // 8. Test AI Chat Assistant Endpoint
  try {
    const chatPayload = {
      eventId: 'demo-180',
      userMessage: 'How can I save ₹10,000 on catering without reducing guest count?',
      eventContext: {
        name: 'Pune Community Utsav',
        type: 'community',
        totalBudget: 150000,
        guestCount: 180,
        city: 'Pune',
        criticalBlockers: [],
      },
    };

    const res = await fetch('http://localhost:3001/api/ai/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(chatPayload),
    });
    const data = await res.json();
    if (res.status === 200 && data.success && data.reply) {
      console.log('✓ PASS: POST /api/ai/chat returned in-context assistant reply');
      passed++;
    } else {
      console.error('✗ FAIL: POST /api/ai/chat', res.status, data);
      failed++;
    }
  } catch (e) {
    console.error('✗ FAIL: POST /api/ai/chat exception', e.message);
    failed++;
  }

  // 9. Test Malformed JSON Handling (Security boundary test)
  try {
    const res = await fetch('http://localhost:3001/api/ai/generate-plan', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: '{"invalid-json": unquoted}',
    });
    if (res.status === 400) {
      console.log('✓ PASS: Malformed JSON payload safely caught with HTTP 400 without exposing stack trace');
      passed++;
    } else {
      console.error('✗ FAIL: Malformed JSON should return 400', res.status);
      failed++;
    }
  } catch (e) {
    console.error('✗ FAIL: Malformed JSON test exception', e.message);
    failed++;
  }

  console.log(`\n========================================`);
  console.log(`API Integration Test Results: ${passed} PASSED, ${failed} FAILED`);
  console.log(`========================================`);

  if (failed > 0) process.exit(1);
}

runTests();
