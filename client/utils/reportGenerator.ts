import jsPDF from 'jspdf';
import { ExamAttempt, Violation } from './supabase';

export interface ReportData {
  attempt: ExamAttempt;
  student: any;
  exam: any;
  violations: Violation[];
  statistics: {
    total_violations: number;
    high_severity_violations: number;
    violation_types: Record<string, number>;
    cheating_risk_score: number;
  };
}

export class ReportGenerator {
  private pdf: jsPDF;

  constructor() {
    this.pdf = new jsPDF();
  }

  generatePDF(data: ReportData): Blob {
    this.pdf = new jsPDF();
    
    // Header
    this.addHeader();
    
    // Student Info
    this.addStudentInfo(data);
    
    // Exam Info
    this.addExamInfo(data);
    
    // Statistics
    this.addStatistics(data);
    
    // Violations
    this.addViolations(data);
    
    // Risk Assessment
    this.addRiskAssessment(data);
    
    return this.pdf.output('blob');
  }

  private addHeader() {
    this.pdf.setFontSize(24);
    this.pdf.setTextColor(59, 130, 246); // Blue
    this.pdf.text('CheatLock AI', 105, 20, { align: 'center' });
    
    this.pdf.setFontSize(16);
    this.pdf.setTextColor(0, 0, 0);
    this.pdf.text('Exam Proctoring Report', 105, 30, { align: 'center' });
    
    this.pdf.setFontSize(10);
    this.pdf.setTextColor(128, 128, 128);
    this.pdf.text(`Generated: ${new Date().toLocaleString()}`, 105, 37, { align: 'center' });
    
    this.pdf.line(20, 40, 190, 40);
  }

  private addStudentInfo(data: ReportData) {
    let y = 50;
    
    this.pdf.setFontSize(14);
    this.pdf.setTextColor(0, 0, 0);
    this.pdf.text('Student Information', 20, y);
    
    y += 10;
    this.pdf.setFontSize(11);
    this.pdf.text(`Name: ${data.student.full_name}`, 25, y);
    
    y += 7;
    this.pdf.text(`Email: ${data.student.email}`, 25, y);
    
    y += 7;
    this.pdf.text(`Attempt ID: ${data.attempt.id}`, 25, y);
  }

  private addExamInfo(data: ReportData) {
    let y = 85;
    
    this.pdf.setFontSize(14);
    this.pdf.text('Exam Information', 20, y);
    
    y += 10;
    this.pdf.setFontSize(11);
    this.pdf.text(`Title: ${data.exam.title}`, 25, y);
    
    y += 7;
    this.pdf.text(`Duration: ${data.exam.duration_minutes} minutes`, 25, y);
    
    y += 7;
    this.pdf.text(`Total Marks: ${data.exam.total_marks}`, 25, y);
    
    y += 7;
    this.pdf.text(`Started: ${new Date(data.attempt.started_at).toLocaleString()}`, 25, y);
    
    y += 7;
    if (data.attempt.submitted_at) {
      this.pdf.text(`Submitted: ${new Date(data.attempt.submitted_at).toLocaleString()}`, 25, y);
    }
    
    y += 7;
    this.pdf.text(`Status: ${data.attempt.status.toUpperCase()}`, 25, y);
    
    if (data.attempt.auto_ended) {
      y += 7;
      this.pdf.setTextColor(239, 68, 68); // Red
      this.pdf.text('⚠ Exam was auto-ended due to violations', 25, y);
      this.pdf.setTextColor(0, 0, 0);
    }
  }

  private addStatistics(data: ReportData) {
    let y = 145;
    
    this.pdf.setFontSize(14);
    this.pdf.text('Statistics', 20, y);
    
    y += 10;
    this.pdf.setFontSize(11);
    
    // Score
    if (data.attempt.final_score !== null) {
      this.pdf.text(`Final Score: ${data.attempt.final_score}/${data.exam.total_marks}`, 25, y);
      y += 7;
    }
    
    // Violations
    const color = this.getViolationColor(data.statistics.total_violations);
    this.pdf.setTextColor(color.r, color.g, color.b);
    this.pdf.text(`Total Violations: ${data.statistics.total_violations}`, 25, y);
    this.pdf.setTextColor(0, 0, 0);
    
    y += 7;
    this.pdf.text(`High Severity Violations: ${data.statistics.high_severity_violations}`, 25, y);
    
    y += 10;
    this.pdf.text('Violation Breakdown:', 25, y);
    
    y += 7;
    Object.entries(data.statistics.violation_types).forEach(([type, count]) => {
      this.pdf.text(`  • ${this.formatViolationType(type)}: ${count}`, 30, y);
      y += 6;
    });
  }

