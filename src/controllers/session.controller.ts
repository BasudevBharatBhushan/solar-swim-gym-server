import { Request, Response } from 'express';
import sessionService from '../services/session.service';

export const getSessions = async (req: Request, res: Response): Promise<void> => {
    try {
        const sessions = await sessionService.getSessions();
        res.json(sessions);
    } catch (err: unknown) {
        console.error('Error in getSessions:', err);
        res.status(500).json({ error: err instanceof Error ? err.message : 'Unknown error' });
    }
};

export const getSession = async (req: Request, res: Response): Promise<void> => {
    try {
        const sessionId = req.params.id as string;
        if (!sessionId) {
             res.status(400).json({ error: 'Session ID is required' });
             return;
        }
        const session = await sessionService.getSessionById(sessionId);
        if (!session) {
            res.status(404).json({ error: 'Session not found' });
            return;
        }
        res.json(session);
    } catch (err: unknown) {
        console.error('Error in getSession:', err);
        res.status(500).json({ error: err instanceof Error ? err.message : 'Unknown error' });
    }
};

export const upsertSession = async (req: Request, res: Response): Promise<void> => {
    try {
        const result = await sessionService.upsertSession(req.body);
        res.json(result);
    } catch (err: unknown) {
        console.error('Error in upsertSession:', err);
        res.status(500).json({ error: err instanceof Error ? err.message : 'Unknown error' });
    }
};

export default {
    getSessions,
    getSession,
    upsertSession
};
