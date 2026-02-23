import { PrismaClient } from "@prisma/client";
import * as fs from "fs";
import * as path from "path";
import { parseMarkdownNote } from "../src/lib/ingestion/markdown-parser";
import { matchAttendees, clearCache } from "../src/lib/ingestion/attendee-matcher";
import { processNoteWithLLM } from "../src/lib/ingestion/llm-processor";
import { upsertActionItems } from "../src/lib/ingestion/upsert-action-items";

// Load .env.local for local runs
const envPath = path.resolve(__dirname, "../.env.local");
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, "utf-8");
  for (const line of envContent.split("\n")) {
    const match = line.match(/^([^#=]+)=(.*)$/);
    if (match) {
      const key = match[1].trim();
      const val = match[2].trim().replace(/^["']|["']$/g, "");
      if (!process.env[key]) process.env[key] = val;
    }
  }
}

const prisma = new PrismaClient();

// Simple concurrency limiter (avoids ESM-only p-limit import issues)
function pLimit(concurrency: number) {
  let active = 0;
  const queue: (() => void)[] = [];
  return <T>(fn: () => Promise<T>): Promise<T> =>
    new Promise<T>((resolve, reject) => {
      const run = () => {
        active++;
        fn()
          .then(resolve)
          .catch(reject)
          .finally(() => {
            active--;
            if (queue.length > 0) queue.shift()!();
          });
      };
      if (active < concurrency) run();
      else queue.push(run);
    });
}

const VAULT_PATH = process.env.OBSIDIAN_VAULT_NOTES_PATH!;
const TWO_WEEKS_AGO = new Date();
TWO_WEEKS_AGO.setDate(TWO_WEEKS_AGO.getDate() - 14);
const CUTOFF = TWO_WEEKS_AGO.toISOString().slice(0, 10);

async function main() {
  if (!VAULT_PATH) {
    console.error("OBSIDIAN_VAULT_NOTES_PATH not set");
    process.exit(1);
  }
  if (!process.env.DEEPSEEK_API_KEY) {
    console.error("DEEPSEEK_API_KEY not set");
    process.exit(1);
  }

  console.log(`Reading notes from: ${VAULT_PATH}`);
  console.log(`Cutoff date: ${CUTOFF}`);

  // Find Doug's team member ID
  const doug = await prisma.teamMember.findUnique({ where: { email: "dwessel@viax.io" } });
  if (!doug) {
    console.error("Doug not found in DB. Run prisma db seed first.");
    process.exit(1);
  }
  const managerId = doug.id;
  console.log(`Manager (Doug) ID: ${managerId}`);

  // Read .md files, filter to last 2 weeks
  const files = fs.readdirSync(VAULT_PATH).filter((f) => {
    if (!f.endsWith(".md")) return false;
    const dateMatch = f.match(/^(\d{4}-\d{2}-\d{2})/);
    return dateMatch ? dateMatch[1] >= CUTOFF : false;
  });

  console.log(`Found ${files.length} notes in last 2 weeks\n`);

  const limit = pLimit(5);
  let processed = 0;
  let upserted = 0;
  let skipped = 0;

  const tasks = files.map((file) =>
    limit(async () => {
      const filePath = path.join(VAULT_PATH, file);
      const raw = fs.readFileSync(filePath, "utf-8");
      const parsed = parseMarkdownNote(raw);
      const { frontmatter, body } = parsed;

      // Match attendees to team members
      const matched = await matchAttendees(frontmatter.attendees, prisma);

      // Filter to viax members who are NOT Doug (they're the "team member" side)
      const teamAttendees = matched.filter((m) => m.email !== "dwessel@viax.io");

      if (teamAttendees.length === 0) {
        // No viax team members (besides Doug) in this meeting — skip or store as Doug-only note
        skipped++;
        processed++;
        console.log(`  [${processed}/${files.length}] Skipped (no team members): ${file}`);
        return;
      }

      // Call LLM for extraction
      let llmResult;
      try {
        llmResult = await processNoteWithLLM(
          frontmatter.title,
          body,
          frontmatter.attendees
        );
      } catch (err) {
        console.error(`  LLM error for ${file}: ${(err as Error).message}`);
        llmResult = { summary: "", actionItems: [], keyTopics: [] };
      }

      // Upsert one row per team member (supports group meetings)
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

      processed++;
      console.log(
        `  [${processed}/${files.length}] Processed: ${file} → ${teamAttendees.length} row(s)`
      );
    })
  );

  await Promise.all(tasks);

  console.log(`\nDone! Processed ${processed} notes, upserted ${upserted} rows, skipped ${skipped}`);
  clearCache();
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
