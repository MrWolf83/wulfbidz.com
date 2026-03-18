import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface TransactionEmailRequest {
  transactionId: string;
}

interface TransactionDetails {
  id: string;
  listing_id: string;
  seller_id: string;
  buyer_id: string;
  final_price: number;
  seller_fee: number;
  payment_method: string;
  seller_email: string;
  seller_phone: string | null;
  buyer_email: string;
  buyer_phone: string | null;
  listing_title: string;
  listing_year: number;
  listing_make: string;
  listing_model: string;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const { transactionId }: TransactionEmailRequest = await req.json();

    if (!transactionId) {
      return new Response(
        JSON.stringify({ error: "Transaction ID is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const transactionResponse = await fetch(
      `${supabaseUrl}/rest/v1/completed_transactions?id=eq.${transactionId}&select=*,listings(year,make,model,title)`,
      {
        headers: {
          "apikey": supabaseServiceKey,
          "Authorization": `Bearer ${supabaseServiceKey}`,
        },
      }
    );

    if (!transactionResponse.ok) {
      throw new Error("Failed to fetch transaction details");
    }

    const transactions = await transactionResponse.json();
    if (transactions.length === 0) {
      return new Response(
        JSON.stringify({ error: "Transaction not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const transaction = transactions[0];
    const listing = transaction.listings;

    const vehicleTitle = `${listing.year} ${listing.make} ${listing.model}`;
    const paymentMethodText = transaction.payment_method === 'buy_now' ? 'Buy Now' : 'Auction Win';

    const sellerEmail = {
      to: transaction.seller_email,
      subject: `Sale Completed: ${vehicleTitle}`,
      body: `
Congratulations! Your listing has been sold.

Vehicle: ${vehicleTitle}
Sale Price: $${transaction.final_price.toLocaleString()}
Seller Fee (5%): $${transaction.seller_fee.toLocaleString()}
Net Amount: $${(transaction.final_price - transaction.seller_fee).toLocaleString()}
Payment Method: ${paymentMethodText}

BUYER CONTACT INFORMATION:
Email: ${transaction.buyer_email}
${transaction.buyer_phone ? `Phone: ${transaction.buyer_phone}` : 'Phone: Not provided'}

Please contact the buyer to finalize the transaction details and arrange for vehicle transfer.

Important Notes:
- You are responsible for completing this transaction directly with the buyer
- The seller fee of $${transaction.seller_fee.toLocaleString()} will be processed separately
- All transactions must comply with local laws and regulations
- WulfBidz is not responsible for the completion of the transaction

Thank you for using WulfBidz!
      `.trim(),
    };

    const buyerEmail = {
      to: transaction.buyer_email,
      subject: `Purchase Confirmed: ${vehicleTitle}`,
      body: `
Congratulations on your purchase!

Vehicle: ${vehicleTitle}
Purchase Price: $${transaction.final_price.toLocaleString()}
Payment Method: ${paymentMethodText}

SELLER CONTACT INFORMATION:
Email: ${transaction.seller_email}
${transaction.seller_phone ? `Phone: ${transaction.seller_phone}` : 'Phone: Not provided'}

Please contact the seller to finalize the transaction details and arrange for vehicle pickup or delivery.

Important Notes:
- You are responsible for completing this transaction directly with the seller
- Inspect the vehicle and verify all documentation before finalizing payment
- All transactions must comply with local laws and regulations
- WulfBidz is not responsible for the completion of the transaction

Thank you for using WulfBidz!
      `.trim(),
    };

    console.log("Transaction emails prepared:");
    console.log("To seller:", sellerEmail.to);
    console.log("To buyer:", buyerEmail.to);
    console.log("\nSeller Email:\n", sellerEmail.body);
    console.log("\nBuyer Email:\n", buyerEmail.body);

    await fetch(
      `${supabaseUrl}/rest/v1/completed_transactions?id=eq.${transactionId}`,
      {
        method: "PATCH",
        headers: {
          "apikey": supabaseServiceKey,
          "Authorization": `Bearer ${supabaseServiceKey}`,
          "Content-Type": "application/json",
          "Prefer": "return=minimal",
        },
        body: JSON.stringify({ notification_sent: true }),
      }
    );

    return new Response(
      JSON.stringify({
        success: true,
        message: "Transaction emails prepared (logged to console)",
        emails: { seller: sellerEmail, buyer: buyerEmail }
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Error sending transaction emails:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});