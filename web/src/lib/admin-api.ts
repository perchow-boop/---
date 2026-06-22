import { INTERNAL_API } from "@/lib/api-client";

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
  expires_at: string;
  admin: Admin;
};

async function request<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  let response: Response;

  try {
    response = await fetch(path, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...options.headers,
      },
    });
  } catch {
    throw new Error("無法連線至管理員 API，請確認 Next.js 開發伺服器是否正常運作");
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
  return request<{
    message: string;
    admin: Admin;
    token?: string;
    expires_at?: string;
  }>(`${INTERNAL_API.admin}/register`, {
    method: "POST",
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: JSON.stringify(payload),
  });
}

export async function loginAdmin(payload: {
  username: string;
  password: string;
}) {
  return request<AdminLoginResponse>(`${INTERNAL_API.admin}/login`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function fetchAdminProfile(token: string) {
  return request<{ admin: Admin }>(`${INTERNAL_API.admin}/profile`, {
    headers: { Authorization: `Bearer ${token}` },
  });
}

export async function logoutAdmin(token: string) {
  return request<{ message: string }>(`${INTERNAL_API.admin}/logout`, {
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
  return request<{ admins: Admin[] }>(`${INTERNAL_API.admin}/admins`, {
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
  return request<{ message: string; admin: Admin }>(
    `${INTERNAL_API.admin}/admins/${id}`,
    {
      method: "PUT",
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify(payload),
    },
  );
}

export async function deleteAdmin(token: string, id: number) {
  return request<{ message: string }>(
    `${INTERNAL_API.admin}/admins/${id}`,
    {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    },
  );
}
