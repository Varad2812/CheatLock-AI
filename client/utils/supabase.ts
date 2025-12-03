import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Missing Supabase environment variables. Please check your .env.local file.\n' +
    'Required: NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY'
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type UserRole = 'admin' | 'teacher' | 'examiner' | 'student';

export type ViolationType =
  | 'gaze_sideward'
  | 'gaze_upward'
  | 'gaze_away'
  | 'face_missing'
  | 'multiple_faces'
  | 'extreme_head_angle'
  | 'audio_speech'
  | 'audio_external'
  | 'tab_switch'
  | 'window_blur'
  | 'copy_paste'
  | 'keystroke_anomaly'
  | 'multiple_devices';

export interface User {
  id: string;
  email: string;
  full_name: string;
  role: UserRole;
  class_id?: string;
  created_at: string;
  updated_at: string;
}

export interface Class {
  id: string;
  name: string;
  description?: string;
  teacher_id?: string;
  created_at: string;
  updated_at: string;
}

export interface Exam {
  id: string;
  title: string;
  description?: string;
  teacher_id: string;
  class_id?: string;
  duration_minutes: number;
  total_marks: number;
  proctoring_strictness: number;
  start_time?: string;
  end_time?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Question {
  id: string;
  exam_id: string;
  question_text: string;
  question_type: string;
  options?: any;
  correct_answer?: string;
  marks: number;
  order_index?: number;
  created_at: string;
}

export interface ExamAttempt {
  id: string;
  exam_id: string;
  student_id: string;
  started_at: string;
  submitted_at?: string;
  auto_ended: boolean;
  violation_count: number;
  final_score?: number;
  cheating_risk_score: number;
  answers?: any;
  status: string;
  created_at: string;
  exam?: Exam; // Optional relation
}

export interface Violation {
  id: string;
  attempt_id: string;
  violation_type: ViolationType;
  severity: number;
  description?: string;
  snapshot_url?: string;
  metadata?: any;
  detected_at: string;
}

export interface ProctoringLog {
  id: string;
  attempt_id: string;
  gaze_direction?: string;
  head_angle?: number;
  mic_noise_level?: number;
  keystroke_pattern?: any;
  tab_active: boolean;
  window_focused: boolean;
  timestamp: string;
}
