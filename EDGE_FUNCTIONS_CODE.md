# Edge Functions - Ready to Deploy

Copy each function code below and paste into Supabase Dashboard.

---

## 1. approve-request

```typescript
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
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
            return new Response(JSON.stringify({ error: 'Unauthorized' }), {
                status: 401,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            })
        }

        // Verify user is a Class Advisor
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
```

---

## 2. acknowledge-arrival

```typescript
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
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
            .select('role')
            .eq('id', user.id)
            .single()

        if (userData?.role !== 'HEALTH_RECEPTIONIST') {
            return new Response(JSON.stringify({ error: 'Forbidden' }), {
                status: 403,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            })
        }

        const { requestId } = await req.json()

        // Update request status
        const { data: request, error: updateError } = await supabase
            .from('HealthRequest')
            .update({ status: 'RECEPTION_ACK' })
            .eq('id', requestId)
            .select()
            .single()

        if (updateError) throw updateError

        // Create arrival record
        await supabase.from('ArrivalAcknowledgement').insert({
            requestId,
            receptionistId: user.id,
        })

        await supabase.from('AuditLog').insert({
            requestId,
            userId: user.id,
            action: 'ARRIVAL_ACKNOWLEDGED',
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

## 3. authorize-exit

```typescript
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { nanoid } from 'https://deno.land/x/nanoid@v3.0.0/mod.ts'

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
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
            .select('role')
            .eq('id', user.id)
            .single()

        if (userData?.role !== 'HEALTH_RECEPTIONIST') {
            return new Response(JSON.stringify({ error: 'Forbidden' }), {
                status: 403,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            })
        }

        const { requestId } = await req.json()

        // Generate exit token
        const exitToken = nanoid(12).toUpperCase()

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
```

---

## 4. hod-decision

```typescript
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
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
            .select('role')
            .eq('id', user.id)
            .single()

        if (userData?.role !== 'HOD') {
            return new Response(JSON.stringify({ error: 'Forbidden' }), {
                status: 403,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            })
        }

        const { requestId, decision, comments } = await req.json()

        const newStatus = decision === 'APPROVED' ? 'DOCTOR_REVIEW' : 'REJECTED'

        const { data: request, error: updateError } = await supabase
            .from('HealthRequest')
            .update({ status: newStatus })
            .eq('id', requestId)
            .select()
            .single()

        if (updateError) throw updateError

        await supabase.from('HODDecision').insert({
            requestId,
            hodId: user.id,
            decision,
            comments,
        })

        await supabase.from('AuditLog').insert({
            requestId,
            userId: user.id,
            action: `HOD_${decision}`,
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

## 5. scan-gate-token

```typescript
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
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
            .select('role')
            .eq('id', user.id)
            .single()

        if (userData?.role !== 'GATE_AUTHORITY') {
            return new Response(JSON.stringify({ error: 'Forbidden' }), {
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
```

---

## 6. submit-doctor-report

```typescript
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
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
            .select('role')
            .eq('id', user.id)
            .single()

        if (userData?.role !== 'DOCTOR') {
            return new Response(JSON.stringify({ error: 'Forbidden' }), {
                status: 403,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            })
        }

        const { requestId, notes, riskLevel } = await req.json()

        // Determine next status based on risk level
        const newStatus = riskLevel === 'HIGH' ? 'HOD_REVIEW' : 'DOCTOR_REVIEW'

        // Update request
        const { data: request, error: updateError } = await supabase
            .from('HealthRequest')
            .update({ status: newStatus })
            .eq('id', requestId)
            .select()
            .single()

        if (updateError) throw updateError

        // Create doctor report
        await supabase.from('DoctorReport').insert({
            requestId,
            doctorId: user.id,
            notes,
            riskLevel,
        })

        await supabase.from('AuditLog').insert({
            requestId,
            userId: user.id,
            action: 'DOCTOR_REPORT_SUBMITTED',
            details: `Risk Level: ${riskLevel}`,
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

## Deployment Instructions

1. Go to Supabase Dashboard → Edge Functions
2. Click "Open Editor"
3. For each function above:
   - Click "New function"
   - Enter the function name (e.g., `approve-request`)
   - Copy the code from above
   - Paste into editor
   - Click "Deploy"
