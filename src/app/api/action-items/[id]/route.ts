import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const { id } = params;

  try {
    const body = await request.json();
    const { done, comment } = body as { done?: boolean; comment?: string };

    // Fetch current state to detect done transition
    const existing = await prisma.actionItem.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Action item not found" }, { status: 404 });
    }

    const data: Record<string, unknown> = {};

    if (typeof done === "boolean") {
      data.done = done;
      if (done && !existing.done) {
        data.closedAt = new Date();
      } else if (!done && existing.done) {
        data.closedAt = null;
      }
    }

    if (typeof comment === "string") {
      data.comment = comment || null;
    }

    const updated = await prisma.actionItem.update({
      where: { id },
      data,
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Action item update error:", error);
    return NextResponse.json(
      { error: "Failed to update action item" },
      { status: 500 }
    );
  }
}
