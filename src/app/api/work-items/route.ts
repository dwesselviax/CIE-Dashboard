import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { randomUUID } from "crypto";

const prisma = new PrismaClient();

const VALID_STATUSES = ["To Do", "In Progress", "Blocked", "Done"];
const VALID_PRIORITIES = ["Critical", "High", "Medium", "Low"];

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { title, teamMemberId, customerId, status, priority } = body as {
      title?: string;
      teamMemberId?: string;
      customerId?: string | null;
      status?: string;
      priority?: string;
    };

    if (!title?.trim()) {
      return NextResponse.json({ error: "Title is required" }, { status: 400 });
    }

    if (!teamMemberId) {
      return NextResponse.json({ error: "teamMemberId is required" }, { status: 400 });
    }

    // Validate team member exists
    const member = await prisma.teamMember.findUnique({ where: { id: teamMemberId } });
    if (!member) {
      return NextResponse.json({ error: "Team member not found" }, { status: 400 });
    }

    // Validate status if provided
    if (status && !VALID_STATUSES.includes(status)) {
      return NextResponse.json(
        { error: `Invalid status. Must be one of: ${VALID_STATUSES.join(", ")}` },
        { status: 400 }
      );
    }

    // Validate priority if provided
    if (priority && !VALID_PRIORITIES.includes(priority)) {
      return NextResponse.json(
        { error: `Invalid priority. Must be one of: ${VALID_PRIORITIES.join(", ")}` },
        { status: 400 }
      );
    }

    // Validate customer if provided
    if (customerId) {
      const customer = await prisma.customer.findUnique({ where: { id: customerId } });
      if (!customer) {
        return NextResponse.json({ error: "Customer not found" }, { status: 400 });
      }
    }

    const created = await prisma.workItem.create({
      data: {
        source: "manual",
        sourceId: randomUUID(),
        title: title.trim(),
        teamMemberId,
        customerId: customerId || null,
        status: status || "To Do",
        priority: priority || "Medium",
        isBlocker: false,
      },
      include: { customer: { select: { name: true } } },
    });

    return NextResponse.json(created, { status: 201 });
  } catch (error) {
    console.error("Work item create error:", error);
    return NextResponse.json(
      { error: "Failed to create work item" },
      { status: 500 }
    );
  }
}
