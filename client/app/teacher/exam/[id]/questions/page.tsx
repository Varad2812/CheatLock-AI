'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { supabase, Exam, Question } from '../../../../../utils/supabase';
import toast from 'react-hot-toast';
import { Plus, Trash2, Save, ArrowLeft, ToggleLeft, ToggleRight } from 'lucide-react';
import Link from 'next/link';

export default function ManageQuestions() {
  const router = useRouter();
  const params = useParams();
  const examId = params.id as string;

  const [exam, setExam] = useState<Exam | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [newQuestion, setNewQuestion] = useState({
    question_text: '',
    question_type: 'multiple_choice',
    options: ['', '', '', ''],
    correct_answer: '',
    marks: 10,
  });

  useEffect(() => {
    loadData();
  }, [examId]);

  async function loadData() {
    try {
      const { data: examData, error: examError } = await supabase
        .from('exams')
        .select('*')
        .eq('id', examId)
        .single();

      if (examError) throw examError;
      setExam(examData);

      const { data: questionsData, error: questionsError } = await supabase
        .from('questions')
        .select('*')
        .eq('exam_id', examId)
        .order('order_index');

      if (questionsError) throw questionsError;
      
      console.log('Questions loaded in teacher page:', questionsData?.length || 0);
      console.log('Questions data:', questionsData);
      
      setQuestions(questionsData || []);
    } catch (error: any) {
      toast.error(error.message);
      console.error('Load data error:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleAddQuestion(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);

    try {
      const { error } = await supabase.from('questions').insert({
        exam_id: examId,
        question_text: newQuestion.question_text,
        question_type: newQuestion.question_type,
        options: newQuestion.question_type === 'multiple_choice' ? newQuestion.options : null,
        correct_answer: newQuestion.correct_answer,
        marks: newQuestion.marks,
        order_index: questions.length,
      });

      if (error) {
        console.error('Insert error:', error);
        throw error;
      }

      console.log('Question inserted successfully');
      toast.success('Question added!');
      
      setNewQuestion({
        question_text: '',
        question_type: 'multiple_choice',
        options: ['', '', '', ''],
        correct_answer: '',
        marks: 10,
      });
      
      // Reload questions
      await loadData();
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleDeleteQuestion(questionId: string) {
    if (!confirm('Delete this question?')) return;

    try {
      const { error } = await supabase.from('questions').delete().eq('id', questionId);

      if (error) throw error;

      toast.success('Question deleted');
      loadData();
    } catch (error: any) {
      toast.error(error.message);
    }
  }

  async function toggleExamActive() {
    if (!exam) return;

    try {
      const { error } = await supabase
        .from('exams')
        .update({ is_active: !exam.is_active })
        .eq('id', examId);

      if (error) throw error;

      toast.success(exam.is_active ? 'Exam deactivated' : 'Exam activated!');
      loadData();
    } catch (error: any) {
      toast.error(error.message);
    }
  }

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 p-6">
      <div className="max-w-5xl mx-auto">
        <Link
          href="/teacher/dashboard"
          className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Dashboard
        </Link>

        <div className="bg-white rounded-2xl shadow-xl p-8 mb-6">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h1 className="text-3xl font-bold mb-2">{exam?.title}</h1>
              <p className="text-gray-600">{exam?.description}</p>
            </div>
            <button
              onClick={toggleExamActive}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl font-semibold transition-all ${
                exam?.is_active
                  ? 'bg-green-100 text-green-700 hover:bg-green-200'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {exam?.is_active ? (
                <>
                  <ToggleRight className="w-5 h-5" />
                  Active
                </>
              ) : (
                <>
                  <ToggleLeft className="w-5 h-5" />
                  Inactive
                </>
              )}
            </button>
          </div>

          <div className="grid grid-cols-3 gap-4 text-sm">
            <div className="bg-blue-50 p-3 rounded-lg">
              <p className="text-gray-600">Duration</p>
              <p className="font-bold text-lg">{exam?.duration_minutes} min</p>
            </div>
            <div className="bg-purple-50 p-3 rounded-lg">
              <p className="text-gray-600">Total Marks</p>
              <p className="font-bold text-lg">{exam?.total_marks}</p>
            </div>
            <div className="bg-pink-50 p-3 rounded-lg">
              <p className="text-gray-600">Questions</p>
              <p className="font-bold text-lg">{questions.length}</p>
            </div>
          </div>
        </div>

        {/* Existing Questions */}
        <div className="bg-white rounded-2xl shadow-xl p-8 mb-6">
          <h2 className="text-2xl font-bold mb-6">Questions ({questions.length})</h2>

          {questions.length > 0 ? (
            <div className="space-y-4">
              {questions.map((q, idx) => (
                <div key={q.id} className="border border-gray-200 rounded-xl p-4 hover:border-blue-300 transition-colors">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-semibold text-lg">
                      {idx + 1}. {q.question_text}
                    </h3>
                    <button
                      onClick={() => handleDeleteQuestion(q.id)}
                      className="text-red-600 hover:text-red-700 p-2"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  {q.options && (
                    <div className="ml-6 space-y-1 text-sm">
                      {q.options.map((opt: string, i: number) => (
                        <div
                          key={i}
                          className={`${
                            opt === q.correct_answer ? 'text-green-600 font-semibold' : 'text-gray-600'
                          }`}
                        >
                          {String.fromCharCode(65 + i)}. {opt}
                          {opt === q.correct_answer && ' ✓'}
                        </div>
                      ))}
                    </div>
                  )}
                  <p className="text-sm text-gray-500 mt-2">Marks: {q.marks}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-8">No questions yet. Add your first question below!</p>
          )}
        </div>

        {/* Add New Question */}
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <h2 className="text-2xl font-bold mb-6">Add New Question</h2>

          <form onSubmit={handleAddQuestion} className="space-y-6">
            <div>
              <label className="block text-sm font-semibold mb-2">Question Text</label>
              <textarea
                value={newQuestion.question_text}
                onChange={(e) => setNewQuestion({ ...newQuestion, question_text: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                rows={3}
                required
                placeholder="Enter your question here..."
              />
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold mb-2">Question Type</label>
                <select
                  value={newQuestion.question_type}
                  onChange={(e) =>
                    setNewQuestion({ ...newQuestion, question_type: e.target.value })
                  }
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500"
                >
                  <option value="multiple_choice">Multiple Choice</option>
                  <option value="text">Text Answer</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2">Marks</label>
                <input
                  type="number"
                  value={newQuestion.marks}
                  onChange={(e) =>
                    setNewQuestion({ ...newQuestion, marks: parseInt(e.target.value) })
                  }
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500"
                  min="1"
                  required
                />
              </div>
            </div>

            {newQuestion.question_type === 'multiple_choice' && (
              <>
                <div>
                  <label className="block text-sm font-semibold mb-2">Options</label>
                  <div className="space-y-3">
                    {newQuestion.options.map((opt, idx) => (
                      <input
                        key={idx}
                        type="text"
                        value={opt}
                        onChange={(e) => {
                          const newOpts = [...newQuestion.options];
                          newOpts[idx] = e.target.value;
                          setNewQuestion({ ...newQuestion, options: newOpts });
                        }}
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500"
                        placeholder={`Option ${String.fromCharCode(65 + idx)}`}
                        required
                      />
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold mb-2">Correct Answer</label>
                  <select
                    value={newQuestion.correct_answer}
                    onChange={(e) =>
                      setNewQuestion({ ...newQuestion, correct_answer: e.target.value })
                    }
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500"
                    required
                  >
                    <option value="">Select correct answer</option>
                    {newQuestion.options.map((opt, idx) => (
                      <option key={idx} value={opt}>
                        {String.fromCharCode(65 + idx)}. {opt}
                      </option>
                    ))}
                  </select>
                </div>
              </>
            )}

            <button
              type="submit"
              disabled={saving}
              className="w-full py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:from-blue-700 hover:to-purple-700 disabled:opacity-50 font-semibold flex items-center justify-center gap-2"
            >
              {saving ? (
                'Adding...'
              ) : (
                <>
                  <Plus className="w-5 h-5" />
                  Add Question
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
