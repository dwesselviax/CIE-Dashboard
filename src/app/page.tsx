"use client";

import { useState, useEffect } from "react";
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
const TEAM = [
  { id: "1", name: "Lucas Seidenfus", email: "lseidenfus@viax.io", role: "Senior Engineer", avatar: "LS", customers: ["2U"], oneOnOneCount: 6 },
  { id: "2", name: "Akash Devgan", email: "adevgan@viax.io", role: "Engineer", avatar: "AD", customers: ["Solventum"], oneOnOneCount: 2 },
  { id: "3", name: "Vishnu Anisetti", email: "vanisetti@viax.io", role: "Engineer", avatar: "VA", customers: ["Stryker"], oneOnOneCount: 2 },
  { id: "4", name: "Rick Chavie", email: "rchavie@viax.io", role: "Business Dev", avatar: "RC", customers: ["Boston Scientific", "Strategym"], oneOnOneCount: 2 },
  { id: "5", name: "Brian Diehl", email: "bdiehl@viax.io", role: "Engineer Lead", avatar: "BD", customers: ["Solventum", "Shopify"], oneOnOneCount: 2 },
  { id: "6", name: "Andrew Martin", email: "amartin@viax.io", role: "Engineer", avatar: "AM", customers: ["Solventum", "2U"], oneOnOneCount: 1 },
  { id: "7", name: "Vova Zubyk", email: "vzubyk@viax.io", role: "Engineer", avatar: "VZ", customers: ["Zaelab"], oneOnOneCount: 1 },
  { id: "8", name: "Francisco Santana", email: "fsantana@viax.io", role: "Engineer", avatar: "FS", customers: ["Boston Scientific"], oneOnOneCount: 1 },
];

const CUSTOMERS = [
  { id: "c1", name: "Solventum", status: "active", members: ["2", "5", "6"] },
  { id: "c2", name: "2U", status: "active", members: ["1", "6"] },
  { id: "c3", name: "Boston Scientific", status: "active", members: ["4", "8"] },
  { id: "c4", name: "Stryker", status: "active", members: ["3"] },
  { id: "c5", name: "Shopify", status: "active", members: ["5"] },
  { id: "c6", name: "Zaelab", status: "active", members: ["7"] },
  { id: "c7", name: "Strategym", status: "discovery", members: ["4"] },
];

