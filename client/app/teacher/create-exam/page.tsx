'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../../../utils/supabase';
import toast from 'react-hot-toast';

export default function CreateExam() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [classes, setClasses] = useState<any[]>([]);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    duration_minutes: 60,
    total_marks: 100,
    class_id: '',
  });

  useEffect(() => {
    loadClasses();
  }, []);

  async function loadClasses() {
    try {
      const { data, error } = await supabase
        .from('classes')
        .select('*')
        .order('name');

      if (error) throw error;
      setClasses(data || []);
    } catch (error: any) {
      console.error('Error loading classes:', error);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('exams')
        .insert({
          ...formData,
          teacher_id: user.id,
          class_id: formData.class_id || null,
        })
        .select()
        .single();

      if (error) throw error;

      toast.success('Exam created successfully!');
      router.push(`/teacher/exam/${data.id}/questions`);
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">Create New Exam</h1>

        <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-lg p-8 space-y-6">
          <div>
            <label className="block text-sm font-medium mb-2">Exam Title</label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              rows={4}
            />
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium mb-2">Duration (minutes)</label>
              <input
                type="number"
                value={formData.duration_minutes}
                onChange={(e) =>
                  setFormData({ ...formData, duration_minutes: parseInt(e.target.value) })
                }
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                min="1"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Total Marks</label>
              <input
                type="number"
                value={formData.total_marks}
                onChange={(e) =>
                  setFormData({ ...formData, total_marks: parseInt(e.target.value) })
                }
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                min="1"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              Assign to Class (Optional)
            </label>
            <select
              value={formData.class_id}
              onChange={(e) => setFormData({ ...formData, class_id: e.target.value })}
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Students (No Class)</option>
              {classes.map((cls) => (
                <option key={cls.id} value={cls.id}>
                  {cls.name}
                </option>
              ))}
            </select>
            <p className="text-xs text-gray-500 mt-1">
              Only students in this class will see the exam
            </p>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm text-blue-800">
              <strong>ℹ️ Proctoring Settings:</strong> Proctoring behavior (audio/gaze sensitivity, violation threshold) 
              is controlled by system-wide settings in the Admin Dashboard. Contact your administrator to adjust these settings.
            </p>
          </div>

          <div className="flex gap-4">
            <button
              type="button"
              onClick={() => router.back()}
              className="px-6 py-3 border rounded-lg hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? 'Creating...' : 'Create Exam'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
