import { withAuth } from 'next-auth/middleware';

export default withAuth(
  function middleware(req) {
    // Add any additional middleware logic here
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        // Check if user is trying to access admin routes
        if (req.nextUrl.pathname.startsWith('/admin')) {
          // Allow access to public auth pages without authentication
          const publicAuthPages = [
            '/admin/login',
            '/admin/forgot-password',
            '/admin/reset-password',
          ];

          if (publicAuthPages.includes(req.nextUrl.pathname)) {
            return true;
          }

          // For all other admin routes, require authentication
          return !!token;
        }
        // For non-admin routes, allow access
        return true;
      },
    },
  }
);

export const config = {
  matcher: ['/admin/:path*']
};