const WORK_ITEMS = [
  { id: "w1", memberId: "1", customer: "2U", title: "Documentation deprecation workflow", status: "In Progress", priority: "High", source: "jira-internal", isBlocker: false, daysInStatus: 3 },
  { id: "w2", memberId: "1", customer: "2U", title: "Tool selection — blocked on Propello", status: "Blocked", priority: "Critical", source: "jira-internal", isBlocker: true, blockerDesc: "Propello unavailable for over a week — hard dependency for tool selection decisions", daysInStatus: 8 },
  { id: "w3", memberId: "1", customer: "2U", title: "Demo server testing with product determination", status: "To Do", priority: "Medium", source: "jira-internal", isBlocker: false, daysInStatus: 1 },
  { id: "w4", memberId: "2", customer: "Solventum", title: "Configuration rules implementation", status: "In Progress", priority: "High", source: "jira-customer", isBlocker: false, daysInStatus: 5 },
  { id: "w5", memberId: "2", customer: "Solventum", title: "MedSurgery integration check-in prep", status: "Done", priority: "Medium", source: "jira-internal", isBlocker: false, daysInStatus: 0 },
  { id: "w6", memberId: "3", customer: "Stryker", title: "MSP knowledge transfer — Enterprise Apps", status: "In Progress", priority: "High", source: "jira-customer", isBlocker: false, daysInStatus: 2 },
  { id: "w7", memberId: "3", customer: "Stryker", title: "eComm & Payment KT session follow-ups", status: "To Do", priority: "Medium", source: "jira-internal", isBlocker: false, daysInStatus: 4 },
  { id: "w8", memberId: "4", customer: "Boston Scientific", title: "Monthly catch-up action items", status: "In Progress", priority: "Medium", source: "jira-internal", isBlocker: false, daysInStatus: 3 },
  { id: "w9", memberId: "4", customer: "Boston Scientific", title: "Stakeholder access — blocked by middle mgmt", status: "Blocked", priority: "High", source: "jira-customer", isBlocker: true, blockerDesc: "Limited business stakeholder access due to middle management resistance", daysInStatus: 14 },
  { id: "w10", memberId: "5", customer: "Solventum", title: "Frontend review action items", status: "In Progress", priority: "High", source: "jira-internal", isBlocker: false, daysInStatus: 1 },
  { id: "w11", memberId: "5", customer: "Shopify", title: "Fuse Integration Hub showcase follow-up", status: "To Do", priority: "Low", source: "jira-internal", isBlocker: false, daysInStatus: 6 },
  { id: "w12", memberId: "6", customer: "Solventum", title: "Bi-weekly sync action items", status: "In Progress", priority: "Medium", source: "jira-internal", isBlocker: false, daysInStatus: 2 },
  { id: "w13", memberId: "6", customer: "2U", title: "edX subscriptions timeline review", status: "Blocked", priority: "High", source: "jira-customer", isBlocker: true, blockerDesc: "Waiting on 2U team for timeline confirmation — no response in 5 days", daysInStatus: 5 },
  { id: "w14", memberId: "7", customer: "Zaelab", title: "Monthly Solventum sync via Zaelab", status: "Done", priority: "Medium", source: "jira-internal", isBlocker: false, daysInStatus: 0 },
  { id: "w15", memberId: "8", customer: "Boston Scientific", title: "SAP ERP upgrade simplification research", status: "In Progress", priority: "Medium", source: "jira-internal", isBlocker: false, daysInStatus: 7 },
  { id: "w16", memberId: "8", customer: "Boston Scientific", title: "Enterprise integration strategy — AI connectors", status: "To Do", priority: "High", source: "jira-customer", isBlocker: false, daysInStatus: 3 },
];

