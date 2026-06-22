import { NextResponse } from "next/server";
import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { canManageProducts, requireAdmin } from "@/lib/server/auth";

const MAX_FILE_SIZE = 5 * 1024 * 1024;
const ALLOWED_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
]);

function sanitizeFilename(name: string) {
  const base = path.basename(name).replace(/[^a-zA-Z0-9._-]/g, "_");
  return base || `image-${Date.now()}.png`;
}

export async function POST(request: Request) {
  try {
    const auth = await requireAdmin(request);
    if (auth instanceof Response) {
      const data = await auth.json();
      return NextResponse.json(data, { status: auth.status });
    }

    if (!canManageProducts(auth.admin.role)) {
      return NextResponse.json(
        { error: "此角色無法上傳商品圖片（僅 superadmin / manager）" },
        { status: 403 },
      );
    }

    const formData = await request.formData();
    const file = formData.get("file");

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "請選擇圖片檔案" }, { status: 400 });
    }

    if (!ALLOWED_TYPES.has(file.type)) {
      return NextResponse.json(
        { error: "僅支援 JPG、PNG、WEBP、GIF 圖片" },
        { status: 400 },
      );
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: "圖片大小不可超過 5MB" },
        { status: 400 },
      );
    }

    const filename = sanitizeFilename(file.name);
    const picsDir = path.join(process.cwd(), "public", "pics");
    await mkdir(picsDir, { recursive: true });
    const targetPath = path.join(picsDir, filename);
    const buffer = Buffer.from(await file.arrayBuffer());

    await writeFile(targetPath, buffer);

    return NextResponse.json({
      message: "圖片已上傳",
      path: `/pics/${filename}`,
    });
  } catch (error) {
    console.error("[POST /api/admin/upload-image]", error);
    return NextResponse.json({ error: "圖片上傳失敗" }, { status: 500 });
  }
}
