import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import * as fs from "fs";
import * as path from "path";
import { parseMarkdownNote } from "@/lib/ingestion/markdown-parser";
import { matchAttendees, clearCache } from "@/lib/ingestion/attendee-matcher";
import { processNoteWithLLM } from "@/lib/ingestion/llm-processor";
import { upsertActionItems } from "@/lib/ingestion/upsert-action-items";

const prisma = new PrismaClient();

export async function POST() {
  const VAULT_PATH = process.env.OBSIDIAN_VAULT_NOTES_PATH;
  if (!VAULT_PATH) {
    return NextResponse.json({ error: "OBSIDIAN_VAULT_NOTES_PATH not set" }, { status: 500 });
  }
  if (!process.env.DEEPSEEK_API_KEY) {
    return NextResponse.json({ error: "DEEPSEEK_API_KEY not set" }, { status: 500 });
  }

  const twoWeeksAgo = new Date();
  twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);
  const cutoff = twoWeeksAgo.toISOString().slice(0, 10);

  try {
    const doug = await prisma.teamMember.findUnique({ where: { email: "dwessel@viax.io" } });
    if (!doug) {
      return NextResponse.json({ error: "Doug not found in DB" }, { status: 500 });
    }
    const managerId = doug.id;

    const files = fs.readdirSync(VAULT_PATH).filter((f) => {
      if (!f.endsWith(".md")) return false;
      const dateMatch = f.match(/^(\d{4}-\d{2}-\d{2})/);
      return dateMatch ? dateMatch[1] >= cutoff : false;
    });

    let upserted = 0;
    let skipped = 0;

    // Process sequentially to avoid overloading DeepSeek
    for (const file of files) {
      const filePath = path.join(VAULT_PATH, file);
      const raw = fs.readFileSync(filePath, "utf-8");
      const parsed = parseMarkdownNote(raw);
      const { frontmatter, body } = parsed;

      const matched = await matchAttendees(frontmatter.attendees, prisma);
      const teamAttendees = matched.filter((m) => m.email !== "dwessel@viax.io");

      if (teamAttendees.length === 0) {
        skipped++;
        continue;
      }

      let llmResult;
      try {
        llmResult = await processNoteWithLLM(frontmatter.title, body, frontmatter.attendees);
      } catch {
        llmResult = { summary: "", actionItems: [], keyTopics: [] };
      }

      const sourceId = frontmatter.granola_id || file.replace(/\.md$/, "");
      const meetingDate = new Date(`${frontmatter.date}T${frontmatter.time || "00:00"}:00`);

      for (const attendee of teamAttendees) {
        const note = await prisma.meetingNote.upsert({
          where: {
            source_sourceId_teamMemberId: {
              source: frontmatter.source || "granola",
              sourceId,
              teamMemberId: attendee.teamMemberId,
            },
          },
          update: {
            title: frontmatter.title,
            meetingDate,
            summary: llmResult.summary,
            actionItems: llmResult.actionItems,
            keyTopics: llmResult.keyTopics,
            rawContent: body,
            sourceUrl: frontmatter.link || null,
            syncedAt: new Date(),
          },
          create: {
            source: frontmatter.source || "granola",
            sourceId,
            teamMemberId: attendee.teamMemberId,
            managerId,
            title: frontmatter.title,
            meetingDate,
            summary: llmResult.summary,
            actionItems: llmResult.actionItems,
            keyTopics: llmResult.keyTopics,
            rawContent: body,
            sourceUrl: frontmatter.link || null,
          },
        });
        await upsertActionItems(prisma, note.id, llmResult.actionItems);
        upserted++;
      }
    }

    clearCache();

    return NextResponse.json({
      success: true,
      filesProcessed: files.length,
      rowsUpserted: upserted,
      skipped,
    });
  } catch (error) {
    console.error("Granola sync error:", error);
    return NextResponse.json(
      { error: "Sync failed", details: (error as Error).message },
      { status: 500 }
    );
  }
}
