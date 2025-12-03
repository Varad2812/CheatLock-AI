'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../utils/supabase';
import Link from 'next/link';
import { Shield, Eye, Mic, Keyboard, Camera, AlertTriangle, BarChart, Lock } from 'lucide-react';

export default function Home() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkUser();
  }, []);

  async function checkUser() {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (session) {
      const { data: user } = await supabase
        .from('users')
        .select('role')
        .eq('id', session.user.id)
        .single();

      if (user) {
        switch (user.role) {
          case 'admin':
            router.push('/admin/dashboard');
            break;
          case 'teacher':
            router.push('/teacher/dashboard');
            break;
          case 'examiner':
            router.push('/examiner/dashboard');
            break;
          case 'student':
            router.push('/student/dashboard');
            break;
        }
      }
    }
    
    setLoading(false);
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-purple-50">
        <div className="flex flex-col items-center gap-4">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-gray-600 font-medium">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Hero Section */}
      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 bg-blue-100 text-blue-700 px-4 py-2 rounded-full text-sm font-medium mb-6">
            <Shield className="w-4 h-4" />
            AI-Powered Security
          </div>
          
          <h1 className="text-6xl md:text-7xl font-bold mb-6 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
            CheatLock AI
          </h1>
          
          <p className="text-xl md:text-2xl text-gray-600 mb-8 max-w-3xl mx-auto">
            Next-generation examination platform with multi-layer AI monitoring
            to ensure academic integrity
          </p>
          
          <div className="flex gap-4 justify-center flex-wrap">
            <Link
              href="/auth/login"
              className="px-8 py-4 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 font-semibold"
            >
              Sign In
            </Link>
            <Link
              href="/auth/register"
              className="px-8 py-4 bg-white text-gray-800 rounded-xl hover:bg-gray-50 transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 font-semibold border border-gray-200"
            >
              Get Started Free
            </Link>
          </div>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
          <div className="bg-white p-6 rounded-2xl shadow-lg hover:shadow-xl transition-all border border-gray-100">
            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mb-4">
              <Eye className="w-6 h-6 text-blue-600" />
            </div>
            <h3 className="text-lg font-bold mb-2">AI Gaze Tracking</h3>
            <p className="text-gray-600 text-sm">468-point facial detection with MediaPipe</p>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-lg hover:shadow-xl transition-all border border-gray-100">
            <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center mb-4">
              <Mic className="w-6 h-6 text-purple-600" />
            </div>
            <h3 className="text-lg font-bold mb-2">Voice Monitoring</h3>
            <p className="text-gray-600 text-sm">Real-time audio analysis & speech detection</p>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-lg hover:shadow-xl transition-all border border-gray-100">
            <div className="w-12 h-12 bg-pink-100 rounded-xl flex items-center justify-center mb-4">
              <Keyboard className="w-6 h-6 text-pink-600" />
            </div>
            <h3 className="text-lg font-bold mb-2">Keystroke Analysis</h3>
            <p className="text-gray-600 text-sm">Pattern detection & paste prevention</p>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-lg hover:shadow-xl transition-all border border-gray-100">
            <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center mb-4">
              <Camera className="w-6 h-6 text-green-600" />
            </div>
            <h3 className="text-lg font-bold mb-2">Live Streaming</h3>
            <p className="text-gray-600 text-sm">WebRTC examiner camera access</p>
          </div>
        </div>

        {/* Stats Section */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-3xl p-12 text-white mb-16">
          <div className="grid md:grid-cols-3 gap-8 text-center">
            <div>
              <div className="text-5xl font-bold mb-2">11</div>
              <div className="text-blue-100">Violation Types</div>
            </div>
            <div>
              <div className="text-5xl font-bold mb-2">99%</div>
              <div className="text-blue-100">Detection Accuracy</div>
            </div>
            <div>
              <div className="text-5xl font-bold mb-2">24/7</div>
              <div className="text-blue-100">Real-time Monitoring</div>
            </div>
          </div>
        </div>

        {/* How It Works */}
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold mb-4">How It Works</h2>
          <p className="text-gray-600 text-lg mb-12">Simple, secure, and effective</p>
          
          <div className="grid md:grid-cols-3 gap-8">
            <div className="relative">
              <div className="w-16 h-16 bg-blue-600 text-white rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">
                1
              </div>
              <h3 className="text-xl font-bold mb-2">Create Exam</h3>
              <p className="text-gray-600">Teachers create exams with custom proctoring settings</p>
            </div>

            <div className="relative">
              <div className="w-16 h-16 bg-purple-600 text-white rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">
                2
              </div>
              <h3 className="text-xl font-bold mb-2">AI Monitoring</h3>
              <p className="text-gray-600">Multi-layer AI tracks gaze, audio, and system behavior</p>
            </div>

            <div className="relative">
              <div className="w-16 h-16 bg-pink-600 text-white rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">
                3
              </div>
              <h3 className="text-xl font-bold mb-2">Get Reports</h3>
              <p className="text-gray-600">Comprehensive reports with evidence and risk scores</p>
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="bg-white rounded-3xl p-12 text-center shadow-xl border border-gray-100">
          <Lock className="w-16 h-16 text-blue-600 mx-auto mb-6" />
          <h2 className="text-3xl font-bold mb-4">Ready to Secure Your Exams?</h2>
          <p className="text-gray-600 text-lg mb-8 max-w-2xl mx-auto">
            Join thousands of institutions using CheatLock AI to maintain academic integrity
          </p>
          <Link
            href="/auth/register"
            className="inline-block px-10 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 font-semibold text-lg"
          >
            Start Free Trial
          </Link>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-gray-200 py-8 mt-16">
        <div className="container mx-auto px-4 text-center text-gray-600">
          <p>© 2025 CheatLock AI. Built with Next.js, Supabase & MediaPipe.</p>
        </div>
      </footer>
    </main>
  );
}
