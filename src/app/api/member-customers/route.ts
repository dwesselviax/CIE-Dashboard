import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// GET — fetch all assignments with customer name
export async function GET() {
  try {
    const rows = await prisma.teamMemberCustomer.findMany({
      include: { customer: { select: { name: true } } },
      orderBy: { createdAt: "asc" },
    });
    const mapped = rows.map((r) => ({
      teamMemberId: r.teamMemberId,
      customerId: r.customerId,
      customerName: r.customer.name,
      percentage: r.percentage,
    }));
    return NextResponse.json(mapped);
  } catch (error) {
    console.error("member-customers GET error:", error);
    return NextResponse.json({ error: "Failed to fetch assignments" }, { status: 500 });
  }
}

// POST — create assignment
export async function POST(request: NextRequest) {
  try {
    const { teamMemberId, customerId, percentage } = (await request.json()) as {
      teamMemberId?: string;
      customerId?: string;
      percentage?: number | null;
    };

    if (!teamMemberId || !customerId) {
      return NextResponse.json({ error: "teamMemberId and customerId are required" }, { status: 400 });
    }

    if (percentage !== undefined && percentage !== null && (percentage < 0 || percentage > 100)) {
      return NextResponse.json({ error: "percentage must be 0-100" }, { status: 400 });
    }

    const created = await prisma.teamMemberCustomer.create({
      data: { teamMemberId, customerId, percentage: percentage ?? null },
      include: { customer: { select: { name: true } } },
    });

    return NextResponse.json({
      teamMemberId: created.teamMemberId,
      customerId: created.customerId,
      customerName: created.customer.name,
      percentage: created.percentage,
    }, { status: 201 });
  } catch (error: any) {
    if (error?.code === "P2002") {
      return NextResponse.json({ error: "Assignment already exists" }, { status: 409 });
    }
    console.error("member-customers POST error:", error);
    return NextResponse.json({ error: "Failed to create assignment" }, { status: 500 });
  }
}

// PATCH — update percentage
export async function PATCH(request: NextRequest) {
  try {
    const { teamMemberId, customerId, percentage } = (await request.json()) as {
      teamMemberId?: string;
      customerId?: string;
      percentage?: number | null;
    };

    if (!teamMemberId || !customerId) {
      return NextResponse.json({ error: "teamMemberId and customerId are required" }, { status: 400 });
    }

    if (percentage !== undefined && percentage !== null && (percentage < 0 || percentage > 100)) {
      return NextResponse.json({ error: "percentage must be 0-100" }, { status: 400 });
    }

    const updated = await prisma.teamMemberCustomer.update({
      where: { teamMemberId_customerId: { teamMemberId, customerId } },
      data: { percentage: percentage ?? null },
      include: { customer: { select: { name: true } } },
    });

    return NextResponse.json({
      teamMemberId: updated.teamMemberId,
      customerId: updated.customerId,
      customerName: updated.customer.name,
      percentage: updated.percentage,
    });
  } catch (error: any) {
    if (error?.code === "P2025") {
      return NextResponse.json({ error: "Assignment not found" }, { status: 404 });
    }
    console.error("member-customers PATCH error:", error);
    return NextResponse.json({ error: "Failed to update assignment" }, { status: 500 });
  }
}

// DELETE — remove assignment
export async function DELETE(request: NextRequest) {
  try {
    const { teamMemberId, customerId } = (await request.json()) as {
      teamMemberId?: string;
      customerId?: string;
    };

    if (!teamMemberId || !customerId) {
      return NextResponse.json({ error: "teamMemberId and customerId are required" }, { status: 400 });
    }

    await prisma.teamMemberCustomer.delete({
      where: { teamMemberId_customerId: { teamMemberId, customerId } },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    if (error?.code === "P2025") {
      return NextResponse.json({ error: "Assignment not found" }, { status: 404 });
    }
    console.error("member-customers DELETE error:", error);
    return NextResponse.json({ error: "Failed to delete assignment" }, { status: 500 });
  }
}
