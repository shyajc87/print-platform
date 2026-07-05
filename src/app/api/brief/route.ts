import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const { data, error } = await supabase
      .from("briefs")
      .insert([{
        user_id: user.id,
        brand_name: body.brandName,
        industry: body.industry,
        product_description: body.productDescription,
        target_audience: body.targetAudience,
        location: body.location,
        reference_image_url: body.referenceImageUrl || null,
        key_message: body.keyMessage,
        mood: body.mood,
        primary_colour: body.primaryColour,
        secondary_colour: body.secondaryColour,
        size: body.size,
        quantity: body.quantity,
        deadline: body.deadline,
        additional_notes: body.additionalNotes,
        logo_url: body.logoUrl || null,
        contact_phone: body.contactPhone || null,
        badges: body.badges || null,
        price1_amount: body.price1Amount || null,
        price1_label: body.price1Label || null,
        price2_amount: body.price2Amount || null,
        price2_label: body.price2Label || null,
        status: "pending",
      }])
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ success: true, brief: data });
  } catch (err) {
    return NextResponse.json({ error: "Failed to save brief" }, { status: 500 });
  }
}
