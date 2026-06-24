"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import {
  Users,
  Plus,
  Trash2,
  Edit3,
  CheckCircle,
  RefreshCw,
  Zap,
  FileText,
  Eye,
  EyeOff,
  ChevronDown,
  AlertTriangle,
  Layers,
  Calendar,
  Hash,
  Shield,
  Loader2,
  Clock,
  Download,
} from "lucide-react";

const API_BASE = "/api/bulk-ipo";

interface Account {
  user: string;
  dp: string;
  username: string;
}

interface AccountForm {
  user: string;
  dp: string;
  username: string;
  password: string;
  crn: string;
  pin: string;
}

interface Capital {
  code: string;
  id: number;
  name: string;
}

interface Issue {
  company_share_id: number;
  company_name: string;
  subgroup: string;
  scrip: string;
  share_type_name: string;
  share_group_name: string;
  status_name: string;
  action: string;
  issue_open_date: string | null;
  issue_close_date: string | null;
  is_applied: boolean;
  is_ordinary_shares: boolean;
  is_unapplied_ordinary_share: boolean;
  status: string;
}

interface TaskResult {
  success: boolean;
  message: string;
  username: string;
  user: string;
  dry_run?: boolean;
}

interface TaskStatus {
  status: string;
  total: number;
  completed: number;
  results: TaskResult[];
}

interface ReportItem {
  companyName: string;
  scrip: string;
  appliedKitta: number;
  allotedKitta: number;
  statusName: string;
  allotmentStatus: string;
}

interface AccountReport {
  reports: ReportItem[];
  user: string;
  error: string | null;
}

interface HistoryEntry {
  id: number;
  task_id: string;
  username: string;
  user: string;
  company_name: string;
  scrip: string;
  kitta: number;
  success: number;
  message: string;
  applied_at: string;
}

type TabId = "accounts" | "issues" | "reports" | "history";

function Toast({ message, type, onDone }: { message: string; type: "success" | "danger" | "warning" | "info"; onDone: () => void }) {
  useEffect(() => {
    const t = setTimeout(onDone, 4000);
    return () => clearTimeout(t);
  }, [onDone]);

  const colors: Record<string, string> = {
    success: "border-[var(--green)] text-[var(--green)] bg-[var(--green-bg)]",
    danger: "border-[var(--red)] text-[var(--red)] bg-[var(--red-bg)]",
    warning: "border-amber-500 text-amber-400 bg-amber-500/10",
    info: "border-[var(--accent)] text-[var(--accent)] bg-[var(--accent)]/10",
  };

  return (
    <div className={`fixed top-4 right-4 z-[2000] px-4 py-3 rounded-lg border text-sm font-medium animate-[slideIn_0.3s] ${colors[type]}`}>
      {message}
    </div>
  );
}

function Modal({ open, onClose, title, children }: { open: boolean; onClose: () => void; title: string; children: React.ReactNode }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[1000] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-[var(--bg-card)] border border-[var(--border-primary)] rounded-2xl w-full max-w-lg max-h-[85vh] overflow-y-auto p-6" onClick={(e) => e.stopPropagation()}>
        <h2 className="text-lg font-bold text-[var(--accent)] mb-5">{title}</h2>
        {children}
      </div>
    </div>
  );
}

