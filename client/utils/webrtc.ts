import SimplePeer from 'simple-peer';
import { supabase } from './supabase';

export class WebRTCStreamer {
  private peer: SimplePeer.Instance | null = null;
  private stream: MediaStream | null = null;
  private attemptId: string;
  private channel: any;

  constructor(attemptId: string) {
    this.attemptId = attemptId;
  }

  // Student side: Start broadcasting
  async startBroadcast(videoElement: HTMLVideoElement) {
    try {
      // Get media stream
      this.stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 640, height: 480 },
        audio: false,
      });

      videoElement.srcObject = this.stream;

      // Create peer as initiator
      this.peer = new SimplePeer({
        initiator: true,
        stream: this.stream,
        trickle: false,
      });

      // Subscribe to signaling channel
      this.channel = supabase.channel(`webrtc:${this.attemptId}`);

      this.peer.on('signal', async (signal) => {
        // Send offer to examiner via Supabase Realtime
        await this.channel.send({
          type: 'broadcast',
          event: 'offer',
          payload: { signal, attemptId: this.attemptId },
        });
      });

      this.peer.on('error', (err) => {
        console.error('WebRTC error:', err);
      });

      // Listen for answer from examiner
      this.channel.on('broadcast', { event: 'answer' }, (payload: any) => {
        if (this.peer && payload.payload.attemptId === this.attemptId) {
          this.peer.signal(payload.payload.signal);
        }
      });

      await this.channel.subscribe();

      return this.stream;
    } catch (error) {
      console.error('Failed to start broadcast:', error);
      throw error;
    }
  }

  // Examiner side: Connect to student stream
  async connectToStream(videoElement: HTMLVideoElement, onStream: (stream: MediaStream) => void) {
    try {
      // Subscribe to signaling channel
      this.channel = supabase.channel(`webrtc:${this.attemptId}`);

      // Listen for offer from student
      this.channel.on('broadcast', { event: 'offer' }, (payload: any) => {
        if (payload.payload.attemptId === this.attemptId) {
          // Create peer as receiver
          this.peer = new SimplePeer({
            initiator: false,
            trickle: false,
          });

          this.peer.on('signal', async (signal) => {
            // Send answer back to student
            await this.channel.send({
              type: 'broadcast',
              event: 'answer',
              payload: { signal, attemptId: this.attemptId },
            });
          });

          this.peer.on('stream', (stream) => {
            videoElement.srcObject = stream;
            onStream(stream);
          });

          this.peer.on('error', (err) => {
            console.error('WebRTC error:', err);
          });

          // Signal the offer
          this.peer.signal(payload.payload.signal);
        }
      });

      await this.channel.subscribe();
    } catch (error) {
      console.error('Failed to connect to stream:', error);
      throw error;
    }
  }

  stop() {
    if (this.peer) {
      this.peer.destroy();
    }
    if (this.stream) {
      this.stream.getTracks().forEach((track) => track.stop());
    }
    if (this.channel) {
      this.channel.unsubscribe();
    }
  }
}

// Realtime monitoring for examiners
export class RealtimeMonitor {
  private channel: any;
  private examId: string;

  constructor(examId: string) {
    this.examId = examId;
  }

  async subscribe(onUpdate: (data: any) => void) {
    this.channel = supabase.channel(`exam:${this.examId}`);

    // Listen for violation updates
    this.channel
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'violations',
        },
        (payload: any) => {
          onUpdate({ type: 'violation', data: payload.new });
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'exam_attempts',
        },
        (payload: any) => {
          onUpdate({ type: 'attempt_update', data: payload.new });
        }
      );

    await this.channel.subscribe();
  }

  unsubscribe() {
    if (this.channel) {
      this.channel.unsubscribe();
    }
  }
}
