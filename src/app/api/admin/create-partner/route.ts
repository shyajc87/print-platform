import { createClient as createServerClient } from "@/lib/supabase/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    // 1. Verify the caller is an admin, using their normal cookie-based session.
    const supabase = await createServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { data: adminRow } = await supabase.from("admins").select("email").eq("email", user.email).maybeSingle();
    if (!adminRow) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const body = await req.json();
    const { role, email, password, businessName, city, specialty, contactPhone, contactEmail, pricing, turnaroundDays } = body;
    if (!role || !email || !password || !businessName || !city) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // 2. Use the service role key (server-only) to create the auth user directly, pre-confirmed.
    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
      return NextResponse.json({ error: "SUPABASE_SERVICE_ROLE_KEY is not set on the server" }, { status: 500 });
    }
    const adminAuth = createAdminClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { data: created, error: createErr } = await adminAuth.auth.admin.createUser({
      email, password, email_confirm: true,
    });
    if (createErr) return NextResponse.json({ error: createErr.message }, { status: 400 });

    // 3. Create the business listing (admin-created, so approved immediately) and profile link.
    let entityId: string;
    if (role === "agency") {
      const { data, error } = await adminAuth.from("design_agencies").insert([{
        name: businessName, city, specialty: specialty || "General design",
        contact_phone: contactPhone, contact_email: contactEmail || email,
        rating: 0, review_count: 0, approved: true,
      }]).select().single();
      if (error) throw error;
      entityId = data.id;
    } else if (role === "printer") {
      const { data, error } = await adminAuth.from("printers").insert([{
        name: businessName, city, pricing: pricing || {},
        turnaround_days: turnaroundDays || 3,
        contact_phone: contactPhone, contact_email: contactEmail || email,
        rating: 0, review_count: 0, approved: true,
      }]).select().single();
      if (error) throw error;
      entityId = data.id;
    } else {
      return NextResponse.json({ error: "role must be 'agency' or 'printer'" }, { status: 400 });
    }

    const { error: profileErr } = await adminAuth.from("profiles").insert([{ id: created.user.id, role, entity_id: entityId }]);
    if (profileErr) throw profileErr;

    return NextResponse.json({ success: true, email, password, entityId });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
