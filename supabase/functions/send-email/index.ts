
// import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
// import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// const corsHeaders = {
//   'Access-Control-Allow-Origin': '*',
//   'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
// };

// const supabase = createClient(
//   Deno.env.get('SUPABASE_URL') ?? '',
//   Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
// );

// const handler = async (req: Request): Promise<Response> => {
//   if (req.method === 'OPTIONS') {
//     return new Response(null, { headers: corsHeaders });
//   }

//   try {
//     // Get pending emails from queue
//     const { data: emails, error } = await supabase
//       .from('email_queue')
//       .select('*')
//       .eq('status', 'pending')
//       .lte('scheduled_for', new Date().toISOString())
//       .limit(10);

//     if (error) throw error;

//     console.log(`Processing ${emails?.length || 0} emails`);

//     for (const email of emails || []) {
//       try {
//         // Here you would integrate with your email service (Resend, SendGrid, etc.)
//         // For now, we'll just mark as sent
//         console.log(`Sending ${email.email_type} email to ${email.recipient_email}`);
        
//         // Update email status to sent
//         await supabase
//           .from('email_queue')
//           .update({
//             status: 'sent',
//             sent_at: new Date().toISOString()
//           })
//           .eq('id', email.id);

//         console.log(`Email ${email.id} marked as sent`);
        
//       } catch (emailError) {
//         console.error(`Failed to send email ${email.id}:`, emailError);
        
//         // Mark email as failed
//         await supabase
//           .from('email_queue')
//           .update({
//             status: 'failed',
//             error_message: emailError.message
//           })
//           .eq('id', email.id);
//       }
//     }

//     return new Response(
//       JSON.stringify({ processed: emails?.length || 0 }),
//       { 
//         headers: { ...corsHeaders, 'Content-Type': 'application/json' },
//         status: 200 
//       }
//     );

//   } catch (error) {
//     console.error('Error processing emails:', error);
//     return new Response(
//       JSON.stringify({ error: error.message }),
//       { 
//         headers: { ...corsHeaders, 'Content-Type': 'application/json' },
//         status: 500 
//       }
//     );
//   }
// };

// serve(handler);
