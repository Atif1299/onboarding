const fs = require('fs');
// Removing '-pooler' from the hostname to guess the Direct Connection URL
const content = `DATABASE_URL="postgresql://neondb_owner:npg_A9bJF5HlNdqa@ep-small-cherry-adbvyaso.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require"
NEXTAUTH_SECRET="your-super-secret-nextauth-secret-key-change-this-in-production"
NEXTAUTH_URL="http://localhost:3000"
STRIPE_PUBLISHABLE_KEY="pk_test_51NeMgsHo4otQW1AuljtMsUoGPSYWXRApOwtWDuykbqinqfkcPo5MdLg9n2ulpDuT2xwrkb0U"
BIDSQUIRE_WEBHOOK_URL="https://your-bidsquire-app.com/api/webhooks/register"
`;
fs.writeFileSync('.env.prod', content);
console.log('.env.prod has been updated with the DIRECT connection string (guessed).');
