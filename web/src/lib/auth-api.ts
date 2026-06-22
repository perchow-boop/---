const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

export type UserAddress = {
  address_id: number;
  user_id: number;
  recipient_name: string | null;
  phone: string | null;
  country: string | null;
  city: string | null;
  street_address: string | null;
  postal_code: string | null;
  is_default: boolean;
  created_at?: string;
};

export type User = {
  user_id: number;
  member_id: string | null;
  first_name: string;
  last_name: string | null;
  name: string;
  email: string;
  phone: string | null;
  status: "active" | "suspended";
  addresses: UserAddress[];
  default_address: UserAddress | null;
  created_at?: string;
  updated_at?: string;
};

export type LoginResponse = {
  message: string;
  token: string;
  expires_at: string;
  user: User;
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
      `無法連線至會員 API（${API_URL}）。請確認已啟動後端：在 server 資料夾執行 npm run dev`,
    );
  }

  let data: { error?: string };
  try {
    data = await response.json();
  } catch {
    throw new Error("伺服器回應格式錯誤，請確認後端 API 是否正常運作");
  }

  if (!response.ok) {
    throw new Error(data.error || "請求失敗");
  }

  return data as T;
}

export type RegisterResponse = LoginResponse;

export async function registerUser(payload: {
  first_name: string;
  last_name?: string;
  name?: string;
  email: string;
  password: string;
  phone?: string;
}) {
  return request<RegisterResponse>("/register", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function loginUser(payload: {
  email: string;
  password: string;
}) {
  return request<LoginResponse>("/login", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function fetchProfile(token: string) {
  return request<{ user: User }>("/profile", {
    headers: { Authorization: `Bearer ${token}` },
  });
}

export async function updateProfile(
  token: string,
  payload: {
    first_name: string;
    last_name?: string;
    phone?: string;
    country?: string;
    city?: string;
    street_address?: string;
    postal_code?: string;
    recipient_name?: string;
  },
) {
  return request<{ message: string; user: User }>("/profile", {
    method: "PUT",
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify(payload),
  });
}

export async function changePassword(
  token: string,
  payload: { current_password: string; new_password: string },
) {
  return request<{ message: string }>("/profile/password", {
    method: "PUT",
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify(payload),
  });
}

export type AddressPayload = {
  recipient_name: string;
  phone?: string;
  country?: string;
  city: string;
  street_address: string;
  postal_code?: string;
  is_default?: boolean;
};

export async function createAddress(token: string, payload: AddressPayload) {
  return request<{ message: string; address: UserAddress; user: User }>(
    "/addresses",
    {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify(payload),
    },
  );
}

export async function updateAddress(
  token: string,
  addressId: number,
  payload: AddressPayload,
) {
  return request<{ message: string; address: UserAddress; user: User }>(
    `/addresses/${addressId}`,
    {
      method: "PUT",
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify(payload),
    },
  );
}

export async function deleteAddress(token: string, addressId: number) {
  return request<{ message: string; user: User }>(`/addresses/${addressId}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` },
  });
}

export async function setDefaultAddress(token: string, addressId: number) {
  return request<{ message: string; address: UserAddress; user: User }>(
    `/addresses/${addressId}/default`,
    {
      method: "PUT",
      headers: { Authorization: `Bearer ${token}` },
    },
  );
}

export type FavoriteItem = {
  favorite_id: number;
  user_id: number;
  product_id: number;
  created_at: string;
  product: {
    product_id: number;
    name: string;
    price: number;
    image_url: string | null;
    type_id: string | null;
    category: string | null;
    stock: number;
  };
};

export async function logoutUser(token: string) {
  return request<{ message: string }>("/logout", {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
  });
}

export async function fetchFavorites(token: string) {
  return request<{ favorites: FavoriteItem[] }>("/favorites", {
    headers: { Authorization: `Bearer ${token}` },
  });
}

export async function addFavorite(token: string, productId: number) {
  return request<{ message: string }>("/favorites", {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify({ product_id: productId }),
  });
}

export async function removeFavorite(token: string, productId: number) {
  return request<{ message: string }>(`/favorites/${productId}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` },
  });
}
