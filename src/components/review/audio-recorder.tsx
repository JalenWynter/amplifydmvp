'use client';

import { useState, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Mic, MicOff, Play, Pause, Square, Download, Trash2, Upload } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { uploadFile } from '@/lib/firebase/services';

interface AudioRecorderProps {
  onRecordingComplete?: (audioUrl: string) => void;
  onRecordingDelete?: () => void;
  existingAudioUrl?: string;
  disabled?: boolean;
}

export default function AudioRecorder({ 
  onRecordingComplete, 
  onRecordingDelete, 
  existingAudioUrl,
  disabled = false 
}: AudioRecorderProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [audioUrl, setAudioUrl] = useState<string | null>(existingAudioUrl || null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const durationIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const { toast } = useToast();

  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 44100,
        }
      });
      
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus'
      });
      
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];
      
      mediaRecorder.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data);
      };
      
      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const url = URL.createObjectURL(audioBlob);
        setAudioUrl(url);
        
        // Stop all tracks to release microphone
        stream.getTracks().forEach(track => track.stop());
        
        // Upload the audio file
        setIsUploading(true);
        try {
          const audioFile = new File([audioBlob], `audio-feedback-${Date.now()}.webm`, { type: 'audio/webm' });
          const uploadedUrl = await uploadFile(audioFile, `audio-feedback/${Date.now()}-${audioFile.name}`);
          setAudioUrl(uploadedUrl);
          onRecordingComplete?.(uploadedUrl);
          toast({
            title: "Audio Recorded",
            description: "Your audio feedback has been saved successfully.",
          });
        } catch (error) {
          console.error('Error uploading audio:', error);
          toast({
            title: "Upload Failed",
            description: "Failed to upload audio. Please try again.",
            variant: "destructive",
          });
        } finally {
          setIsUploading(false);
        }
      };
      
      mediaRecorder.start();
      setIsRecording(true);
      setRecordingDuration(0);
      
      // Start duration counter
      durationIntervalRef.current = setInterval(() => {
        setRecordingDuration(prev => prev + 1);
      }, 1000);
      
    } catch (error) {
      console.error('Error starting recording:', error);
      toast({
        title: "Recording Error",
        description: "Could not access microphone. Please check your permissions.",
        variant: "destructive",
      });
    }
  }, [onRecordingComplete, toast]);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      
      if (durationIntervalRef.current) {
        clearInterval(durationIntervalRef.current);
        durationIntervalRef.current = null;
      }
    }
  }, [isRecording]);

  const playPause = useCallback(() => {
    if (audioRef.current && audioUrl) {
      if (isPlaying) {
        audioRef.current.pause();
        setIsPlaying(false);
      } else {
        audioRef.current.play();
        setIsPlaying(true);
      }
    }
  }, [audioUrl, isPlaying]);

  const deleteRecording = useCallback(() => {
    if (audioUrl) {
      URL.revokeObjectURL(audioUrl);
      setAudioUrl(null);
      onRecordingDelete?.();
      toast({
        title: "Recording Deleted",
        description: "Your audio feedback has been deleted.",
      });
    }
  }, [audioUrl, onRecordingDelete, toast]);

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Mic className="h-5 w-5" />
          Audio Feedback
        </CardTitle>
        <CardDescription>
          Record audio feedback for this track (mobile & web optimized)
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Recording Controls */}
        <div className="flex items-center gap-2 justify-center">
          {!isRecording && !audioUrl && (
            <Button 
              onClick={startRecording} 
              disabled={disabled}
              className="gap-2"
              size="lg"
            >
              <Mic className="h-5 w-5" />
              Start Recording
            </Button>
          )}
          
          {isRecording && (
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse" />
                <span className="text-sm font-mono">
                  {formatDuration(recordingDuration)}
                </span>
              </div>
              <Button 
                onClick={stopRecording} 
                variant="destructive"
                className="gap-2"
                size="lg"
              >
                <Square className="h-5 w-5" />
                Stop Recording
              </Button>
            </div>
          )}
        </div>

        {/* Playback Controls */}
        {audioUrl && (
          <div className="space-y-4">
            <div className="flex items-center gap-2 justify-center">
              <Button
                onClick={playPause}
                variant="outline"
                size="lg"
                className="gap-2"
              >
                {isPlaying ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
                {isPlaying ? 'Pause' : 'Play'}
              </Button>
              
              <Button
                onClick={deleteRecording}
                variant="destructive"
                size="lg"
                className="gap-2"
              >
                <Trash2 className="h-5 w-5" />
                Delete
              </Button>
            </div>

            <audio
              ref={audioRef}
              src={audioUrl}
              onEnded={() => setIsPlaying(false)}
              className="w-full"
              controls
            />
          </div>
        )}

        {/* Upload Status */}
        {isUploading && (
          <div className="flex items-center gap-2 justify-center text-sm text-muted-foreground">
            <Upload className="h-4 w-4 animate-spin" />
            Uploading audio feedback...
          </div>
        )}

        {/* Instructions */}
        <div className="text-xs text-muted-foreground text-center">
          <p>• Tap and hold for better mobile experience</p>
          <p>• Audio will be automatically uploaded when recording stops</p>
          <p>• Maximum recording time: 10 minutes</p>
        </div>
      </CardContent>
    </Card>
  );
} 