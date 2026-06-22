import type { Admin, Product, User as PrismaUser } from "@prisma/client";
import type { User as MemberUser } from "@/lib/auth-api";
import type { Admin as AdminDto } from "@/lib/admin-api";
import type { DbProduct } from "@/types/db-product";

export function mapPrismaAdmin(admin: Admin): AdminDto {
  return {
    admin_id: admin.id,
    username: admin.username,
    email: admin.email,
    role: admin.role,
    last_login: admin.lastLogin?.toISOString() ?? null,
    created_at: admin.createdAt.toISOString(),
    updated_at: admin.updatedAt.toISOString(),
  };
}

export function mapPrismaProduct(product: Product): DbProduct {
  return {
    product_id: product.id,
    type_id: product.typeId,
    type: product.category,
    name: product.name,
    description: product.description,
    price: Number(product.price),
    stock: product.stock,
    image_url: product.imageUrl,
    created_at: product.createdAt.toISOString(),
    updated_at: product.updatedAt.toISOString(),
  };
}

export function mapPrismaUserToMember(
  user: PrismaUser,
  addresses: MemberUser["addresses"] = [],
  defaultAddress: MemberUser["default_address"] = null,
): MemberUser {
  return {
    user_id: user.id,
    member_id: user.memberId,
    first_name: user.firstName || "",
    last_name: user.lastName,
    name: user.name,
    email: user.email,
    phone: user.phone,
    status: user.status,
    addresses,
    default_address: defaultAddress,
    created_at: user.createdAt.toISOString(),
    updated_at: user.updatedAt.toISOString(),
  };
}
