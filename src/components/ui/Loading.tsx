"use client"

import { Loader2 } from "lucide-react"

export default function Loading({ text = "Loading..." }: { text?: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-20">
      <Loader2 className="h-10 w-10 animate-spin text-blue-600 mb-4" />
      <p className="text-gray-600 font-medium">{text}</p>
    </div>
  )
}
