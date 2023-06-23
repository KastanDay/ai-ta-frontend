// import { NextRequest, NextResponse } from 'next/server';
// import { get, getAll } from '@vercel/edge-config';
// const configItems = await getAll();

// export const config = { matcher: '/*' };

// export async function middleware() {
//   const greeting = await get('greeting');
//   return NextResponse.json(greeting);
// }

import { authMiddleware } from '@clerk/nextjs'

export default authMiddleware()

// Stop Middleware from running on static files
export const config = {
  matcher: ['/((?!.*\\..*|_next).*)', '/', '/(api|trpc)(.*)'],
}
