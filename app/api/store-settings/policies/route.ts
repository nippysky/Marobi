import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import type { PolicyType } from "@/lib/generated/prisma-client";


export async function GET() {
  // fetch all policy types
  const policies = await prisma.storePolicy.findMany({
    orderBy: { type: "asc" },
  });
  return NextResponse.json(policies);
}

export async function PUT(req: Request) {
  // now `type` is a PolicyType, not just string
  const updates: Array<{
    type: PolicyType;
    content: string;
  }> = await req.json();

  const ops = updates.map((p) =>
    prisma.storePolicy.upsert({
      where: { type: p.type },
      create: { type: p.type, content: p.content },
      update: { content: p.content },
    })
  );

  await prisma.$transaction(ops);
  return NextResponse.json({ success: true });
}
