"use client";

import { useEffect } from "react";
import { confirmOrder } from "@/lib/orders-api";

type ConfirmOrderOnSuccessProps = {
  sessionId?: string;
};

export function ConfirmOrderOnSuccess({ sessionId }: ConfirmOrderOnSuccessProps) {
  useEffect(() => {
    if (!sessionId) return;

    confirmOrder(sessionId).catch((error) => {
      console.warn("[ConfirmOrderOnSuccess]", error);
    });
  }, [sessionId]);

  return null;
}
