import crypto from "crypto";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

function formatDatePart(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}${month}${day}`;
}

export function generatePaymentNo(date = new Date()) {
  const randomPart = String(crypto.randomInt(0, 1_000_000)).padStart(6, "0");
  return `Luk${formatDatePart(date)}${randomPart}`;
}

type Tx = Prisma.TransactionClient;

export async function createUniquePaymentNo(
  tx: Tx = prisma,
  date = new Date(),
) {
  for (let attempt = 0; attempt < 10; attempt += 1) {
    const paymentNo = generatePaymentNo(date);
    const existing = await tx.order.findUnique({
      where: { paymentNo },
      select: { id: true },
    });
    if (!existing) return paymentNo;
  }

  throw new Error("PAYMENT_NO_COLLISION");
}
