// src/components/ClientNotifications.tsx
"use client";

import { useLoadNotifications } from "@/hooks/useLoadNotifications";

export default function ClientNotifications() {
  useLoadNotifications();
  return null;
}

