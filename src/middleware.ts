// import { NextResponse } from 'next/server'
// import type { NextRequest } from 'next/server'
// import { auth } from '@/lib/auth'

// // Private by default, public routes are defined below (regex)
// const isPublicRoute = (request: NextRequest): boolean => {
//   const publicPatterns = [
//     /^\/sign-in(.*)/,
//     /^\/sign-up(.*)/,
//     /^\/api(.*)/,
//     /^\/$/,  // landing page
//     /^\/[^/]+$/, // single level path
//     /^\/[^/]+\/chat$/, // course chat pages
//   ]

//   return publicPatterns.some(pattern => pattern.test(request.nextUrl.pathname))
// }

// // Create a middleware handler that runs before authentication
// function materialsRedirectMiddleware(request: NextRequest) {
//   const url = request.nextUrl
//   const materialsPattern = /^\/([^\/]+)\/materials$/
//   const match = url.pathname.match(materialsPattern)

//   if (match) {
//     const projectName = match[1]
//     const newUrl = new URL(`/${projectName}/dashboard`, url)
//     return NextResponse.redirect(newUrl)
//   }

//   return null
// }

// export default async function middleware(request: NextRequest) {
//   // First check for materials redirect
//   const redirectResponse = materialsRedirectMiddleware(request)
//   if (redirectResponse) return redirectResponse

//   // Check if it's a public route
//   if (isPublicRoute(request)) {
//     return NextResponse.next()
//   }

//   // For protected routes, validate authentication using Better Auth
//   const session = await auth.api.getSession(request)
//   if (!session) {
//     return NextResponse.redirect(new URL('/sign-in', request.url))
//   }

//   return NextResponse.next()
// }

// Update the matcher to include all the same patterns as before
export const config = {
  matcher: [
    // '/((?!.*\\..*|_next).*)',  // Match all paths except files with extensions and _next
    '/',                        // Match root path
    // '/(api|trpc)/(.*)',        // Match API and tRPC routes
    // '/\\[course_name\\]/gpt4', // Match course GPT4 routes
    // '/:path*/materials',        // Match materials routes
  ],
}