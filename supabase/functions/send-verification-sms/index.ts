import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface RequestPayload {
  phoneNumber: string;
  action: 'send' | 'verify';
  code?: string;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      {
        auth: {
          persistSession: false,
        },
      }
    );

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      throw new Error("No authorization header");
    }

    const { data: { user }, error: userError } = await supabaseClient.auth.getUser(
      authHeader.replace("Bearer ", "")
    );

    if (userError || !user) {
      throw new Error("Unauthorized");
    }

    const { phoneNumber, action, code }: RequestPayload = await req.json();

    if (action === 'send') {
      // Check rate limiting
      const { data: rateLimitOk } = await supabaseClient.rpc(
        'check_verification_rate_limit',
        { p_user_id: user.id }
      );

      if (!rateLimitOk) {
        return new Response(
          JSON.stringify({
            error: "Too many verification attempts. Please try again in an hour."
          }),
          {
            status: 429,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }

      // Generate verification code
      const { data: verificationCode } = await supabaseClient.rpc(
        'generate_verification_code'
      );

      // Store verification code in database
      const { error: insertError } = await supabaseClient
        .from('user_phone_verification')
        .upsert({
          user_id: user.id,
          phone_number: phoneNumber,
          verification_code: verificationCode,
          code_expires_at: new Date(Date.now() + 10 * 60 * 1000).toISOString(), // 10 minutes
          verification_attempts: 0,
          last_attempt_at: new Date().toISOString(),
          is_verified: false,
        }, {
          onConflict: 'user_id,phone_number'
        });

      if (insertError) {
        throw insertError;
      }

      // In a production environment, you would integrate with an SMS provider like Twilio
      // For now, we'll return the code in development mode for testing
      console.log(`Verification code for ${phoneNumber}: ${verificationCode}`);

      // TODO: Integrate with SMS provider (Twilio, AWS SNS, etc.)
      // Example with Twilio:
      // const twilioAccountSid = Deno.env.get('TWILIO_ACCOUNT_SID');
      // const twilioAuthToken = Deno.env.get('TWILIO_AUTH_TOKEN');
      // const twilioPhoneNumber = Deno.env.get('TWILIO_PHONE_NUMBER');
      //
      // const twilioUrl = `https://api.twilio.com/2010-04-01/Accounts/${twilioAccountSid}/Messages.json`;
      // const twilioAuth = btoa(`${twilioAccountSid}:${twilioAuthToken}`);
      //
      // await fetch(twilioUrl, {
      //   method: 'POST',
      //   headers: {
      //     'Authorization': `Basic ${twilioAuth}`,
      //     'Content-Type': 'application/x-www-form-urlencoded',
      //   },
      //   body: new URLSearchParams({
      //     To: phoneNumber,
      //     From: twilioPhoneNumber,
      //     Body: `Your WulfBidz verification code is: ${verificationCode}. This code expires in 10 minutes.`
      //   })
      // });

      return new Response(
        JSON.stringify({
          success: true,
          message: "Verification code sent successfully",
          // Remove this in production - only for testing
          devCode: verificationCode
        }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );

    } else if (action === 'verify') {
      if (!code) {
        return new Response(
          JSON.stringify({ error: "Verification code is required" }),
          {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }

      // Validate verification code
      const { data: isValid } = await supabaseClient.rpc(
        'validate_verification_code',
        {
          p_user_id: user.id,
          p_phone_number: phoneNumber,
          p_code: code
        }
      );

      if (isValid) {
        // Update profile with verified phone number
        await supabaseClient
          .from('profiles')
          .update({ phone: phoneNumber })
          .eq('id', user.id);

        return new Response(
          JSON.stringify({
            success: true,
            verified: true,
            message: "Phone number verified successfully"
          }),
          {
            status: 200,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      } else {
        return new Response(
          JSON.stringify({
            success: false,
            verified: false,
            error: "Invalid or expired verification code"
          }),
          {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }
    }

    return new Response(
      JSON.stringify({ error: "Invalid action" }),
      {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );

  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
