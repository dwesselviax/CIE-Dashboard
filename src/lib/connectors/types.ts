/**
 * Connector Interface — the extensibility contract.
 *
 * Each data source (Jira, Granola, Slack, Confluence, etc.) implements
 * this interface. Adding a new source = implementing Connector + registering
 * it in the registry. No page changes, no schema migrations for the basics.
 */

// ─── Core Types ─────────────────────────────────────────────────────

export type ConnectorStatus = "active" | "configured" | "pending" | "error" | "disabled";

export type SyncStatus = "idle" | "running" | "error";

export interface ConnectorConfig {
  /** Unique identifier for this connector instance */
  id: string;
  /** Human-readable name (e.g., "Solventum Jira") */
  name: string;
  /** Connector type key (e.g., "jira", "granola", "slack") */
  type: string;
  /** Current connection status */
  status: ConnectorStatus;
  /** Connector-specific configuration (URLs, project keys, etc.) */
  settings: Record<string, unknown>;
  /** Vault secret ID for credentials (never store creds in config) */
  vaultSecretId?: string;
  /** Polling interval in ms (0 = webhook-only, null = manual only) */
  pollIntervalMs: number | null;
}

// ─── Data Types ─────────────────────────────────────────────────────

export interface NormalizedWorkItem {
  sourceId: string;
  source: string;
  sourceUrl?: string;
  teamMemberEmail: string;
  customerName?: string;
  title: string;
  description?: string;
  status: string;
  priority: string;
  isBlocker: boolean;
  blockerDescription?: string;
  rawData: Record<string, unknown>;
}

export interface NormalizedMeetingNote {
  sourceId: string;
  source: "granola" | "obsidian" | "manual";
  sourceUrl?: string;
  teamMemberEmail: string;
  managerEmail: string;
  title: string;
  meetingDate: Date;
  summary?: string;
  actionItems: ActionItem[];
  keyTopics: string[];
  rawContent?: string;
}

export interface ActionItem {
  text: string;
  assigneeEmail?: string;
  done: boolean;
}

// ─── Connector Interface ────────────────────────────────────────────

export interface Connector {
  /** Type key — must be unique across all connector types */
  readonly type: string;

  /** Human-readable type label (e.g., "Jira Cloud") */
  readonly label: string;

  /** Description for the admin UI */
  readonly description: string;

  /**
   * Validate that the connector can reach its source.
   * Called when configuring a new connection.
   */
  testConnection(config: ConnectorConfig): Promise<ConnectionTestResult>;

  /**
   * Fetch all relevant data from the source and return normalized items.
   * Called by the sync engine on the configured schedule.
   * Must be idempotent — re-running should not create duplicates.
   */
  sync(config: ConnectorConfig): Promise<SyncResult>;

  /**
   * Optional: handle an incoming webhook payload.
   * Return normalized items to upsert.
   */
  handleWebhook?(payload: unknown, config: ConnectorConfig): Promise<SyncResult>;

  /**
   * Return the JSON schema for this connector's settings object.
   * Used by the admin UI to render a configuration form.
   */
  getSettingsSchema(): ConnectorSettingsSchema;
}

// ─── Supporting Types ───────────────────────────────────────────────

export interface ConnectionTestResult {
  success: boolean;
  message: string;
  details?: Record<string, unknown>;
}

export interface SyncResult {
  workItems: NormalizedWorkItem[];
  meetingNotes: NormalizedMeetingNote[];
  errors: SyncError[];
  metadata: {
    itemsFetched: number;
    duration: number;
  };
}

export interface SyncError {
  message: string;
  itemId?: string;
  recoverable: boolean;
}

export interface ConnectorSettingsField {
  key: string;
  label: string;
  type: "text" | "url" | "select" | "number" | "boolean";
  required: boolean;
  description?: string;
  options?: { label: string; value: string }[];
  default?: unknown;
}

export interface ConnectorSettingsSchema {
  fields: ConnectorSettingsField[];
}
