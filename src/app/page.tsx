import Image from "next/image";

// src/app/page.tsx
import { redirect } from "next/navigation"

export default function HomePage() {
  redirect("/login")
  return null
}

