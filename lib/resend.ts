import { Resend } from 'resend';

/**
 * Returns an initialized Resend client if the RESEND_API_KEY is present.
 * This is wrapped in a function to prevent "Missing API key" errors 
 * during Next.js build-time module evaluation.
 */
export const getResendClient = () => {
    const apiKey = process.env.RESEND_API_KEY;

    if (!apiKey || apiKey === 'undefined' || apiKey.trim() === '') {
        return null;
    }

    try {
        return new Resend(apiKey);
    } catch (error) {
        console.error("Failed to initialize Resend client:", error);
        return null;
    }
};
