import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS'
}

serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { status: 200, headers: corsHeaders })
    }

    try {
        const supabase = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_ANON_KEY') ?? '',
            { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
        )

        const { data: { user }, error: authError } = await supabase.auth.getUser()
        if (authError || !user) {
            return new Response(JSON.stringify({ error: 'Unauthorized' }), {
                status: 401,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            })
        }

        // Check metadata first (faster and matches frontend)
        const userRole = user.user_metadata?.role;

        if (userRole !== 'GATE_AUTHORITY') {
            console.error('Role Mismatch:', { metadataRole: userRole });
            return new Response(JSON.stringify({
                error: 'Forbidden',
                details: `User role is ${userRole}`
            }), {
                status: 403,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            })
        }

        const { token } = await req.json()

        // Find request with this token
        const { data: request, error: findError } = await supabase
            .from('HealthRequest')
            .select('*, user:User!userId(*)')
            .eq('exitToken', token)
            .eq('status', 'EXIT_AUTHORIZED')
            .single()

        if (findError || !request) {
            return new Response(JSON.stringify({ error: 'Invalid or expired token' }), {
                status: 404,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            })
        }

        // Update request status
        const { error: updateError } = await supabase
            .from('HealthRequest')
            .update({ status: 'COMPLETED' })
            .eq('id', request.id)

        if (updateError) throw updateError

        // Create gate exit log
        await supabase.from('GateExitLog').insert({
            requestId: request.id,
            gateAuthorityId: user.id,
            exitToken: token,
        })

        await supabase.from('AuditLog').insert({
            requestId: request.id,
            userId: user.id,
            action: 'GATE_EXIT_SCANNED',
            details: `Token: ${token}`,
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
