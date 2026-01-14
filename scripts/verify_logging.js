
const { generateActivationToken } = require('../lib/token');
const { sendActivationEmail } = require('../lib/email');

// Mock environment variables if needed
process.env.CROSS_APP_SECRET = 'test-secret';
process.env.MAIN_APP_URL = 'http://localhost:3001';
process.env.EMAIL_PROVIDER = 'console';

async function run() {
    console.log('Starting Verification...');

    const user = {
        id: 123,
        email: 'test@example.com',
        firstName: 'TestUser'
    };

    // 1. Test Key Generation
    console.log('\n1. Testing Token Generation...');
    const token = generateActivationToken(user);
    console.log('Generated Token:', token);

    if (!token || !token.includes('.')) {
        console.error('FAILED: Token format invalid');
        process.exit(1);
    } else {
        console.log('PASSED: Token generated successfully');
    }

    // 2. Test URL Construction
    const activationUrl = `${process.env.MAIN_APP_URL}/auth/activate?token=${token}`;
    console.log('Activation URL:', activationUrl);

    // 3. Test Email Sending (Console Mode)
    console.log('\n2. Testing Email Sending...');
    try {
        await sendActivationEmail(user.email, user.firstName, activationUrl);
        console.log('PASSED: Email function called successfully');
    } catch (error) {
        console.error('FAILED: Email sending failed', error);
        process.exit(1);
    }

    console.log('\nVerification Complete!');
}

run();
