import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

const isPublicRoute = createRouteMatcher([
  '/sign-in',
  '/sign-up',
  '/',
  '/pricing',
]);

export default clerkMiddleware((auth, request) => {
  if (!isPublicRoute(request)) {
    auth.protect();
  }
});

export const config = {
  matcher: [
    // Match all request paths except for the ones starting with:
    // - _next/static (static files)
    // - _next/image (image optimization files)
    // - favicon.ico (favicon file)
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
