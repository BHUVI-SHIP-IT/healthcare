import { supabase } from '../lib/supabase';
import { CreateHealthRequestDto, HealthRequest } from '../types';

export async function getMyRequests(): Promise<HealthRequest[]> {
    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) throw new Error('Not authenticated');

    const { data, error } = await supabase
        .from('HealthRequest')
        .select('*')
        .eq('studentId', user.id)
        .order('createdAt', { ascending: false });

    if (error) throw new Error(error.message);
    return data as unknown as HealthRequest[];
}

export async function createHealthRequest(input: CreateHealthRequestDto): Promise<HealthRequest> {
    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) throw new Error('Not authenticated');

    const { data, error } = await supabase
        .from('HealthRequest')
        .insert({
            studentId: user.id,
            symptoms: input.symptoms,
            description: input.description,
            classSection: user.user_metadata.classSection,
            updatedAt: new Date().toISOString(),
        })
        .select()
        .single();

    if (error) {
        console.error('Full Supabase error:', error);
        throw new Error(`Failed to create request: ${error.message} (${error.code || 'unknown code'})`);
    }
    return data as unknown as HealthRequest;
}

export async function getPendingRequests(): Promise<HealthRequest[]> {
    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) throw new Error('Not authenticated');

    const userRole = user.user_metadata.role;
    let query = supabase.from('HealthRequest').select('*, student:User!studentId(id, fullName, email, classSection)');

    // Filter based on role
    if (userRole === 'CLASS_ADVISOR') {
        // Class Advisors see requests from their classSection with status PENDING_CA
        query = query
            .eq('classSection', user.user_metadata.classSection)
            .eq('status', 'PENDING_CA');
    } else if (userRole === 'HOD') {
        // HODs see HIGH risk cases from their department
        // Extract department from classSection (format: YEAR_SECTION_DEPT)
        const hodDepartment = user.user_metadata.department;

        // Get all PENDING_HOD requests
        const { data: allRequests, error: allError } = await query
            .eq('status', 'PENDING_HOD')
            .order('createdAt', { ascending: false });

        if (allError) throw new Error(allError.message);

        // Filter by department extracted from classSection
        const filtered = (allRequests || []).filter((req: any) => {
            if (!req.classSection) return false;
            const reqDept = req.classSection.split('_')[2]; // Extract DEPT from "YEAR_SECTION_DEPT"
            return reqDept === hodDepartment;
        });

        return filtered as unknown as HealthRequest[];
    } else if (userRole === 'HEALTH_RECEPTIONIST') {
        // Receptionists see approved requests awaiting arrival OR doctor-approved requests awaiting exit
        query = query.in('status', ['CA_APPROVED', 'DOCTOR_REVIEW']);
    } else if (userRole === 'DOCTOR') {
        // Doctors see requests with reception acknowledgment
        query = query.eq('status', 'RECEPTION_ACK');
    } else {
        // For other roles, return empty array
        return [];
    }

    const { data, error } = await query.order('createdAt', { ascending: false });

    if (error) throw new Error(error.message);
    return data as unknown as HealthRequest[];
}

// Workflow functions now use Edge Functions
export async function approveRequest(requestId: string, decision: string, comments?: string) {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) throw new Error('No active session');

    const { data, error } = await supabase.functions.invoke('approve-request', {
        body: { requestId, decision, comments },
        headers: {
            Authorization: `Bearer ${session.access_token}`
        }
    });

    if (error) throw error;
    return data;
}

export async function acknowledgeArrival(requestId: string) {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) throw new Error('No active session');

    const { data, error } = await supabase.functions.invoke('acknowledge-arrival', {
        body: { requestId },
        headers: {
            Authorization: `Bearer ${session.access_token}`
        }
    });

    if (error) throw error;
    return data;
}

export async function submitDoctorReport(
    requestId: string,
    notes: string,
    riskLevel: string
) {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) throw new Error('No active session');

    const { data, error } = await supabase.functions.invoke('submit-doctor-report', {
        body: { requestId, notes, riskLevel },
        headers: {
            Authorization: `Bearer ${session.access_token}`
        }
    });

    if (error) throw error;
    return data;
}

export async function submitHODDecision(
    requestId: string,
    decision: string,
    comments?: string
) {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) throw new Error('No active session');

    const { data, error } = await supabase.functions.invoke('hod-decision', {
        body: { requestId, decision, comments },
        headers: {
            Authorization: `Bearer ${session.access_token}`
        }
    });

    if (error) throw error;
    return data;
}

export async function authorizeExit(requestId: string) {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) throw new Error('No active session');

    const { data, error } = await supabase.functions.invoke('authorize-exit', {
        body: { requestId },
        headers: {
            Authorization: `Bearer ${session.access_token}`
        }
    });

    if (error) throw error;
    return data;
}

export async function scanGateToken(token: string) {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) throw new Error('No active session');

    const { data, error } = await supabase.functions.invoke('scan-gate-token', {
        body: { token },
        headers: {
            Authorization: `Bearer ${session.access_token}`
        }
    });

    if (error) throw error;
    return data;
}
