import React, { useState, useEffect } from 'react';
import { AdminTemplate, AdminAuditLog, SystemHealthMetrics } from '@/types';
import { Logo } from '../common/Logo';
import { 
  ShieldCheck, 
  Lock, 
  Activity, 
  Layers, 
  History, 
  ArrowLeft, 
  CheckCircle2, 
  AlertTriangle, 
  Clock, 
  Plus, 
  Edit3, 
  Eye, 
  RefreshCw 
} from 'lucide-react';

interface AdminDashboardProps {
  onBackToApp: () => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ onBackToApp }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [secretKeyInput, setSecretKeyInput] = useState<string>('');
  const [authError, setAuthError] = useState<string | null>(null);
  const [authToken, setAuthToken] = useState<string>('');

  const [activeTab, setActiveTab] = useState<'metrics' | 'templates' | 'audit'>('metrics');
  const [healthMetrics, setHealthMetrics] = useState<SystemHealthMetrics | null>(null);
  const [templates, setTemplates] = useState<AdminTemplate[]>([]);
  const [auditLogs, setAuditLogs] = useState<AdminAuditLog[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // Handle Login
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    setIsLoading(true);

    try {
      const response = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ secretKey: secretKeyInput.trim() }),
      });

      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Invalid administrator secret key.');
      }

      setAuthToken(data.token);
      setIsAuthenticated(true);
      fetchAdminData(data.token);
    } catch (err: any) {
      setAuthError(err.message || 'Authorization failed.');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchAdminData = async (token: string) => {
    setIsLoading(true);
    try {
      const headers = { Authorization: `Bearer ${token}` };

      // 1. Fetch Metrics
      const resMetrics = await fetch('/api/admin/metrics', { headers });
      if (resMetrics.ok) {
        const data = await resMetrics.json();
        setHealthMetrics(data.metrics);
      }

      // 2. Fetch Templates
      const resTemplates = await fetch('/api/admin/templates', { headers });
      if (resTemplates.ok) {
        const data = await resTemplates.json();
        setTemplates(data.templates);
      }

      // 3. Fetch Audit Logs
      const resAudit = await fetch('/api/admin/audit', { headers });
      if (resAudit.ok) {
        const data = await resAudit.json();
        setAuditLogs(data.auditLogs);
      }
    } catch (err) {
      console.error('Failed to load admin data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Invalidate session and logout
  const handleLogout = async () => {
    try {
      if (authToken) {
        await fetch('/api/admin/logout', {
          method: 'POST',
          headers: { Authorization: `Bearer ${authToken}` },
        });
      }
    } catch (err) {
      // Ignore network errors on logout
    } finally {
      setAuthToken('');
      setIsAuthenticated(false);
      setSecretKeyInput('');
    }
  };

  // Toggle template active status
  const handleToggleTemplate = async (template: AdminTemplate) => {
    const updated = { ...template, isActive: !template.isActive };
    try {
      const res = await fetch('/api/admin/templates', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify(updated),
      });

      if (res.ok) {
        const data = await res.json();
        setTemplates(data.templates);
        // Refresh audit
        fetchAdminData(authToken);
      }
    } catch (err) {
      console.error('Failed to update template:', err);
    }
  };

  // -------------------------------------------------------------------------
  // Render Auth Gate if not authenticated
  // -------------------------------------------------------------------------
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-ivory-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl max-w-md w-full p-8 shadow-lifted border border-ivory-200">
          <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center mb-4">
            <Lock size={24} />
          </div>
          <h1 className="text-2xl font-serif font-bold text-navy-950">Interface B: Admin Portal</h1>
          <p className="text-xs text-navy-600 mt-1 mb-6">
            Securely restricted administrative console for operational telemetry and planning templates. Authorization is enforced on the server.
          </p>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-navy-800 uppercase tracking-wider mb-1" htmlFor="admin-secret-key">
                Server Admin Secret Key
              </label>
              <input
                id="admin-secret-key"
                type="password"
                required
                placeholder="Enter ADMIN_SECRET_KEY"
                value={secretKeyInput}
                onChange={e => setSecretKeyInput(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-ivory-300 focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 text-sm"
              />
              <p className="text-[11px] text-navy-500 mt-1">
                Enter the secret key configured in the server's <code className="bg-ivory-100 px-1 py-0.5 rounded font-mono text-[10px]">ADMIN_SECRET_KEY</code> environment variable.
              </p>
            </div>

            {authError && (
              <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-800 flex items-center gap-2">
                <AlertTriangle size={15} className="shrink-0 text-red-600" />
                <span>{authError}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading || !secretKeyInput.trim()}
              className="w-full py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-semibold text-sm shadow-sm transition-all disabled:opacity-50"
            >
              {isLoading ? 'Verifying with Server...' : 'Access Admin Dashboard'}
            </button>
          </form>

          <div className="mt-6 pt-4 border-t border-ivory-200 text-center">
            <button
              onClick={onBackToApp}
              className="text-xs font-semibold text-navy-600 hover:text-navy-950 flex items-center justify-center gap-1 mx-auto"
            >
              <ArrowLeft size={14} />
              <span>Return to User Application</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // -------------------------------------------------------------------------
  // Render Authorized Admin Dashboard
  // -------------------------------------------------------------------------
  return (
    <div className="min-h-screen bg-ivory-50 flex flex-col">
      {/* Top Header */}
      <header className="bg-white border-b border-ivory-200 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Logo size="sm" />
          <div className="h-4 w-px bg-ivory-300" />
          <span className="text-xs font-bold uppercase tracking-wider text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
            Admin Console (Verified)
          </span>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => fetchAdminData(authToken)}
            className="p-1.5 rounded-lg text-navy-600 hover:bg-ivory-100"
            title="Refresh Telemetry"
          >
            <RefreshCw size={15} />
          </button>
          <button
            onClick={onBackToApp}
            className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-ivory-100 hover:bg-ivory-200 text-navy-800 border border-ivory-300"
          >
            Exit to User App
          </button>
          <button
            onClick={handleLogout}
            className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-red-50 hover:bg-red-100 text-red-700 border border-red-200"
          >
            Log Out
          </button>
        </div>
      </header>

      {/* Navigation Sub-bar */}
      <div className="bg-white border-b border-ivory-200 px-6 flex gap-6 text-xs font-semibold">
        <button
          onClick={() => setActiveTab('metrics')}
          className={`py-3 flex items-center gap-1.5 border-b-2 transition-colors ${activeTab === 'metrics' ? 'border-emerald-700 text-emerald-800' : 'border-transparent text-navy-600 hover:text-navy-950'}`}
        >
          <Activity size={14} />
          <span>Operational Health & Telemetry</span>
        </button>
        <button
          onClick={() => setActiveTab('templates')}
          className={`py-3 flex items-center gap-1.5 border-b-2 transition-colors ${activeTab === 'templates' ? 'border-emerald-700 text-emerald-800' : 'border-transparent text-navy-600 hover:text-navy-950'}`}
        >
          <Layers size={14} />
          <span>Event Templates ({templates.length})</span>
        </button>
        <button
          onClick={() => setActiveTab('audit')}
          className={`py-3 flex items-center gap-1.5 border-b-2 transition-colors ${activeTab === 'audit' ? 'border-emerald-700 text-emerald-800' : 'border-transparent text-navy-600 hover:text-navy-950'}`}
        >
          <History size={14} />
          <span>Audit Log ({auditLogs.length})</span>
        </button>
      </div>

      {/* Admin Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-6 space-y-6">
        {/* TAB 1: METRICS & HEALTH */}
        {activeTab === 'metrics' && healthMetrics && (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-bold text-navy-950">System Telemetry & AI Health</h2>
              <p className="text-xs text-navy-600">Aggregated operational metrics. Zero PII, user prompts, or private plans are recorded.</p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="p-5 rounded-2xl bg-white border border-ivory-200 shadow-soft">
                <span className="text-[10px] font-bold uppercase tracking-wider text-navy-500 block">Total AI Invocations</span>
                <span className="text-2xl font-bold font-serif text-navy-950">{healthMetrics.aiRequestCount}</span>
                <span className="text-[11px] text-navy-500 block mt-1">Processed requests</span>
              </div>

              <div className="p-5 rounded-2xl bg-white border border-ivory-200 shadow-soft">
                <span className="text-[10px] font-bold uppercase tracking-wider text-navy-500 block">Failures / Fallbacks</span>
                <span className={`text-2xl font-bold font-serif ${healthMetrics.aiFailureCount > 0 ? 'text-amber-600' : 'text-emerald-700'}`}>
                  {healthMetrics.aiFailureCount}
                </span>
                <span className="text-[11px] text-navy-500 block mt-1">Graceful fallback engaged</span>
              </div>

              <div className="p-5 rounded-2xl bg-white border border-ivory-200 shadow-soft">
                <span className="text-[10px] font-bold uppercase tracking-wider text-navy-500 block">Avg Latency</span>
                <span className="text-2xl font-bold font-serif text-navy-950">{healthMetrics.averageLatencyMs} ms</span>
                <span className="text-[11px] text-navy-500 block mt-1">End-to-end response time</span>
              </div>

              <div className="p-5 rounded-2xl bg-white border border-ivory-200 shadow-soft">
                <span className="text-[10px] font-bold uppercase tracking-wider text-navy-500 block">Server Uptime</span>
                <span className="text-2xl font-bold font-serif text-emerald-800">{healthMetrics.uptimeSeconds}s</span>
                <span className="text-[11px] text-emerald-700 block mt-1 font-semibold flex items-center gap-1">
                  <CheckCircle2 size={12} />
                  <span>Status: Healthy</span>
                </span>
              </div>
            </div>

            {/* Error Categories Breakdown */}
            <div className="p-5 rounded-2xl bg-white border border-ivory-200 shadow-soft">
              <h3 className="font-bold text-sm text-navy-950 mb-3">Safe Error Taxonomy (Aggregated)</h3>
              {Object.keys(healthMetrics.errorCategories).length === 0 ? (
                <p className="text-xs text-navy-500 italic">No errors recorded during current session uptime.</p>
              ) : (
                <div className="grid grid-cols-3 gap-3 text-xs">
                  {Object.entries(healthMetrics.errorCategories).map(([cat, count]) => (
                    <div key={cat} className="p-3 rounded-xl bg-ivory-50 border border-ivory-200 flex justify-between">
                      <span className="font-mono text-navy-700">{cat}:</span>
                      <strong className="text-navy-950">{count} occurrences</strong>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 2: TEMPLATE MANAGEMENT */}
        {activeTab === 'templates' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-navy-950">Curated Event Templates</h2>
                <p className="text-xs text-navy-600">Base configuration templates for Weddings, Birthdays, Community, and Fests.</p>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              {templates.map(tpl => (
                <div key={tpl.id} className="p-5 rounded-2xl bg-white border border-ivory-200 shadow-soft space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-ivory-100 text-navy-700">
                        {tpl.eventType.replace('_', ' ')}
                      </span>
                      <h3 className="font-bold text-base text-navy-950 mt-1">{tpl.name}</h3>
                    </div>

                    <button
                      onClick={() => handleToggleTemplate(tpl)}
                      className={`text-xs px-2.5 py-1 rounded-full font-bold uppercase tracking-wider transition-colors ${
                        tpl.isActive
                          ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                          : 'bg-ivory-200 text-navy-600'
                      }`}
                    >
                      {tpl.isActive ? 'Active' : 'Inactive'}
                    </button>
                  </div>

                  <p className="text-xs text-navy-700">{tpl.description}</p>

                  <div className="pt-2 border-t border-ivory-100 text-xs text-navy-600 space-y-1">
                    <p className="font-semibold text-navy-900">Default Category Splits:</p>
                    <div className="flex flex-wrap gap-1.5">
                      {tpl.defaultCategories.map((c, i) => (
                        <span key={i} className="px-2 py-0.5 rounded bg-ivory-100 text-[11px] text-navy-800">
                          {c.name} ({c.percentage}%)
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 3: AUDIT TRAIL */}
        {activeTab === 'audit' && (
          <div className="space-y-4">
            <div>
              <h2 className="text-xl font-bold text-navy-950">Administrative Audit Trail</h2>
              <p className="text-xs text-navy-600">Tamper-evident chronological log of privileged operations.</p>
            </div>

            <div className="bg-white rounded-2xl border border-ivory-200 shadow-soft overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead className="bg-ivory-100 text-navy-700 font-bold uppercase text-[10px]">
                  <tr>
                    <th className="p-3">Timestamp</th>
                    <th className="p-3">Actor</th>
                    <th className="p-3">Action</th>
                    <th className="p-3">Target</th>
                    <th className="p-3">Outcome</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-ivory-100">
                  {auditLogs.map(log => (
                    <tr key={log.id} className="hover:bg-ivory-50/50">
                      <td className="p-3 text-navy-500 font-mono text-[11px]">
                        {new Date(log.timestamp).toLocaleString()}
                      </td>
                      <td className="p-3 font-semibold text-navy-900">{log.actor}</td>
                      <td className="p-3 font-mono text-[11px] text-navy-700">{log.action}</td>
                      <td className="p-3 text-navy-800">{log.target}</td>
                      <td className="p-3">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                          log.outcome === 'success' ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {log.outcome}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};
