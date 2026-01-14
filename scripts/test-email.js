import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Load .env.local
const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

async function testEmail() {
    console.log('Testing email sending...');
    console.log('EMAIL_PROVIDER:', process.env.EMAIL_PROVIDER);
    console.log('RESEND_API_KEY present:', !!process.env.RESEND_API_KEY);

    try {
        const { sendWelcomeEmail } = await import('../lib/email.js');
        const testEmail = process.env.TEST_EMAIL || 'me@amirhameed.com';

        // Pass a fake name
        const result = await sendWelcomeEmail(testEmail, 'Test User');
        console.log('Email sent result:', result);
    } catch (error) {
        console.error('Failed to send email:', error);
    }
}

testEmail();
