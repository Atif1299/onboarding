import '../src/index.css';
import Providers from './providers';

export const metadata = {
  title: 'Offer Page - Find Your Exclusive County',
  description: 'Select your state and county to see available subscription plans and unlock your potential.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <meta charSet="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      </head>
      <body>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
