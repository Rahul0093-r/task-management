'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { getCookie } from '@/lib/cookies';
import Link from 'next/link';

export default function Home() {
  const router = useRouter();
  const { loading } = useAuth();

  useEffect(() => {
    if (!loading) {
      // Check for sessions in cookies to perform auto-redirect
      const adminSession = getCookie('adminSession');
      const authToken = getCookie('authToken');
      
      if (adminSession) {
        router.push('/dashboard/admin');
      } else if (authToken) {
        router.push('/dashboard/employee');
      }
    }
  }, [loading, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex justify-center items-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex flex-col justify-center items-center p-4 animate-fade-in relative overflow-hidden">
      {/* Unique animated background patterns */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 opacity-20" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%239C92AC' fill-opacity='0.1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
        }}></div>
        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-t from-transparent via-purple-500/10 to-transparent animate-pulse-slow"></div>
      </div>
      
      {/* Floating geometric shapes */}
      <div className="absolute top-10 left-10 w-32 h-32 border-2 border-cyan-400/30 rotate-45 animate-float"></div>
      <div className="absolute top-20 right-20 w-24 h-24 border-2 border-pink-400/30 rotate-12 animate-float-delay"></div>
      <div className="absolute bottom-10 left-20 w-28 h-28 border-2 border-yellow-400/30 -rotate-45 animate-float-slow"></div>
      <div className="absolute bottom-20 right-10 w-20 h-20 border-2 border-green-400/30 rotate-90 animate-float-delay-slow"></div>
      
      {/* Unique header with animated border */}
      <div className="relative z-10 mb-12 text-center animate-slide-down">
        <div className="relative">
          <div className="absolute inset-0 bg-gradient-to-r from-cyan-500 via-purple-500 to-pink-500 rounded-3xl blur-xl opacity-50 animate-pulse-slow"></div>
          <div className="relative bg-slate-800/80 backdrop-blur-2xl rounded-3xl p-10 shadow-2xl border border-purple-500/30">
            <div className="absolute -top-2 -left-2 w-4 h-4 bg-cyan-400 rounded-full animate-pulse"></div>
            <div className="absolute -top-2 -right-2 w-4 h-4 bg-pink-400 rounded-full animate-pulse" style={{animationDelay: '0.5s'}}></div>
            <div className="absolute -bottom-2 -left-2 w-4 h-4 bg-yellow-400 rounded-full animate-pulse" style={{animationDelay: '1s'}}></div>
            <div className="absolute -bottom-2 -right-2 w-4 h-4 bg-green-400 rounded-full animate-pulse" style={{animationDelay: '1.5s'}}></div>
            
            <h1 className="text-5xl md:text-6xl font-black mb-4 tracking-tight bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-400 bg-clip-text text-transparent animate-gradient-shift">
              Task Management System
            </h1>
            <p className="text-xl text-gray-300 max-w-2xl animate-fade-in-delay">
              Streamline your workflow with our integrated employee and administrative portals.
            </p>
          </div>
        </div>
      </div>

      {/* Unique card layout with diagonal split */}
      <div className="relative z-10 max-w-5xl w-full animate-slide-up">
        <div className="relative bg-slate-800/60 backdrop-blur-2xl rounded-3xl shadow-2xl overflow-hidden border border-purple-500/30 transform transition-all duration-500 hover:scale-[1.02] hover:shadow-purple-500/50">
          
          {/* Diagonal divider */}
          <div className="absolute inset-0 flex">
            <div className="flex-1 bg-gradient-to-br from-cyan-500/10 to-transparent"></div>
            <div className="w-px bg-gradient-to-b from-transparent via-purple-500/50 to-transparent"></div>
            <div className="flex-1 bg-gradient-to-bl from-pink-500/10 to-transparent"></div>
          </div>
          
          <div className="relative flex flex-col md:flex-row">
            {/* Employee Portal - Unique hexagon design */}
            <div className="flex-1 p-12 flex flex-col items-center text-center group hover:bg-cyan-500/5 transition-all duration-500">
              <div className="relative mb-8">
                <div className="absolute inset-0 bg-cyan-400/20 blur-xl rounded-full animate-pulse"></div>
                <div className="relative w-24 h-24 bg-gradient-to-br from-cyan-400 to-blue-500 clip-hexagon flex items-center justify-center transform rotate-0 group-hover:rotate-180 transition-transform duration-700 shadow-2xl group-hover:shadow-cyan-400/50">
                  <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
              </div>
              
              <div className="space-y-4">
                <h2 className="text-3xl font-bold text-cyan-300 group-hover:text-cyan-200 transition-colors">Employee Portal</h2>
                <p className="text-gray-400 leading-relaxed group-hover:text-gray-300 transition-colors">
                  Access your personalized workspace, manage assigned tasks, track performance, and mark daily attendance.
                </p>
              </div>
              
              <Link 
                href="/login" 
                className="mt-8 px-8 py-4 bg-gradient-to-r from-cyan-500 to-blue-500 text-white font-bold rounded-full hover:from-cyan-400 hover:to-blue-400 transform transition-all duration-300 hover:scale-105 hover:shadow-xl hover:shadow-cyan-400/50 active:scale-95"
              >
                Enter Employee Dashboard
              </Link>
            </div>

            {/* Admin Portal - Unique diamond design */}
            <div className="flex-1 p-12 flex flex-col items-center text-center group hover:bg-pink-500/5 transition-all duration-500">
              <div className="relative mb-8">
                <div className="absolute inset-0 bg-pink-400/20 blur-xl rounded-full animate-pulse" style={{animationDelay: '1s'}}></div>
                <div className="relative w-24 h-24 bg-gradient-to-br from-pink-400 to-purple-500 clip-diamond flex items-center justify-center transform rotate-45 group-hover:rotate-225 transition-transform duration-700 shadow-2xl group-hover:shadow-pink-400/50">
                  <svg className="w-12 h-12 text-white transform -rotate-45" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                </div>
              </div>
              
              <div className="space-y-4">
                <h2 className="text-3xl font-bold text-pink-300 group-hover:text-pink-200 transition-colors">Admin Portal</h2>
                <p className="text-gray-400 leading-relaxed group-hover:text-gray-300 transition-colors">
                  Complete administrative control. Manage departments, oversee employee accounts, and monitor organization-wide tasks.
                </p>
              </div>
              
              <Link 
                href="/admin" 
                className="mt-8 px-8 py-4 bg-gradient-to-r from-pink-500 to-purple-500 text-white font-bold rounded-full hover:from-pink-400 hover:to-purple-400 transform transition-all duration-300 hover:scale-105 hover:shadow-xl hover:shadow-pink-400/50 active:scale-95"
              >
                Enter Administrative Suite
              </Link>
            </div>
          </div>
        </div>
      </div>
      
      {/* Unique footer with animated dots */}
      <div className="relative z-10 mt-12 text-center">
        <div className="flex items-center justify-center space-x-2 mb-4">
          <div className="w-2 h-2 bg-cyan-400 rounded-full animate-pulse"></div>
          <div className="w-2 h-2 bg-purple-400 rounded-full animate-pulse" style={{animationDelay: '0.3s'}}></div>
          <div className="w-2 h-2 bg-pink-400 rounded-full animate-pulse" style={{animationDelay: '0.6s'}}></div>
        </div>
        <div className="text-gray-400 text-sm font-medium animate-fade-in-delay-2">
          &copy; {new Date().getFullYear()} Task Management System &bull; Enterprise Version 2.0
        </div>
      </div>
    </div>
  );
}
