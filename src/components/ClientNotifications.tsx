// src/components/ClientNotifications.tsx
"use client";

import { useLoadNotifications } from "@/hooks/useLoadNotifications";
import { TrackingRequestsPage } from "@/hooks/useTrackingRequestNotification";

export default function ClientNotifications() {
  useLoadNotifications();
  TrackingRequestsPage();
  return null;
}

