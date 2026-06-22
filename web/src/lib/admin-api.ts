const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

export type Admin = {
  admin_id: number;
  username: string;
  email: string | null;
  role: "superadmin" | "manager" | "staff";
  last_login?: string | null;
  created_at?: string;
  updated_at?: string;
};

export type AdminLoginResponse = {
  message: string;
  token: string;
  admin: Admin;
};

async function request<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  let response: Response;

  try {
    response = await fetch(`${API_URL}${path}`, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...options.headers,
      },
    });
  } catch {
    throw new Error(
      `無法連線至 API（${API_URL}）。請確認 server 已執行 npm run dev`,
    );
  }

  let data: { error?: string };
  try {
    data = await response.json();
  } catch {
    throw new Error("伺服器回應格式錯誤");
  }

  if (!response.ok) {
    throw new Error(data.error || "請求失敗");
  }

  return data as T;
}

export async function registerAdmin(
  payload: {
    username: string;
    password: string;
    email?: string;
    role?: Admin["role"];
  },
  token?: string,
) {
  return request<{ message: string; admin: Admin }>("/admin/register", {
    method: "POST",
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: JSON.stringify(payload),
  });
}

export async function loginAdmin(payload: {
  username: string;
  password: string;
}) {
  return request<AdminLoginResponse>("/admin/login", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function fetchAdminProfile(token: string) {
  return request<{ admin: Admin }>("/admin/profile", {
    headers: { Authorization: `Bearer ${token}` },
  });
}

export async function logoutAdmin(token: string) {
  return request<{ message: string }>("/admin/logout", {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
  });
}

export type AdminFormData = {
  username: string;
  email: string;
  password: string;
  role: Admin["role"];
};

export const emptyAdminForm: AdminFormData = {
  username: "",
  email: "",
  password: "",
  role: "staff",
};

export async function fetchAdmins(token: string) {
  return request<{ admins: Admin[] }>("/admin/admins", {
    headers: { Authorization: `Bearer ${token}` },
  });
}

export async function updateAdmin(
  token: string,
  id: number,
  payload: {
    email?: string | null;
    role?: Admin["role"];
    password?: string;
  },
) {
  return request<{ message: string; admin: Admin }>(`/admin/admins/${id}`, {
    method: "PUT",
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify(payload),
  });
}

export async function deleteAdmin(token: string, id: number) {
  return request<{ message: string }>(`/admin/admins/${id}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` },
  });
}
