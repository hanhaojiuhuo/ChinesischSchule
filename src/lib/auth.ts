import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const adminEmail = process.env.ADMIN_EMAIL || "admin@yixin-chinese.de";
        const adminPassword = process.env.ADMIN_PASSWORD || "admin123";
        
        if (credentials?.email === adminEmail && credentials?.password === adminPassword) {
          return {
            id: "1",
            name: "Admin",
            email: adminEmail,
          };
        }
        return null;
      },
    }),
  ],
  pages: {
    signIn: "/admin/login",
  },
  session: {
    strategy: "jwt",
  },
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const isOnAdmin = nextUrl.pathname.includes('/admin');
      const isOnLogin = nextUrl.pathname.includes('/admin/login');
      
      if (isOnAdmin && !isOnLogin) {
        if (isLoggedIn) return true;
        return false;
      }
      return true;
    },
  },
});
