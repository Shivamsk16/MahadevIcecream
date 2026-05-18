import { getAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();
  if (profile?.role !== "admin")
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await request.json();
  const {
    full_name,
    email,
    password,
    phone,
    business_name,
    address,
    city,
    pincode,
  } = body;

  const adminClient = getAdminClient();
  const { data: newUser, error: authError } =
    await adminClient.auth.admin.createUser({
      email,
      password,
      phone: phone ? `+91${phone}` : undefined,
      email_confirm: true,
      user_metadata: { full_name },
    });

  if (authError)
    return NextResponse.json({ error: authError.message }, { status: 400 });

  const { error: profileError } = await adminClient.from("profiles").insert({
    id: newUser.user.id,
    role: "customer",
    full_name,
    email,
    phone: phone ? `+91${phone}` : null,
    business_name,
    address,
    city,
    pincode,
    created_by: user.id,
  });

  if (profileError) {
    await adminClient.auth.admin.deleteUser(newUser.user.id);
    return NextResponse.json({ error: profileError.message }, { status: 400 });
  }

  return NextResponse.json(
    { success: true, user_id: newUser.user.id },
    { status: 201 }
  );
}
