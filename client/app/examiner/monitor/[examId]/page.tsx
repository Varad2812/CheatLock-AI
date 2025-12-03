'use client';

import { useEffect, useState, useRef } from 'react';
import { useParams } from 'next/navigation';
import { supabase, ExamAttempt, Violation } from '../../../../utils/supabase';
import { WebRTCStreamer, RealtimeMonitor } from '../../../../utils/webrtc';
import toast from 'react-hot-toast';
import { Camera, AlertTriangle, X } from 'lucide-react';

interface StudentMonitor {
  attempt: ExamAttempt;
  violations: Violation[];
  student: any;
}

export default function ExaminerMonitor() {
  const params = useParams();
  const examId = params.examId as string;

  const [students, setStudents] = useState<StudentMonitor[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<StudentMonitor | null>(null);
  const [liveStream, setLiveStream] = useState(false);
  const [streamConnected, setStreamConnected] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const webrtcRef = useRef<WebRTCStreamer | null>(null);
  const monitorRef = useRef<RealtimeMonitor | null>(null);

  useEffect(() => {
    loadStudents();
    setupRealtimeMonitoring();

    return () => {
      if (webrtcRef.current) {
        webrtcRef.current.stop();
      }
      if (monitorRef.current) {
        monitorRef.current.unsubscribe();
      }
    };
  }, [examId]);

  async function loadStudents() {
    try {
      const { data: attempts, error } = await supabase
        .from('exam_attempts')
        .select(`
          *,
          student:users!exam_attempts_student_id_fkey(id, full_name, email)
        `)
        .eq('exam_id', examId)
        .eq('status', 'in_progress');

      if (error) throw error;

      const studentsData = await Promise.all(
        attempts.map(async (attempt) => {
          const { data: violations } = await supabase
            .from('violations')
            .select('*')
            .eq('attempt_id', attempt.id)
            .order('detected_at', { ascending: false });

          return {
            attempt,
            violations: violations || [],
            student: attempt.student,
          };
        })
      );

      setStudents(studentsData);
    } catch (error: any) {
      toast.error(error.message);
    }
  }

  function setupRealtimeMonitoring() {
    const monitor = new RealtimeMonitor(examId);
    monitor.subscribe((data) => {
      if (data.type === 'violation') {
        loadStudents(); // Refresh data
        toast.error(`New violation detected for student`);
      } else if (data.type === 'attempt_update') {
        loadStudents();
      }
    });
    monitorRef.current = monitor;
  }

  async function openLiveStream(student: StudentMonitor) {
    try {
      setSelectedStudent(student);
      setLiveStream(true);
      setStreamConnected(false);

      if (videoRef.current) {
        toast.loading('Connecting to live stream...', { id: 'stream-connect' });
        
        const streamer = new WebRTCStreamer(student.attempt.id);
        await streamer.connectToStream(videoRef.current, (stream) => {
          console.log('Stream connected successfully');
          setStreamConnected(true);
          toast.success('Live stream connected!', { id: 'stream-connect' });
        });
        webrtcRef.current = streamer;
      }
    } catch (error: any) {
      console.error('Live stream error:', error);
      toast.error('Failed to connect to live stream. Student may not have started the exam yet.', { id: 'stream-connect' });
      setLiveStream(false);
      setSelectedStudent(null);
      setStreamConnected(false);
    }
  }

  function captureSnapshot() {
    if (!videoRef.current || !canvasRef.current) return;

    try {
      const canvas = canvasRef.current;
      const video = videoRef.current;
      
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      
      ctx.drawImage(video, 0, 0);
      
      // Download snapshot
      canvas.toBlob((blob) => {
        if (!blob) return;
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `snapshot-${selectedStudent?.student.full_name}-${Date.now()}.jpg`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        toast.success('Snapshot captured!');
      }, 'image/jpeg', 0.9);
    } catch (error) {
      console.error('Snapshot error:', error);
      toast.error('Failed to capture snapshot');
    }
  }

  function closeLiveStream() {
    if (webrtcRef.current) {
      webrtcRef.current.stop();
    }
    setLiveStream(false);
    setSelectedStudent(null);
    setStreamConnected(false);
  }

  async function forceEndExam(attemptId: string) {
    if (!confirm('Are you sure you want to force end this exam?')) return;

    try {
      await supabase
        .from('exam_attempts')
        .update({
          auto_ended: true,
          submitted_at: new Date().toISOString(),
          status: 'ended',
        })
        .eq('id', attemptId);

      toast.success('Exam ended successfully');
      loadStudents();
    } catch (error: any) {
      toast.error(error.message);
    }
  }

  const getViolationColor = (count: number) => {
    if (count === 0) return 'text-green-600';
    if (count === 1) return 'text-yellow-600';
    if (count === 2) return 'text-orange-600';
    return 'text-red-600';
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">Live Exam Monitoring</h1>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {students.map((student) => (
            <div key={student.attempt.id} className="bg-white rounded-lg shadow-lg p-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="font-semibold text-lg">{student.student.full_name}</h3>
                  <p className="text-sm text-gray-600">{student.student.email}</p>
                </div>
                <div className={`text-2xl font-bold ${getViolationColor(student.violations.length)}`}>
                  {student.violations.length}/3
                </div>
              </div>

              <div className="space-y-2 mb-4">
                <div className="text-sm">
                  <span className="text-gray-600">Started:</span>{' '}
                  {new Date(student.attempt.started_at).toLocaleTimeString()}
                </div>
                <div className="text-sm">
                  <span className="text-gray-600">Status:</span>{' '}
                  <span className="capitalize">{student.attempt.status}</span>
                </div>
              </div>

              {student.violations.length > 0 && (
                <div className="mb-4">
                  <h4 className="text-sm font-semibold mb-2 flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-red-600" />
                    Recent Violations
                  </h4>
                  <div className="space-y-1">
                    {student.violations.slice(0, 3).map((v) => (
                      <div key={v.id} className="text-xs text-gray-600 bg-red-50 p-2 rounded">
                        {v.violation_type}: {v.description}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex gap-2">
                <button
                  onClick={() => openLiveStream(student)}
                  className="flex-1 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 flex items-center justify-center gap-2"
                >
                  <Camera className="w-4 h-4" />
                  View Live
                </button>
                <button
                  onClick={() => forceEndExam(student.attempt.id)}
                  className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
                >
                  End
                </button>
              </div>
            </div>
          ))}
        </div>

        {students.length === 0 && (
          <div className="text-center py-12 text-gray-600">
            No students currently taking this exam
          </div>
        )}
      </div>

      {/* Live Stream Modal */}
      {liveStream && selectedStudent && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-6">
          <div className="bg-white rounded-lg max-w-4xl w-full p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold">
                Live Feed: {selectedStudent.student.full_name}
              </h2>
              <button
                onClick={closeLiveStream}
                className="p-2 hover:bg-gray-100 rounded-full"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="mb-4 bg-gray-900 rounded-lg overflow-hidden relative">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full rounded-lg"
                style={{ minHeight: '400px' }}
                onLoadedMetadata={() => {
                  console.log('Video metadata loaded');
                  setStreamConnected(true);
                }}
                onError={(e) => {
                  console.error('Video error:', e);
                  toast.error('Video playback error');
                }}
              />
              <canvas ref={canvasRef} className="hidden" />
              
              {streamConnected && (
                <div className="absolute top-4 right-4 bg-red-600 text-white px-3 py-1 rounded-full text-sm flex items-center gap-2">
                  <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                  LIVE
                </div>
              )}
              
              {!streamConnected && (
                <div className="absolute inset-0 flex items-center justify-center bg-gray-900 bg-opacity-75">
                  <div className="text-center text-white">
                    <div className="w-12 h-12 border-4 border-white border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <p>Connecting to stream...</p>
                  </div>
                </div>
              )}
            </div>

            <div className="mb-4 flex gap-2">
              <button
                onClick={captureSnapshot}
                disabled={!streamConnected}
                className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 disabled:opacity-50 flex items-center gap-2"
              >
                <Camera className="w-4 h-4" />
                Capture Snapshot
              </button>
              <button
                onClick={() => forceEndExam(selectedStudent!.attempt.id)}
                className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 flex items-center gap-2"
              >
                <X className="w-4 h-4" />
                Force End Exam
              </button>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <h3 className="font-semibold mb-2">Violation Count</h3>
                <div className={`text-3xl font-bold ${getViolationColor(selectedStudent.violations.length)}`}>
                  {selectedStudent.violations.length}/3
                </div>
              </div>
              <div>
                <h3 className="font-semibold mb-2">Recent Activity</h3>
                <div className="space-y-1">
                  {selectedStudent.violations.slice(0, 5).map((v) => (
                    <div key={v.id} className="text-sm text-gray-600">
                      {new Date(v.detected_at).toLocaleTimeString()}: {v.violation_type}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
