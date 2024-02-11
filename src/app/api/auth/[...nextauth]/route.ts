// This route utilizes the special syntax [...nextauth] within the app directory to handle authentication. 
// Any route matching /api/auth/* will be processed by this route handler.

// Importing NextAuth and the authOptions from our custom auth configuration
import NextAuth from 'next-auth/next';
import { authOptions } from '@/lib/auth';

// Creating the handler with our authOptions
const handler = NextAuth(authOptions);

// Exporting the handler to manage both GET and POST requests
export { handler as GET, handler as POST };
