'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabase, ExamAttempt, Violation } from '../../../../../utils/supabase';
import { ReportGenerator } from '../../../../../utils/reportGenerator';
import toast from 'react-hot-toast';
import { Download, Eye, AlertTriangle, CheckCircle, XCircle, FileText } from 'lucide-react';

interface AttemptWithDetails extends ExamAttempt {
  student: any;
  violations: Violation[];
}

export default function ExamReports() {
  const params = useParams();
  const router = useRouter();
  const examId = params.id as string;

  const [exam, setExam] = useState<any>(null);
  const [attempts, setAttempts] = useState<AttemptWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [generatingReport, setGeneratingReport] = useState<string | null>(null);
  const [selectedAttempt, setSelectedAttempt] = useState<AttemptWithDetails | null>(null);

  useEffect(() => {
    loadData();
  }, [examId]);

  async function loadData() {
    try {
      // Load exam
      const { data: examData, error: examError } = await supabase
        .from('exams')
        .select('*')
        .eq('id', examId)
        .single();

      if (examError) throw examError;
      setExam(examData);

      // Load attempts with student details
      const { data: attemptsData, error: attemptsError } = await supabase
        .from('exam_attempts')
        .select(`
          *,
          student:users!exam_attempts_student_id_fkey(id, full_name, email)
        `)
        .eq('exam_id', examId)
        .order('started_at', { ascending: false });

      if (attemptsError) throw attemptsError;

      // Load violations for each attempt
      const attemptsWithViolations = await Promise.all(
        attemptsData.map(async (attempt) => {
          const { data: violations } = await supabase
            .from('violations')
            .select('*')
            .eq('attempt_id', attempt.id)
            .order('detected_at');

          return {
            ...attempt,
            violations: violations || [],
          };
        })
      );

      setAttempts(attemptsWithViolations);
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  }

  async function generateReport(attempt: AttemptWithDetails) {
    setGeneratingReport(attempt.id);
    
    try {
      // Calculate statistics
      const violationTypes: Record<string, number> = {};
      attempt.violations.forEach((v) => {
        violationTypes[v.violation_type] = (violationTypes[v.violation_type] || 0) + 1;
      });

      const highSeverityCount = attempt.violations.filter((v) => v.severity > 0.7).length;
      
      // Calculate risk score
      let riskScore = attempt.violations.length * 0.15;
      attempt.violations.forEach((v) => riskScore += v.severity * 0.2);
      riskScore += highSeverityCount * 0.25;
      riskScore = Math.min(riskScore, 1.0);

      const reportData = {
        attempt,
        student: attempt.student,
        exam,
        violations: attempt.violations,
        statistics: {
          total_violations: attempt.violations.length,
          high_severity_violations: highSeverityCount,
          violation_types: violationTypes,
          cheating_risk_score: riskScore,
        },
      };

      // Generate PDF
      const generator = new ReportGenerator();
      const pdfBlob = generator.generatePDF(reportData);

      // Download PDF
      const url = URL.createObjectURL(pdfBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `exam-report-${attempt.student.full_name}-${new Date().toISOString().split('T')[0]}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast.success('Report generated successfully!');
    } catch (error: any) {
      console.error('Report generation error:', error);
      toast.error('Failed to generate report');
    } finally {
      setGeneratingReport(null);
    }
  }

  const getRiskColor = (score: number) => {
    if (score < 0.3) return 'text-green-600 bg-green-50';
    if (score < 0.7) return 'text-orange-600 bg-orange-50';
    return 'text-red-600 bg-red-50';
  };

  const getRiskLabel = (score: number) => {
    if (score < 0.3) return 'Low Risk';
    if (score < 0.7) return 'Medium Risk';
    return 'High Risk';
  };

  const getStatusIcon = (status: string, autoEnded: boolean) => {
    if (autoEnded) return <XCircle className="w-5 h-5 text-red-600" />;
    if (status === 'completed') return <CheckCircle className="w-5 h-5 text-green-600" />;
    return <AlertTriangle className="w-5 h-5 text-yellow-600" />;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading reports...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={() => router.push('/teacher/dashboard')}
            className="text-blue-600 hover:text-blue-700 mb-4"
          >
            ← Back to Dashboard
          </button>
          <h1 className="text-3xl font-bold mb-2">{exam?.title} - Reports</h1>
          <p className="text-gray-600">
            {attempts.length} attempt{attempts.length !== 1 ? 's' : ''} recorded
          </p>
        </div>

        {/* Summary Stats */}
        <div className="grid md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-sm text-gray-600 mb-1">Total Attempts</div>
            <div className="text-3xl font-bold">{attempts.length}</div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-sm text-gray-600 mb-1">Completed</div>
            <div className="text-3xl font-bold text-green-600">
              {attempts.filter((a) => a.status === 'completed').length}
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-sm text-gray-600 mb-1">Auto-Ended</div>
            <div className="text-3xl font-bold text-red-600">
              {attempts.filter((a) => a.auto_ended).length}
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-sm text-gray-600 mb-1">Avg Score</div>
            <div className="text-3xl font-bold text-blue-600">
              {attempts.length > 0
                ? Math.round(
                    attempts.reduce((sum, a) => sum + (a.final_score || 0), 0) / attempts.length
                  )
                : 0}
            </div>
          </div>
        </div>

        {/* Attempts Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Student
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Score
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Violations
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Risk Level
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Started
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {attempts.map((attempt) => {
                  const riskScore = attempt.cheating_risk_score || 0;
                  
                  return (
                    <tr key={attempt.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div className="font-medium">{attempt.student.full_name}</div>
                        <div className="text-sm text-gray-500">{attempt.student.email}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          {getStatusIcon(attempt.status, attempt.auto_ended)}
                          <span className="capitalize">{attempt.status}</span>
                        </div>
                        {attempt.auto_ended && (
                          <div className="text-xs text-red-600 mt-1">Auto-ended</div>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-semibold">
                          {attempt.final_score !== null ? `${attempt.final_score}/${exam.total_marks}` : 'N/A'}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className={`font-semibold ${
                          attempt.violations.length === 0 ? 'text-green-600' :
                          attempt.violations.length < 3 ? 'text-yellow-600' : 'text-red-600'
                        }`}>
                          {attempt.violations.length}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${getRiskColor(riskScore)}`}>
                          {getRiskLabel(riskScore)}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {new Date(attempt.started_at).toLocaleString()}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex gap-2">
                          <button
                            onClick={() => generateReport(attempt)}
                            disabled={generatingReport === attempt.id}
                            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 text-sm"
                          >
                            {generatingReport === attempt.id ? (
                              <>
                                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                Generating...
                              </>
                            ) : (
                              <>
                                <Download className="w-4 h-4" />
                                Report
                              </>
                            )}
                          </button>
                          {attempt.violations.length > 0 && (
                            <button
                              onClick={() => setSelectedAttempt(attempt)}
                              className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 text-sm"
                            >
                              <Eye className="w-4 h-4" />
                              Evidence ({attempt.violations.length})
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {attempts.length === 0 && (
            <div className="text-center py-12">
              <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-600 mb-2">No attempts yet</h3>
              <p className="text-gray-500">Reports will appear here once students take the exam</p>
            </div>
          )}
        </div>

        {/* Snapshots Modal */}
        {selectedAttempt && (
          <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-6">
            <div className="bg-white rounded-lg max-w-6xl w-full max-h-[90vh] overflow-y-auto p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold">
                  Violation Snapshots - {selectedAttempt.student.full_name}
                </h2>
                <button
                  onClick={() => setSelectedAttempt(null)}
                  className="p-2 hover:bg-gray-100 rounded-full"
                >
                  <AlertTriangle className="w-6 h-6" />
                </button>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                {selectedAttempt.violations
                  .map((violation, idx) => (
                    <div key={violation.id} className="border rounded-lg p-4">
                      <div className="mb-3">
                        <div className="font-semibold text-lg">
                          {idx + 1}. {violation.violation_type.replace(/_/g, ' ').toUpperCase()}
                        </div>
                        <div className="text-sm text-gray-600">
                          {new Date(violation.detected_at).toLocaleString()}
                        </div>
                        <div className="text-sm text-gray-700 mt-1">
                          {violation.description}
                        </div>
                        {violation.metadata?.audioLevel && (
                          <div className="text-sm text-orange-600 mt-1">
                            Audio Level: {(violation.metadata.audioLevel * 100).toFixed(0)}%
                          </div>
                        )}
                      </div>
                      {violation.snapshot_url ? (
                        <img
                          src={violation.snapshot_url}
                          alt={`Violation ${idx + 1}`}
                          className="w-full rounded border"
                        />
                      ) : (
                        <div className="w-full p-8 bg-gray-100 rounded border border-gray-300 text-center text-gray-500">
                          <AlertTriangle className="w-12 h-12 mx-auto mb-2 text-gray-400" />
                          <p className="text-sm">No snapshot captured</p>
                          <p className="text-xs mt-1">Violation detected but snapshot not available</p>
                        </div>
                      )}
                      {(violation as any).audio_recording && (
                        <div className="mt-3 p-3 bg-orange-50 rounded border border-orange-200">
                          <div className="flex items-center gap-2 mb-2">
                            <AlertTriangle className="w-4 h-4 text-orange-600" />
                            <span className="text-sm font-medium text-orange-900">
                              Audio Recording ({((violation as any).audio_duration / 1000).toFixed(1)}s)
                            </span>
                          </div>
                          <audio
                            controls
                            className="w-full"
                            src={`data:audio/webm;base64,${(violation as any).audio_recording}`}
                          >
                            Your browser does not support audio playback.
                          </audio>
                          {(violation as any).audio_level && (
                            <div className="text-xs text-orange-700 mt-2">
                              Peak Level: {((violation as any).audio_level * 100).toFixed(0)}%
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
              </div>

              {selectedAttempt.violations.length === 0 && (
                <div className="text-center py-12 text-gray-600">
                  No violations recorded for this attempt
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
