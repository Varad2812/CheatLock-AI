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

    const { attemptId, violationType, severity, description, metadata } = await req.json();

    // Validate input
    if (!attemptId || !violationType) {
      throw new Error('Missing required fields');
    }

    // Get current attempt
    const { data: attempt, error: attemptError } = await supabaseClient
      .from('exam_attempts')
      .select('*, exam:exams(*)')
      .eq('id', attemptId)
      .single();

    if (attemptError) throw attemptError;

    // Calculate adjusted severity based on proctoring strictness
    const adjustedSeverity = severity * attempt.exam.proctoring_strictness;

    // Insert violation
    const { error: violationError } = await supabaseClient
      .from('violations')
      .insert({
        attempt_id: attemptId,
        violation_type: violationType,
        severity: adjustedSeverity,
        description,
        metadata,
      });

    if (violationError) throw violationError;

    // Update violation count
    const newViolationCount = attempt.violation_count + 1;
    
    const { error: updateError } = await supabaseClient
      .from('exam_attempts')
      .update({ violation_count: newViolationCount })
      .eq('id', attemptId);

    if (updateError) throw updateError;

    // Check if threshold exceeded
    const { data: settings } = await supabaseClient
      .from('system_settings')
      .select('violation_threshold')
      .single();

    const threshold = settings?.violation_threshold || 3;

    if (newViolationCount >= threshold) {
      // Auto-end exam
      await supabaseClient
        .from('exam_attempts')
        .update({
          auto_ended: true,
          submitted_at: new Date().toISOString(),
          status: 'ended',
        })
        .eq('id', attemptId);

      return new Response(
        JSON.stringify({
          success: true,
          action: 'exam_ended',
          violationCount: newViolationCount,
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        action: 'violation_recorded',
        violationCount: newViolationCount,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
