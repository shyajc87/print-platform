import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const { data, error } = await supabase
      .from("briefs")
      .insert([
        {
          brand_name: body.brandName,
          industry: body.industry,
          product_description: body.productDescription,
          target_audience: body.targetAudience,
          key_message: body.keyMessage,
          mood: body.mood,
          primary_colour: body.primaryColour,
          secondary_colour: body.secondaryColour,
          size: body.size,
          quantity: body.quantity,
          deadline: body.deadline,
          additional_notes: body.additionalNotes,
          status: "pending",
        },
      ])
      .select()
      .single();

    if (error) {
      console.error("Supabase error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, brief: data });
  } catch (err) {
    console.error("Error saving brief:", err);
    return NextResponse.json({ error: "Failed to save brief" }, { status: 500 });
  }
}