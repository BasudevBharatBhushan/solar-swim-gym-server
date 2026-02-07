import supabase from '../config/db';
import { Session } from '../types';

export const getSessions = async (): Promise<Session[]> => {
    // Sessions are potentially global or filtered by location if we add that later.
    // For now, assuming global or all visible.
    const { data, error } = await supabase
        .from('session')
        .select('*')
        .order('start_date', { ascending: false });

    if (error) throw new Error(error.message);
    return data || [];
};

export const getSessionById = async (sessionId: string): Promise<Session | null> => {
    const { data, error } = await supabase
        .from('session')
        .select('*')
        .eq('session_id', sessionId)
        .single();

    if (error) throw new Error(error.message);
    return data;
};

export const upsertSession = async (sessionData: Partial<Session>): Promise<Session> => {
    // Simple validation
    if (!sessionData.name || !sessionData.start_date || !sessionData.expiry_date) {
        // If updating, maybe partial is okay? But upsert usually requires full payload or ID.
        // If ID is present, we update. If not, we create, needing fields.
        if (!sessionData.session_id) {
             if (!sessionData.name || !sessionData.start_date || !sessionData.expiry_date) {
                 throw new Error('Name, Start Date, and Expiry Date are required for new sessions.');
             }
        }
    }

    const { data, error } = await supabase
        .from('session')
        .upsert(sessionData)
        .select('*')
        .single();

    if (error) throw new Error(error.message);
    return data;
};

export default {
    getSessions,
    getSessionById,
    upsertSession
};
