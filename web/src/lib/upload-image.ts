export async function uploadProductImage(token: string, file: File) {
  const formData = new FormData();
  formData.append("file", file);

  let response: Response;
  try {
    response = await fetch("/api/admin/upload-image", {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body: formData,
    });
  } catch {
    throw new Error("圖片上傳失敗，請稍後再試");
  }

  let data: { error?: string; path?: string };
  try {
    data = await response.json();
  } catch {
    throw new Error("伺服器回應格式錯誤");
  }

  if (!response.ok || !data.path) {
    throw new Error(data.error || "圖片上傳失敗");
  }

  return data.path;
}
