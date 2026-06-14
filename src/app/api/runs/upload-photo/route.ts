import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { supabaseAdmin, STORAGE_BUCKET, getPublicUrl } from "@/lib/supabase";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const formData = await req.formData();
  const file = formData.get("file") as File | null;
  const runId = formData.get("runId") as string | null;
  const type = formData.get("type") as "pre" | "post" | null;

  if (!file || !runId || !type) {
    return NextResponse.json({ error: "Champs manquants" }, { status: 400 });
  }

  // Verify the run belongs to this user
  const run = await prisma.run.findFirst({
    where: { id: runId, userId: session.user.id },
  });
  if (!run) return NextResponse.json({ error: "Run introuvable" }, { status: 404 });

  const ext = file.name.split(".").pop() ?? "jpg";
  const path = `${session.user.id}/${runId}/${type}.${ext}`;

  const buffer = Buffer.from(await file.arrayBuffer());

  const { error } = await supabaseAdmin.storage
    .from(STORAGE_BUCKET)
    .upload(path, buffer, {
      contentType: file.type,
      upsert: true,
    });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const publicUrl = getPublicUrl(path);

  await prisma.run.update({
    where: { id: runId },
    data: type === "pre" ? { photoPreUrl: publicUrl } : { photoPostUrl: publicUrl },
  });

  return NextResponse.json({ url: publicUrl });
}
