import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    );

    const { attemptId } = await req.json();

    if (!attemptId) {
      throw new Error('Missing attemptId');
    }

    // Get attempt details
    const { data: attempt, error: attemptError } = await supabaseClient
      .from('exam_attempts')
      .select(`
        *,
        exam:exams(*),
        student:users!exam_attempts_student_id_fkey(*)
      `)
      .eq('id', attemptId)
      .single();

    if (attemptError) throw attemptError;

    // Get violations
    const { data: violations, error: violationsError } = await supabaseClient
      .from('violations')
      .select('*')
      .eq('attempt_id', attemptId)
      .order('detected_at');

    if (violationsError) throw violationsError;

    // Get proctoring logs
    const { data: logs, error: logsError } = await supabaseClient
      .from('proctoring_logs')
      .select('*')
      .eq('attempt_id', attemptId)
      .order('timestamp');

    if (logsError) throw logsError;

    // Calculate cheating risk score
    const riskScore = calculateRiskScore(violations, logs);

    // Generate report data
    const reportData = {
      attempt: {
        id: attempt.id,
        started_at: attempt.started_at,
        submitted_at: attempt.submitted_at,
        auto_ended: attempt.auto_ended,
        final_score: attempt.final_score,
        status: attempt.status,
      },
      student: {
        name: attempt.student.full_name,
        email: attempt.student.email,
      },
      exam: {
        title: attempt.exam.title,
        duration_minutes: attempt.exam.duration_minutes,
        total_marks: attempt.exam.total_marks,
      },
      violations: violations.map((v) => ({
        type: v.violation_type,
        severity: v.severity,
        description: v.description,
        detected_at: v.detected_at,
        snapshot_url: v.snapshot_url,
      })),
      statistics: {
        total_violations: violations.length,
        high_severity_violations: violations.filter((v) => v.severity > 0.7).length,
        violation_types: getViolationTypeCounts(violations),
        cheating_risk_score: riskScore,
      },
      timeline: generateTimeline(violations, logs),
    };

    // Update attempt with risk score
    await supabaseClient
      .from('exam_attempts')
      .update({ cheating_risk_score: riskScore })
      .eq('id', attemptId);

    // Save report
    const { data: report, error: reportError } = await supabaseClient
      .from('reports')
      .insert({
        attempt_id: attemptId,
        report_data: reportData,
      })
      .select()
      .single();

    if (reportError) throw reportError;

    return new Response(
      JSON.stringify({ success: true, report: reportData }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

function calculateRiskScore(violations: any[], logs: any[]): number {
  let score = 0;

  // Base score from violation count
  score += violations.length * 0.15;

  // Add severity-weighted score
  violations.forEach((v) => {
    score += v.severity * 0.2;
  });

  // High-severity violations
  const highSeverity = violations.filter((v) => v.severity > 0.7).length;
  score += highSeverity * 0.25;

  // Cap at 1.0
  return Math.min(score, 1.0);
}

function getViolationTypeCounts(violations: any[]): Record<string, number> {
  const counts: Record<string, number> = {};
  violations.forEach((v) => {
    counts[v.violation_type] = (counts[v.violation_type] || 0) + 1;
  });
  return counts;
}

function generateTimeline(violations: any[], logs: any[]): any[] {
  const timeline = [];

  violations.forEach((v) => {
    timeline.push({
      timestamp: v.detected_at,
      type: 'violation',
      data: v,
    });
  });

  // Sample logs every minute
  logs.forEach((log, idx) => {
    if (idx % 12 === 0) {
      // Every 12th log (assuming 5-second intervals)
      timeline.push({
        timestamp: log.timestamp,
        type: 'log',
        data: log,
      });
    }
  });

  return timeline.sort((a, b) => 
    new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
  );
}
