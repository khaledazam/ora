import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';

const isAdminRoute = createRouteMatcher(['/admin(.*)']);

export default clerkMiddleware(async (auth, req) => {
  const { userId } = await auth();
  const isProtected = isAdminRoute(req);

  if (isProtected && !userId) {
    return (await auth()).redirectToSignIn({ returnBackUrl: req.url });
  }

  // لو المستخدم موجود وفي الـ admin route، خلي التحقق في الـ page
});

export const config = {
  matcher: [
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    '/(api|trpc)(.*)',
  ],
};