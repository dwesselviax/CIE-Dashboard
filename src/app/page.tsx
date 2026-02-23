"use client";

import { useState, useEffect, useMemo } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import type { User } from "@supabase/supabase-js";
import {
  Users,
  AlertTriangle,
  Building2,
  MessageSquare,
  Settings,
  ChevronRight,
  Clock,
  ExternalLink,
  CheckCircle2,
  Circle,
  ArrowLeft,
  Calendar,
  TrendingUp,
  Zap,
  Search,
  LayoutDashboard,
  Lock,
  LogOut,
  ChevronDown,
  ChevronUp,
  MessageCircle,
  Plus,
  X,
} from "lucide-react";

// ─── viax Design Tokens ─────────────────────────────────────────────
const V = {
  bg: "#F8F7F6",
  green: "#90E9B8",
  greenDark: "#5CC98A",
  dark: "#2A2A2A",
  copy: "#1E1E1E",
  muted: "#71717A",
  border: "#E4E4E7",
  card: "#FFFFFF",
  danger: "#EF4444",
  dangerBg: "#FEF2F2",
  warning: "#F59E0B",
  warningBg: "#FFFBEB",
  success: "#10B981",
  successBg: "#ECFDF5",
};

// ─── Mock Data ──────────────────────────────────────────────────────
// Team roster is fetched from Supabase (see Page component).
// Legacy ID mapping keeps mock work items / meeting notes working until those move to DB too.
const EMAIL_TO_LEGACY_ID: Record<string, string> = {
  "lseidenfus@viax.io": "1", "adevgan@viax.io": "2", "vanisetti@viax.io": "3",
  "rchavie@viax.io": "4", "bdiehl@viax.io": "5", "amartin@viax.io": "6",
  "vzubyk@viax.io": "7", "fsantana@viax.io": "8",
};
// DB types for work items and customers fetched from Supabase
type WorkItemDB = {
  id: string; source: string; memberId: string;
  customerId: string | null; customerName: string;
  title: string; status: string; priority: string;
  isBlocker: boolean; blockerDescription: string | null;
  daysInStatus: number;
};
type CustomerDB = { id: string; name: string; connectionStatus: string };

type TeamMember = {
  id: string; name: string; email: string; role: string;
  avatar: string; customers: string[]; oneOnOneCount: number;
};

type MeetingNoteItem = {
  id: string; memberId: string; title: string; date: string; source: string;
  topics: string[]; actionItems: { text: string; done: boolean }[]; summary: string;
};

type ActionItemDB = {
  id: string;
  meeting_note_id: string;
  text: string;
  assignee: string | null;
  done: boolean;
  comment: string | null;
  closed_at: string | null;
  created_at: string;
  // joined fields
  noteTitle?: string;
  noteDate?: string;
};

// Work item and customer data are now fetched from Supabase (see Page component).

const MOCK_MEETING_NOTES = [
  { id: "m1", memberId: "1", title: "1:1 Doug & Lucas", date: "2026-01-26", source: "granola", topics: ["Documentation workflow", "Propello dependency", "Customer expansion strategy", "Strategic positioning"], actionItems: [{ text: "Schedule intervention call with Propello and Dennis", done: true }, { text: "Continue customer expansion strategy discussion", done: false }, { text: "Test demo server with product determination and pricing", done: false }], summary: "Discussed documentation progress and Propello hard dependency blocking tool selection. Lucas raised concerns about expansion strategy requiring significant human investment per account. Identified Solventum as the success model (Tegan as technical rockstar stakeholder). Need to position as strategic partner to trusted advisors." },
  { id: "m2", memberId: "1", title: "1:1 Doug & Lucas", date: "2026-01-19", source: "granola", topics: ["2U project planning", "Timeline alignment", "Resource allocation"], actionItems: [{ text: "Finalize 2U project timeline", done: true }, { text: "Align with Andrew on shared 2U work", done: true }], summary: "Reviewed 2U project timeline and resource needs. Agreed on phased approach starting with documentation before expanding scope. Lucas to coordinate with Andrew on shared deliverables." },
  { id: "m3", memberId: "1", title: "Connect on 2U", date: "2026-01-12", source: "granola", topics: ["2U expectations", "Delivery timeline", "Client relationship"], actionItems: [{ text: "Draft expectations document for 2U", done: true }, { text: "Review delivery milestones", done: true }], summary: "Quick sync on 2U engagement expectations and next steps. Aligned on delivery cadence and communication rhythm with the client." },
  { id: "m4", memberId: "2", title: "1:1 Doug & Akash", date: "2026-02-03", source: "granola", topics: ["Solventum configuration", "Technical challenges", "Growth goals"], actionItems: [{ text: "Document configuration rules approach", done: false }, { text: "Schedule deep dive on Solventum architecture", done: true }], summary: "Reviewed Akash's progress on Solventum configuration rules. Discussed technical complexities and approaches. Touched on career growth goals and upcoming opportunities." },
  { id: "m5", memberId: "2", title: "1:1 Doug & Akash", date: "2026-01-20", source: "granola", topics: ["Sprint progress", "Solventum integration", "Team collaboration"], actionItems: [{ text: "Connect with Brian on shared Solventum items", done: true }, { text: "Prepare MedSurgery integration check-in", done: true }], summary: "Sprint review with Akash. Good velocity on Solventum work. Discussed coordination needed with Brian on overlapping deliverables." },
  { id: "m6", memberId: "3", title: "1:1 Doug & Vishnu", date: "2026-02-05", source: "granola", topics: ["Stryker KT progress", "Enterprise apps scope", "Learning path"], actionItems: [{ text: "Complete eComm KT session prep", done: false }, { text: "Document key learnings from MSP sessions", done: false }], summary: "Checked in on Stryker MSP knowledge transfer progress. Vishnu making good headway on Enterprise Apps track. Discussed scope of eComm and Payment sessions coming up." },
  { id: "m7", memberId: "3", title: "1:1 Doug & Vishnu", date: "2026-01-22", source: "granola", topics: ["Stryker onboarding", "KT kickoff planning", "Technical readiness"], actionItems: [{ text: "Prepare for MSP KT kickoff session", done: true }, { text: "Review Stryker enterprise app documentation", done: true }], summary: "Pre-kickoff planning for Stryker MSP knowledge transfer. Vishnu reviewed existing documentation and identified gaps. Ready for kickoff session." },
  { id: "m8", memberId: "4", title: "Doug & Rick / bus plan", date: "2026-02-10", source: "granola", topics: ["Business plan", "BSCI relationship", "Pipeline strategy"], actionItems: [{ text: "Draft updated business plan section on partnerships", done: false }, { text: "Identify warm intros at BSCI executive level", done: false }], summary: "Business planning discussion focused on partnership strategy. Rick highlighted challenges with BSCI middle management gatekeeping. Need executive-level introductions to unblock." },
  { id: "m9", memberId: "4", title: "Review Rick and Doug", date: "2026-01-27", source: "granola", topics: ["Pipeline review", "Strategym intro", "BSCI monthly prep"], actionItems: [{ text: "Follow up on Strategym B2B agentic research intro", done: true }, { text: "Prepare BSCI monthly catch-up materials", done: true }], summary: "Reviewed pipeline and new opportunities. Strategym intro for B2B agentic research looks promising. Prepped talking points for BSCI monthly." },
  { id: "m10", memberId: "5", title: "Viax team reconnect", date: "2026-02-08", source: "granola", topics: ["Team alignment", "Frontend review outcomes", "Solventum priorities"], actionItems: [{ text: "Implement frontend review action items", done: false }, { text: "Coordinate Shopify Fuse follow-up", done: false }], summary: "Reconnect with Brian on team alignment. Reviewed frontend review outcomes and prioritized Solventum work over Shopify Fuse follow-up given timeline constraints." },
  { id: "m11", memberId: "5", title: "Doug / Brian", date: "2026-01-25", source: "granola", topics: ["Delivery priorities", "Team workload", "Solventum bi-weekly prep"], actionItems: [{ text: "Re-prioritize delivery queue", done: true }, { text: "Prepare for Solventum bi-weekly", done: true }], summary: "Discussed delivery priorities and workload distribution. Brian flagged capacity concerns with parallel Solventum and Shopify tracks." },
  { id: "m12", memberId: "6", title: "Andrew & Doug: Monthly Review", date: "2026-02-20", source: "granola", topics: ["Monthly review", "Solventum progress", "2U coordination", "AI showcase"], actionItems: [{ text: "Follow up on edX timeline with 2U team", done: false }, { text: "Prepare next AI showcase demo", done: false }], summary: "Monthly review covering Andrew's work across Solventum and 2U. EdX subscriptions timeline blocked waiting on 2U team response. Discussed upcoming AI showcase preparation." },
  { id: "m13", memberId: "7", title: "1:1 Doug & Vova", date: "2026-02-12", source: "granola", topics: ["Zaelab collaboration", "Technical growth", "Solventum sync outcomes"], actionItems: [{ text: "Document Zaelab sync key decisions", done: true }, { text: "Explore deeper Zaelab technical integration", done: false }], summary: "Reviewed Vova's work with Zaelab on Solventum sync. Good collaboration but opportunity for deeper technical integration. Discussed growth path and upcoming challenges." },
  { id: "m14", memberId: "8", title: "1:1 Francisco & Doug", date: "2026-01-30", source: "granola", topics: ["BSCI integration", "SAP research", "AI connector strategy"], actionItems: [{ text: "Complete SAP ERP upgrade research", done: false }, { text: "Draft AI connector integration proposal", done: false }], summary: "Francisco progressing on SAP ERP upgrade simplification research for BSCI. Discussed AI-powered connector development approach and how it fits the enterprise integration strategy." },
];

