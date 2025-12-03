'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase, Exam } from '../../../utils/supabase';
import toast from 'react-hot-toast';
import { Plus, FileText, Users, BarChart, Edit, Trash2, Power } from 'lucide-react';
import Link from 'next/link';

export default function TeacherDashboard() {
  const router = useRouter();
  const [exams, setExams] = useState<Exam[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingExam, setEditingExam] = useState<Exam | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);

  useEffect(() => {
    checkAuth();
    loadExams();
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

    if (userData?.role !== 'teacher' && userData?.role !== 'admin') {
      router.push('/');
    }
  }

  async function loadExams() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('exams')
        .select('*')
        .eq('teacher_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setExams(data);
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

  async function toggleExamActive(examId: string, currentStatus: boolean) {
    try {
      const { error } = await supabase
        .from('exams')
        .update({ is_active: !currentStatus })
        .eq('id', examId);

      if (error) throw error;

      toast.success(currentStatus ? 'Exam deactivated' : 'Exam activated');
      loadExams();
    } catch (error: any) {
      toast.error(error.message);
    }
  }

  async function handleDeleteExam(examId: string, examTitle: string) {
    if (!confirm(`Delete "${examTitle}"? This will also delete all questions and attempts. This cannot be undone.`)) {
      return;
    }

    try {
      const { error } = await supabase
        .from('exams')
        .delete()
        .eq('id', examId);

      if (error) throw error;

      toast.success('Exam deleted');
      loadExams();
    } catch (error: any) {
      toast.error(error.message);
    }
  }

  async function handleEditExam(e: React.FormEvent) {
    e.preventDefault();
    if (!editingExam) return;

    try {
      const { error } = await supabase
        .from('exams')
        .update({
          title: editingExam.title,
          description: editingExam.description,
          duration_minutes: editingExam.duration_minutes,
          total_marks: editingExam.total_marks,
        })
        .eq('id', editingExam.id);

      if (error) throw error;

      toast.success('Exam updated!');
      setShowEditModal(false);
      setEditingExam(null);
      loadExams();
    } catch (error: any) {
      toast.error(error.message);
    }
  }

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold">Teacher Dashboard</h1>
          <button
            onClick={handleLogout}
            className="px-4 py-2 text-gray-600 hover:text-gray-800"
          >
            Logout
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Actions */}
        <div className="mb-8">
          <Link
            href="/teacher/create-exam"
            className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <Plus className="w-5 h-5" />
            Create New Exam
          </Link>
        </div>

        {/* Exams Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {exams.map((exam) => (
            <div key={exam.id} className="bg-white rounded-lg shadow-lg p-6">
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-xl font-semibold">{exam.title}</h3>
                <span
                  className={`px-3 py-1 rounded-full text-sm ${
                    exam.is_active
                      ? 'bg-green-100 text-green-800'
                      : 'bg-gray-100 text-gray-800'
                  }`}
                >
                  {exam.is_active ? 'Active' : 'Inactive'}
                </span>
              </div>

              <p className="text-gray-600 mb-4 line-clamp-2">{exam.description}</p>

              <div className="space-y-2 mb-4 text-sm text-gray-600">
                <div>Duration: {exam.duration_minutes} minutes</div>
                <div>Total Marks: {exam.total_marks}</div>
              </div>

              <div className="flex gap-2 mb-3">
                <Link
                  href={`/teacher/exam/${exam.id}/questions`}
                  className="flex-1 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 flex items-center justify-center gap-2 text-sm"
                >
                  <FileText className="w-4 h-4" />
                  Questions
                </Link>
                <Link
                  href={`/teacher/exam/${exam.id}/reports`}
                  className="flex-1 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 flex items-center justify-center gap-2 text-sm"
                >
                  <BarChart className="w-4 h-4" />
                  Reports
                </Link>
              </div>

              <div className="flex gap-2 pt-3 border-t">
                <button
                  onClick={() => toggleExamActive(exam.id, exam.is_active)}
                  className={`flex-1 py-2 rounded flex items-center justify-center gap-2 text-sm ${
                    exam.is_active
                      ? 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                      : 'bg-green-100 text-green-700 hover:bg-green-200'
                  }`}
                  title={exam.is_active ? 'Deactivate' : 'Activate'}
                >
                  <Power className="w-4 h-4" />
                  {exam.is_active ? 'Deactivate' : 'Activate'}
                </button>
                <button
                  onClick={() => {
                    setEditingExam(exam);
                    setShowEditModal(true);
                  }}
                  className="p-2 text-blue-600 hover:bg-blue-50 rounded"
                  title="Edit"
                >
                  <Edit className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleDeleteExam(exam.id, exam.title)}
                  className="p-2 text-red-600 hover:bg-red-50 rounded"
                  title="Delete"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>

        {exams.length === 0 && (
          <div className="text-center py-12">
            <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-600 mb-2">No exams yet</h3>
            <p className="text-gray-500 mb-4">Create your first exam to get started</p>
            <Link
              href="/teacher/create-exam"
              className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              <Plus className="w-5 h-5" />
              Create Exam
            </Link>
          </div>
        )}
      </main>

      {/* Edit Exam Modal */}
      {showEditModal && editingExam && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-8 max-h-[90vh] overflow-y-auto">
            <h2 className="text-2xl font-bold mb-6">Edit Exam</h2>
            
            <form onSubmit={handleEditExam} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Exam Title</label>
                <input
                  type="text"
                  value={editingExam.title}
                  onChange={(e) => setEditingExam({ ...editingExam, title: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Description</label>
                <textarea
                  value={editingExam.description || ''}
                  onChange={(e) => setEditingExam({ ...editingExam, description: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  rows={4}
                />
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Duration (minutes)</label>
                  <input
                    type="number"
                    value={editingExam.duration_minutes}
                    onChange={(e) => setEditingExam({ ...editingExam, duration_minutes: parseInt(e.target.value) })}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    min="1"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Total Marks</label>
                  <input
                    type="number"
                    value={editingExam.total_marks}
                    onChange={(e) => setEditingExam({ ...editingExam, total_marks: parseInt(e.target.value) })}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    min="1"
                    required
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowEditModal(false);
                    setEditingExam(null);
                  }}
                  className="flex-1 px-4 py-2 border rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
