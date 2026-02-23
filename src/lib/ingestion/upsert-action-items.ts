import type { PrismaClient } from "@prisma/client";

/**
 * Upsert action items from LLM extraction into the action_items table.
 * Only updates text/assignee on conflict — preserves user's done/comment.
 */
export async function upsertActionItems(
  prisma: PrismaClient,
  meetingNoteId: string,
  actionItems: { text: string; assignee?: string; done?: boolean }[]
) {
  if (!Array.isArray(actionItems)) return;

  for (const item of actionItems) {
    const text = (item.text || "").trim();
    if (!text) continue;

    await prisma.actionItem.upsert({
      where: {
        meetingNoteId_text: { meetingNoteId, text },
      },
      update: {
        assignee: item.assignee || null,
      },
      create: {
        meetingNoteId,
        text,
        assignee: item.assignee || null,
        done: !!item.done,
      },
    });
  }
}