const MEETING_NOTES = [
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

const MEMBER_SCOPE: Record<string, ViewScope> = {
  "1": "team",       // Lucas Seidenfus
  "2": "team",       // Akash Devgan
  "3": "team",       // Vishnu Anisetti
  "4": "leadership", // Rick Chavie
  "5": "leadership", // Brian Diehl
  "6": "leadership", // Andrew Martin
  "7": "team",       // Vova Zubyk
  "8": "team",       // Francisco Santana
};

const getTeamForScope = (scope: ViewScope) =>
  TEAM.filter((m) => MEMBER_SCOPE[m.id] === scope);

const getWorkItemsForScope = (scope: ViewScope) =>
  WORK_ITEMS.filter((w) => MEMBER_SCOPE[w.memberId] === scope);

const getMeetingNotesForScope = (scope: ViewScope) =>
  MEETING_NOTES.filter((n) => MEMBER_SCOPE[n.memberId] === scope);

const getCustomersForScope = (scope: ViewScope) =>
  CUSTOMERS.map((c) => ({
    ...c,
    members: c.members.filter((id) => MEMBER_SCOPE[id] === scope),
  })).filter((c) => c.members.length > 0);

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

function WorkItemRow({ item, showMember }: { item: typeof WORK_ITEMS[number]; showMember?: boolean }) {
  const member = TEAM.find((t) => t.id === item.memberId);
  return (
    <div style={{ padding: "12px 20px", borderBottom: `1px solid ${V.border}`, display: "flex", alignItems: "center", gap: 12 }}>
      {showMember && member && <div style={avatar(28)}>{member.avatar}</div>}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 13, fontWeight: 500, color: V.copy, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{item.title}</div>
        <div style={{ display: "flex", gap: 8, marginTop: 4, alignItems: "center" }}>
          <span style={styles.tag}>{item.customer}</span>
          <PriorityDot priority={item.priority} />
          {item.daysInStatus > 0 && <span style={{ fontSize: 11, color: V.muted }}>{item.daysInStatus}d in status</span>}
        </div>
        {item.isBlocker && item.blockerDesc && (
          <div style={{ fontSize: 12, color: V.danger, marginTop: 6, padding: "6px 10px", background: V.dangerBg, borderRadius: 6 }}>
            <AlertTriangle size={12} style={{ marginRight: 4, verticalAlign: "middle" }} />
            {item.blockerDesc}
          </div>
        )}
      </div>
      <StatusBadge status={item.status} />
    </div>
  );
}

function MeetingNoteCard({ note }: { note: typeof MEETING_NOTES[number] }) {
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
function DashboardView({ onNavigate, scope = "team" }: { onNavigate: (page: string, id?: string) => void; scope?: ViewScope }) {
  const team = getTeamForScope(scope);
  const workItems = getWorkItemsForScope(scope);
  const customers = getCustomersForScope(scope);
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

function MemberDetailPage({ memberId, onNavigate }: { memberId: string; onNavigate: (page: string, id?: string) => void }) {
  const member = TEAM.find((t) => t.id === memberId);
  const items = WORK_ITEMS.filter((w) => w.memberId === memberId);
  const notes = MEETING_NOTES.filter((n) => n.memberId === memberId);
  const isLeadership = MEMBER_SCOPE[memberId] === "leadership";
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
          </div>
          {items.map((item) => <WorkItemRow key={item.id} item={item} />)}
          {items.length === 0 && <div style={{ padding: 20, textAlign: "center", color: V.muted, fontSize: 13 }}>No work items</div>}
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

function OneOnOnePage({ memberId, onNavigate }: { memberId: string; onNavigate: (page: string, id?: string) => void }) {
  const member = TEAM.find((t) => t.id === memberId);
  const notes = MEETING_NOTES.filter((n) => n.memberId === memberId);
  const items = WORK_ITEMS.filter((w) => w.memberId === memberId);
  const openActions = notes.flatMap((n) => n.actionItems.filter((a) => !a.done).map((a) => ({ ...a, from: n.title, date: n.date })));
  const isLeadership = MEMBER_SCOPE[memberId] === "leadership";
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
            <span style={styles.cardTitle}>Open Action Items ({openActions.length})</span>
          </div>
          <div style={{ padding: "8px 20px" }}>
            {openActions.map((a, i) => (
              <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 8, padding: "8px 0", borderBottom: i < openActions.length - 1 ? `1px solid ${V.border}` : "none" }}>
                <Circle size={14} color={V.muted} style={{ marginTop: 2, flexShrink: 0 }} />
                <div>
                  <div style={{ fontSize: 13, color: V.copy }}>{a.text}</div>
                  <div style={{ fontSize: 11, color: V.muted }}>from {a.from} · {a.date}</div>
                </div>
              </div>
            ))}
            {openActions.length === 0 && <div style={{ padding: "12px 0", textAlign: "center", color: V.muted, fontSize: 13 }}>All caught up</div>}
          </div>
        </div>
        <div style={styles.card}>
          <div style={styles.cardHeader}>
            <span style={styles.cardTitle}>Current Work Context</span>
          </div>
          {items.map((item) => <WorkItemRow key={item.id} item={item} />)}
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

function OneOnOneListPage({ onNavigate, scope = "team" }: { onNavigate: (page: string, id?: string) => void; scope?: ViewScope }) {
  const team = getTeamForScope(scope);
  return (
    <div>
      <div style={styles.pageTitle}>1:1 Meetings</div>
      <div style={styles.pageSubtitle}>Prepare for and review 1:1 meetings with your {scope === "leadership" ? "leadership team" : "team"}</div>
      <div style={styles.grid3}>
        {team.map((m) => {
          const notes = MEETING_NOTES.filter((n) => n.memberId === m.id);
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

function BlockerPage({ scope = "team" }: { scope?: ViewScope }) {
  const workItems = getWorkItemsForScope(scope);
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
        {blockers.map((item) => <WorkItemRow key={item.id} item={item} showMember />)}
        {blockers.length === 0 && <div style={{ padding: 24, textAlign: "center", color: V.success, fontSize: 14 }}>No active blockers</div>}
      </div>
      <div style={styles.card}>
        <div style={{ ...styles.cardHeader, background: V.warningBg }}>
          <span style={{ ...styles.cardTitle, color: V.warning, display: "flex", alignItems: "center", gap: 6 }}>
            <Clock size={14} /> Stale Items — 7+ days in status ({stale.length})
          </span>
        </div>
        {stale.map((item) => <WorkItemRow key={item.id} item={item} showMember />)}
        {stale.length === 0 && <div style={{ padding: 24, textAlign: "center", color: V.success, fontSize: 14 }}>Nothing stale</div>}
      </div>
    </div>
  );
}

function CustomerPage({ onNavigate, scope = "team" }: { onNavigate: (page: string, id?: string) => void; scope?: ViewScope }) {
  const customers = getCustomersForScope(scope);
  const workItems = getWorkItemsForScope(scope);
  const isLeadership = scope === "leadership";
  return (
    <div style={isLeadership ? { background: "#F5F3FF", margin: "-24px -32px", padding: "24px 32px", minHeight: "100vh" } : undefined}>
      <div style={styles.pageTitle}>Customer Engagements</div>
      <div style={styles.pageSubtitle}>Work organized by customer{isLeadership ? " — leadership scope" : " across the team"}</div>
      {customers.map((cust) => {
        const members = TEAM.filter((m) => cust.members.includes(m.id));
        const items = workItems.filter((w) => w.customer === cust.name);
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
              <div style={{ display: "flex" }}>
                {members.map((m) => <div key={m.id} style={{ ...avatar(28), marginLeft: -6, border: `2px solid ${V.card}`, cursor: "pointer" }} title={m.name} onClick={() => onNavigate("member", m.id)}>{m.avatar}</div>)}
              </div>
            </div>
            {items.map((item) => <WorkItemRow key={item.id} item={item} showMember />)}
            {items.length === 0 && <div style={{ padding: 16, textAlign: "center", color: V.muted, fontSize: 13 }}>No tracked items yet</div>}
          </div>
        );
      })}
    </div>
  );
}

function ConnectorsPage() {
  return (
    <div>
      <div style={styles.pageTitle}>Connectors</div>
      <div style={styles.pageSubtitle}>Manage data sources — add new integrations without code changes</div>
      <div style={styles.grid3}>
        {CONNECTORS.map((conn) => {
          const s = connectorStatusStyle(conn.status);
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
                {conn.status === "active" && <button style={btn(false)}>↻ Sync Now</button>}
                {conn.status === "pending" && <button style={btn(true)}>Configure</button>}
                {conn.status === "planned" && <button style={{ ...btn(false), opacity: 0.5 }}>Coming Soon</button>}
                {conn.status === "configured" && <button style={btn(false)}>↻ Sync Now</button>}
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
  const router = useRouter();

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => setUser(data.user));
  }, []);

  const handleSignOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
  };

  const navigate = (p: string, id?: string) => {
    setPage(p);
    setSelectedId(id || null);
  };

  const teamBlockerCount = getWorkItemsForScope("team").filter((w) => w.isBlocker).length;
  const leadershipBlockerCount = getWorkItemsForScope("leadership").filter((w) => w.isBlocker).length;

  // Determine if current member drill-down is from a leadership member
  const isLeadershipMemberPage = (page === "member" || page === "oneOnOne") && !!selectedId && MEMBER_SCOPE[selectedId] === "leadership";

  const renderPage = () => {
    switch (page) {
      case "dashboard": return <DashboardView onNavigate={navigate} />;
      case "member": return <MemberDetailPage memberId={selectedId!} onNavigate={navigate} />;
      case "oneOnOne": return <OneOnOnePage memberId={selectedId!} onNavigate={navigate} />;
      case "oneOnOneList": return <OneOnOneListPage onNavigate={navigate} />;
      case "blockers": return <BlockerPage />;
      case "customers": return <CustomerPage onNavigate={navigate} />;
      case "leadershipDashboard": return <DashboardView onNavigate={navigate} scope="leadership" />;
      case "leadershipBlockers": return <BlockerPage scope="leadership" />;
      case "leadershipCustomers": return <CustomerPage onNavigate={navigate} scope="leadership" />;
      case "connectors": return <ConnectorsPage />;
      default: return <DashboardView onNavigate={navigate} />;
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