export default function BulkIPOPage() {
  const [tab, setTab] = useState<TabId>("accounts");
  const [capitals, setCapitals] = useState<Capital[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [issues, setIssues] = useState<Issue[]>([]);
  const [issuesLoading, setIssuesLoading] = useState(false);
  const [reports, setReports] = useState<Record<string, AccountReport>>({});
  const [reportsLoading, setReportsLoading] = useState(false);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [toast, setToast] = useState<{ msg: string; type: "success" | "danger" | "warning" | "info" } | null>(null);

  // Account modal
  const [accModalOpen, setAccModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<string | null>(null);
  const [accForm, setAccForm] = useState<AccountForm>({ user: "", dp: "", username: "", password: "", crn: "", pin: "" });
  const [dpSearch, setDpSearch] = useState("");
  const [dpOpen, setDpOpen] = useState(false);
  const dpRef = useRef<HTMLDivElement>(null);

  // Progress modal
  const [progressOpen, setProgressOpen] = useState(false);
  const [taskStatus, setTaskStatus] = useState<TaskStatus | null>(null);
  const [taskLogs, setTaskLogs] = useState<string[]>([]);
  const pollRef = useRef<NodeJS.Timeout | null>(null);

  // Confirm modal
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmMsg, setConfirmMsg] = useState("");
  const confirmCb = useRef<() => void>(() => {});

  // Password visibility
  const [showPw, setShowPw] = useState(false);
  const [showPin, setShowPin] = useState(false);

  // Kitta values per issue
  const [kittaValues, setKittaValues] = useState<Record<number, number>>({});

  // Backend connection status
  const [backendStatus, setBackendStatus] = useState<"checking" | "connected" | "disconnected">("checking");
  const BACKEND_URL = process.env.NEXT_PUBLIC_BULK_IPO_URL || "http://localhost:8000";

  // Health polling
  const healthRef = useRef<NodeJS.Timeout | null>(null);

  const safeFetch = useCallback(async (url: string, init?: RequestInit): Promise<Response | null> => {
    try {
      const r = await fetch(url, init);
      return r;
    } catch {
      return null;
    }
  }, []);

  // --- Health check ---
  const checkHealth = useCallback(async () => {
    const r = await safeFetch(`${API_BASE}/health`);
    if (r && r.ok) {
      const data = await r.json();
      if (data.status === "ok") {
        setBackendStatus("connected");
        return true;
      }
    }
    setBackendStatus("disconnected");
    return false;
  }, [safeFetch]);

  // --- Load data ---
  useEffect(() => {
    (async () => {
      const ok = await checkHealth();
      if (ok) {
        const r = await safeFetch(`${API_BASE}/capitals`);
        if (r && r.ok) setCapitals(await r.json());
        loadAccounts();
      }
    })();
    healthRef.current = setInterval(checkHealth, 30000);
    return () => { if (healthRef.current) clearInterval(healthRef.current); };
  }, [safeFetch, checkHealth]);

  const loadAccounts = async () => {
    const r = await safeFetch(`${API_BASE}/accounts`);
    if (r && r.ok) {
      const data = await r.json();
      setAccounts(data);
    }
  };

  const showToast = useCallback((msg: string, type: "success" | "danger" | "warning" | "info" = "info") => {
    setToast({ msg, type });
  }, []);

  // --- Selection ---
  const toggleSelect = (username: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(username)) next.delete(username);
      else next.add(username);
      return next;
    });
  };
  const selectAll = () => setSelected(new Set(accounts.map((a) => a.username)));
  const clearAll = () => setSelected(new Set());

  // --- Account CRUD ---
  const openAddModal = () => {
    setEditingUser(null);
    setAccForm({ user: "", dp: "", username: "", password: "", crn: "", pin: "" });
    setDpSearch("");
    setShowPw(false);
    setShowPin(false);
    setAccModalOpen(true);
  };

  const openEditModal = (username: string) => {
    const acc = accounts.find((a) => a.username === username);
    if (!acc) return;
    setEditingUser(username);
    setAccForm({ ...acc, password: "", crn: "", pin: "" });
    setDpSearch("");
    setShowPw(false);
    setShowPin(false);
    setAccModalOpen(true);
  };

  const saveAccount = async () => {
    if (!accForm.dp) { showToast("Please select a valid DP from the dropdown", "warning"); return; }
    const r = await safeFetch(`${API_BASE}/accounts`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(accForm),
    });
    if (!r) { showToast("Network error - backend not running", "danger"); return; }
    const res = await r.json();
    if (res.success) {
      showToast(res.message, "success");
      setAccModalOpen(false);
      loadAccounts();
    } else {
      showToast(res.message || "Save failed", "danger");
    }
  };

  const verifyAccount = async () => {
    if (!accForm.dp) { showToast("Please select a valid DP from the dropdown", "warning"); return; }
    const r = await safeFetch(`${API_BASE}/accounts/verify`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(accForm),
    });
    if (!r) { showToast("Network error - backend not running", "danger"); return; }
    const res = await r.json();
    showToast(res.message, res.success ? "success" : "danger");
  };

  const requestDelete = (username: string) => {
    setConfirmMsg(`Delete account "${username}"? This cannot be undone.`);
    confirmCb.current = async () => {
      const r = await safeFetch(`${API_BASE}/accounts/${encodeURIComponent(username)}`, { method: "DELETE" });
      if (!r) { showToast("Network error - backend not running", "danger"); return; }
      const res = await r.json();
      if (res.success) {
        showToast(res.message, "success");
        loadAccounts();
        setSelected((prev) => { const n = new Set(prev); n.delete(username); return n; });
      } else showToast(res.message, "danger");
    };
    setConfirmOpen(true);
  };

  // --- DP Autocomplete ---
  const filteredDP = capitals.filter(
    (c) => c.code.includes(dpSearch) || c.name.toLowerCase().includes(dpSearch.toLowerCase())
  ).slice(0, 20);

  const selectDP = (code: string) => {
    setAccForm((f) => ({ ...f, dp: code }));
    setDpOpen(false);
    setDpSearch("");
  };

  // --- Issues ---
  const loadIssues = async () => {
    setIssuesLoading(true);
    const r = await safeFetch(`${API_BASE}/issues`);
    if (r && r.ok) {
      const data = await r.json();
      setIssues(data.issues || []);
      if (data.account_errors?.length) {
        data.account_errors.forEach((e: { username: string; error: string }) =>
          showToast(`${e.username}: ${e.error}`, "warning")
        );
      }
    } else {
      showToast("Failed to load issues - backend not running", "danger");
    }
    setIssuesLoading(false);
  };

  useEffect(() => {
    if (tab === "issues" && !issues.length) loadIssues();
    if (tab === "history" && !history.length) loadHistory();
  }, [tab]);

  // --- Bulk Apply ---
  const handleBulkApply = async (companyShareId: number, dryRun: boolean = false) => {
    const sel = [...selected];
    if (!sel.length) {
      showToast("Select at least one account first", "warning");
      return;
    }
    const kitta = kittaValues[companyShareId] || 10;
    const r = await safeFetch(`${API_BASE}/apply`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ usernames: sel, company_share_id: companyShareId, kitta, dry_run: dryRun }),
    });
    if (!r) { showToast("Network error - backend not running", "danger"); return; }
    const data = await r.json();
    if (data.task_id) {
      setProgressOpen(true);
      setTaskStatus(null);
      setTaskLogs([]);
      pollTask(data.task_id, sel.length);
    } else {
      showToast("Failed to start apply task", "danger");
    }
  };

  const pollTask = (taskId: string, total: number) => {
    let elapsed = 0;
    if (pollRef.current) clearInterval(pollRef.current);
    pollRef.current = setInterval(async () => {
      elapsed++;
      if (elapsed > 300) {
        clearInterval(pollRef.current!);
        showToast("Task timed out", "danger");
        return;
      }
      const r = await safeFetch(`${API_BASE}/tasks/${taskId}`);
      if (!r) return;
      const task: TaskStatus = await r.json();
      setTaskStatus(task);
      setTaskLogs((prev) => {
        const next = [...prev];
        for (let i = next.length; i < task.results.length; i++) {
          const res = task.results[i];
          const prefix = res.dry_run ? "🔍" : res.success ? "✓" : "✗";
          next.push(`${prefix} ${res.user || res.username}: ${res.message}`);
        }
        return next;
      });
      if (task.status === "completed") {
        clearInterval(pollRef.current!);
        const ok = task.results.filter((r) => r.success).length;
        const isDryRun = task.results[0]?.dry_run;
        showToast(
          isDryRun
            ? `Dry run complete: ${ok}/${task.total} eligible`
            : `Apply complete: ${ok}/${task.total} successful`,
          ok === task.total ? "success" : "warning"
        );
      }
    }, 1000);
  };

  // --- Reports ---
  const loadReports = async () => {
    const sel = [...selected];
    if (!sel.length) {
      showToast("Select at least one account first", "warning");
      return;
    }
    setReportsLoading(true);
    const r = await safeFetch(`${API_BASE}/reports?usernames=${sel.join(",")}`);
    if (r && r.ok) {
      const data = await r.json();
      setReports(data);
    } else {
      showToast("Failed to load reports - backend not running", "danger");
    }
    setReportsLoading(false);
  };

  // --- History ---
  const loadHistory = async () => {
    setHistoryLoading(true);
    const r = await safeFetch(`${API_BASE}/history`);
    if (r && r.ok) {
      const data = await r.json();
      setHistory(data);
    }
    setHistoryLoading(false);
  };

  const exportHistory = () => {
    if (!history.length) return;
    const header = "Date,Account,User,Company,Scrip,Kitta,Success,Message";
    const rows = history.map(h =>
      `"${h.applied_at}","${h.username}","${h.user}","${h.company_name}","${h.scrip}",${h.kitta},${h.success ? "Yes" : "No"},"${h.message}"`
    );
    const csv = [header, ...rows].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `bulk-ipo-history-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // --- Helpers ---
  const getDPName = (code: string) => capitals.find((c) => c.code === code)?.name || "Unknown";
  const getInitial = (name: string) => name.charAt(0).toUpperCase();

  const tabs: { id: TabId; label: string; icon: typeof Users }[] = [
    { id: "accounts", label: "Accounts", icon: Users },
    { id: "issues", label: "Open Issues", icon: Layers },
    { id: "reports", label: "Allotment Reports", icon: FileText },
    { id: "history", label: "History", icon: Clock },
  ];

  return (
    <div className="space-y-6">
      {toast && <Toast message={toast.msg} type={toast.type} onDone={() => setToast(null)} />}

      {/* Header */}
      <div className="flex items-center gap-3">
        <Layers className="h-6 w-6 text-[var(--accent)]" />
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-[var(--text-primary)]">Bulk IPO Manager</h1>
          <p className="text-[var(--text-muted)] text-sm">Manage MeroShare IPO/FPO bulk applications via CDSC API</p>
        </div>
        <div className="flex items-center gap-2">
          <span className={`w-2 h-2 rounded-full ${backendStatus === "connected" ? "bg-[var(--green)]" : backendStatus === "disconnected" ? "bg-[var(--red)]" : "bg-amber-400 animate-pulse"}`} />
          <span className="text-xs text-[var(--text-muted)]">{backendStatus === "connected" ? "Connected" : backendStatus === "disconnected" ? "Disconnected" : "Checking..."}</span>
        </div>
      </div>

      {/* Backend connection status */}
      {backendStatus === "disconnected" && (
        <div className="rounded-xl border border-[var(--red)] bg-[var(--red-bg)] p-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-[var(--red)] flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-[var(--red)]">Cannot connect to Bulk IPO backend</p>
              <p className="text-xs text-[var(--text-muted)] mt-1">
                The FastAPI server at <code className="text-[var(--accent)]">{BACKEND_URL}</code> is not running.
              </p>
              <pre className="mt-3 px-3 py-2 rounded-lg bg-[var(--bg-hover)] border border-[var(--border-primary)] text-xs text-[var(--text-muted)] font-mono">
{`cd bulk-ipo
pip install -r requirements.txt
uvicorn bulk-ipo.main:app --reload --port 8000`}
              </pre>
              <button onClick={async () => { setBackendStatus("checking"); await checkHealth(); }} className="mt-3 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border border-[var(--red)] text-[var(--red)] hover:bg-[var(--red)]/10 transition-colors">
                <RefreshCw className="h-3.5 w-3.5" /> Retry Connection
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-0 border-b border-[var(--border-primary)]">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex items-center gap-2 px-5 py-3 text-sm font-medium border-b-2 transition-colors ${
              tab === t.id
                ? "border-[var(--accent)] text-[var(--accent)]"
                : "border-transparent text-[var(--text-muted)] hover:text-[var(--text-primary)]"
            }`}
          >
            <t.icon className="h-4 w-4" />
            {t.label}
          </button>
        ))}
      </div>

      {/* ============ ACCOUNTS TAB ============ */}
      {tab === "accounts" && (
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <span className="text-sm text-[var(--text-muted)] mr-auto">{accounts.length} account{accounts.length !== 1 ? "s" : ""}</span>
            <button onClick={selectAll} className="px-3 py-1.5 rounded-lg text-xs font-medium border border-[var(--border-primary)] text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:border-[var(--accent)] transition-colors">
              Select All
            </button>
            <button onClick={clearAll} className="px-3 py-1.5 rounded-lg text-xs font-medium border border-[var(--border-primary)] text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:border-[var(--accent)] transition-colors">
              Clear
            </button>
            <button onClick={openAddModal} className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-medium bg-[var(--accent)] text-black hover:opacity-90 transition-opacity">
              <Plus className="h-3.5 w-3.5" /> Add Account
            </button>
          </div>

          {accounts.length === 0 ? (
            <div className="text-center py-20 text-[var(--text-muted)]">
              <Users className="h-12 w-12 mx-auto mb-4 opacity-30" />
              <p className="text-sm">No accounts yet. Add one to get started.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {accounts.map((a) => (
                <div key={a.username} className="flex items-center gap-4 p-4 rounded-xl border border-[var(--border-primary)] bg-[var(--bg-card)] hover:border-[var(--accent)] transition-colors">
                  <input
                    type="checkbox"
                    checked={selected.has(a.username)}
                    onChange={() => toggleSelect(a.username)}
                    className="h-4 w-4 accent-[var(--accent)] cursor-pointer"
                  />
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[var(--accent)] to-amber-600 flex items-center justify-center text-black font-bold text-sm flex-shrink-0">
                    {getInitial(a.user)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-sm text-[var(--text-primary)]">{a.user}</div>
                    <div className="text-xs text-[var(--text-muted)]">{getDPName(a.dp)}</div>
                    <div className="text-xs text-[var(--accent)] font-mono">130{a.dp}{a.username}</div>
                  </div>
                  <div className="flex gap-1.5">
                    <button onClick={() => openEditModal(a.username)} className="p-2 rounded-lg border border-[var(--border-primary)] text-[var(--text-muted)] hover:text-[var(--accent)] hover:border-[var(--accent)] transition-colors">
                      <Edit3 className="h-3.5 w-3.5" />
                    </button>
                    <button onClick={() => requestDelete(a.username)} className="p-2 rounded-lg border border-[var(--border-primary)] text-[var(--text-muted)] hover:text-[var(--red)] hover:border-[var(--red)] transition-colors">
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ============ ISSUES TAB ============ */}
      {tab === "issues" && (
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <span className="text-sm text-[var(--text-muted)] mr-auto">Fetched from CDSC MeroShare API</span>
            <button onClick={loadIssues} disabled={issuesLoading} className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-medium bg-[var(--accent)] text-black hover:opacity-90 transition-opacity disabled:opacity-50">
              {issuesLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}
              Refresh Issues
            </button>
          </div>

          {issuesLoading ? (
            <div className="text-center py-20 text-[var(--text-muted)]">
              <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-[var(--accent)]" />
              <p className="text-sm">Fetching open issues from CDSC...</p>
            </div>
          ) : issues.length === 0 ? (
            <div className="text-center py-20 text-[var(--text-muted)]">
              <Layers className="h-12 w-12 mx-auto mb-4 opacity-30" />
              <p className="text-sm">No open issues found. Click Refresh to fetch.</p>
            </div>
          ) : (
            issues.map((issue) => {
              const sel = accounts.filter((a) => selected.has(a.username));
              return (
                <div key={issue.company_share_id} className="rounded-xl border border-[var(--border-primary)] bg-[var(--bg-card)] p-5 hover:border-[var(--accent)] hover:shadow-[0_0_20px_rgba(255,215,0,0.08)] transition-all">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h3 className="text-base font-semibold text-[var(--text-primary)]">{issue.company_name}</h3>
                      <div className="flex flex-wrap gap-3 mt-1.5">
                        <span className="text-xs text-[var(--text-muted)] flex items-center gap-1"><Hash className="h-3 w-3 text-[var(--accent)]" />{issue.scrip}</span>
                        <span className="text-xs text-[var(--text-muted)] flex items-center gap-1"><Layers className="h-3 w-3 text-[var(--accent)]" />{issue.share_type_name}</span>
                        <span className="text-xs text-[var(--text-muted)] flex items-center gap-1"><ChevronDown className="h-3 w-3 text-[var(--accent)]" />{issue.subgroup}</span>
                        <span className="text-xs text-[var(--text-muted)] flex items-center gap-1"><Shield className="h-3 w-3 text-[var(--accent)]" />{issue.share_group_name}</span>
                      </div>
                    </div>
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[var(--accent)]/15 text-[var(--accent)]">{issue.status_name}</span>
                  </div>

                  <div className="flex gap-5 mb-3 text-xs text-[var(--text-muted)]">
                    <span className="flex items-center gap-1"><Calendar className="h-3 w-3" /> Open: <strong className="text-[var(--text-primary)]">{issue.issue_open_date || "N/A"}</strong></span>
                    <span className="flex items-center gap-1"><Calendar className="h-3 w-3" /> Close: <strong className="text-[var(--text-primary)]">{issue.issue_close_date || "N/A"}</strong></span>
                  </div>

                  <div className="grid grid-cols-[repeat(auto-fill,minmax(200px,1fr))] gap-2 mb-4">
                    {sel.length === 0 ? (
                      <div className="text-xs text-[var(--text-muted)]">Select accounts in the Accounts tab first.</div>
                    ) : (
                      sel.map((a) => {
                        const st = issue.is_applied ? "Applied" : issue.is_unapplied_ordinary_share ? "Not Applied" : "Ineligible";
                        const dotColor = st === "Applied" ? "bg-[var(--green)]" : st === "Not Applied" ? "bg-amber-400" : "bg-[var(--text-muted)]";
                        const badgeColor = st === "Applied" ? "bg-[var(--green-bg)] text-[var(--green)]" : st === "Not Applied" ? "bg-amber-500/15 text-amber-400" : "bg-[var(--bg-hover)] text-[var(--text-muted)]";
                        return (
                          <div key={a.username} className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[var(--bg-hover)] text-xs">
                            <span className={`w-2 h-2 rounded-full flex-shrink-0 ${dotColor}`} />
                            <span className="text-[var(--text-primary)] truncate">{a.user}</span>
                            <span className={`ml-auto px-1.5 py-0.5 rounded text-[10px] font-semibold ${badgeColor}`}>{st}</span>
                          </div>
                        );
                      })
                    )}
                  </div>

                  <div className="flex items-center gap-3 pt-3 border-t border-[var(--border-primary)]">
                    <label className="text-xs text-[var(--text-muted)]">Kitta:</label>
                    <input
                      type="number"
                      value={kittaValues[issue.company_share_id] || 10}
                      onChange={(e) => setKittaValues((v) => ({ ...v, [issue.company_share_id]: parseInt(e.target.value) || 10 }))}
                      min={10}
                      step={10}
                      className="w-20 px-2 py-1 rounded-lg bg-[var(--bg-hover)] border border-[var(--border-primary)] text-[var(--text-primary)] text-xs text-center outline-none focus:border-[var(--accent)]"
                    />
                    <button
                      onClick={() => handleBulkApply(issue.company_share_id, true)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border border-[var(--accent)] text-[var(--accent)] hover:bg-[var(--accent)]/10 transition-colors"
                    >
                      Dry Run
                    </button>
                    <button
                      onClick={() => handleBulkApply(issue.company_share_id, false)}
                      className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-medium bg-[var(--accent)] text-black hover:opacity-90 transition-opacity ml-auto"
                    >
                      <Zap className="h-3.5 w-3.5" /> Bulk Apply Selected
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* ============ REPORTS TAB ============ */}
      {tab === "reports" && (
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <span className="text-sm text-[var(--text-muted)] mr-auto">Allotment reports for selected accounts</span>
            <button onClick={loadReports} disabled={reportsLoading} className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-medium bg-[var(--accent)] text-black hover:opacity-90 transition-opacity disabled:opacity-50">
              {reportsLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <FileText className="h-3.5 w-3.5" />}
              Generate Bulk Report
            </button>
          </div>

          {reportsLoading ? (
            <div className="text-center py-20 text-[var(--text-muted)]">
              <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-[var(--accent)]" />
              <p className="text-sm">Generating allotment reports...</p>
            </div>
          ) : Object.keys(reports).length === 0 ? (
            <div className="text-center py-20 text-[var(--text-muted)]">
              <FileText className="h-12 w-12 mx-auto mb-4 opacity-30" />
              <p className="text-sm">No reports yet. Select accounts and click Generate.</p>
            </div>
          ) : (
            Object.entries(reports).map(([username, acc]) => (
              <div key={username} className="rounded-xl border border-[var(--border-primary)] bg-[var(--bg-card)] p-5">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-[var(--text-primary)]">{acc.user || username}</h3>
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[var(--accent)]/15 text-[var(--accent)]">{acc.reports.length} application{acc.reports.length !== 1 ? "s" : ""}</span>
                </div>

                {acc.error ? (
                  <div className="text-sm text-[var(--red)] flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4" /> {acc.error}
                  </div>
                ) : acc.reports.length === 0 ? (
                  <p className="text-sm text-[var(--text-muted)]">No applications found.</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-[var(--border-primary)] text-left text-xs font-medium text-[var(--text-muted)]">
                          <th className="pb-2 pr-4">Company</th>
                          <th className="pb-2 pr-4">Scrip</th>
                          <th className="pb-2 pr-4 text-right">Kitta</th>
                          <th className="pb-2 pr-4">Verify Status</th>
                          <th className="pb-2">Allotment</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[var(--border-primary)]">
                        {acc.reports.map((r, i) => {
                          const stColor = r.allotmentStatus === "ALLOTTED" ? "bg-[var(--green-bg)] text-[var(--green)]" : r.allotmentStatus === "NOT_ALLOTTED" ? "bg-[var(--red-bg)] text-[var(--red)]" : "bg-[var(--bg-hover)] text-[var(--text-muted)]";
                          return (
                            <tr key={i}>
                              <td className="py-2.5 pr-4 text-[var(--text-primary)]">{r.companyName || "N/A"}</td>
                              <td className="py-2.5 pr-4 text-[var(--text-muted)]">{r.scrip || "N/A"}</td>
                              <td className="py-2.5 pr-4 text-right font-mono">{r.appliedKitta || "N/A"}</td>
                              <td className="py-2.5 pr-4"><span className="px-2 py-0.5 rounded text-xs font-medium bg-[var(--bg-hover)] text-[var(--text-muted)]">{r.statusName || "N/A"}</span></td>
                              <td className="py-2.5"><span className={`px-2 py-0.5 rounded text-xs font-semibold ${stColor}`}>{r.allotmentStatus || "N/A"}</span></td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      )}

      {/* ============ HISTORY TAB ============ */}
      {tab === "history" && (
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <span className="text-sm text-[var(--text-muted)] mr-auto">{history.length} record{history.length !== 1 ? "s" : ""}</span>
            <button onClick={exportHistory} disabled={!history.length} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border border-[var(--border-primary)] text-[var(--text-muted)] hover:text-[var(--accent)] hover:border-[var(--accent)] transition-colors disabled:opacity-40">
              <Download className="h-3.5 w-3.5" /> Export CSV
            </button>
            <button onClick={loadHistory} disabled={historyLoading} className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-medium bg-[var(--accent)] text-black hover:opacity-90 transition-opacity disabled:opacity-50">
              {historyLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}
              Refresh
            </button>
          </div>

          {historyLoading ? (
            <div className="text-center py-20 text-[var(--text-muted)]">
              <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-[var(--accent)]" />
              <p className="text-sm">Loading history...</p>
            </div>
          ) : history.length === 0 ? (
            <div className="text-center py-20 text-[var(--text-muted)]">
              <Clock className="h-12 w-12 mx-auto mb-4 opacity-30" />
              <p className="text-sm">No apply history yet.</p>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-[var(--border-primary)] bg-[var(--bg-card)]">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[var(--border-primary)] text-left text-xs font-medium text-[var(--text-muted)]">
                    <th className="px-4 py-3">Date</th>
                    <th className="px-4 py-3">Account</th>
                    <th className="px-4 py-3">Company</th>
                    <th className="px-4 py-3">Scrip</th>
                    <th className="px-4 py-3 text-right">Kitta</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Message</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border-primary)]">
                  {history.map((h) => (
                    <tr key={h.id} className="hover:bg-[var(--bg-hover)] transition-colors">
                      <td className="px-4 py-2.5 text-xs text-[var(--text-muted)]">{h.applied_at}</td>
                      <td className="px-4 py-2.5">
                        <div className="text-[var(--text-primary)] text-xs">{h.user}</div>
                        <div className="text-[var(--text-muted)] text-[10px] font-mono">{h.username}</div>
                      </td>
                      <td className="px-4 py-2.5 text-[var(--text-primary)] text-xs">{h.company_name}</td>
                      <td className="px-4 py-2.5 text-[var(--text-muted)] text-xs">{h.scrip}</td>
                      <td className="px-4 py-2.5 text-right font-mono text-xs">{h.kitta}</td>
                      <td className="px-4 py-2.5">
                        <span className={`px-2 py-0.5 rounded text-xs font-semibold ${h.success ? "bg-[var(--green-bg)] text-[var(--green)]" : "bg-[var(--red-bg)] text-[var(--red)]"}`}>
                          {h.success ? "Success" : "Failed"}
                        </span>
                      </td>
                      <td className="px-4 py-2.5 text-[var(--text-muted)] text-xs max-w-[200px] truncate">{h.message}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ============ ACCOUNT MODAL ============ */}
      <Modal open={accModalOpen} onClose={() => setAccModalOpen(false)} title={editingUser ? "Edit Account" : "Add Account"}>
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-[var(--text-muted)] mb-1.5">Display Name</label>
            <input value={accForm.user} onChange={(e) => setAccForm((f) => ({ ...f, user: e.target.value }))} placeholder="e.g. John Doe" className="w-full px-3 py-2 rounded-lg bg-[var(--bg-hover)] border border-[var(--border-primary)] text-[var(--text-primary)] text-sm outline-none focus:border-[var(--accent)]" />
          </div>

          <div className="relative" ref={dpRef}>
            <label className="block text-xs font-medium text-[var(--text-muted)] mb-1.5">DP (Depository Participant)</label>
            <input
              value={dpOpen ? dpSearch : accForm.dp ? `${capitals.find((c) => c.code === accForm.dp)?.name || ""} (${accForm.dp})` : ""}
              onChange={(e) => { setDpSearch(e.target.value); setDpOpen(true); setAccForm((f) => ({ ...f, dp: "" })); }}
              onFocus={() => { setDpOpen(true); setDpSearch(""); }}
              placeholder="Search DP code or name (select from dropdown)..."
              className="w-full px-3 py-2 rounded-lg bg-[var(--bg-hover)] border border-[var(--border-primary)] text-[var(--text-primary)] text-sm outline-none focus:border-[var(--accent)]"
            />
            {dpOpen && filteredDP.length > 0 && (
              <div className="absolute top-full left-0 right-0 max-h-52 overflow-y-auto bg-[var(--bg-card)] border border-[var(--border-primary)] rounded-b-lg z-50">
                {filteredDP.map((c) => (
                  <div
                    key={c.code}
                    onMouseDown={() => selectDP(c.code)}
                    className="px-3 py-2.5 cursor-pointer text-sm border-b border-[var(--border-primary)] last:border-0 text-[var(--text-primary)] hover:bg-[var(--bg-hover)]"
                  >
                    {c.name}
                    <span className="ml-2 text-xs text-[var(--accent)]">{c.code}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-[var(--text-muted)] mb-1.5">MeroShare Username</label>
              <input value={accForm.username} onChange={(e) => setAccForm((f) => ({ ...f, username: e.target.value }))} placeholder="e.g. 00452178" className="w-full px-3 py-2 rounded-lg bg-[var(--bg-hover)] border border-[var(--border-primary)] text-[var(--text-primary)] text-sm outline-none focus:border-[var(--accent)]" />
            </div>
            <div>
              <label className="block text-xs font-medium text-[var(--text-muted)] mb-1.5">Password</label>
              <div className="relative">
                <input type={showPw ? "text" : "password"} value={accForm.password} onChange={(e) => setAccForm((f) => ({ ...f, password: e.target.value }))} placeholder={editingUser ? "(unchanged)" : "MeroShare password"} className="w-full px-3 py-2 pr-9 rounded-lg bg-[var(--bg-hover)] border border-[var(--border-primary)] text-[var(--text-primary)] text-sm outline-none focus:border-[var(--accent)]" />
                <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-2 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-[var(--text-primary)]">
                  {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-[var(--text-muted)] mb-1.5">CRN Number</label>
              <input value={accForm.crn} onChange={(e) => setAccForm((f) => ({ ...f, crn: e.target.value }))} placeholder="CRN" className="w-full px-3 py-2 rounded-lg bg-[var(--bg-hover)] border border-[var(--border-primary)] text-[var(--text-primary)] text-sm outline-none focus:border-[var(--accent)]" />
            </div>
            <div>
              <label className="block text-xs font-medium text-[var(--text-muted)] mb-1.5">Transaction PIN (4-digit)</label>
              <div className="relative">
                <input type={showPin ? "text" : "password"} value={accForm.pin} onChange={(e) => setAccForm((f) => ({ ...f, pin: e.target.value }))} placeholder={editingUser ? "(unchanged)" : "PIN"} maxLength={4} className="w-full px-3 py-2 pr-9 rounded-lg bg-[var(--bg-hover)] border border-[var(--border-primary)] text-[var(--text-primary)] text-sm outline-none focus:border-[var(--accent)]" />
                <button type="button" onClick={() => setShowPin(!showPin)} className="absolute right-2 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-[var(--text-primary)]">
                  {showPin ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 pt-2">
            <button onClick={verifyAccount} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border border-[var(--border-primary)] text-[var(--text-muted)] hover:text-[var(--accent)] hover:border-[var(--accent)] transition-colors">
              <Zap className="h-3.5 w-3.5" /> Test Connection
            </button>
            <div className="flex-1" />
            <button onClick={() => setAccModalOpen(false)} className="px-4 py-1.5 rounded-lg text-xs font-medium border border-[var(--border-primary)] text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors">
              Cancel
            </button>
            <button onClick={saveAccount} className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-medium bg-[var(--accent)] text-black hover:opacity-90 transition-opacity">
              <CheckCircle className="h-3.5 w-3.5" /> Save
            </button>
          </div>
        </div>
      </Modal>

      {/* ============ PROGRESS MODAL ============ */}
      <Modal open={progressOpen} onClose={() => { if (taskStatus?.status === "completed") { setProgressOpen(false); if (pollRef.current) clearInterval(pollRef.current); } }} title={taskStatus?.results?.[0]?.dry_run ? "Dry Run Results" : "Bulk Apply Progress"}>
        <div className="space-y-4">
          {taskStatus && (
            <>
              <div className="h-1.5 bg-[var(--bg-hover)] rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-[var(--accent)] to-[var(--green)] rounded-full transition-all duration-300" style={{ width: `${taskStatus.total > 0 ? (taskStatus.completed / taskStatus.total) * 100 : 0}%` }} />
              </div>
              <div className="text-center text-sm text-[var(--accent)] font-mono">{taskStatus.completed} / {taskStatus.total}</div>
            </>
          )}
          <div className="max-h-64 overflow-y-auto bg-[var(--bg-hover)] rounded-lg p-3 font-mono text-xs space-y-1">
            {taskLogs.length === 0 ? (
              <div className="text-[var(--text-muted)]">Waiting for results...</div>
            ) : (
              taskLogs.map((log, i) => (
                <div key={i} className={log.startsWith("✓") ? "text-[var(--green)]" : log.startsWith("🔍") ? "text-[var(--accent)]" : "text-[var(--red)]"}>{log}</div>
              ))
            )}
          </div>
          <div className="flex justify-end">
            <button
              onClick={() => { setProgressOpen(false); if (pollRef.current) clearInterval(pollRef.current); }}
              disabled={taskStatus?.status !== "completed"}
              className="px-4 py-1.5 rounded-lg text-xs font-medium border border-[var(--border-primary)] text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors disabled:opacity-40"
            >
              Close
            </button>
          </div>
        </div>
      </Modal>

      {/* ============ CONFIRM MODAL ============ */}
      <Modal open={confirmOpen} onClose={() => setConfirmOpen(false)} title="Confirm Delete">
        <div className="space-y-5">
          <p className="text-sm text-[var(--text-muted)] flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-[var(--red)] flex-shrink-0" /> {confirmMsg}
          </p>
          <div className="flex justify-end gap-2">
            <button onClick={() => setConfirmOpen(false)} className="px-4 py-1.5 rounded-lg text-xs font-medium border border-[var(--border-primary)] text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors">
              Cancel
            </button>
            <button onClick={() => { confirmCb.current(); setConfirmOpen(false); }} className="px-4 py-1.5 rounded-lg text-xs font-medium bg-[var(--red)] text-white hover:opacity-90 transition-opacity">
              Delete
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
