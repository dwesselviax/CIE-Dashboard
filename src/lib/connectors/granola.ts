import type {
  Connector,
  ConnectorConfig,
  ConnectionTestResult,
  SyncResult,
  NormalizedMeetingNote,
  ConnectorSettingsSchema,
} from "./types";

/**
 * Granola connector — syncs 1:1 meeting notes.
 *
 * Supports two modes:
 * 1. Granola API (primary) — queries the Granola API for meeting notes
 * 2. Obsidian vault (fallback) — reads from local Obsidian vault via REST API
 *
 * The connector normalizes notes from either source into the same shape,
 * so the dashboard doesn't care where the data came from.
 */
export const granolaConnector: Connector = {
  type: "granola",
  label: "Granola Meeting Notes",
  description: "Sync 1:1 meeting notes from Granola and/or Obsidian vault",

  async testConnection(config: ConnectorConfig): Promise<ConnectionTestResult> {
    const { mode } = config.settings as { mode: "granola-api" | "obsidian" | "both" };

    // TODO: Replace with actual API calls
    if (mode === "obsidian" || mode === "both") {
      try {
        const res = await fetch("https://127.0.0.1:27124/", {
          headers: { Authorization: `Bearer ${config.vaultSecretId}` },
        });
        if (!res.ok) {
          return { success: false, message: "Obsidian REST API not reachable" };
        }
      } catch {
        return { success: false, message: "Obsidian REST API not reachable — is Obsidian running?" };
      }
    }

    return { success: true, message: `Connected in ${mode} mode` };
  },

  async sync(config: ConnectorConfig): Promise<SyncResult> {
    const start = Date.now();
    const {
      mode,
      teamMemberEmails,
      managerEmail,
      obsidianNotesFolder,
    } = config.settings as {
      mode: "granola-api" | "obsidian" | "both";
      teamMemberEmails: string[];
      managerEmail: string;
      obsidianNotesFolder?: string;
    };

    const meetingNotes: NormalizedMeetingNote[] = [];
    const errors: SyncResult["errors"] = [];

    // ── Granola API sync ────────────────────────────────────────
    if (mode === "granola-api" || mode === "both") {
      try {
        // TODO: Replace with actual Granola API calls
        // The Granola MCP tools provide: list_meetings, get_meetings, query_granola_meetings
        // In production, call these via the MCP bridge or direct API

        // Pseudocode for the actual implementation:
        // const meetings = await granolaClient.listMeetings({ timeRange: "last_30_days" });
        // for (const meeting of meetings) {
        //   const participants = meeting.known_participants;
        //   const isOneOnOne = participants.length === 2
        //     && participants.some(p => p.email === managerEmail);
        //   if (!isOneOnOne) continue;
        //   const otherEmail = participants.find(p => p.email !== managerEmail)?.email;
        //   if (!teamMemberEmails.includes(otherEmail)) continue;
        //   const details = await granolaClient.getMeeting(meeting.id);
        //   meetingNotes.push(normalizeGranolaMeeting(details, otherEmail, managerEmail));
        // }
      } catch (err) {
        errors.push({
          message: `Granola sync failed: ${(err as Error).message}`,
          recoverable: true,
        });
      }
    }

    // ── Obsidian vault sync ─────────────────────────────────────
    if (mode === "obsidian" || mode === "both") {
      try {
        // TODO: Replace with actual Obsidian REST API calls
        // GET https://127.0.0.1:27124/vault/{obsidianNotesFolder}/
        // Parse each note's frontmatter for: date, participants, tags
        // Extract action items from checkbox patterns: - [ ] and - [x]

        // Pseudocode:
        // const files = await obsidianClient.listFiles(obsidianNotesFolder);
        // for (const file of files) {
        //   const content = await obsidianClient.getFile(file.path);
        //   const { frontmatter, body } = parseMarkdown(content);
        //   if (!isOneOnOneNote(frontmatter)) continue;
        //   meetingNotes.push(normalizeObsidianNote(frontmatter, body, file.path));
        // }
      } catch (err) {
        errors.push({
          message: `Obsidian sync failed: ${(err as Error).message}`,
          recoverable: true,
        });
      }
    }

    return {
      workItems: [],
      meetingNotes,
      errors,
      metadata: {
        itemsFetched: meetingNotes.length,
        duration: Date.now() - start,
      },
    };
  },

  getSettingsSchema(): ConnectorSettingsSchema {
    return {
      fields: [
        {
          key: "mode",
          label: "Data Source",
          type: "select",
          required: true,
          options: [
            { label: "Granola API", value: "granola-api" },
            { label: "Obsidian Vault", value: "obsidian" },
            { label: "Both (Granola primary, Obsidian fallback)", value: "both" },
          ],
          default: "both",
        },
        {
          key: "managerEmail",
          label: "Manager Email",
          type: "text",
          required: true,
          description: "Your email (the 1:1 host)",
        },
        {
          key: "obsidianNotesFolder",
          label: "Obsidian Notes Folder",
          type: "text",
          required: false,
          description: "Path within your vault where 1:1 notes are stored (e.g., 'Meetings/1-on-1s')",
        },
      ],
    };
  },
};
