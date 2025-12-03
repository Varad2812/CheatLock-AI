'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase, Exam, ExamAttempt } from '../../../utils/supabase';
import toast from 'react-hot-toast';
import { FileText, Clock, CheckCircle, XCircle, BookOpen, TrendingUp, Award, AlertCircle } from 'lucide-react';
import Link from 'next/link';

export default function StudentDashboard() {
  const router = useRouter();
  const [availableExams, setAvailableExams] = useState<Exam[]>([]);
  const [attempts, setAttempts] = useState<ExamAttempt[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuth();
    loadData();
  }, []);

  async function checkAuth() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      router.push('/auth/login');
      return;
    }

    const { data: userData } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();

    if (userData?.role !== 'student') {
      router.push('/');
    }
  }

  async function loadData() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Get student's class
      const { data: userData } = await supabase
        .from('users')
        .select('class_id')
        .eq('id', user.id)
        .single();

      // Load available exams (for student's class OR no class assigned)
      let examsQuery = supabase
        .from('exams')
        .select('*')
        .eq('is_active', true);

      // If student has a class, show exams for that class OR exams with no class
      if (userData?.class_id) {
        examsQuery = examsQuery.or(`class_id.eq.${userData.class_id},class_id.is.null`);
      } else {
        // If student has no class, only show exams with no class assigned
        examsQuery = examsQuery.is('class_id', null);
      }

      const { data: examsData, error: examsError } = await examsQuery.order('created_at', { ascending: false });

      if (examsError) throw examsError;

      // Load student's attempts
      const { data: attemptsData, error: attemptsError } = await supabase
        .from('exam_attempts')
        .select('*, exam:exams(*)')
        .eq('student_id', user.id)
        .order('created_at', { ascending: false });

      if (attemptsError) throw attemptsError;

      // Filter out exams already attempted
      const attemptedExamIds = attemptsData.map((a) => a.exam_id);
      const available = examsData.filter((e) => !attemptedExamIds.includes(e.id));

      setAvailableExams(available);
      setAttempts(attemptsData);
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push('/');
  }

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  const completedAttempts = attempts.filter(a => a.status === 'completed');
  const averageScore = completedAttempts.length > 0
    ? completedAttempts.reduce((sum, a) => sum + (a.final_score || 0), 0) / completedAttempts.length
    : 0;
  const totalViolations = attempts.reduce((sum, a) => sum + a.violation_count, 0);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Student Dashboard
            </h1>
            <p className="text-sm text-gray-600 mt-1">Welcome back! Ready to take an exam?</p>
          </div>
          <button
            onClick={handleLogout}
            className="px-4 py-2 text-gray-600 hover:text-gray-900 transition-colors"
          >
            Logout
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Stats Cards */}
        <div className="grid md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
            <div className="flex items-center justify-between mb-2">
              <BookOpen className="w-8 h-8 text-blue-600" />
            </div>
            <p className="text-gray-600 text-sm">Available Exams</p>
            <p className="text-3xl font-bold text-gray-900">{availableExams.length}</p>
          </div>

          <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
            <div className="flex items-center justify-between mb-2">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
            <p className="text-gray-600 text-sm">Completed</p>
            <p className="text-3xl font-bold text-gray-900">{completedAttempts.length}</p>
          </div>

          <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
            <div className="flex items-center justify-between mb-2">
              <TrendingUp className="w-8 h-8 text-purple-600" />
            </div>
            <p className="text-gray-600 text-sm">Average Score</p>
            <p className="text-3xl font-bold text-gray-900">{averageScore.toFixed(0)}%</p>
          </div>

          <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
            <div className="flex items-center justify-between mb-2">
              <AlertCircle className="w-8 h-8 text-orange-600" />
            </div>
            <p className="text-gray-600 text-sm">Total Violations</p>
            <p className="text-3xl font-bold text-gray-900">{totalViolations}</p>
          </div>
        </div>
        {/* Available Exams */}
        <section className="mb-12">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold">Available Exams</h2>
            {availableExams.length > 0 && (
              <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium">
                {availableExams.length} exam{availableExams.length !== 1 ? 's' : ''}
              </span>
            )}
          </div>

          {availableExams.length > 0 ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {availableExams.map((exam) => (
                <div key={exam.id} className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100 hover:shadow-xl transition-all">
                  <div className="flex items-start justify-between mb-3">
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-500 rounded-xl flex items-center justify-center">
                      <FileText className="w-6 h-6 text-white" />
                    </div>
                    <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">
                      Active
                    </span>
                  </div>
                  
                  <h3 className="text-xl font-bold mb-2">{exam.title}</h3>
                  <p className="text-gray-600 mb-4 line-clamp-2 text-sm">{exam.description}</p>

                  <div className="space-y-2 mb-4">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Clock className="w-4 h-4 text-blue-600" />
                      <span>{exam.duration_minutes} minutes</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Award className="w-4 h-4 text-purple-600" />
                      <span>{exam.total_marks} marks</span>
                    </div>
                  </div>

                  <Link
                    href={`/student/exam/${exam.id}`}
                    className="block w-full py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white text-center rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all font-semibold"
                  >
                    Start Exam
                  </Link>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-16 bg-white rounded-2xl border-2 border-dashed border-gray-200">
              <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <BookOpen className="w-10 h-10 text-gray-400" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No Exams Available</h3>
              <p className="text-gray-600 mb-4">Check back later for new exams</p>
            </div>
          )}
        </section>

        {/* Past Attempts */}
        <section>
          <h2 className="text-2xl font-bold mb-6">Exam History</h2>

          {attempts.length > 0 ? (
            <div className="bg-white rounded-2xl shadow-lg overflow-hidden border border-gray-100">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
                    <tr>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        Exam
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        Score
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        Violations
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        Date
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {attempts.map((attempt) => (
                      <tr key={attempt.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4 font-medium text-gray-900">{attempt.exam?.title || 'Unknown Exam'}</td>
                        <td className="px-6 py-4">
                          <span
                            className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium ${
                              attempt.status === 'completed'
                                ? 'bg-green-100 text-green-800'
                                : attempt.status === 'ended'
                                ? 'bg-red-100 text-red-800'
                                : 'bg-yellow-100 text-yellow-800'
                            }`}
                          >
                            {attempt.status === 'completed' ? (
                              <CheckCircle className="w-3 h-3" />
                            ) : (
                              <XCircle className="w-3 h-3" />
                            )}
                            {attempt.status}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          {attempt.final_score !== null && attempt.exam ? (
                            <span className="font-semibold text-gray-900">
                              {attempt.final_score}/{attempt.exam.total_marks}
                            </span>
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <span
                            className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold ${
                              attempt.violation_count === 0
                                ? 'bg-green-100 text-green-700'
                                : attempt.violation_count < 3
                                ? 'bg-yellow-100 text-yellow-700'
                                : 'bg-red-100 text-red-700'
                            }`}
                          >
                            {attempt.violation_count}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600">
                          {new Date(attempt.started_at).toLocaleDateString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="text-center py-16 bg-white rounded-2xl border-2 border-dashed border-gray-200">
              <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <FileText className="w-10 h-10 text-gray-400" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No Exam History</h3>
              <p className="text-gray-600">Your completed exams will appear here</p>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
