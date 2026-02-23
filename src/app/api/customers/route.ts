import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name } = body as { name?: string };

    if (!name?.trim()) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 });
    }

    const created = await prisma.customer.create({
      data: {
        name: name.trim(),
        connectionStatus: "pending",
      },
    });

    return NextResponse.json(created, { status: 201 });
  } catch (error) {
    console.error("Customer create error:", error);
    return NextResponse.json(
      { error: "Failed to create customer" },
      { status: 500 }
    );
  }
}
