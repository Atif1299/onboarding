import bcrypt from 'bcryptjs';
import { Pool } from 'pg';

// Import CredentialsProvider using dynamic import to avoid module resolution issues
const CredentialsProvider = require('next-auth/providers/credentials').default;

// Database connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  connectionTimeoutMillis: 30000,
  idleTimeoutMillis: 30000,
  statement_timeout: 60000,
  query_timeout: 60000
});

export const authOptions = {
  providers: [
    // Regular user authentication
    CredentialsProvider({
      id: 'credentials',
      name: 'Email and Password',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' }
      },
      async authorize(credentials) {
        console.log('\n=== USER LOGIN ATTEMPT ===');
        console.log('Email:', credentials?.email);

        if (!credentials?.email || !credentials?.password) {
          throw new Error('Email and password are required');
        }

        let client;
        try {
          client = await pool.connect();

          // Find regular user by email
          const result = await client.query(
            'SELECT user_id, email, password_hash, first_name, last_name, phone, address, stripe_customer_id, credits, user_type FROM users WHERE email = $1',
            [credentials.email.toLowerCase()]
          );

          if (result.rows.length === 0) {
            throw new Error('Invalid credentials');
          }

          const user = result.rows[0];

          // Verify password
          const isValidPassword = await bcrypt.compare(credentials.password, user.password_hash);

          if (!isValidPassword) {
            throw new Error('Invalid credentials');
          }

          console.log('✅ User login successful');
          console.log('===================\n');

          return {
            id: user.user_id.toString(),
            email: user.email,
            name: user.first_name ? `${user.first_name} ${user.last_name || ''}`.trim() : user.email.split('@')[0],
            firstName: user.first_name,
            lastName: user.last_name,
            phone: user.phone,
            address: user.address,
            role: 'user',
            stripeCustomerId: user.stripe_customer_id,
            credits: user.credits,
            userType: user.user_type,
          };
        } catch (error) {
          console.log('❌ Error during user authorization:', error.message);
          throw error;
        } finally {
          if (client) {
            client.release();
          }
        }
      }
    }),
    // Admin authentication
    CredentialsProvider({
      id: 'admin-credentials',
      name: 'Admin Login',
      credentials: {
        username: { label: 'Username', type: 'text' },
        password: { label: 'Password', type: 'password' }
      },
      async authorize(credentials) {
        console.log('\n=== ADMIN LOGIN ATTEMPT ===');
        console.log('Username:', credentials?.username);

        if (!credentials?.username || !credentials?.password) {
          throw new Error('Username and password are required');
        }

        let client;
        try {
          client = await pool.connect();

          // Find admin user by username OR email
          const result = await client.query(
            'SELECT admin_id, username, email, password_hash, full_name, role, is_active FROM admin_users WHERE (username = $1 OR email = $1) AND is_active = true',
            [credentials.username]
          );

          if (result.rows.length === 0) {
            throw new Error('Invalid credentials');
          }

          const user = result.rows[0];

          // Verify password
          const isValidPassword = await bcrypt.compare(credentials.password, user.password_hash);

          if (!isValidPassword) {
            throw new Error('Invalid credentials');
          }

          // Update last login
          await client.query(
            'UPDATE admin_users SET last_login = CURRENT_TIMESTAMP WHERE admin_id = $1',
            [user.admin_id]
          );

          console.log('✅ Admin login successful');
          console.log('===================\n');

          return {
            id: user.admin_id.toString(),
            username: user.username,
            email: user.email,
            name: user.full_name,
            role: user.role,
          };
        } catch (error) {
          console.log('❌ Error during admin authorization:', error.message);
          throw error;
        } finally {
          if (client) {
            client.release();
          }
        }
      }
    })
  ],
  pages: {
    signIn: '/auth/signin',
    error: '/auth/signin',
  },
  session: {
    strategy: 'jwt',
    maxAge: 24 * 60 * 60, // 24 hours
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
        token.username = user.username;
        token.adminId = user.id;
        token.firstName = user.firstName;
        token.lastName = user.lastName;
        token.phone = user.phone;
        token.address = user.address;
        token.stripeCustomerId = user.stripeCustomerId;
        token.credits = user.credits;
        token.userType = user.userType;
      }
      return token;
    },
    async session({ session, token }) {
      session.user.id = token.id;
      session.user.role = token.role;
      session.user.username = token.username;
      session.user.adminId = token.adminId;
      session.user.firstName = token.firstName;
      session.user.lastName = token.lastName;
      session.user.phone = token.phone;
      session.user.address = token.address;
      session.user.stripeCustomerId = token.stripeCustomerId;
      session.user.credits = token.credits;
      session.user.userType = token.userType;
      return session;
    },
    async redirect({ url, baseUrl }) {
      // Redirect to admin dashboard after login
      if (url === baseUrl + '/admin/login') {
        return baseUrl + '/admin/dashboard';
      }
      // Allows relative callback URLs
      if (url.startsWith('/')) return `${baseUrl}${url}`;
      // Allows callback URLs on the same origin
      else if (new URL(url).origin === baseUrl) return url;
      return baseUrl + '/admin/dashboard';
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
};

// Export authOptions for use in API route
// NextAuth v4 with App Router pattern
