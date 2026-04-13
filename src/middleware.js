import { NextResponse } from 'next/server';
import { auth } from './lib/firebase';

export function middleware(request) {
  const { pathname } = request.nextUrl;

  // Public routes that don't require authentication
  const publicRoutes = ['/login', '/register', '/admin'];
  
  // Protected routes
  const protectedRoutes = ['/dashboard', '/employee'];
  
  // Check if the current path is a protected route
  const isProtectedRoute = protectedRoutes.some(route => pathname.startsWith(route));
  const isPublicRoute = publicRoutes.some(route => pathname.startsWith(route));

  // If it's a protected route, check for authentication
  if (isProtectedRoute) {
    const adminSession = request.cookies.get('adminSession');
    const authToken = request.cookies.get('authToken');
    const tokenTimestamp = request.cookies.get('tokenTimestamp');
    
    // Path-specific role protection
    if (pathname.startsWith('/dashboard/admin')) {
      if (!adminSession) {
        return NextResponse.redirect(new URL('/admin', request.url));
      }
    } else if (pathname.startsWith('/dashboard/employee')) {
      if (!authToken) {
        return NextResponse.redirect(new URL('/login', request.url));
      }
    } else if (!adminSession && !authToken) {
      // Generic dashboard protection fallback
      return NextResponse.redirect(new URL('/login', request.url));
    }
    
    // Check if employee token is expired (24 hours)
    if (authToken && tokenTimestamp) {
      const currentTime = Date.now();
      const tokenAge = currentTime - parseInt(tokenTimestamp.value);
      const twentyFourHours = 24 * 60 * 60 * 1000;
      
      if (tokenAge > twentyFourHours) {
        // Token expired, redirect to login
        const response = NextResponse.redirect(new URL('/login', request.url));
        response.cookies.delete('authToken');
        response.cookies.delete('tokenTimestamp');
        response.cookies.delete('userRole');
        return response;
      }
    }
  }

  // If user is already authenticated and tries to access their own login portal, redirect to dashboard
  if (isPublicRoute) {
    const adminSession = request.cookies.get('adminSession');
    const authToken = request.cookies.get('authToken');
    
    // Admin trying to access /admin
    if (pathname.startsWith('/admin') && adminSession) {
      return NextResponse.redirect(new URL('/dashboard/admin', request.url));
    }
    
    // Employee trying to access employee login/register
    if ((pathname.startsWith('/login') || pathname.startsWith('/register')) && authToken) {
      return NextResponse.redirect(new URL('/dashboard/employee', request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};
