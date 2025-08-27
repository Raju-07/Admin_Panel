// src/app/api/admin/create-load/route.ts
import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/server";
import { Weight } from "lucide-react";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      load_number,
      pickup_location,
      pickup_datetime,
      delivery_location,
      delivery_datetime,
      commodity,
      pallets,
      weights,
      driver_id
    } = body;

    if (!load_number || !pickup_location || !pickup_datetime || !delivery_location || !delivery_datetime) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const insert = {
      load_number,
      pickup_location,
      pickup_datetime: new Date(pickup_datetime).toISOString(),
      delivery_location,
      delivery_datetime: new Date(delivery_datetime).toISOString(),
      commodity,
      pallets: pallets ? Number(pallets) : null,
      weights: weights ? Number(weights) : null,
      driver_id: driver_id || null,
      status: "Pending"
    };

    const { data, error } = await supabaseAdmin.from("loads").insert([insert]).select().single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true, load: data });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Unknown error" }, { status: 500 });
  }
}
