-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- User Roles Enum
CREATE TYPE user_role AS ENUM ('admin', 'teacher', 'examiner', 'student');

-- Violation Types Enum
CREATE TYPE violation_type AS ENUM (
  'gaze_sideward',
  'gaze_upward',
  'gaze_away',
  'face_missing',
  'multiple_faces',
  'extreme_head_angle',
  'audio_speech',
  'audio_external',
  'tab_switch',
  'window_blur',
  'copy_paste',
  'keystroke_anomaly',
  'multiple_devices'
);

-- Users Table (extends Supabase auth.users)
CREATE TABLE users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT NOT NULL,
  role user_role NOT NULL DEFAULT 'student',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- System Settings Table
CREATE TABLE system_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  violation_threshold INTEGER DEFAULT 3,
  gaze_sensitivity FLOAT DEFAULT 0.7,
  audio_sensitivity FLOAT DEFAULT 0.6,
  face_missing_timeout INTEGER DEFAULT 5,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert default settings
INSERT INTO system_settings (violation_threshold, gaze_sensitivity, audio_sensitivity, face_missing_timeout)
VALUES (3, 0.7, 0.6, 5);

-- Exams Table
CREATE TABLE exams (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  description TEXT,
  teacher_id UUID REFERENCES users(id) ON DELETE CASCADE,
  duration_minutes INTEGER NOT NULL,
  total_marks INTEGER NOT NULL,
  proctoring_strictness FLOAT DEFAULT 0.7,
  start_time TIMESTAMPTZ,
  end_time TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Questions Table
CREATE TABLE questions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  exam_id UUID REFERENCES exams(id) ON DELETE CASCADE,
  question_text TEXT NOT NULL,
  question_type TEXT DEFAULT 'multiple_choice',
  options JSONB,
  correct_answer TEXT,
  marks INTEGER NOT NULL,
  order_index INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Exam Assignments (which examiner monitors which batch)
CREATE TABLE exam_assignments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  exam_id UUID REFERENCES exams(id) ON DELETE CASCADE,
  examiner_id UUID REFERENCES users(id) ON DELETE CASCADE,
  batch_name TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(exam_id, examiner_id)
);

-- Student Exam Attempts
CREATE TABLE exam_attempts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  exam_id UUID REFERENCES exams(id) ON DELETE CASCADE,
  student_id UUID REFERENCES users(id) ON DELETE CASCADE,
  started_at TIMESTAMPTZ DEFAULT NOW(),
  submitted_at TIMESTAMPTZ,
  auto_ended BOOLEAN DEFAULT false,
  violation_count INTEGER DEFAULT 0,
  final_score INTEGER,
  cheating_risk_score FLOAT DEFAULT 0.0,
  answers JSONB,
  status TEXT DEFAULT 'in_progress',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(exam_id, student_id)
);

-- Violations Log
CREATE TABLE violations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  attempt_id UUID REFERENCES exam_attempts(id) ON DELETE CASCADE,
  violation_type violation_type NOT NULL,
  severity FLOAT DEFAULT 0.5,
  description TEXT,
  snapshot_url TEXT,
  metadata JSONB,
  detected_at TIMESTAMPTZ DEFAULT NOW()
);

-- Proctoring Logs (Real-time monitoring data)
CREATE TABLE proctoring_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  attempt_id UUID REFERENCES exam_attempts(id) ON DELETE CASCADE,
  gaze_direction TEXT,
  head_angle FLOAT,
  mic_noise_level FLOAT,
  keystroke_pattern JSONB,
  tab_active BOOLEAN DEFAULT true,
  window_focused BOOLEAN DEFAULT true,
  timestamp TIMESTAMPTZ DEFAULT NOW()
);

-- Reports Table
CREATE TABLE reports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  attempt_id UUID REFERENCES exam_attempts(id) ON DELETE CASCADE,
  generated_by UUID REFERENCES users(id),
  report_data JSONB,
  pdf_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_exams_teacher ON exams(teacher_id);
CREATE INDEX idx_exams_active ON exams(is_active);
CREATE INDEX idx_questions_exam ON questions(exam_id);
CREATE INDEX idx_attempts_exam ON exam_attempts(exam_id);
CREATE INDEX idx_attempts_student ON exam_attempts(student_id);
CREATE INDEX idx_attempts_status ON exam_attempts(status);
CREATE INDEX idx_violations_attempt ON violations(attempt_id);
CREATE INDEX idx_violations_type ON violations(violation_type);
CREATE INDEX idx_proctoring_attempt ON proctoring_logs(attempt_id);
CREATE INDEX idx_proctoring_timestamp ON proctoring_logs(timestamp);

