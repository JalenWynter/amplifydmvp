'use client';

import { useState, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Video, VideoOff, Play, Pause, Square, Download, Trash2, Upload, Camera, CameraOff } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { uploadFile } from '@/lib/firebase/services';

interface VideoRecorderProps {
  onRecordingComplete?: (videoUrl: string) => void;
  onRecordingDelete?: () => void;
  existingVideoUrl?: string;
  disabled?: boolean;
}

export default function VideoRecorder({ 
  onRecordingComplete, 
  onRecordingDelete, 
  existingVideoUrl,
  disabled = false 
}: VideoRecorderProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [videoUrl, setVideoUrl] = useState<string | null>(existingVideoUrl || null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [cameraEnabled, setCameraEnabled] = useState(false);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const videoChunksRef = useRef<Blob[]>([]);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const previewRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const durationIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const { toast } = useToast();

  const startCamera = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: 'user', // Front camera for mobile
          frameRate: { ideal: 30 }
        },
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 44100,
        }
      });
      
      streamRef.current = stream;
      
      if (previewRef.current) {
        previewRef.current.srcObject = stream;
      }
      
      setCameraEnabled(true);
      
    } catch (error) {
      console.error('Error accessing camera:', error);
      toast({
        title: "Camera Error",
        description: "Could not access camera. Please check your permissions.",
        variant: "destructive",
      });
    }
  }, [toast]);

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setCameraEnabled(false);
  }, []);

  const startRecording = useCallback(async () => {
    if (!streamRef.current) {
      await startCamera();
      return;
    }

    try {
      const mediaRecorder = new MediaRecorder(streamRef.current, {
        mimeType: 'video/webm;codecs=vp9,opus'
      });
      
      mediaRecorderRef.current = mediaRecorder;
      videoChunksRef.current = [];
      
      mediaRecorder.ondataavailable = (event) => {
        videoChunksRef.current.push(event.data);
      };
      
      mediaRecorder.onstop = async () => {
        const videoBlob = new Blob(videoChunksRef.current, { type: 'video/webm' });
        const url = URL.createObjectURL(videoBlob);
        setVideoUrl(url);
        
        // Stop camera after recording
        stopCamera();
        
        // Upload the video file
        setIsUploading(true);
        try {
          const videoFile = new File([videoBlob], `video-feedback-${Date.now()}.webm`, { type: 'video/webm' });
          const uploadedUrl = await uploadFile(videoFile);
          setVideoUrl(uploadedUrl);
          onRecordingComplete?.(uploadedUrl);
          toast({
            title: "Video Recorded",
            description: "Your video feedback has been saved successfully.",
          });
        } catch (error) {
          console.error('Error uploading video:', error);
          toast({
            title: "Upload Failed",
            description: "Failed to upload video. Please try again.",
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
        description: "Could not start video recording. Please try again.",
        variant: "destructive",
      });
    }
  }, [onRecordingComplete, toast, startCamera, stopCamera]);

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
    if (videoRef.current && videoUrl) {
      if (isPlaying) {
        videoRef.current.pause();
        setIsPlaying(false);
      } else {
        videoRef.current.play();
        setIsPlaying(true);
      }
    }
  }, [videoUrl, isPlaying]);

  const deleteRecording = useCallback(() => {
    if (videoUrl) {
      URL.revokeObjectURL(videoUrl);
      setVideoUrl(null);
      onRecordingDelete?.();
      toast({
        title: "Recording Deleted",
        description: "Your video feedback has been deleted.",
      });
    }
  }, [videoUrl, onRecordingDelete, toast]);

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Video className="h-5 w-5" />
          Video Feedback
        </CardTitle>
        <CardDescription>
          Record video feedback for this track (mobile & web optimized)
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Camera Preview */}
        {cameraEnabled && !videoUrl && (
          <div className="relative">
            <video
              ref={previewRef}
              autoPlay
              muted
              playsInline
              className="w-full h-48 md:h-64 bg-black rounded-lg object-cover"
            />
            {isRecording && (
              <div className="absolute top-4 right-4 flex items-center gap-2 bg-red-500 text-white px-3 py-1 rounded-full">
                <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
                <span className="text-sm font-mono">
                  {formatDuration(recordingDuration)}
                </span>
              </div>
            )}
          </div>
        )}

        {/* Recording Controls */}
        <div className="flex items-center gap-2 justify-center flex-wrap">
          {!cameraEnabled && !videoUrl && (
            <Button 
              onClick={startCamera} 
              disabled={disabled}
              className="gap-2"
              size="lg"
            >
              <Camera className="h-5 w-5" />
              Enable Camera
            </Button>
          )}
          
          {cameraEnabled && !isRecording && !videoUrl && (
            <div className="flex items-center gap-2">
              <Button 
                onClick={startRecording} 
                disabled={disabled}
                className="gap-2"
                size="lg"
              >
                <Video className="h-5 w-5" />
                Start Recording
              </Button>
              
              <Button 
                onClick={stopCamera} 
                variant="outline"
                className="gap-2"
                size="lg"
              >
                <CameraOff className="h-5 w-5" />
                Stop Camera
              </Button>
            </div>
          )}
          
          {isRecording && (
            <Button 
              onClick={stopRecording} 
              variant="destructive"
              className="gap-2"
              size="lg"
            >
              <Square className="h-5 w-5" />
              Stop Recording
            </Button>
          )}
        </div>

        {/* Video Playback */}
        {videoUrl && (
          <div className="space-y-4">
            <video
              ref={videoRef}
              src={videoUrl}
              controls
              playsInline
              className="w-full h-48 md:h-64 bg-black rounded-lg object-cover"
              onEnded={() => setIsPlaying(false)}
            />
            
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
          </div>
        )}

        {/* Upload Status */}
        {isUploading && (
          <div className="flex items-center gap-2 justify-center text-sm text-muted-foreground">
            <Upload className="h-4 w-4 animate-spin" />
            Uploading video feedback...
          </div>
        )}

        {/* Instructions */}
        <div className="text-xs text-muted-foreground text-center">
          <p>• Use front camera for best mobile experience</p>
          <p>• Video will be automatically uploaded when recording stops</p>
          <p>• Maximum recording time: 10 minutes</p>
          <p>• Keep your device steady while recording</p>
        </div>
      </CardContent>
    </Card>
  );
} 