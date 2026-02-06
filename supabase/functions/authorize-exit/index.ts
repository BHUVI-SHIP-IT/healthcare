import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS'
}

function generateExitToken(length: number = 12): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    const randomValues = new Uint32Array(length);
    crypto.getRandomValues(randomValues);
    for (let i = 0; i < length; i++) {
        result += chars[randomValues[i] % chars.length];
    }
    return result;
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

        const { data: { user }, error: authError } = await supabase.auth.getUser()
        if (authError || !user) {
            return new Response(JSON.stringify({ error: 'Unauthorized' }), {
                status: 401,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            })
        }

        // Check metadata first (faster and matches frontend)
        const userRole = user.user_metadata?.role;

        if (userRole !== 'HEALTH_RECEPTIONIST') {
            console.error('Role Mismatch:', { metadataRole: userRole });
            return new Response(JSON.stringify({
                error: 'Forbidden',
                details: `User role is ${userRole}`
            }), {
                status: 403,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            })
        }

        const { requestId } = await req.json()

        // Generate exit token
        const exitToken = generateExitToken(12);

        // Update request with token
        const { data: request, error: updateError } = await supabase
            .from('HealthRequest')
            .update({
                status: 'EXIT_AUTHORIZED',
                exitToken
            })
            .eq('id', requestId)
            .select()
            .single()

        if (updateError) throw updateError

        // Create exit authorization record
        await supabase.from('ExitAuthorization').insert({
            requestId,
            receptionistId: user.id,
            exitToken,
        })

        await supabase.from('AuditLog').insert({
            requestId,
            userId: user.id,
            action: 'EXIT_AUTHORIZED',
            details: `Token: ${exitToken}`,
        })

        return new Response(JSON.stringify({ success: true, request, exitToken }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
    } catch (error) {
        return new Response(JSON.stringify({ error: (error as Error).message }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
    }
})