-- Row Level Security (RLS) Policies

-- Enable RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE exams ENABLE ROW LEVEL SECURITY;
ALTER TABLE questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE exam_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE exam_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE violations ENABLE ROW LEVEL SECURITY;
ALTER TABLE proctoring_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;

-- Users policies
CREATE POLICY "Users can view their own data" ON users FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Admins can view all users" ON users FOR SELECT USING (
  EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
);
CREATE POLICY "Admins can insert users" ON users FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
);
CREATE POLICY "Admins can update users" ON users FOR UPDATE USING (
  EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
);

-- System settings policies
CREATE POLICY "Admins can manage settings" ON system_settings FOR ALL USING (
  EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
);
CREATE POLICY "All authenticated users can view settings" ON system_settings FOR SELECT USING (auth.uid() IS NOT NULL);

-- Exams policies
CREATE POLICY "Teachers can create exams" ON exams FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('teacher', 'admin'))
);
CREATE POLICY "Teachers can view their exams" ON exams FOR SELECT USING (
  teacher_id = auth.uid() OR 
  EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('admin', 'examiner'))
);
CREATE POLICY "Teachers can update their exams" ON exams FOR UPDATE USING (teacher_id = auth.uid());
CREATE POLICY "Students can view active exams" ON exams FOR SELECT USING (
  is_active = true AND EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'student')
);

-- Questions policies
CREATE POLICY "Teachers can manage questions" ON questions FOR ALL USING (
  EXISTS (SELECT 1 FROM exams WHERE exams.id = questions.exam_id AND exams.teacher_id = auth.uid())
);
CREATE POLICY "Students can view questions during exam" ON questions FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM exam_attempts 
    WHERE exam_attempts.exam_id = questions.exam_id 
    AND exam_attempts.student_id = auth.uid() 
    AND exam_attempts.status = 'in_progress'
  )
);

-- Exam attempts policies
CREATE POLICY "Students can create their attempts" ON exam_attempts FOR INSERT WITH CHECK (student_id = auth.uid());
CREATE POLICY "Students can view their attempts" ON exam_attempts FOR SELECT USING (student_id = auth.uid());
CREATE POLICY "Students can update their attempts" ON exam_attempts FOR UPDATE USING (student_id = auth.uid());
CREATE POLICY "Teachers and examiners can view attempts" ON exam_attempts FOR SELECT USING (
  EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('teacher', 'examiner', 'admin'))
);

-- Violations policies
CREATE POLICY "System can insert violations" ON violations FOR INSERT WITH CHECK (true);
CREATE POLICY "Students can view their violations" ON violations FOR SELECT USING (
  EXISTS (SELECT 1 FROM exam_attempts WHERE exam_attempts.id = violations.attempt_id AND exam_attempts.student_id = auth.uid())
);
CREATE POLICY "Teachers and examiners can view violations" ON violations FOR SELECT USING (
  EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('teacher', 'examiner', 'admin'))
);

-- Proctoring logs policies
CREATE POLICY "System can insert logs" ON proctoring_logs FOR INSERT WITH CHECK (true);
CREATE POLICY "Examiners can view logs" ON proctoring_logs FOR SELECT USING (
  EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('examiner', 'admin'))
);

-- Reports policies
CREATE POLICY "Teachers can view reports" ON reports FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM exam_attempts ea
    JOIN exams e ON ea.exam_id = e.id
    WHERE ea.id = reports.attempt_id AND e.teacher_id = auth.uid()
  ) OR EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('admin', 'examiner'))
);
CREATE POLICY "System can create reports" ON reports FOR INSERT WITH CHECK (true);

-- Functions

-- Update timestamp function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_system_settings_updated_at BEFORE UPDATE ON system_settings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_exams_updated_at BEFORE UPDATE ON exams FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to calculate cheating risk score
CREATE OR REPLACE FUNCTION calculate_cheating_risk_score(attempt_id_param UUID)
RETURNS FLOAT AS $$
DECLARE
  risk_score FLOAT := 0.0;
  violation_count INTEGER;
  high_severity_count INTEGER;
BEGIN
  SELECT COUNT(*), COUNT(*) FILTER (WHERE severity > 0.7)
  INTO violation_count, high_severity_count
  FROM violations
  WHERE attempt_id = attempt_id_param;
  
  risk_score := (violation_count * 0.2) + (high_severity_count * 0.3);
  risk_score := LEAST(risk_score, 1.0);
  
  RETURN risk_score;
END;
$$ LANGUAGE plpgsql;