// ─── View Scope ─────────────────────────────────────────────────────
type ViewScope = "team" | "leadership";

// MEMBER_SCOPE is built dynamically from DB data in the Page component.
// These helpers accept it as a parameter.
const getTeamForScope = (team: TeamMember[], memberScope: Record<string, ViewScope>, scope: ViewScope) =>
  team.filter((m) => memberScope[m.id] === scope);

const getWorkItemsForScope = (workItems: WorkItemDB[], memberScope: Record<string, ViewScope>, scope: ViewScope) =>
  workItems.filter((w) => memberScope[w.memberId] === scope);

const getMeetingNotesForScope = (notes: MeetingNoteItem[], memberScope: Record<string, ViewScope>, scope: ViewScope) =>
  notes.filter((n) => memberScope[n.memberId] === scope);

const getCustomersForScope = (customers: CustomerDB[], workItems: WorkItemDB[], memberScope: Record<string, ViewScope>, scope: ViewScope) => {
  // Derive member lists from work items; keep customers with no work items (e.g. newly created)
  return customers.map((c) => {
    const allMemberIds = Array.from(new Set(workItems.filter((w) => w.customerName === c.name).map((w) => w.memberId)));
    const scopedMembers = allMemberIds.filter((id) => memberScope[id] === scope);
    return { ...c, status: c.connectionStatus, members: scopedMembers, hasWorkItems: allMemberIds.length > 0 };
  }).filter((c) => c.members.length > 0 || !c.hasWorkItems);
};

const CONNECTORS = [
  { id: "conn1", name: "Internal Jira", type: "jira", status: "active", lastSync: "2 min ago", itemCount: 47 },
  { id: "conn2", name: "Granola", type: "granola", status: "active", lastSync: "5 min ago", itemCount: 125 },
  { id: "conn3", name: "Slack", type: "slack", status: "planned", lastSync: null, itemCount: 0 },
  { id: "conn4", name: "Confluence", type: "confluence", status: "planned", lastSync: null, itemCount: 0 },
  { id: "conn5", name: "Solventum Jira", type: "jira-customer", status: "pending", lastSync: null, itemCount: 0 },
  { id: "conn6", name: "Obsidian Vault", type: "obsidian", status: "configured", lastSync: "1 hr ago", itemCount: 34 },
];

// ─── Utility ────────────────────────────────────────────────────────
const statusColor = (s: string) => {
  if (s === "Blocked") return { bg: V.dangerBg, text: V.danger, border: V.danger };
  if (s === "In Progress") return { bg: "#EFF6FF", text: "#2563EB", border: "#2563EB" };
  if (s === "Done") return { bg: V.successBg, text: V.success, border: V.success };
  return { bg: "#F4F4F5", text: V.muted, border: V.border };
};

const priorityDot = (p: string) => {
  if (p === "Critical") return V.danger;
  if (p === "High") return V.warning;
  if (p === "Medium") return "#3B82F6";
  return V.muted;
};

const connectorStatusStyle = (s: string) => {
  if (s === "active") return { bg: V.successBg, text: V.success, label: "Active" };
  if (s === "configured") return { bg: "#EFF6FF", text: "#2563EB", label: "Configured" };
  if (s === "pending") return { bg: V.warningBg, text: V.warning, label: "Pending Setup" };
  return { bg: "#F4F4F5", text: V.muted, label: "Planned" };
};

// ─── Styles ─────────────────────────────────────────────────────────
const styles: Record<string, any> = {
  app: { display: "flex", minHeight: "100vh", fontFamily: "'Inter', system-ui, -apple-system, sans-serif", background: V.bg, color: V.copy },
  sidebar: { width: 240, background: V.dark, color: "#fff", display: "flex", flexDirection: "column" as const, position: "sticky" as const, top: 0, height: "100vh", flexShrink: 0 },
  sidebarLogo: { padding: "20px 20px 16px", borderBottom: "1px solid #3a3a3a" },
  logoText: { fontSize: 20, fontWeight: 700, color: V.green, letterSpacing: "-0.5px" },
  logoSub: { fontSize: 11, color: "#999", marginTop: 2, letterSpacing: "0.5px", textTransform: "uppercase" as const },
  navSection: { padding: "16px 12px 8px", fontSize: 10, color: "#666", textTransform: "uppercase" as const, letterSpacing: "1px", fontWeight: 600 },
  navIcon: { width: 16, height: 16, opacity: 0.7 },
  main: { flex: 1, padding: "24px 32px", maxWidth: 1200, margin: "0 auto", width: "100%" },
  pageTitle: { fontSize: 22, fontWeight: 700, color: V.copy, marginBottom: 4 },
  pageSubtitle: { fontSize: 13, color: V.muted, marginBottom: 24 },
  kpiRow: { display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginBottom: 24 },
  kpiCard: { background: V.card, borderRadius: 10, padding: "18px 20px", border: `1px solid ${V.border}` },
  kpiLabel: { fontSize: 11, color: V.muted, textTransform: "uppercase" as const, letterSpacing: "0.5px", marginBottom: 4 },
  kpiValue: { fontSize: 28, fontWeight: 700, color: V.copy },
  kpiSub: { fontSize: 12, color: V.muted, marginTop: 2 },
  card: { background: V.card, borderRadius: 10, border: `1px solid ${V.border}`, overflow: "hidden" },
  cardHeader: { padding: "14px 20px", borderBottom: `1px solid ${V.border}`, display: "flex", justifyContent: "space-between", alignItems: "center" },
  cardTitle: { fontSize: 14, fontWeight: 600, color: V.copy },
  grid2: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 24 },
  grid3: { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 16, marginBottom: 24 },
  tag: { display: "inline-block", padding: "2px 8px", borderRadius: 4, fontSize: 11, background: "#F4F4F5", color: V.muted, marginRight: 4, marginBottom: 4 },
};

const navItem = (active: boolean): React.CSSProperties => ({
  display: "flex", alignItems: "center", gap: 10, padding: "8px 16px", margin: "1px 8px",
  borderRadius: 6, cursor: "pointer", fontSize: 13, fontWeight: active ? 600 : 400,
  color: active ? "#fff" : "#aaa", background: active ? "rgba(144,233,184,0.15)" : "transparent",
  transition: "all 0.15s",
});

const memberCard = (hasBlocker: boolean): React.CSSProperties => ({
  background: V.card, borderRadius: 10, border: `1px solid ${hasBlocker ? V.danger + "40" : V.border}`,
  padding: 20, cursor: "pointer", transition: "all 0.15s",
  borderLeft: hasBlocker ? `3px solid ${V.danger}` : `3px solid transparent`,
});

const avatar = (size = 40): React.CSSProperties => ({
  width: size, height: size, borderRadius: "50%", background: V.green, color: V.dark,
  display: "flex", alignItems: "center", justifyContent: "center", fontSize: size * 0.35,
  fontWeight: 700, flexShrink: 0,
});

const badge = (bg: string, text: string): React.CSSProperties => ({
  display: "inline-flex", alignItems: "center", padding: "2px 8px", borderRadius: 99,
  fontSize: 11, fontWeight: 500, background: bg, color: text,
});

const btn = (primary: boolean): React.CSSProperties => ({
  display: "inline-flex", alignItems: "center", gap: 6, padding: "7px 14px", borderRadius: 6,
  border: primary ? "none" : `1px solid ${V.border}`, background: primary ? V.dark : V.card,
  color: primary ? "#fff" : V.copy, fontSize: 13, fontWeight: 500, cursor: "pointer",
});

// ─── Components ─────────────────────────────────────────────────────
function KPICard({ label, value, sub }: { label: string; value: number; sub?: string }) {
  return (
    <div style={styles.kpiCard}>
      <div style={styles.kpiLabel}>{label}</div>
      <div style={styles.kpiValue}>{value}</div>
      {sub && <div style={styles.kpiSub}>{sub}</div>}
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const c = statusColor(status);
  return <span style={{ ...badge(c.bg, c.text), border: `1px solid ${c.border}30` }}>{status}</span>;
}

function PriorityDot({ priority }: { priority: string }) {
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 12, color: V.muted }}>
      <span style={{ width: 7, height: 7, borderRadius: "50%", background: priorityDot(priority) }} />
      {priority}
    </span>
  );
}

