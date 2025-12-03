-- Add classes table
CREATE TABLE IF NOT EXISTS classes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  teacher_id UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add class_id to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS class_id UUID REFERENCES classes(id) ON DELETE SET NULL;

-- Add class_id to exams table (exams can be assigned to specific classes)
ALTER TABLE exams ADD COLUMN IF NOT EXISTS class_id UUID REFERENCES classes(id) ON DELETE SET NULL;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_users_class ON users(class_id);
CREATE INDEX IF NOT EXISTS idx_exams_class ON exams(class_id);
CREATE INDEX IF NOT EXISTS idx_classes_teacher ON classes(teacher_id);

-- Enable RLS
ALTER TABLE classes ENABLE ROW LEVEL SECURITY;

-- RLS Policies for classes
CREATE POLICY "Anyone can view classes" ON classes FOR SELECT USING (true);
CREATE POLICY "Teachers can create classes" ON classes FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('teacher', 'admin'))
);
CREATE POLICY "Teachers can update their classes" ON classes FOR UPDATE USING (
  teacher_id = auth.uid() OR EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
);
CREATE POLICY "Admins can delete classes" ON classes FOR DELETE USING (
  EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
);

-- Update trigger for classes
CREATE TRIGGER update_classes_updated_at 
  BEFORE UPDATE ON classes 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();
