import { PrismaClient, Prisma } from "@prisma/client";
import * as fs from "fs";
import * as path from "path";

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

async function main() {
  const notes = await prisma.meetingNote.findMany({
    where: { actionItems: { not: Prisma.JsonNull } },
    select: { id: true, title: true, actionItems: true },
  });

  console.log(`Found ${notes.length} meeting notes with action items`);

  let created = 0;
  let skipped = 0;

  for (const note of notes) {
    const items = note.actionItems as any[];
    if (!Array.isArray(items)) continue;

    for (const item of items) {
      const text = (item.text || "").trim();
      if (!text) continue;

      try {
        await prisma.actionItem.upsert({
          where: {
            meetingNoteId_text: {
              meetingNoteId: note.id,
              text,
            },
          },
          update: {
            assignee: item.assignee || null,
          },
          create: {
            meetingNoteId: note.id,
            text,
            assignee: item.assignee || null,
            done: !!item.done,
          },
        });
        created++;
      } catch (err) {
        console.error(`  Error upserting item for note ${note.id}: ${(err as Error).message}`);
        skipped++;
      }
    }
  }

  console.log(`Done! Upserted ${created} action items, skipped ${skipped}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
