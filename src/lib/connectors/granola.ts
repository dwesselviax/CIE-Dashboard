import type {
  Connector,
  ConnectorConfig,
  ConnectionTestResult,
  SyncResult,
  NormalizedMeetingNote,
  ConnectorSettingsSchema,
} from "./types";
import * as fs from "fs";
import * as path from "path";
import { parseMarkdownNote } from "../ingestion/markdown-parser";

/**
 * Granola connector — syncs 1:1 meeting notes from Obsidian vault.
 *
 * Reads local .md files with YAML frontmatter (exported from Granola),
 * normalizes them, and returns structured meeting notes for upsert.
 *
 * LLM processing is handled by the sync API route, not here —
 * this connector handles the file-based data extraction only.
 */
export const granolaConnector: Connector = {
  type: "granola",
  label: "Granola Meeting Notes",
  description: "Sync 1:1 meeting notes from Granola via Obsidian vault",

  async testConnection(config: ConnectorConfig): Promise<ConnectionTestResult> {
    const vaultPath = config.settings.obsidianNotesFolder as string;
    if (!vaultPath) {
      return { success: false, message: "Obsidian vault path not configured" };
    }
    try {
      const stat = fs.statSync(vaultPath);
      if (!stat.isDirectory()) {
        return { success: false, message: "Path is not a directory" };
      }
      const files = fs.readdirSync(vaultPath).filter((f) => f.endsWith(".md"));
      return {
        success: true,
        message: `Connected — found ${files.length} notes in vault`,
        details: { noteCount: files.length },
      };
    } catch {
      return { success: false, message: "Cannot read vault directory — check the path" };
    }
  },

  async sync(config: ConnectorConfig): Promise<SyncResult> {
    const start = Date.now();
    const {
      obsidianNotesFolder,
      managerEmail,
      daysBack = 14,
    } = config.settings as {
      obsidianNotesFolder: string;
      managerEmail: string;
      daysBack?: number;
    };

    const meetingNotes: NormalizedMeetingNote[] = [];
    const errors: SyncResult["errors"] = [];

    if (!obsidianNotesFolder) {
      return { workItems: [], meetingNotes: [], errors: [{ message: "Vault path not set", recoverable: false }], metadata: { itemsFetched: 0, duration: 0 } };
    }

    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysBack);
      const cutoff = cutoffDate.toISOString().slice(0, 10);

      const files = fs.readdirSync(obsidianNotesFolder).filter((f) => {
        if (!f.endsWith(".md")) return false;
        const dateMatch = f.match(/^(\d{4}-\d{2}-\d{2})/);
        return dateMatch ? dateMatch[1] >= cutoff : false;
      });

      for (const file of files) {
        try {
          const filePath = path.join(obsidianNotesFolder, file);
          const raw = fs.readFileSync(filePath, "utf-8");
          const { frontmatter, body, actionItemsText } = parseMarkdownNote(raw);

          // Build normalized note for each attendee (non-manager)
          const attendees = frontmatter.attendees
            .map((a) => a.toLowerCase())
            .filter((a) => a !== managerEmail?.split("@")[0]?.toLowerCase());

          for (const attendee of attendees) {
            meetingNotes.push({
              sourceId: frontmatter.granola_id || file.replace(/\.md$/, ""),
              source: "granola",
              sourceUrl: frontmatter.link,
              teamMemberEmail: `${attendee}@viax.io`, // best-effort email guess
              managerEmail: managerEmail || "dwessel@viax.io",
              title: frontmatter.title,
              meetingDate: new Date(`${frontmatter.date}T${frontmatter.time || "00:00"}:00`),
              summary: "", // populated by LLM in the sync route
              actionItems: actionItemsText.map((t) => ({ text: t, done: false })),
              keyTopics: [],
              rawContent: body,
            });
          }
        } catch (err) {
          errors.push({
            message: `Failed to parse ${file}: ${(err as Error).message}`,
            itemId: file,
            recoverable: true,
          });
        }
      }
    } catch (err) {
      errors.push({
        message: `Vault read failed: ${(err as Error).message}`,
        recoverable: false,
      });
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
          required: true,
          description: "Full path to vault meeting notes folder",
        },
        {
          key: "daysBack",
          label: "Days to Sync",
          type: "number",
          required: false,
          description: "How many days back to sync (default: 14)",
          default: 14,
        },
      ],
    };
  },
};
