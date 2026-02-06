# CORRECTED Edge Functions - Copy These to Fix CORS

The issue: Missing `Access-Control-Allow-Methods` header and explicit `status: 200` in OPTIONS response.

---

## 1. approve-request (CORRECTED)

```typescript
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

        const { data: userData } = await supabase
            .from('User')
            .select('role, classSection')
            .eq('id', user.id)
            .single()

        if (userData?.role !== 'CLASS_ADVISOR') {
            return new Response(JSON.stringify({ error: 'Forbidden - Not a Class Advisor' }), {
                status: 403,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            })
        }

        const { requestId, decision, comments } = await req.json()

        const newStatus = decision === 'APPROVED' ? 'CA_APPROVED' : 'REJECTED'
        const { data: request, error: updateError } = await supabase
            .from('HealthRequest')
            .update({ status: newStatus })
            .eq('id', requestId)
            .select()
            .single()

        if (updateError) throw updateError

        await supabase.from('CAApproval').insert({
            requestId,
            advisorId: user.id,
            decision,
            comments,
        })

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
```

---

## Quick Fix Instructions

**Instead of redeploying all 6 functions, just update the CORS headers in each:**

1. Open each Edge Function in Supabase Dashboard
2. Find lines 4-7 (corsHeaders definition)
3. **Change line 7** to add the Methods header:
   ```typescript
   const corsHeaders = {
       'Access-Control-Allow-Origin': '*',
       'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
       'Access-Control-Allow-Methods': 'POST, OPTIONS'
   }
   ```

4. Find lines 10-12 (OPTIONS handler)
5. **Change line 11** to add explicit status:
   ```typescript
   if (req.method === 'OPTIONS') {
       return new Response('ok', { status: 200, headers: corsHeaders })
   }
   ```

6. Click "Deploy updates"
7. **Repeat for all 6 functions**

This should fix the CORS error!
