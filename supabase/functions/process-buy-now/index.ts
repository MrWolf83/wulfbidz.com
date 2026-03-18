import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface BuyNowRequest {
  listingId: string;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Authorization required" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { createClient } = await import("npm:@supabase/supabase-js@2.57.4");
    const supabase = createClient(supabaseUrl, supabaseKey);

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: "Invalid authorization" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { listingId }: BuyNowRequest = await req.json();

    if (!listingId) {
      return new Response(
        JSON.stringify({ error: "Listing ID is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { data: listing, error: listingError } = await supabase
      .from("listings")
      .select("*")
      .eq("id", listingId)
      .single();

    if (listingError || !listing) {
      return new Response(
        JSON.stringify({ error: "Listing not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (listing.status !== "active") {
      return new Response(
        JSON.stringify({ error: "Listing is not active" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!listing.buy_now_price) {
      return new Response(
        JSON.stringify({ error: "Buy now price not available for this listing" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (listing.seller_id === user.id) {
      return new Response(
        JSON.stringify({ error: "You cannot buy your own listing" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { data: sellerContact } = await supabase.rpc("get_transaction_contact_info", {
      user_id_param: listing.seller_id
    });
    const seller = sellerContact?.[0];

    const { data: buyerContact } = await supabase.rpc("get_transaction_contact_info", {
      user_id_param: user.id
    });
    const buyer = buyerContact?.[0];

    const { data: feeData } = await supabase.rpc("calculate_seller_fee", {
      seller_id_param: listing.seller_id,
      final_price_param: listing.buy_now_price
    });
    const sellerFee = feeData || 0;

    const { data: transaction, error: transactionError } = await supabase
      .from("completed_transactions")
      .insert({
        listing_id: listing.id,
        seller_id: listing.seller_id,
        buyer_id: user.id,
        final_price: listing.buy_now_price,
        seller_fee: sellerFee,
        payment_method: "buy_now",
        seller_email: seller?.email || "",
        seller_phone: seller?.phone || null,
        buyer_email: buyer?.email || "",
        buyer_phone: buyer?.phone || null,
      })
      .select()
      .single();

    if (transactionError) {
      console.error("Error creating transaction:", transactionError);
      return new Response(
        JSON.stringify({ error: "Failed to create transaction" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    await supabase
      .from("listings")
      .update({ status: "sold" })
      .eq("id", listing.id);

    try {
      await fetch(`${supabaseUrl}/functions/v1/send-transaction-emails`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${supabaseKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ transactionId: transaction.id }),
      });
    } catch (emailError) {
      console.error("Error sending transaction emails:", emailError);
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: "Purchase completed successfully",
        transactionId: transaction.id
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Error processing buy now:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});