  private addViolations(data: ReportData) {
    if (data.violations.length === 0) return;
    
    this.pdf.addPage();
    let y = 20;
    
    this.pdf.setFontSize(14);
    this.pdf.text('Detailed Violations', 20, y);
    
    y += 10;
    this.pdf.setFontSize(10);
    
    data.violations.forEach((violation, index) => {
      if (y > 250) {
        this.pdf.addPage();
        y = 20;
      }
      
      const time = new Date(violation.detected_at).toLocaleTimeString();
      const severity = (violation.severity * 100).toFixed(0);
      
      this.pdf.text(`${index + 1}. [${time}] ${this.formatViolationType(violation.violation_type)}`, 25, y);
      y += 6;
      this.pdf.text(`   Severity: ${severity}% | ${violation.description}`, 25, y);
      y += 6;
      
      // Add audio level if present
      if (violation.metadata?.audioLevel) {
        const audioPercent = (violation.metadata.audioLevel * 100).toFixed(0);
        this.pdf.text(`   Audio Level: ${audioPercent}%`, 25, y);
        y += 6;
      }
      
      // Add snapshot indicator
      if (violation.snapshot_url) {
        this.pdf.setTextColor(59, 130, 246); // Blue
        this.pdf.text('   [Snapshot captured - view in database]', 25, y);
        this.pdf.setTextColor(0, 0, 0);
        y += 6;
      }
      
      y += 4;
    });
  }

  private addRiskAssessment(data: ReportData) {
    this.pdf.addPage();
    let y = 20;
    
    this.pdf.setFontSize(14);
    this.pdf.text('Cheating Risk Assessment', 20, y);
    
    y += 15;
    
    const riskScore = data.statistics.cheating_risk_score;
    const riskLevel = this.getRiskLevel(riskScore);
    const color = this.getRiskColor(riskScore);
    
    // Risk score
    this.pdf.setFontSize(12);
    this.pdf.text('Overall Risk Score:', 25, y);
    
    this.pdf.setFontSize(24);
    this.pdf.setTextColor(color.r, color.g, color.b);
    this.pdf.text(`${(riskScore * 100).toFixed(0)}%`, 80, y);
    
    this.pdf.setFontSize(14);
    this.pdf.text(`(${riskLevel})`, 110, y);
    this.pdf.setTextColor(0, 0, 0);
    
    y += 20;
    
    // Risk factors
    this.pdf.setFontSize(12);
    this.pdf.text('Risk Factors:', 25, y);
    
    y += 10;
    this.pdf.setFontSize(11);
    
    if (data.statistics.total_violations >= 3) {
      this.pdf.text('• High number of violations detected', 30, y);
      y += 7;
    }
    
    if (data.statistics.high_severity_violations > 0) {
      this.pdf.text(`• ${data.statistics.high_severity_violations} high-severity violations`, 30, y);
      y += 7;
    }
    
    if (data.attempt.auto_ended) {
      this.pdf.text('• Exam was automatically ended', 30, y);
      y += 7;
    }
    
    // Recommendations
    y += 10;
    this.pdf.setFontSize(12);
    this.pdf.text('Recommendations:', 25, y);
    
    y += 10;
    this.pdf.setFontSize(11);
    
    if (riskScore > 0.7) {
      this.pdf.text('• Manual review strongly recommended', 30, y);
      y += 7;
      this.pdf.text('• Consider re-examination under supervision', 30, y);
    } else if (riskScore > 0.4) {
      this.pdf.text('• Manual review recommended', 30, y);
      y += 7;
      this.pdf.text('• Review violation snapshots', 30, y);
    } else {
      this.pdf.text('• Low risk - standard review sufficient', 30, y);
    }
  }

  private getViolationColor(count: number): { r: number; g: number; b: number } {
    if (count === 0) return { r: 16, g: 185, b: 129 }; // Green
    if (count < 3) return { r: 245, g: 158, b: 11 }; // Orange
    return { r: 239, g: 68, b: 68 }; // Red
  }

  private getRiskColor(score: number): { r: number; g: number; b: number } {
    if (score < 0.3) return { r: 16, g: 185, b: 129 }; // Green
    if (score < 0.7) return { r: 245, g: 158, b: 11 }; // Orange
    return { r: 239, g: 68, b: 68 }; // Red
  }

  private getRiskLevel(score: number): string {
    if (score < 0.3) return 'LOW RISK';
    if (score < 0.7) return 'MEDIUM RISK';
    return 'HIGH RISK';
  }

  private formatViolationType(type: string): string {
    return type
      .split('_')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }
}
