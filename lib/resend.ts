import { Resend } from 'resend';

const apiKey = process.env.RESEND_API_KEY;

// Only initialize if we have a key, otherwise export a proxy or handle it in the routes
// This prevents the "Missing API key" error during build time
export const resend = apiKey ? new Resend(apiKey) : null;
