import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import OpenAI from "openai";

const prisma = new PrismaClient();

const getDeepseek = () =>
  new OpenAI({
    apiKey: process.env.DEEPSEEK_API_KEY,
    baseURL: "https://api.deepseek.com",
  });

export async function GET(
  request: NextRequest,
  { params }: { params: { memberId: string } }
) {
  const { memberId } = params;

  try {
    // Fetch last 5 meeting notes for this member (with action item rows)
    const notes = await prisma.meetingNote.findMany({
      where: { teamMemberId: memberId },
      orderBy: { meetingDate: "desc" },
      take: 5,
      select: {
        title: true,
        meetingDate: true,
        summary: true,
        actionItems: true,
        keyTopics: true,
        actionItemRows: {
          select: { text: true, done: true, assignee: true, comment: true },
        },
      },
    });

    // Fetch open work items for this member
    const workItems = await prisma.workItem.findMany({
      where: { teamMemberId: memberId, status: { not: "Done" } },
      select: {
        title: true,
        status: true,
        priority: true,
        isBlocker: true,
        blockerDescription: true,
      },
    });

    // Get member info
    const member = await prisma.teamMember.findUnique({
      where: { id: memberId },
      select: { name: true, role: true },
    });

    if (!member) {
      return NextResponse.json({ error: "Member not found" }, { status: 404 });
    }

    // If no notes, return a basic response
    if (notes.length === 0 && workItems.length === 0) {
      return NextResponse.json({
        talkingPoints: ["No prior meeting data — start with a general check-in"],
        openActions: [],
        workContext: "No tracked work items",
      });
    }

    // Build context for LLM — prefer action_items table rows over JSON
    const notesContext = notes
      .map((n) => {
        const rows = (n as any).actionItemRows as { text: string; done: boolean; assignee: string | null; comment: string | null }[];
        const hasRows = rows && rows.length > 0;
        const actionStr = hasRows
          ? rows.filter((a) => !a.done).map((a) => `[open] ${a.text}`).join("; ") || "All done"
          : (n.actionItems as any[])?.map((a: any) => `${a.done ? "[done]" : "[open]"} ${a.text}`).join("; ") || "None";
        return `Meeting: ${n.title} (${n.meetingDate.toISOString().slice(0, 10)})\nSummary: ${n.summary || "N/A"}\nTopics: ${(n.keyTopics as string[])?.join(", ") || "N/A"}\nAction Items: ${actionStr}`;
      })
      .join("\n\n");

    const workContext = workItems
      .map(
        (w) =>
          `- ${w.title} (${w.status}, ${w.priority})${w.isBlocker ? " [BLOCKER: " + w.blockerDescription + "]" : ""}`
      )
      .join("\n");

    const prompt = `You are preparing a manager for a 1:1 meeting with ${member.name} (${member.role}).

Recent meeting history:
${notesContext || "No prior meetings"}

Current work items:
${workContext || "No tracked items"}

Generate a concise 1:1 prep briefing as JSON:
{
  "talkingPoints": ["3-5 specific, actionable talking points based on the context"],
  "openActions": ["list of unresolved action items from prior meetings"],
  "workContext": "1-2 sentence summary of their current work status and any concerns"
}`;

    const response = await getDeepseek().chat.completions.create({
      model: "deepseek-chat",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.4,
      max_tokens: 800,
    });

    const text = response.choices[0]?.message?.content || "{}";
    const cleaned = text.replace(/^```json?\n?/m, "").replace(/\n?```$/m, "").trim();

    try {
      const result = JSON.parse(cleaned);
      return NextResponse.json(result);
    } catch {
      return NextResponse.json({
        talkingPoints: ["Review open action items", "Check in on current work"],
        openActions: [],
        workContext: text,
      });
    }
  } catch (error) {
    console.error("Prep API error:", error);
    return NextResponse.json(
      { error: "Failed to generate prep" },
      { status: 500 }
    );
  }
}
