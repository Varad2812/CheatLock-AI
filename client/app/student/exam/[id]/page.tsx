'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { supabase, Exam, Question, ExamAttempt } from '../../../../utils/supabase';
import { ProctoringEngine, ViolationEvent } from '../../../../proctoring/proctoringEngine';
import toast from 'react-hot-toast';
import { AlertTriangle, Camera, Mic, Eye } from 'lucide-react';

export default function TakeExam() {
  const router = useRouter();
  const params = useParams();
  const examId = params.id as string;

  const [exam, setExam] = useState<Exam | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [attempt, setAttempt] = useState<ExamAttempt | null>(null);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [violations, setViolations] = useState<ViolationEvent[]>([]);
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [examStarted, setExamStarted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const proctoringEngineRef = useRef<ProctoringEngine | null>(null);
  const attemptIdRef = useRef<string | null>(null); // Store attempt ID in ref

  useEffect(() => {
    loadExam();
  }, [examId]);

  useEffect(() => {
    // Initialize camera preview
    if (videoRef.current && !examStarted) {
      navigator.mediaDevices
        .getUserMedia({ video: true, audio: false })
        .then((stream) => {
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
          }
        })
        .catch((err) => {
          console.error('Camera access denied:', err);
        });
    }
  }, [examStarted]);

  async function loadExam() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/auth/login');
        return;
      }

      // Load exam
      const { data: examData, error: examError } = await supabase
        .from('exams')
        .select('*')
        .eq('id', examId)
        .single();

      if (examError) {
        console.error('Exam load error:', examError);
        throw examError;
      }
      
      console.log('Exam loaded:', examData);
      setExam(examData);

      // Load questions
      const { data: questionsData, error: questionsError } = await supabase
        .from('questions')
        .select('*')
        .eq('exam_id', examId)
        .order('order_index');

      if (questionsError) {
        console.error('Questions load error:', questionsError);
        throw questionsError;
      }
      
      console.log('Questions loaded:', questionsData?.length || 0, 'questions');
      console.log('Questions data:', questionsData);
      setQuestions(questionsData || []);

      setTimeRemaining(examData.duration_minutes * 60);
      setLoading(false);
    } catch (error: any) {
      toast.error(error.message);
      router.push('/student/dashboard');
    }
  }

  async function startExam() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Check for existing attempt first
      const { data: existingAttempt } = await supabase
        .from('exam_attempts')
        .select('*')
        .eq('exam_id', examId)
        .eq('student_id', user.id)
        .single();

      let attemptData;
      
      if (existingAttempt) {
        console.log('Found existing attempt:', existingAttempt);
        // Use existing attempt if it's still in progress
        if (existingAttempt.status === 'in_progress') {
          attemptData = existingAttempt;
        } else {
          toast.error('You have already completed this exam');
          router.push('/student/dashboard');
          return;
        }
      } else {
        // Create new exam attempt
        const { data: newAttempt, error: attemptError } = await supabase
          .from('exam_attempts')
          .insert({
            exam_id: examId,
            student_id: user.id,
            status: 'in_progress',
          })
          .select()
          .single();

        if (attemptError) {
          console.error('Failed to create attempt:', attemptError);
          throw attemptError;
        }
        attemptData = newAttempt;
      }

      setAttempt(attemptData);
      attemptIdRef.current = attemptData.id; // Store in ref

      // Start exam immediately
      setExamStarted(true);
      toast.success('Exam started!');

      // Load system settings from database
      const { data: settings } = await supabase
        .from('system_settings')
        .select('*')
        .single();

      const violationThreshold = settings?.violation_threshold || 3;
      const audioSensitivity = settings?.audio_sensitivity || 0.15;
      const gazeSensitivity = settings?.gaze_sensitivity || 0.20;
      const faceMissingTimeout = settings?.face_missing_timeout || 5;
      
      console.log('System settings loaded:', settings);
      console.log('Violation threshold:', violationThreshold);
      console.log('Audio sensitivity:', audioSensitivity);
      console.log('Gaze sensitivity:', gazeSensitivity);
      console.log('Face missing timeout:', faceMissingTimeout);

      // Try to initialize proctoring (but don't block if it fails)
      try {
        if (videoRef.current && canvasRef.current) {
          const engine = new ProctoringEngine({
            attemptId: attemptData.id,
            violationThreshold,
            audioSensitivity,
            gazeSensitivity,
            faceMissingTimeout: faceMissingTimeout * 1000, // Convert to milliseconds
            onViolation: handleViolation,
            onExamEnd: handleExamEnd,
          });

          await engine.start(videoRef.current, canvasRef.current);
          proctoringEngineRef.current = engine;

          toast.success(`Proctoring activated! (${violationThreshold} violations allowed)`);
        }
      } catch (proctoringError: any) {
        console.error('Proctoring failed:', proctoringError);
        toast.error('Proctoring unavailable - exam will continue without monitoring');
      }

      // Try to enter fullscreen
      try {
        await document.documentElement.requestFullscreen();
      } catch (fullscreenError) {
        console.error('Fullscreen failed:', fullscreenError);
      }
    } catch (error: any) {
      console.error('Start exam error:', error);
      toast.error(error.message || 'Failed to start exam');
    }
  }

  const handleSubmit = useCallback(async (autoEnded: boolean = false, attemptId?: string) => {
    console.log('=== HANDLE SUBMIT CALLED ===');
    console.log('autoEnded:', autoEnded);
    console.log('attempt:', attempt);
    console.log('attemptId param:', attemptId);
    console.log('isSubmitting:', isSubmitting);
    
    // Use provided attemptId or get from attempt state
    const finalAttemptId = attemptId || attempt?.id;
    
    if (!finalAttemptId) {
      console.error('=== ERROR: No attempt ID found ===');
      toast.error('Cannot submit - no exam attempt found');
      return;
    }

    if (isSubmitting) {
      console.log('=== ALREADY SUBMITTING - IGNORING ===');
      return;
    }

    console.log('=== SETTING isSubmitting = true ===');
    setIsSubmitting(true);
    console.log('=== STARTING SUBMISSION PROCESS ===');
    console.log('Submitting exam...', { attemptId: finalAttemptId, autoEnded, answersCount: Object.keys(answers).length });

    try {
      // Stop proctoring first
      if (proctoringEngineRef.current) {
        console.log('Stopping proctoring engine');
        proctoringEngineRef.current.stop();
        proctoringEngineRef.current = null; // Clear reference
      }

      // Calculate score
      let score = 0;
      let correctAnswers = 0;
      questions.forEach((q) => {
        if (answers[q.id] === q.correct_answer) {
          score += q.marks;
          correctAnswers++;
        }
      });

      console.log('Score calculated:', { score, correctAnswers, totalQuestions: questions.length });

      // Update attempt with all data
      const updateData: any = {
        submitted_at: new Date().toISOString(),
        status: autoEnded ? 'auto_ended' : 'completed',
        answers: answers,
        final_score: score,
        violation_count: violations.length,
        auto_ended: autoEnded,
      };

      console.log('Updating exam attempt:', updateData);

      const { data: updateResult, error: updateError } = await supabase
        .from('exam_attempts')
        .update(updateData)
        .eq('id', finalAttemptId)
        .select();

      if (updateError) {
        console.error('Update error:', updateError);
        throw updateError;
      }

      console.log('Exam attempt updated successfully:', updateResult);

      // Exit fullscreen
      if (document.fullscreenElement) {
        try {
          await document.exitFullscreen();
        } catch (e) {
          console.error('Fullscreen exit error:', e);
        }
      }

      toast.success('Exam submitted successfully!');
      
      // Small delay before redirect to ensure toast is visible
      setTimeout(() => {
        router.push('/student/dashboard');
      }, 1000);
    } catch (error: any) {
      console.error('Submit error:', error);
      toast.error(error.message || 'Failed to submit exam');
      setIsSubmitting(false);
    }
  }, [attempt, answers, questions, violations, isSubmitting, router]);

  const handleExamEnd = useCallback((reason: string) => {
    console.log('=== HANDLE EXAM END CALLED ===');
    console.log('Reason:', reason);
    console.log('Current attempt:', attempt);
    console.log('Attempt ID from ref:', attemptIdRef.current);
    console.log('Current isSubmitting:', isSubmitting);
    
    // Use ref which persists even if state is cleared
    const attemptId = attemptIdRef.current || attempt?.id;
    console.log('Final attempt ID to use:', attemptId);
    
    toast.error(`Exam ended: ${reason}`);
    
    // Call submit with saved attempt ID
    console.log('=== CALLING handleSubmit(true, attemptId) ===');
    handleSubmit(true, attemptId);
  }, [handleSubmit, attempt, isSubmitting]);

  const handleViolation = useCallback((violation: ViolationEvent) => {
    console.log('=== VIOLATION HANDLER CALLED ===');
    console.log('Violation:', violation);
    
    setViolations((prev) => {
      const newViolations = [...prev, violation];
      const violationCount = newViolations.length;
      const threshold = proctoringEngineRef.current?.getViolationThreshold() || 3;
      
      console.log('=== VIOLATION STATE UPDATE ===');
      console.log(`Previous violations: ${prev.length}`);
      console.log(`New violations: ${violationCount}`);
      console.log(`Threshold: ${threshold}`);
      
      // Show toast with current count
      toast.error(`Violation ${violationCount}/${threshold}: ${violation.description}`);
      
      // Check if threshold reached
      if (violationCount >= threshold) {
        console.log('=== THRESHOLD REACHED - TRIGGERING AUTO-END ===');
        console.log(`Violation count: ${violationCount}, Threshold: ${threshold}`);
        
        // Use setTimeout to ensure state update completes first
        setTimeout(() => {
          console.log('=== CALLING handleExamEnd ===');
          handleExamEnd(`${threshold} violations detected`);
        }, 100);
      }
      
      return newViolations;
    });
  }, [handleExamEnd]);

  // Timer effect - must be after handleSubmit is defined
  useEffect(() => {
    if (examStarted && timeRemaining > 0) {
      const timer = setInterval(() => {
        setTimeRemaining((prev) => {
          if (prev <= 1) {
            console.log('Time expired - auto-submitting exam');
            handleSubmit(false);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [examStarted, timeRemaining, handleSubmit]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-purple-50">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading exam...</p>
        </div>
      </div>
    );
  }

  if (!exam) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Exam Not Found</h1>
          <button onClick={() => router.push('/student/dashboard')} className="px-6 py-2 bg-blue-600 text-white rounded-lg">
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  if (questions.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="max-w-md text-center bg-white rounded-2xl shadow-xl p-8">
          <AlertTriangle className="w-16 h-16 text-yellow-600 mx-auto mb-4" />
          <h1 className="text-2xl font-bold mb-4">No Questions Available</h1>
          <p className="text-gray-600 mb-6">This exam doesn't have any questions yet. Please contact your teacher.</p>
          <button onClick={() => router.push('/student/dashboard')} className="px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700">
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  if (!examStarted) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-blue-50 to-purple-50">
        <div className="max-w-2xl w-full bg-white rounded-2xl shadow-xl p-8">
          <h1 className="text-3xl font-bold mb-2">{exam?.title}</h1>
          <p className="text-gray-600 mb-6">{exam?.description}</p>

          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="bg-blue-50 p-4 rounded-xl text-center">
              <p className="text-sm text-gray-600">Duration</p>
              <p className="text-2xl font-bold">{exam?.duration_minutes} min</p>
            </div>
            <div className="bg-purple-50 p-4 rounded-xl text-center">
              <p className="text-sm text-gray-600">Questions</p>
              <p className="text-2xl font-bold">{questions.length}</p>
            </div>
            <div className="bg-pink-50 p-4 rounded-xl text-center">
              <p className="text-sm text-gray-600">Total Marks</p>
              <p className="text-2xl font-bold">{exam?.total_marks}</p>
            </div>
          </div>

          <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 mb-6">
            <h3 className="font-semibold mb-3 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-yellow-600" />
              Proctoring Requirements
            </h3>
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2">
                <Camera className="w-4 h-4 text-blue-600" />
                <span>Camera access required</span>
              </div>
              <div className="flex items-center gap-2">
                <Mic className="w-4 h-4 text-blue-600" />
                <span>Microphone access required</span>
              </div>
              <div className="flex items-center gap-2">
                <Eye className="w-4 h-4 text-blue-600" />
                <span>Gaze tracking will be active</span>
              </div>
              <div className="flex items-center gap-2 text-red-600 font-semibold">
                <AlertTriangle className="w-4 h-4" />
                <span>Violations will end exam automatically</span>
              </div>
            </div>
          </div>

          <div className="mb-6">
            <p className="text-sm font-semibold mb-2">Camera Preview:</p>
            <video
              ref={videoRef}
              autoPlay
              muted
              playsInline
              className="w-full rounded-xl border-2 border-gray-200 bg-gray-100"
              onError={(e) => console.error('Video error:', e)}
            />
            <canvas ref={canvasRef} className="hidden" />
            <p className="text-xs text-gray-500 mt-2">
              If camera doesn't show, you can still start the exam
            </p>
          </div>

          <button
            onClick={startExam}
            className="w-full py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:from-blue-700 hover:to-purple-700 font-semibold text-lg shadow-lg transition-all"
          >
            Start Exam
          </button>
        </div>
      </div>
    );
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="exam-fullscreen exam-mode bg-white p-8">
      {/* Header */}
      <div className="flex justify-between items-center mb-6 pb-4 border-b">
        <h1 className="text-2xl font-bold">{exam?.title}</h1>
        <div className="flex items-center gap-6">
          <div className="text-lg font-semibold">
            Time: {formatTime(timeRemaining)}
          </div>
          <div className="flex items-center gap-2">
            <AlertTriangle className="text-red-600" />
            <span>Violations: {violations.length}/{proctoringEngineRef.current?.getViolationThreshold() || 3}</span>
          </div>
        </div>
      </div>

      {/* Question */}
      <div className="max-w-4xl mx-auto">
        <div className="mb-4">
          <span className="text-gray-600">
            Question {currentQuestion + 1} of {questions.length}
          </span>
        </div>

        {questions[currentQuestion] && (
          <div className="bg-gray-50 p-6 rounded-lg mb-6">
            <h2 className="text-xl mb-4">{questions[currentQuestion].question_text}</h2>

            {questions[currentQuestion].question_type === 'multiple_choice' && (
              <div className="space-y-3">
                {questions[currentQuestion].options?.map((option: string, idx: number) => {
                  const questionId = questions[currentQuestion].id;
                  const isChecked = answers[questionId] === option;
                  
                  return (
                    <label 
                      key={`${questionId}-${idx}`} 
                      className={`flex items-center gap-3 p-3 border rounded cursor-pointer transition-colors ${
                        isChecked ? 'bg-blue-50 border-blue-500' : 'hover:bg-gray-50'
                      }`}
                    >
                      <input
                        type="radio"
                        name={`question-${questionId}`}
                        value={option}
                        checked={isChecked}
                        onChange={(e) => {
                          console.log('Answer selected:', { questionId, option: e.target.value });
                          setAnswers(prev => ({ ...prev, [questionId]: e.target.value }));
                        }}
                        className="w-4 h-4 text-blue-600"
                      />
                      <span className={isChecked ? 'font-medium' : ''}>{option}</span>
                    </label>
                  );
                })}
              </div>
            )}

            {questions[currentQuestion].question_type === 'text' && (
              <textarea
                value={answers[questions[currentQuestion].id] || ''}
                onChange={(e) =>
                  setAnswers({ ...answers, [questions[currentQuestion].id]: e.target.value })
                }
                className="w-full p-3 border rounded-lg"
                rows={5}
                placeholder="Type your answer here..."
              />
            )}
          </div>
        )}

        {/* Navigation */}
        <div className="flex justify-between">
          <button
            onClick={() => setCurrentQuestion(Math.max(0, currentQuestion - 1))}
            disabled={currentQuestion === 0}
            className="px-6 py-2 bg-gray-200 rounded-lg hover:bg-gray-300 disabled:opacity-50"
          >
            Previous
          </button>

          {currentQuestion < questions.length - 1 ? (
            <button
              onClick={() => setCurrentQuestion(currentQuestion + 1)}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Next
            </button>
          ) : (
            <button
              onClick={() => handleSubmit(false)}
              className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
            >
              Submit Exam
            </button>
          )}
        </div>
      </div>

      {/* Hidden video for proctoring */}
      <video ref={videoRef} autoPlay muted className="hidden" />
      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
}
