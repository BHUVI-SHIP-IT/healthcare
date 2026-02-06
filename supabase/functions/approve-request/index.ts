import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS'
}

serve(async (req: Request) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { status: 200, headers: corsHeaders })
    }

    try {
        const supabase = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_ANON_KEY') ?? '',
            { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
        )

        // Get authenticated user
        const { data: { user }, error: authError } = await supabase.auth.getUser()
        if (authError || !user) {
            console.error('Auth Error:', authError);
            return new Response(JSON.stringify({
                error: 'Unauthorized',
                details: authError?.message || 'No user found',
                headerReceived: !!req.headers.get('Authorization')
            }), {
                status: 401,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            })
        }

        // Verify user is a Class Advisor
        // Check metadata first (faster and matches frontend)
        const userRole = user.user_metadata?.role;

        if (userRole !== 'CLASS_ADVISOR') {
            console.error('Role Mismatch:', { metadataRole: userRole });
            return new Response(JSON.stringify({
                error: 'Forbidden - Not a Class Advisor',
                details: `User role is ${userRole}`
            }), {
                status: 403,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            })
        }

        const { requestId, decision, comments } = await req.json()

        // Update request status
        const newStatus = decision === 'APPROVED' ? 'CA_APPROVED' : 'REJECTED'
        const { data: request, error: updateError } = await supabase
            .from('HealthRequest')
            .update({ status: newStatus })
            .eq('id', requestId)
            .select()
            .single()

        if (updateError) {
            throw updateError
        }

        // Create CA approval record
        await supabase.from('CAApproval').insert({
            requestId,
            advisorId: user.id,
            decision,
            comments,
        })

        // Create audit log
        await supabase.from('AuditLog').insert({
            requestId,
            userId: user.id,
            action: `CA_${decision}`,
            details: comments || null,
        })

        return new Response(JSON.stringify({ success: true, request }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
    } catch (error) {
        return new Response(JSON.stringify({ error: (error as Error).message }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
    }
})