function WorkItemRow({ item, showMember, team, onUpdate, customers }: { item: WorkItemDB; showMember?: boolean; team: TeamMember[]; onUpdate?: (id: string, patch: Record<string, unknown>) => void; customers?: CustomerDB[] }) {
  const [editingField, setEditingField] = useState<string | null>(null);
  const [blockerText, setBlockerText] = useState(item.blockerDescription || "");
  const [titleText, setTitleText] = useState(item.title);
  const member = team.find((t) => t.id === item.memberId);

  const handleFieldChange = (field: string, value: unknown) => {
    setEditingField(null);
    if (onUpdate) onUpdate(item.id, { [field]: value });
  };

  return (
    <div style={{ padding: "12px 20px", borderBottom: `1px solid ${V.border}`, display: "flex", alignItems: "center", gap: 12 }}>
      {showMember && member && <div style={avatar(28)}>{member.avatar}</div>}
      <div style={{ flex: 1, minWidth: 0 }}>
        {editingField === "title" && onUpdate ? (
          <input
            autoFocus
            type="text"
            value={titleText}
            onChange={(e) => setTitleText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") { onUpdate(item.id, { title: titleText }); setEditingField(null); }
              if (e.key === "Escape") { setTitleText(item.title); setEditingField(null); }
            }}
            onBlur={() => { if (titleText && titleText !== item.title) { onUpdate(item.id, { title: titleText }); } setEditingField(null); }}
            style={{ width: "100%", fontSize: 13, fontWeight: 500, color: V.copy, padding: "2px 6px", border: `1px solid ${V.border}`, borderRadius: 4, outline: "none" }}
          />
        ) : (
          <div style={{ fontSize: 13, fontWeight: 500, color: V.copy, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", cursor: onUpdate ? "pointer" : "default" }} onClick={() => onUpdate && (setTitleText(item.title), setEditingField("title"))}>{item.title}</div>
        )}
        <div style={{ display: "flex", gap: 8, marginTop: 4, alignItems: "center", flexWrap: "wrap" }}>
          {/* Customer — click to edit */}
          {editingField === "customer" && customers ? (
            <select
              autoFocus
              value={item.customerId || ""}
              onChange={(e) => handleFieldChange("customerId", e.target.value || null)}
              onBlur={() => setEditingField(null)}
              style={{ fontSize: 11, padding: "2px 4px", borderRadius: 4, border: `1px solid ${V.border}` }}
            >
              <option value="">None</option>
              {customers.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          ) : (
            <span style={{ ...styles.tag, cursor: onUpdate ? "pointer" : "default" }} onClick={() => onUpdate && setEditingField("customer")}>{item.customerName || "—"}</span>
          )}
          {/* Priority — click to edit */}
          {editingField === "priority" ? (
            <select
              autoFocus
              value={item.priority}
              onChange={(e) => handleFieldChange("priority", e.target.value)}
              onBlur={() => setEditingField(null)}
              style={{ fontSize: 11, padding: "2px 4px", borderRadius: 4, border: `1px solid ${V.border}` }}
            >
              {["Critical", "High", "Medium", "Low"].map((p) => <option key={p} value={p}>{p}</option>)}
            </select>
          ) : (
            <span style={{ cursor: onUpdate ? "pointer" : "default" }} onClick={() => onUpdate && setEditingField("priority")}>
              <PriorityDot priority={item.priority} />
            </span>
          )}
          {item.daysInStatus > 0 && <span style={{ fontSize: 11, color: V.muted }}>{item.daysInStatus}d in status</span>}
          {/* Blocker toggle */}
          {onUpdate && (
            <span
              style={{ cursor: "pointer", fontSize: 12, color: item.isBlocker ? V.danger : V.muted, display: "inline-flex", alignItems: "center", gap: 2 }}
              onClick={() => {
                if (item.isBlocker) {
                  onUpdate(item.id, { isBlocker: false });
                } else {
                  onUpdate(item.id, { isBlocker: true });
                  setEditingField("blocker");
                  setBlockerText("");
                }
              }}
              title={item.isBlocker ? "Remove blocker" : "Mark as blocker"}
            >
              <AlertTriangle size={12} />
            </span>
          )}
        </div>
        {item.isBlocker && editingField === "blocker" && onUpdate ? (
          <div style={{ marginTop: 6 }}>
            <input
              autoFocus
              type="text"
              value={blockerText}
              onChange={(e) => setBlockerText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") { onUpdate(item.id, { blockerDescription: blockerText }); setEditingField(null); }
                if (e.key === "Escape") setEditingField(null);
              }}
              onBlur={() => { if (blockerText) { onUpdate(item.id, { blockerDescription: blockerText }); } setEditingField(null); }}
              placeholder="Describe the blocker..."
              style={{ width: "100%", padding: "6px 10px", fontSize: 12, border: `1px solid ${V.danger}40`, borderRadius: 6, background: V.dangerBg, outline: "none" }}
            />
          </div>
        ) : item.isBlocker && item.blockerDescription ? (
          <div style={{ fontSize: 12, color: V.danger, marginTop: 6, padding: "6px 10px", background: V.dangerBg, borderRadius: 6, cursor: onUpdate ? "pointer" : "default" }} onClick={() => onUpdate && (setEditingField("blocker"), setBlockerText(item.blockerDescription || ""))}>
            <AlertTriangle size={12} style={{ marginRight: 4, verticalAlign: "middle" }} />
            {item.blockerDescription}
          </div>
        ) : null}
      </div>
      {/* Status — click to edit */}
      {editingField === "status" ? (
        <select
          autoFocus
          value={item.status}
          onChange={(e) => handleFieldChange("status", e.target.value)}
          onBlur={() => setEditingField(null)}
          style={{ fontSize: 11, padding: "2px 6px", borderRadius: 99, border: `1px solid ${V.border}` }}
        >
          {["To Do", "In Progress", "Blocked", "Done"].map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
      ) : (
        <span style={{ cursor: onUpdate ? "pointer" : "default" }} onClick={() => onUpdate && setEditingField("status")}>
          <StatusBadge status={item.status} />
        </span>
      )}
    </div>
  );
}

function MeetingNoteCard({ note }: { note: MeetingNoteItem }) {
  const [expanded, setExpanded] = useState(false);
  return (
    <div style={{ padding: "16px 20px", borderBottom: `1px solid ${V.border}` }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", cursor: "pointer" }} onClick={() => setExpanded(!expanded)}>
        <div>
          <div style={{ fontSize: 13, fontWeight: 600, color: V.copy }}>{note.title}</div>
          <div style={{ fontSize: 12, color: V.muted, marginTop: 2 }}>{new Date(note.date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</div>
        </div>
        <span style={{ ...badge("#F4F4F5", V.muted), fontSize: 10 }}>{note.source}</span>
      </div>
      {expanded && (
        <div style={{ marginTop: 12 }}>
          <div style={{ fontSize: 13, color: V.copy, lineHeight: 1.6, marginBottom: 12 }}>{note.summary}</div>
          <div style={{ marginBottom: 8 }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: V.muted, textTransform: "uppercase", marginBottom: 6 }}>Topics</div>
            <div>{note.topics.map((t, i) => <span key={i} style={styles.tag}>{t}</span>)}</div>
          </div>
          <div>
            <div style={{ fontSize: 11, fontWeight: 600, color: V.muted, textTransform: "uppercase", marginBottom: 6 }}>Action Items</div>
            {note.actionItems.map((a, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, padding: "4px 0", fontSize: 13 }}>
                {a.done ? <CheckCircle2 size={14} color={V.success} /> : <Circle size={14} color={V.muted} />}
                <span style={{ color: a.done ? V.muted : V.copy, textDecoration: a.done ? "line-through" : "none" }}>{a.text}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Pages ──────────────────────────────────────────────────────────
function DashboardView({ onNavigate, scope = "team", team: allTeam, memberScope, workItems: allWorkItems, customers: allCustomers }: { onNavigate: (page: string, id?: string) => void; scope?: ViewScope; team: TeamMember[]; memberScope: Record<string, ViewScope>; workItems: WorkItemDB[]; customers: CustomerDB[] }) {
  const team = getTeamForScope(allTeam, memberScope, scope);
  const workItems = getWorkItemsForScope(allWorkItems, memberScope, scope);
  const customers = getCustomersForScope(allCustomers, allWorkItems, memberScope, scope);
  const blockers = workItems.filter((w) => w.isBlocker);
  const inProgress = workItems.filter((w) => w.status === "In Progress");
  const isLeadership = scope === "leadership";
  return (
    <div style={isLeadership ? { background: "#F5F3FF", margin: "-24px -32px", padding: "24px 32px", minHeight: "100vh" } : undefined}>
      <div style={styles.pageTitle}>{isLeadership ? "Leadership Overview" : "Team Overview"}</div>
      <div style={styles.pageSubtitle}>{isLeadership ? "Direct reports — leadership & business development" : "Co-Innovation Engineering — real-time status across all engagements"}</div>
      <div style={styles.kpiRow}>
        <KPICard label={isLeadership ? "Leadership" : "Team Members"} value={team.length} sub={`across ${customers.length} customers`} />
        <KPICard label="Active Items" value={inProgress.length} sub="in progress now" />
        <KPICard label="Blockers" value={blockers.length} sub={blockers.length > 0 ? "needs attention" : "all clear"} />
        <KPICard label="Customers" value={customers.filter((c) => c.status === "active").length} sub="active engagements" />
      </div>
      <div style={styles.grid3}>
        {team.map((m) => {
          const items = workItems.filter((w) => w.memberId === m.id);
          const hasBlocker = items.some((w) => w.isBlocker);
          const activeCount = items.filter((w) => w.status === "In Progress").length;
          return (
            <div key={m.id} style={memberCard(hasBlocker)} onClick={() => onNavigate("member", m.id)}>
              <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
                <div style={avatar()}>{m.avatar}</div>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 600 }}>{m.name}</div>
                  <div style={{ fontSize: 12, color: V.muted }}>{m.role}</div>
                </div>
              </div>
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 10 }}>
                {m.customers.map((c, i) => <span key={i} style={styles.tag}>{c}</span>)}
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: V.muted }}>
                <span>{activeCount} active · {items.length} total</span>
                {hasBlocker && <span style={{ color: V.danger, fontWeight: 600 }}>Blocked</span>}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function MemberDetailPage({ memberId, onNavigate, team, memberScope, meetingNotes, workItems, customers, onWorkItemUpdate, onWorkItemCreate }: { memberId: string; onNavigate: (page: string, id?: string) => void; team: TeamMember[]; memberScope: Record<string, ViewScope>; meetingNotes: MeetingNoteItem[]; workItems: WorkItemDB[]; customers: CustomerDB[]; onWorkItemUpdate: (id: string, patch: Record<string, unknown>) => void; onWorkItemCreate: (memberId: string, fields: { title: string; customerId?: string | null; priority?: string }) => void }) {
  const [showAddForm, setShowAddForm] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newCustomerId, setNewCustomerId] = useState<string>("");
  const [newPriority, setNewPriority] = useState("Medium");
  const member = team.find((t) => t.id === memberId);
  const items = workItems.filter((w) => w.memberId === memberId);
  const notes = meetingNotes.filter((n) => n.memberId === memberId);
  const isLeadership = memberScope[memberId] === "leadership";

  const handleSubmitNew = () => {
    if (!newTitle.trim()) return;
    onWorkItemCreate(memberId, {
      title: newTitle.trim(),
      customerId: newCustomerId || null,
      priority: newPriority,
    });
    setNewTitle("");
    setNewCustomerId("");
    setNewPriority("Medium");
    setShowAddForm(false);
  };

  if (!member) return null;
  return (
    <div style={isLeadership ? { background: "#F5F3FF", margin: "-24px -32px", padding: "24px 32px", minHeight: "100vh" } : undefined}>
      <div style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 13, color: V.muted, cursor: "pointer", marginBottom: 16, padding: "4px 0" }} onClick={() => onNavigate(isLeadership ? "leadershipDashboard" : "dashboard")}>
        <ArrowLeft size={14} /> Back to {isLeadership ? "leadership" : "team"}
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 24 }}>
        <div style={avatar(56)}>{member.avatar}</div>
        <div>
          <div style={styles.pageTitle}>{member.name}</div>
          <div style={styles.pageSubtitle}>{member.role} · {member.email}</div>
        </div>
        <div style={{ marginLeft: "auto" }}>
          <button style={btn(true)} onClick={() => onNavigate("oneOnOne", memberId)}>
            <MessageSquare size={14} /> 1:1 Prep
          </button>
        </div>
      </div>
      <div style={styles.grid2}>
        <div style={styles.card}>
          <div style={styles.cardHeader}>
            <span style={styles.cardTitle}>Work Items ({items.length})</span>
            <button
              style={{ ...btn(false), padding: "4px 10px", fontSize: 12, gap: 4 }}
              onClick={() => setShowAddForm(!showAddForm)}
            >
              <Plus size={12} /> Add
            </button>
          </div>
          {showAddForm && (
            <div style={{ padding: "12px 20px", borderBottom: `1px solid ${V.border}`, background: "#FAFAFA" }}>
              <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                <input
                  autoFocus
                  type="text"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleSubmitNew();
                    if (e.key === "Escape") { setShowAddForm(false); setNewTitle(""); }
                  }}
                  placeholder="Work item title..."
                  style={{ flex: 1, padding: "6px 10px", fontSize: 13, border: `1px solid ${V.border}`, borderRadius: 6, outline: "none" }}
                />
                <select
                  value={newCustomerId}
                  onChange={(e) => setNewCustomerId(e.target.value)}
                  style={{ padding: "6px 8px", fontSize: 12, border: `1px solid ${V.border}`, borderRadius: 6 }}
                >
                  <option value="">No customer</option>
                  {customers.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
                <select
                  value={newPriority}
                  onChange={(e) => setNewPriority(e.target.value)}
                  style={{ padding: "6px 8px", fontSize: 12, border: `1px solid ${V.border}`, borderRadius: 6 }}
                >
                  {["Critical", "High", "Medium", "Low"].map((p) => <option key={p} value={p}>{p}</option>)}
                </select>
                <button style={{ ...btn(true), padding: "6px 12px", fontSize: 12 }} onClick={handleSubmitNew}>Add</button>
              </div>
            </div>
          )}
          {items.map((item) => <WorkItemRow key={item.id} item={item} team={team} onUpdate={onWorkItemUpdate} customers={customers} />)}
          {items.length === 0 && !showAddForm && <div style={{ padding: 20, textAlign: "center", color: V.muted, fontSize: 13 }}>No work items</div>}
        </div>
        <div style={styles.card}>
          <div style={styles.cardHeader}>
            <span style={styles.cardTitle}>Recent 1:1 Notes ({notes.length})</span>
            <span style={{ fontSize: 12, color: V.green, cursor: "pointer" }} onClick={() => onNavigate("oneOnOne", memberId)}>View all →</span>
          </div>
          {notes.slice(0, 3).map((note) => <MeetingNoteCard key={note.id} note={note} />)}
          {notes.length === 0 && <div style={{ padding: 20, textAlign: "center", color: V.muted, fontSize: 13 }}>No 1:1 notes yet</div>}
        </div>
      </div>
    </div>
  );
}

function ActionItemRow({ item, onToggle, onComment }: { item: ActionItemDB; onToggle: (id: string, done: boolean) => void; onComment: (id: string, comment: string) => void }) {
  const [showComment, setShowComment] = useState(false);
  const [commentText, setCommentText] = useState(item.comment || "");
  const [saving, setSaving] = useState(false);

  const handleSaveComment = () => {
    if (commentText !== (item.comment || "")) {
      onComment(item.id, commentText);
    }
    setShowComment(false);
  };

  return (
    <div style={{ padding: "10px 0", borderBottom: `1px solid ${V.border}` }}>
      <div style={{ display: "flex", alignItems: "flex-start", gap: 8 }}>
        <div
          style={{ cursor: "pointer", marginTop: 2, flexShrink: 0, opacity: saving ? 0.5 : 1 }}
          onClick={async () => {
            setSaving(true);
            await onToggle(item.id, !item.done);
            setSaving(false);
          }}
        >
          {item.done
            ? <CheckCircle2 size={16} color={V.success} />
            : <Circle size={16} color={V.muted} />}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 13, color: item.done ? V.muted : V.copy, textDecoration: item.done ? "line-through" : "none" }}>
            {item.text}
          </div>
          <div style={{ display: "flex", gap: 8, alignItems: "center", marginTop: 2 }}>
            <span style={{ fontSize: 11, color: V.muted }}>from {item.noteTitle} · {item.noteDate}</span>
            {item.assignee && <span style={{ ...badge("#F4F4F5", V.muted), fontSize: 10 }}>{item.assignee}</span>}
          </div>
          {item.comment && !showComment && (
            <div style={{ fontSize: 12, color: V.muted, marginTop: 4, fontStyle: "italic", padding: "4px 8px", background: "#F9FAFB", borderRadius: 4 }}>
              {item.comment}
            </div>
          )}
        </div>
        <button
          style={{ background: "none", border: "none", cursor: "pointer", color: V.muted, padding: 2, flexShrink: 0 }}
          onClick={() => setShowComment(!showComment)}
          title="Add comment"
        >
          <MessageCircle size={14} />
        </button>
      </div>
      {showComment && (
        <div style={{ display: "flex", gap: 8, marginTop: 8, marginLeft: 24 }}>
          <input
            type="text"
            value={commentText}
            onChange={(e) => setCommentText(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") handleSaveComment(); if (e.key === "Escape") setShowComment(false); }}
            placeholder="Add a note (reason, context...)"
            style={{ flex: 1, padding: "6px 10px", fontSize: 12, border: `1px solid ${V.border}`, borderRadius: 6, outline: "none" }}
            autoFocus
          />
          <button style={{ ...btn(true), fontSize: 12, padding: "5px 12px" }} onClick={handleSaveComment}>Save</button>
        </div>
      )}
    </div>
  );
}

function OneOnOnePage({ memberId, onNavigate, team, memberScope, meetingNotes, actionItems, setActionItems, workItems, customers, onWorkItemUpdate }: { memberId: string; onNavigate: (page: string, id?: string) => void; team: TeamMember[]; memberScope: Record<string, ViewScope>; meetingNotes: MeetingNoteItem[]; actionItems: ActionItemDB[]; setActionItems: React.Dispatch<React.SetStateAction<ActionItemDB[]>>; workItems: WorkItemDB[]; customers: CustomerDB[]; onWorkItemUpdate: (id: string, patch: Record<string, unknown>) => void }) {
  const [showClosed, setShowClosed] = useState(false);
  const member = team.find((t) => t.id === memberId);
  const notes = meetingNotes.filter((n) => n.memberId === memberId);
  const items = workItems.filter((w) => w.memberId === memberId);
  const isLeadership = memberScope[memberId] === "leadership";

  // Get meeting note UUIDs for this member
  const memberNoteIds = new Set(notes.map((n) => n.id));

  // Filter action items to this member's meeting notes
  const memberActions = actionItems.filter((a) => memberNoteIds.has(a.meeting_note_id));
  const openActions = memberActions.filter((a) => !a.done);
  const closedActions = memberActions.filter((a) => a.done);

  // Fallback: if no DB action items, derive from JSON (mock data path)
  const fallbackOpenActions = memberActions.length === 0
    ? notes.flatMap((n) => n.actionItems.filter((a) => !a.done).map((a) => ({ ...a, from: n.title, date: n.date })))
    : [];
  const hasDBActions = memberActions.length > 0;

  const handleToggle = async (id: string, done: boolean) => {
    try {
      const res = await fetch(`/api/action-items/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ done }),
      });
      if (res.ok) {
        const updated = await res.json();
        setActionItems((prev) => prev.map((a) => a.id === id ? { ...a, done: updated.done, closed_at: updated.closedAt || updated.closed_at } : a));
      }
    } catch (err) {
      console.error("Failed to toggle action item:", err);
    }
  };

  const handleComment = async (id: string, comment: string) => {
    try {
      const res = await fetch(`/api/action-items/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ comment }),
      });
      if (res.ok) {
        setActionItems((prev) => prev.map((a) => a.id === id ? { ...a, comment: comment || null } : a));
      }
    } catch (err) {
      console.error("Failed to save comment:", err);
    }
  };

  if (!member) return null;
  return (
    <div style={isLeadership ? { background: "#F5F3FF", margin: "-24px -32px", padding: "24px 32px", minHeight: "100vh" } : undefined}>
      <div style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 13, color: V.muted, cursor: "pointer", marginBottom: 16, padding: "4px 0" }} onClick={() => onNavigate("member", memberId)}>
        <ArrowLeft size={14} /> Back to {member.name}
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 8 }}>
        <div style={avatar(48)}>{member.avatar}</div>
        <div>
          <div style={styles.pageTitle}>1:1 Prep — {member.name}</div>
          <div style={styles.pageSubtitle}>Prepare for your next 1:1 with context from prior meetings and current work</div>
        </div>
      </div>

      {/* AI Suggested Talking Points */}
      <div style={{ ...styles.card, marginBottom: 16, borderLeft: `3px solid ${V.green}` }}>
        <div style={{ ...styles.cardHeader, background: `${V.green}10` }}>
          <span style={{ ...styles.cardTitle, display: "flex", alignItems: "center", gap: 6 }}>
            <Zap size={14} color={V.greenDark} /> Suggested Talking Points
          </span>
          <span style={badge(V.successBg, V.success)}>AI Generated</span>
        </div>
        <div style={{ padding: 20 }}>
          {items.filter((w) => w.isBlocker).length > 0 && (
            <div style={{ display: "flex", gap: 8, marginBottom: 12, alignItems: "flex-start" }}>
              <AlertTriangle size={16} color={V.danger} style={{ marginTop: 2, flexShrink: 0 }} />
              <div>
                <div style={{ fontSize: 13, fontWeight: 600, color: V.danger }}>Address blockers</div>
                <div style={{ fontSize: 12, color: V.muted }}>
                  {items.filter((w) => w.isBlocker).map((w) => w.title).join("; ")}
                </div>
              </div>
            </div>
          )}
          {openActions.length > 0 && (
            <div style={{ display: "flex", gap: 8, marginBottom: 12, alignItems: "flex-start" }}>
              <CheckCircle2 size={16} color={V.warning} style={{ marginTop: 2, flexShrink: 0 }} />
              <div>
                <div style={{ fontSize: 13, fontWeight: 600 }}>Review open action items ({openActions.length})</div>
                <div style={{ fontSize: 12, color: V.muted }}>From prior 1:1s — check progress and remove roadblocks</div>
              </div>
            </div>
          )}
          <div style={{ display: "flex", gap: 8, marginBottom: 12, alignItems: "flex-start" }}>
            <TrendingUp size={16} color="#3B82F6" style={{ marginTop: 2, flexShrink: 0 }} />
            <div>
              <div style={{ fontSize: 13, fontWeight: 600 }}>Work in progress</div>
              <div style={{ fontSize: 12, color: V.muted }}>{items.filter((w) => w.status === "In Progress").length} items active across {member.customers.join(", ")}</div>
            </div>
          </div>
          <div style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
            <Calendar size={16} color={V.muted} style={{ marginTop: 2, flexShrink: 0 }} />
            <div>
              <div style={{ fontSize: 13, fontWeight: 600 }}>Last 1:1 recap</div>
              <div style={{ fontSize: 12, color: V.muted }}>{notes.length > 0 ? `${notes[0].date} — Topics: ${notes[0].topics.slice(0, 3).join(", ")}` : "No prior notes"}</div>
            </div>
          </div>
        </div>
      </div>

      <div style={styles.grid2}>
        <div style={styles.card}>
          <div style={styles.cardHeader}>
            <span style={styles.cardTitle}>Open Action Items ({hasDBActions ? openActions.length : fallbackOpenActions.length})</span>
          </div>
          <div style={{ padding: "8px 20px" }}>
            {hasDBActions ? (
              <>
                {openActions.map((a) => (
                  <ActionItemRow key={a.id} item={a} onToggle={handleToggle} onComment={handleComment} />
                ))}
                {openActions.length === 0 && <div style={{ padding: "12px 0", textAlign: "center", color: V.muted, fontSize: 13 }}>All caught up</div>}
                {closedActions.length > 0 && (
                  <div style={{ marginTop: 12 }}>
                    <button
                      style={{ background: "none", border: "none", cursor: "pointer", color: V.muted, fontSize: 12, display: "flex", alignItems: "center", gap: 4, padding: "4px 0" }}
                      onClick={() => setShowClosed(!showClosed)}
                    >
                      {showClosed ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                      {showClosed ? "Hide" : "Show"} closed ({closedActions.length})
                    </button>
                    {showClosed && closedActions.map((a) => (
                      <ActionItemRow key={a.id} item={a} onToggle={handleToggle} onComment={handleComment} />
                    ))}
                  </div>
                )}
              </>
            ) : (
              <>
                {fallbackOpenActions.map((a, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 8, padding: "8px 0", borderBottom: i < fallbackOpenActions.length - 1 ? `1px solid ${V.border}` : "none" }}>
                    <Circle size={14} color={V.muted} style={{ marginTop: 2, flexShrink: 0 }} />
                    <div>
                      <div style={{ fontSize: 13, color: V.copy }}>{a.text}</div>
                      <div style={{ fontSize: 11, color: V.muted }}>from {a.from} · {a.date}</div>
                    </div>
                  </div>
                ))}
                {fallbackOpenActions.length === 0 && <div style={{ padding: "12px 0", textAlign: "center", color: V.muted, fontSize: 13 }}>All caught up</div>}
              </>
            )}
          </div>
        </div>
        <div style={styles.card}>
          <div style={styles.cardHeader}>
            <span style={styles.cardTitle}>Current Work Context</span>
          </div>
          {items.map((item) => <WorkItemRow key={item.id} item={item} team={team} onUpdate={onWorkItemUpdate} customers={customers} />)}
        </div>
      </div>

      <div style={{ ...styles.card, marginTop: 16 }}>
        <div style={styles.cardHeader}>
          <span style={styles.cardTitle}>1:1 Meeting History</span>
          <span style={{ fontSize: 12, color: V.muted }}>{notes.length} meetings</span>
        </div>
        {notes.map((note) => <MeetingNoteCard key={note.id} note={note} />)}
      </div>
    </div>
  );
}

