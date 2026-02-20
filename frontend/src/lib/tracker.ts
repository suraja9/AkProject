
import { v4 as uuidv4 } from 'uuid';

const SESSION_KEY = 'audit_session_id';
const API_URL = 'http://localhost:5000/api/session';

export const tracker = {
    getSessionId: () => {
        let id = sessionStorage.getItem(SESSION_KEY);
        if (!id) {
            id = uuidv4();
            sessionStorage.setItem(SESSION_KEY, id);
        }
        return id;
    },

    startSession: async () => {
        const sessionId = tracker.getSessionId();
        // Reset session if it's old or fresh start, but usually we just want to ensure ID exists
        try {
            await fetch(`${API_URL}/start`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ sessionId })
            });
        } catch (e) {
            console.error('Failed to start session tracking', e);
        }
    },

    trackStep: async (step: string) => {
        const sessionId = tracker.getSessionId();
        try {
            await fetch(`${API_URL}/update`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ sessionId, step })
            });
        } catch (e) {
            console.error('Failed to update session tracking', e);
        }
    },

    completeSession: async () => {
        const sessionId = tracker.getSessionId();
        try {
            await fetch(`${API_URL}/complete`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ sessionId })
            });
            // Clear session after completion so next time it starts fresh logic can handle it
            sessionStorage.removeItem(SESSION_KEY);
        } catch (e) {
            console.error('Failed to complete session tracking', e);
        }
    }
};
