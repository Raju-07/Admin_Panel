// src/app/api/admin/create-driver/route.ts
import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/server";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { full_name, email, phone, password } = body;

    if (!email || !full_name) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Create user in Supabase Auth (admin)
    const { data: userData, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password: password || "maxxuser@1234",
      email_confirm: true,
      user_metadata: { full_name, phone },
      app_metadata: { role: "driver" }
    });

    if (createError) {
      return NextResponse.json({ error: createError.message }, { status: 500 });
    }

    const userId = userData.user?.id;
    if (!userId) {
      return NextResponse.json({ error: "Failed to create user" }, { status: 500 });
    }

    // Insert into drivers table (auth_user_id references auth.users)
    const { error: insertError } = await supabaseAdmin
      .from("drivers")
      .insert([{ full_name, phone, email, auth_user_id: userId }]);

    if (insertError) {
      // Optionally cleanup the user if driver record fails
      return NextResponse.json({ error: insertError.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true, userId });
  }
  catch (err: unknown) {
  if (err instanceof Error) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
  return NextResponse.json({ error: "Unknown error" }, { status: 500 });
}

}