function OneOnOneListPage({ onNavigate, scope = "team", team: allTeam, memberScope, meetingNotes }: { onNavigate: (page: string, id?: string) => void; scope?: ViewScope; team: TeamMember[]; memberScope: Record<string, ViewScope>; meetingNotes: MeetingNoteItem[] }) {
  const team = getTeamForScope(allTeam, memberScope, scope);
  return (
    <div>
      <div style={styles.pageTitle}>1:1 Meetings</div>
      <div style={styles.pageSubtitle}>Prepare for and review 1:1 meetings with your {scope === "leadership" ? "leadership team" : "team"}</div>
      <div style={styles.grid3}>
        {team.map((m) => {
          const notes = meetingNotes.filter((n) => n.memberId === m.id);
          const openActions = notes.flatMap((n) => n.actionItems.filter((a) => !a.done));
          const lastNote = notes[0];
          return (
            <div key={m.id} style={{ ...styles.card, padding: 20, cursor: "pointer" }} onClick={() => onNavigate("oneOnOne", m.id)}>
              <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
                <div style={avatar(36)}>{m.avatar}</div>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 600 }}>{m.name}</div>
                  <div style={{ fontSize: 12, color: V.muted }}>{m.role}</div>
                </div>
                <ChevronRight size={16} color={V.muted} style={{ marginLeft: "auto" }} />
              </div>
              <div style={{ fontSize: 12, color: V.muted, marginBottom: 4 }}>
                Last 1:1: {lastNote ? new Date(lastNote.date).toLocaleDateString("en-US", { month: "short", day: "numeric" }) : "None"}
              </div>
              <div style={{ display: "flex", gap: 12, fontSize: 12 }}>
                <span style={{ color: openActions.length > 0 ? V.warning : V.success }}>{openActions.length} open actions</span>
                <span style={{ color: V.muted }}>{notes.length} meetings</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function BlockerPage({ scope = "team", team, memberScope, workItems: allWorkItems, customers, onWorkItemUpdate }: { scope?: ViewScope; team: TeamMember[]; memberScope: Record<string, ViewScope>; workItems: WorkItemDB[]; customers: CustomerDB[]; onWorkItemUpdate: (id: string, patch: Record<string, unknown>) => void }) {
  const workItems = getWorkItemsForScope(allWorkItems, memberScope, scope);
  const blockers = workItems.filter((w) => w.isBlocker);
  const stale = workItems.filter((w) => w.daysInStatus >= 7 && !w.isBlocker && w.status !== "Done");
  const isLeadership = scope === "leadership";
  return (
    <div style={isLeadership ? { background: "#F5F3FF", margin: "-24px -32px", padding: "24px 32px", minHeight: "100vh" } : undefined}>
      <div style={styles.pageTitle}>Blockers & Risks</div>
      <div style={styles.pageSubtitle}>{isLeadership ? "Leadership items" : "Items"} that need immediate attention</div>
      <div style={{ ...styles.card, marginBottom: 16 }}>
        <div style={{ ...styles.cardHeader, background: V.dangerBg }}>
          <span style={{ ...styles.cardTitle, color: V.danger, display: "flex", alignItems: "center", gap: 6 }}>
            <AlertTriangle size={14} /> Active Blockers ({blockers.length})
          </span>
        </div>
        {blockers.map((item) => <WorkItemRow key={item.id} item={item} showMember team={team} onUpdate={onWorkItemUpdate} customers={customers} />)}
        {blockers.length === 0 && <div style={{ padding: 24, textAlign: "center", color: V.success, fontSize: 14 }}>No active blockers</div>}
      </div>
      <div style={styles.card}>
        <div style={{ ...styles.cardHeader, background: V.warningBg }}>
          <span style={{ ...styles.cardTitle, color: V.warning, display: "flex", alignItems: "center", gap: 6 }}>
            <Clock size={14} /> Stale Items — 7+ days in status ({stale.length})
          </span>
        </div>
        {stale.map((item) => <WorkItemRow key={item.id} item={item} showMember team={team} onUpdate={onWorkItemUpdate} customers={customers} />)}
        {stale.length === 0 && <div style={{ padding: 24, textAlign: "center", color: V.success, fontSize: 14 }}>Nothing stale</div>}
      </div>
    </div>
  );
}

function CustomerPage({ onNavigate, scope = "team", team, memberScope, workItems: allWorkItems, customers: allCustomers, onWorkItemUpdate, onCustomerCreate, onCustomerDelete }: { onNavigate: (page: string, id?: string) => void; scope?: ViewScope; team: TeamMember[]; memberScope: Record<string, ViewScope>; workItems: WorkItemDB[]; customers: CustomerDB[]; onWorkItemUpdate: (id: string, patch: Record<string, unknown>) => void; onCustomerCreate?: (name: string) => void; onCustomerDelete?: (id: string) => void }) {
  const customers = getCustomersForScope(allCustomers, allWorkItems, memberScope, scope);
  const workItems = getWorkItemsForScope(allWorkItems, memberScope, scope);
  const isLeadership = scope === "leadership";
  const [addingCustomer, setAddingCustomer] = useState(false);
  const [newCustomerName, setNewCustomerName] = useState("");
  return (
    <div style={isLeadership ? { background: "#F5F3FF", margin: "-24px -32px", padding: "24px 32px", minHeight: "100vh" } : undefined}>
      <div style={styles.pageTitle}>Customer Engagements</div>
      <div style={styles.pageSubtitle}>Work organized by customer{isLeadership ? " — leadership scope" : " across the team"}</div>
      {customers.map((cust) => {
        const members = team.filter((m) => cust.members.includes(m.id));
        const items = workItems.filter((w) => w.customerName === cust.name);
        const blockers = items.filter((w) => w.isBlocker);
        return (
          <div key={cust.id} style={{ ...styles.card, marginBottom: 16 }}>
            <div style={styles.cardHeader}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <Building2 size={16} color={V.muted} />
                <span style={styles.cardTitle}>{cust.name}</span>
                {cust.status === "discovery" && <span style={badge(V.warningBg, V.warning)}>Discovery</span>}
                {blockers.length > 0 && <span style={badge(V.dangerBg, V.danger)}>{blockers.length} blocker{blockers.length > 1 ? "s" : ""}</span>}
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                {members.map((m) => <div key={m.id} style={{ ...avatar(28), marginLeft: -6, border: `2px solid ${V.card}`, cursor: "pointer" }} title={m.name} onClick={() => onNavigate("member", m.id)}>{m.avatar}</div>)}
                {onCustomerDelete && <button onClick={() => { if (window.confirm(`Delete customer "${cust.name}"? Work items will lose their customer assignment.`)) onCustomerDelete(cust.id); }} style={{ background: "none", border: "none", cursor: "pointer", padding: 4, borderRadius: 4, display: "flex", alignItems: "center", color: V.muted }} title="Delete customer"><X size={14} /></button>}
              </div>
            </div>
            {items.map((item) => <WorkItemRow key={item.id} item={item} showMember team={team} onUpdate={onWorkItemUpdate} customers={allCustomers} />)}
            {items.length === 0 && <div style={{ padding: 16, textAlign: "center", color: V.muted, fontSize: 13 }}>No tracked items yet</div>}
          </div>
        );
      })}
      {onCustomerCreate && !addingCustomer && (
        <div onClick={() => setAddingCustomer(true)} style={{ ...styles.card, padding: 20, border: `2px dashed ${V.border}`, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: 80, cursor: "pointer", marginBottom: 16 }}>
          <div style={{ fontSize: 24, color: V.muted, marginBottom: 4 }}>+</div>
          <div style={{ fontSize: 13, fontWeight: 600, color: V.muted }}>Add Customer</div>
        </div>
      )}
      {onCustomerCreate && addingCustomer && (
        <div style={{ ...styles.card, padding: 16, marginBottom: 16 }}>
          <input
            autoFocus
            placeholder="Customer name..."
            value={newCustomerName}
            onChange={(e) => setNewCustomerName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && newCustomerName.trim()) {
                onCustomerCreate(newCustomerName.trim());
                setNewCustomerName("");
                setAddingCustomer(false);
              }
              if (e.key === "Escape") {
                setNewCustomerName("");
                setAddingCustomer(false);
              }
            }}
            style={{ width: "100%", padding: "8px 12px", border: `1px solid ${V.border}`, borderRadius: 6, fontSize: 14, outline: "none", boxSizing: "border-box" }}
          />
          <div style={{ fontSize: 12, color: V.muted, marginTop: 6 }}>Press Enter to add, Escape to cancel</div>
        </div>
      )}
    </div>
  );
}

function ConnectorsPage() {
  const [syncing, setSyncing] = useState<string | null>(null);
  const [syncResult, setSyncResult] = useState<string | null>(null);

  const handleSync = async (connId: string, connType: string) => {
    if (connType !== "granola") return;
    setSyncing(connId);
    setSyncResult(null);
    try {
      const res = await fetch("/api/sync/granola", { method: "POST" });
      const data = await res.json();
      if (data.success) {
        setSyncResult(`Synced ${data.rowsUpserted} notes (${data.skipped} skipped)`);
      } else {
        setSyncResult(`Error: ${data.error}`);
      }
    } catch (err) {
      setSyncResult(`Sync failed: ${(err as Error).message}`);
    } finally {
      setSyncing(null);
    }
  };

  return (
    <div>
      <div style={styles.pageTitle}>Connectors</div>
      <div style={styles.pageSubtitle}>Manage data sources — add new integrations without code changes</div>
      {syncResult && (
        <div style={{ padding: "10px 16px", marginBottom: 16, borderRadius: 8, background: syncResult.startsWith("Error") ? V.dangerBg : V.successBg, color: syncResult.startsWith("Error") ? V.danger : V.success, fontSize: 13 }}>
          {syncResult}
        </div>
      )}
      <div style={styles.grid3}>
        {CONNECTORS.map((conn) => {
          const s = connectorStatusStyle(conn.status);
          const isSyncing = syncing === conn.id;
          return (
            <div key={conn.id} style={{ ...styles.card, padding: 20 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
                <div style={{ fontSize: 14, fontWeight: 600 }}>{conn.name}</div>
                <span style={badge(s.bg, s.text)}>{s.label}</span>
              </div>
              <div style={{ fontSize: 12, color: V.muted, marginBottom: 4 }}>Type: {conn.type}</div>
              {conn.lastSync && <div style={{ fontSize: 12, color: V.muted }}>Last sync: {conn.lastSync} · {conn.itemCount} items</div>}
              {!conn.lastSync && <div style={{ fontSize: 12, color: V.muted }}>Not yet connected</div>}
              <div style={{ marginTop: 12 }}>
                {(conn.status === "active" || conn.status === "configured") && (
                  <button style={btn(false)} onClick={() => handleSync(conn.id, conn.type)} disabled={isSyncing}>
                    {isSyncing ? "Syncing..." : "↻ Sync Now"}
                  </button>
                )}
                {conn.status === "pending" && <button style={btn(true)}>Configure</button>}
                {conn.status === "planned" && <button style={{ ...btn(false), opacity: 0.5 }}>Coming Soon</button>}
              </div>
            </div>
          );
        })}
        <div style={{ ...styles.card, padding: 20, border: `2px dashed ${V.border}`, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: 160 }}>
          <div style={{ fontSize: 24, color: V.muted, marginBottom: 8 }}>+</div>
          <div style={{ fontSize: 13, fontWeight: 600, color: V.muted }}>Add Connector</div>
          <div style={{ fontSize: 12, color: V.muted, textAlign: "center", marginTop: 4 }}>Jira, Slack, Confluence, Google Drive, or custom</div>
        </div>
      </div>
    </div>
  );
}

// ─── App Shell ──────────────────────────────────────────────────────
const NAV = [
  { id: "dashboard", label: "Team Overview", icon: LayoutDashboard, section: "core" },
  { id: "oneOnOneList", label: "1:1 Meetings", icon: MessageSquare, section: "core" },
  { id: "blockers", label: "Blockers & Risks", icon: AlertTriangle, section: "core" },
  { id: "customers", label: "Customers", icon: Building2, section: "core" },
  { id: "leadershipDashboard", label: "Leadership Overview", icon: LayoutDashboard, section: "personal" },
  { id: "leadershipBlockers", label: "Blockers & Risks", icon: AlertTriangle, section: "personal" },
  { id: "leadershipCustomers", label: "Customers", icon: Building2, section: "personal" },
  { id: "connectors", label: "Connectors", icon: Settings, section: "admin" },
];

export default function Page() {
  const [page, setPage] = useState("dashboard");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [team, setTeam] = useState<TeamMember[]>([]);
  const [memberScope, setMemberScope] = useState<Record<string, ViewScope>>({});
  const [meetingNotes, setMeetingNotes] = useState<MeetingNoteItem[]>([]);
  const [actionItems, setActionItems] = useState<ActionItemDB[]>([]);
  const [workItems, setWorkItems] = useState<WorkItemDB[]>([]);
  const [customers, setCustomers] = useState<CustomerDB[]>([]);
  const router = useRouter();

  // Derive member-customer assignments from work items
  const memberCustomers = useMemo(() => {
    const map: Record<string, string[]> = {};
    for (const w of workItems) {
      if (!w.customerName) continue;
      if (!map[w.memberId]) map[w.memberId] = [];
      if (!map[w.memberId].includes(w.customerName)) map[w.memberId].push(w.customerName);
    }
    return map;
  }, [workItems]);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => setUser(data.user));

    // Fetch team roster from Supabase
    supabase.from("team_members").select("id, name, email, role, view_scope").then(({ data }) => {
      if (!data) return;

      // Build UUID-to-legacy lookup for work items
      const uuidToLegacy: Record<string, string> = {};
      data.forEach((row) => {
        const legacyId = EMAIL_TO_LEGACY_ID[row.email];
        if (legacyId) uuidToLegacy[row.id] = legacyId;
      });

      const members: TeamMember[] = data.map((row) => {
        const legacyId = EMAIL_TO_LEGACY_ID[row.email] || row.id;
        const initials = row.name.split(" ").map((n: string) => n[0]).join("").slice(0, 2).toUpperCase();
        return {
          id: legacyId,
          name: row.name,
          email: row.email,
          role: row.role || "Engineer",
          avatar: initials,
          customers: [], // derived from workItems via memberCustomers memo
          oneOnOneCount: 0,
        };
      });
      setTeam(members);

      const scope: Record<string, ViewScope> = {};
      members.forEach((m) => {
        const row = data.find((r) => (EMAIL_TO_LEGACY_ID[r.email] || r.id) === m.id);
        scope[m.id] = (row?.view_scope === "leadership" ? "leadership" : "team") as ViewScope;
      });
      setMemberScope(scope);

      // Fetch customers from Supabase
      supabase.from("customers").select("id, name, connection_status").then(({ data: custData }) => {
        if (custData && custData.length > 0) {
          setCustomers(custData.map((c: any) => ({ id: c.id, name: c.name, connectionStatus: c.connection_status })));
        }
      });

      // Fetch work items from Supabase with customer join
      supabase
        .from("work_items")
        .select("id, source, source_id, team_member_id, customer_id, title, status, priority, is_blocker, blocker_description, updated_at, customers(name)")
        .then(({ data: wiData }) => {
          if (wiData && wiData.length > 0) {
            const mapped: WorkItemDB[] = wiData.map((row: any) => {
              const legacyMemberId = uuidToLegacy[row.team_member_id] || row.team_member_id;
              const now = Date.now();
              const updatedAt = new Date(row.updated_at).getTime();
              const daysInStatus = Math.max(0, Math.floor((now - updatedAt) / 86400000));
              return {
                id: row.id,
                source: row.source,
                memberId: legacyMemberId,
                customerId: row.customer_id,
                customerName: row.customers?.name || "",
                title: row.title,
                status: row.status || "To Do",
                priority: row.priority || "Medium",
                isBlocker: row.is_blocker || false,
                blockerDescription: row.blocker_description || null,
                daysInStatus,
              };
            });
            setWorkItems(mapped);
          }
        });

      // Fetch meeting notes from Supabase — fall back to mock data if empty
      supabase
        .from("meeting_notes")
        .select("id, team_member_id, title, meeting_date, source, summary, action_items, key_topics")
        .order("meeting_date", { ascending: false })
        .limit(100)
        .then(({ data: notesData }) => {
          if (notesData && notesData.length > 0) {
            const mapped: MeetingNoteItem[] = notesData.map((row: any) => {
              const member = members.find((m) =>
                data!.some(
                  (d: any) => d.id === row.team_member_id && (EMAIL_TO_LEGACY_ID[d.email] || d.id) === m.id
                )
              );
              return {
                id: row.id,
                memberId: member?.id || row.team_member_id,
                title: row.title,
                date: row.meeting_date?.slice(0, 10) || "",
                source: row.source || "granola",
                topics: Array.isArray(row.key_topics) ? row.key_topics : [],
                actionItems: Array.isArray(row.action_items)
                  ? row.action_items.map((a: any) => ({ text: a.text || "", done: !!a.done }))
                  : [],
                summary: row.summary || "",
              };
            });
            setMeetingNotes(mapped);

            // Fetch action items from the dedicated table
            supabase
              .from("action_items")
              .select("id, meeting_note_id, text, assignee, done, comment, closed_at, created_at")
              .order("created_at", { ascending: true })
              .then(({ data: aiData }) => {
                if (aiData && aiData.length > 0) {
                  const noteMap = new Map(notesData.map((n: any) => [n.id, n]));
                  const enriched: ActionItemDB[] = aiData.map((row: any) => {
                    const note = noteMap.get(row.meeting_note_id) as any;
                    return {
                      ...row,
                      noteTitle: note?.title || "",
                      noteDate: note?.meeting_date?.slice(0, 10) || "",
                    };
                  });
                  setActionItems(enriched);
                }
              });
          } else {
            setMeetingNotes(MOCK_MEETING_NOTES);
          }
        });
    });
  }, []);

  // Optimistic work item update with server sync
  const handleWorkItemUpdate = async (id: string, patch: Record<string, unknown>) => {
    // Optimistic update
    setWorkItems((prev) => prev.map((w) => {
      if (w.id !== id) return w;
      const updated = { ...w, ...patch };
      // If customer changed, resolve name
      if ("customerId" in patch) {
        const cust = customers.find((c) => c.id === patch.customerId);
        updated.customerName = cust?.name || "";
      }
      // Clear blocker description when blocker is removed
      if (patch.isBlocker === false) {
        updated.blockerDescription = null;
      }
      return updated;
    }));

    try {
      const res = await fetch(`/api/work-items/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patch),
      });
      if (res.ok) {
        const serverData = await res.json();
        setWorkItems((prev) => prev.map((w) => {
          if (w.id !== id) return w;
          return {
            ...w,
            title: serverData.title || w.title,
            status: serverData.status || w.status,
            priority: serverData.priority || w.priority,
            isBlocker: serverData.is_blocker ?? serverData.isBlocker ?? w.isBlocker,
            blockerDescription: serverData.blocker_description ?? serverData.blockerDescription ?? w.blockerDescription,
            customerId: serverData.customer_id ?? serverData.customerId ?? w.customerId,
            customerName: serverData.customer?.name || w.customerName,
          };
        }));
      }
    } catch (err) {
      console.error("Failed to update work item:", err);
    }
  };

  // Create a new work item via POST API
  const handleWorkItemCreate = async (
    legacyMemberId: string,
    fields: { title: string; customerId?: string | null; priority?: string }
  ) => {
    // Reverse-lookup: legacy ID → UUID via EMAIL_TO_LEGACY_ID
    const memberEmail = Object.entries(EMAIL_TO_LEGACY_ID).find(
      ([, lid]) => lid === legacyMemberId
    )?.[0];
    // Find the DB row whose email matches to get the UUID
    const dbRow = team.find((t) => t.email === memberEmail);
    // If the member wasn't from legacy mapping, assume legacyMemberId IS the UUID
    const teamMemberId = memberEmail && dbRow
      ? (() => {
          // We need the actual UUID — stored nowhere on TeamMember (it uses legacy id).
          // Re-derive from the Supabase fetch: we stored legacy id as member.id,
          // so we need to go the other way.  But we can look it up by email.
          // Since we don't persist UUIDs in state, fetch it on demand.
          return null; // will be resolved below
        })()
      : legacyMemberId;

    // Resolve UUID from email by querying Supabase directly
    let resolvedUuid = teamMemberId;
    if (!resolvedUuid && memberEmail) {
      const { createClient } = await import("@/lib/supabase/client");
      const supabase = createClient();
      const { data } = await supabase
        .from("team_members")
        .select("id")
        .eq("email", memberEmail)
        .single();
      if (data) resolvedUuid = data.id;
    }

    if (!resolvedUuid) {
      console.error("Could not resolve team member UUID for", legacyMemberId);
      return;
    }

    try {
      const res = await fetch("/api/work-items", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: fields.title,
          teamMemberId: resolvedUuid,
          customerId: fields.customerId || null,
          priority: fields.priority || "Medium",
        }),
      });
      if (res.ok) {
        const created = await res.json();
        const newItem: WorkItemDB = {
          id: created.id,
          source: "manual",
          memberId: legacyMemberId,
          customerId: created.customerId || created.customer_id || null,
          customerName: created.customer?.name || "",
          title: created.title,
          status: created.status || "To Do",
          priority: created.priority || "Medium",
          isBlocker: false,
          blockerDescription: null,
          daysInStatus: 0,
        };
        setWorkItems((prev) => [newItem, ...prev]);
      } else {
        const err = await res.json();
        console.error("Failed to create work item:", err.error);
      }
    } catch (err) {
      console.error("Failed to create work item:", err);
    }
  };

  const handleCustomerCreate = async (name: string) => {
    try {
      const res = await fetch("/api/customers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
      if (res.ok) {
        const created = await res.json();
        setCustomers((prev) => [...prev, {
          id: created.id,
          name: created.name,
          connectionStatus: created.connectionStatus || created.connection_status || "pending",
        }]);
      } else {
        const err = await res.json();
        console.error("Failed to create customer:", err.error);
      }
    } catch (err) {
      console.error("Failed to create customer:", err);
    }
  };

  const handleCustomerDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/customers/${id}`, { method: "DELETE" });
      if (res.ok) {
        setCustomers((prev) => prev.filter((c) => c.id !== id));
        setWorkItems((prev) => prev.map((w) =>
          w.customerId === id ? { ...w, customerId: null, customerName: "" } : w
        ));
      } else {
        const err = await res.json();
        console.error("Failed to delete customer:", err.error);
      }
    } catch (err) {
      console.error("Failed to delete customer:", err);
    }
  };

  const handleSignOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
  };

  const navigate = (p: string, id?: string) => {
    setPage(p);
    setSelectedId(id || null);
  };

  const isLocalhost = typeof window !== "undefined" && window.location.hostname === "localhost";
  const viewOverride = typeof window !== "undefined" ? new URLSearchParams(window.location.search).get("as") : null;
  const isManager = viewOverride === "team" && isLocalhost ? false : user?.email === "dwessel@viax.io";

  // Update team member customer tags from derived data
  const teamWithCustomers = useMemo(() =>
    team.map((m) => ({ ...m, customers: memberCustomers[m.id] || [] })),
    [team, memberCustomers]
  );

  const teamBlockerCount = getWorkItemsForScope(workItems, memberScope, "team").filter((w) => w.isBlocker).length;
  const leadershipBlockerCount = isManager ? getWorkItemsForScope(workItems, memberScope, "leadership").filter((w) => w.isBlocker).length : 0;

  // Determine if current member drill-down is from a leadership member
  const isLeadershipMemberPage = (page === "member" || page === "oneOnOne") && !!selectedId && memberScope[selectedId] === "leadership";

  const tp = { team: teamWithCustomers, memberScope, meetingNotes, actionItems, setActionItems, workItems, customers, onWorkItemUpdate: handleWorkItemUpdate, onWorkItemCreate: handleWorkItemCreate, onCustomerCreate: handleCustomerCreate, onCustomerDelete: handleCustomerDelete };

  const renderPage = () => {
    switch (page) {
      case "dashboard": return <DashboardView onNavigate={navigate} {...tp} />;
      case "member": return <MemberDetailPage memberId={selectedId!} onNavigate={navigate} {...tp} />;
      case "oneOnOne": return <OneOnOnePage memberId={selectedId!} onNavigate={navigate} {...tp} />;
      case "oneOnOneList": return <OneOnOneListPage onNavigate={navigate} {...tp} />;
      case "blockers": return <BlockerPage {...tp} />;
      case "customers": return <CustomerPage onNavigate={navigate} {...tp} />;
      case "leadershipDashboard": return isManager ? <DashboardView onNavigate={navigate} scope="leadership" {...tp} /> : <DashboardView onNavigate={navigate} {...tp} />;
      case "leadershipBlockers": return isManager ? <BlockerPage scope="leadership" {...tp} /> : <DashboardView onNavigate={navigate} {...tp} />;
      case "leadershipCustomers": return isManager ? <CustomerPage onNavigate={navigate} scope="leadership" {...tp} /> : <DashboardView onNavigate={navigate} {...tp} />;
      case "connectors": return <ConnectorsPage />;
      default: return <DashboardView onNavigate={navigate} {...tp} />;
    }
  };

  return (
    <div style={styles.app}>
      <aside style={styles.sidebar}>
        <div style={styles.sidebarLogo}>
          <div style={styles.logoText}>viax</div>
          <div style={styles.logoSub}>Co-Innovation Dashboard</div>
        </div>
        <nav style={{ flex: 1, paddingTop: 8 }}>
          <div style={styles.navSection}>Views</div>
          {NAV.filter((n) => n.section === "core").map((n) => {
            const isActive = page === n.id || (n.id === "dashboard" && page === "member" && !isLeadershipMemberPage);
            return (
              <div key={n.id} style={navItem(isActive)} onClick={() => navigate(n.id)}>
                <n.icon size={16} />
                <span>{n.label}</span>
                {n.id === "blockers" && teamBlockerCount > 0 && (
                  <span style={{ marginLeft: "auto", background: V.danger, color: "#fff", fontSize: 10, fontWeight: 700, width: 18, height: 18, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center" }}>{teamBlockerCount}</span>
                )}
              </div>
            );
          })}
          {isManager && (
            <>
              <div style={{ ...styles.navSection, display: "flex", alignItems: "center", gap: 4 }}>
                <Lock size={10} /> Personal
              </div>
              {NAV.filter((n) => n.section === "personal").map((n) => {
                const isActive = page === n.id || (n.id === "leadershipDashboard" && isLeadershipMemberPage);
                return (
                  <div key={n.id} style={navItem(isActive)} onClick={() => navigate(n.id)}>
                    <n.icon size={16} />
                    <span>{n.label}</span>
                    {n.id === "leadershipBlockers" && leadershipBlockerCount > 0 && (
                      <span style={{ marginLeft: "auto", background: V.danger, color: "#fff", fontSize: 10, fontWeight: 700, width: 18, height: 18, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center" }}>{leadershipBlockerCount}</span>
                    )}
                  </div>
                );
              })}
            </>
          )}
          <div style={styles.navSection}>Admin</div>
          {NAV.filter((n) => n.section === "admin").map((n) => (
            <div key={n.id} style={navItem(page === n.id)} onClick={() => navigate(n.id)}>
              <n.icon size={16} />
              <span>{n.label}</span>
            </div>
          ))}
        </nav>
        <div style={{ padding: "12px 16px", borderTop: "1px solid #3a3a3a" }}>
          {user ? (
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div style={{ fontSize: 11, color: "#999", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", flex: 1, marginRight: 8 }}>
                {user.email}
              </div>
              <button onClick={handleSignOut} style={{ background: "none", border: "none", color: "#666", cursor: "pointer", padding: 4, display: "flex", alignItems: "center" }} title="Sign out">
                <LogOut size={14} />
              </button>
            </div>
          ) : (
            <div style={{ fontSize: 11, color: "#666" }}>Loading...</div>
          )}
        </div>
      </aside>
      <main style={styles.main}>{renderPage()}</main>
    </div>
  );
}
