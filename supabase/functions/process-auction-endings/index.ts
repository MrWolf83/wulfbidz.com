import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const { createClient } = await import("npm:@supabase/supabase-js@2.57.4");
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { error: notificationError } = await supabase.rpc("create_auction_end_notifications");

    if (notificationError) {
      console.error("Error creating auction end notifications:", notificationError);
      return new Response(
        JSON.stringify({ error: notificationError.message }),
        {
          status: 500,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      );
    }

    const { data: endedListings, error: fetchError } = await supabase
      .from("listings")
      .select(`
        id,
        seller_id,
        title,
        year,
        make,
        model,
        current_bid,
        buy_now_price,
        reserve_price,
        end_time,
        status,
        bids!inner(
          id,
          bidder_id,
          amount,
          is_retracted
        )
      `)
      .eq("status", "active")
      .lte("end_time", new Date().toISOString())
      .order("end_time", { ascending: true });

    if (fetchError) {
      console.error("Error fetching ended listings:", fetchError);
    } else if (endedListings && endedListings.length > 0) {
      for (const listing of endedListings) {
        const validBids = listing.bids.filter((bid: any) => !bid.is_retracted);

        if (validBids.length === 0) {
          await supabase
            .from("listings")
            .update({ status: "expired" })
            .eq("id", listing.id);
          continue;
        }

        const winningBid = validBids.reduce((max: any, bid: any) =>
          bid.amount > max.amount ? bid : max
        );

        const finalPrice = winningBid.amount;
        const metReserve = !listing.reserve_price || finalPrice >= listing.reserve_price;

        if (!metReserve) {
          await supabase
            .from("listings")
            .update({ status: "expired" })
            .eq("id", listing.id);
          continue;
        }

        const { data: contactData } = await supabase.rpc("get_transaction_contact_info", {
          user_id_param: listing.seller_id
        });
        const sellerContact = contactData?.[0];

        const { data: buyerContactData } = await supabase.rpc("get_transaction_contact_info", {
          user_id_param: winningBid.bidder_id
        });
        const buyerContact = buyerContactData?.[0];

        const { data: feeData } = await supabase.rpc("calculate_seller_fee", {
          seller_id_param: listing.seller_id,
          final_price_param: finalPrice
        });
        const sellerFee = feeData || 0;

        const { data: transaction, error: transactionError } = await supabase
          .from("completed_transactions")
          .insert({
            listing_id: listing.id,
            seller_id: listing.seller_id,
            buyer_id: winningBid.bidder_id,
            final_price: finalPrice,
            seller_fee: sellerFee,
            payment_method: "auction_win",
            seller_email: sellerContact?.email || "",
            seller_phone: sellerContact?.phone || null,
            buyer_email: buyerContact?.email || "",
            buyer_phone: buyerContact?.phone || null,
          })
          .select()
          .single();

        if (transactionError) {
          console.error("Error creating transaction:", transactionError);
          continue;
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
      }
    }

    return new Response(
      JSON.stringify({
        message: "Auction end notifications and transactions processed successfully",
        processed: endedListings?.length || 0
      }),
      {
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  } catch (error) {
    console.error("Unexpected error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  }
});
