import { NextResponse } from "next/server";
import { mkdir, writeFile } from "fs/promises";
import path from "path";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";
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

async function verifyAdmin(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (!authHeader) {
    return { error: "請先登入管理員帳號", status: 401 };
  }

  let response: Response;
  try {
    response = await fetch(`${API_URL}/admin/profile`, {
      headers: { Authorization: authHeader },
      cache: "no-store",
    });
  } catch {
    return { error: "無法連線至管理員 API", status: 503 };
  }

  if (!response.ok) {
    return { error: "管理員驗證失敗", status: 401 };
  }

  const data = (await response.json()) as {
    admin?: { role?: string };
  };

  if (
    data.admin?.role !== "superadmin" &&
    data.admin?.role !== "manager"
  ) {
    return { error: "權限不足，無法上傳圖片", status: 403 };
  }

  return { ok: true as const };
}

export async function POST(request: Request) {
  try {
    const auth = await verifyAdmin(request);
    if ("error" in auth) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
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
