import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const VALID_STATUSES = ["To Do", "In Progress", "Blocked", "Done"];
const VALID_PRIORITIES = ["Critical", "High", "Medium", "Low"];

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const { id } = params;

  try {
    const body = await request.json();
    const { title, status, priority, customerId, isBlocker, blockerDescription } = body as {
      title?: string;
      status?: string;
      priority?: string;
      customerId?: string | null;
      isBlocker?: boolean;
      blockerDescription?: string | null;
    };

    const existing = await prisma.workItem.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Work item not found" }, { status: 404 });
    }

    const data: Record<string, unknown> = {};

    if (typeof title === "string") {
      if (!title.trim()) {
        return NextResponse.json({ error: "Title cannot be empty" }, { status: 400 });
      }
      data.title = title.trim();
    }

    if (typeof status === "string") {
      if (!VALID_STATUSES.includes(status)) {
        return NextResponse.json(
          { error: `Invalid status. Must be one of: ${VALID_STATUSES.join(", ")}` },
          { status: 400 }
        );
      }
      data.status = status;
    }

    if (typeof priority === "string") {
      if (!VALID_PRIORITIES.includes(priority)) {
        return NextResponse.json(
          { error: `Invalid priority. Must be one of: ${VALID_PRIORITIES.join(", ")}` },
          { status: 400 }
        );
      }
      data.priority = priority;
    }

    if (customerId !== undefined) {
      if (customerId !== null) {
        const customer = await prisma.customer.findUnique({ where: { id: customerId } });
        if (!customer) {
          return NextResponse.json({ error: "Customer not found" }, { status: 400 });
        }
      }
      data.customerId = customerId;
    }

    if (typeof isBlocker === "boolean") {
      data.isBlocker = isBlocker;
      if (!isBlocker) {
        data.blockerDescription = null;
      }
    }

    if (typeof blockerDescription === "string") {
      data.blockerDescription = blockerDescription || null;
    }

    const updated = await prisma.workItem.update({
      where: { id },
      data,
      include: { customer: { select: { name: true } } },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Work item update error:", error);
    return NextResponse.json(
      { error: "Failed to update work item" },
      { status: 500 }
    );
  }
}
