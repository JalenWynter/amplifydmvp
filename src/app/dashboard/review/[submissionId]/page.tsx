
'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import ScoringChart, { reviewSchema, ReviewFormValues } from "@/components/review/scoring-chart";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getSubmissionById, Submission, submitReview, hasReviewerSubmittedReview } from "@/lib/firebase/services";
import { Skeleton } from "@/components/ui/skeleton";
import { Headphones, Music, Loader2, Video, Mic, ShieldX, Save, Send } from "lucide-react";
import { useEffect, useState, useMemo, use } from "react";
import { Form } from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from '@/lib/firebase/client';
import Link from 'next/link';
import AudioRecorder from '@/components/review/audio-recorder';
import VideoRecorder from '@/components/review/video-recorder';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

function ReviewSkeleton() {
  return (
    <div className="grid md:grid-cols-3 gap-8">
      <div className="md:col-span-2 space-y-6">
        <Card>
          <CardHeader>
            <Skeleton className="h-8 w-3/4" />
            <Skeleton className="h-4 w-1/4" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-40 w-full" />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <Skeleton className="h-7 w-1/3" />
            <Skeleton className="h-4 w-2/3" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-64 w-full" />
          </CardContent>
        </Card>
      </div>
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <Skeleton className="h-7 w-1/2" />
          </CardHeader>
          <CardContent className="space-y-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default function ReviewSubmissionPage({ params }: { params: Promise<{ submissionId: string }> }) {
  const resolvedParams = use(params);
  const [user, loadingAuth] = useAuthState(auth);
  const [submission, setSubmission] = useState<Submission | null | undefined>(undefined);
  const [hasReviewBeenSubmitted, setHasReviewBeenSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isDraftSaving, setIsDraftSaving] = useState(false);
  const [showFirstConfirmation, setShowFirstConfirmation] = useState(false);
  const [showSecondConfirmation, setShowSecondConfirmation] = useState(false);
  const { toast } = useToast();
  const router = useRouter();

  const form = useForm<ReviewFormValues>({
    resolver: zodResolver(reviewSchema),
    defaultValues: {
      originality: 5, structure: 5, melody: 5, lyrics: 5,
      vocal_performance: 5, instrumental_performance: 5, energy: 5, technical_skill: 5,
      sound_quality: 5, mixing: 5, sound_design: 5, mastering: 5,
      commercial_potential: 5, target_audience: 5, branding: 5, uniqueness: 5,
      strengths: '', improvements: '', overallReview: '',
      audioFeedbackUrl: '', videoFeedbackUrl: '', isDraft: false
    } as ReviewFormValues
  });

  const scores = form.watch();

  const overallScore = useMemo(() => {
    const numericScores = Object.keys(scores)
      .filter(key => typeof scores[key as keyof ReviewFormValues] === 'number')
      .map(key => scores[key as keyof ReviewFormValues] as number);
    
    if (numericScores.length === 0) return 0;
    
    const sum = numericScores.reduce((total, score) => total + score, 0);
    return sum / numericScores.length;
  }, [scores]);

  useEffect(() => {
    if (loadingAuth || !user) return;
    
    const fetchSubmissionAndReviewStatus = async () => {
      setSubmission(undefined); // Start in loading state
      const sub = await getSubmissionById(resolvedParams.submissionId);
      setSubmission(sub);
      
      if (sub) {
        const reviewSubmitted = await hasReviewerSubmittedReview(sub.id, user.uid);
        setHasReviewBeenSubmitted(reviewSubmitted);
      }
    }
    fetchSubmissionAndReviewStatus();
  }, [resolvedParams.submissionId, user, loadingAuth]);

  const handleAudioRecording = (audioUrl: string) => {
    form.setValue('audioFeedbackUrl', audioUrl);
  };

  const handleVideoRecording = (videoUrl: string) => {
    form.setValue('videoFeedbackUrl', videoUrl);
  };

  const handleAudioDelete = () => {
    form.setValue('audioFeedbackUrl', '');
  };

  const handleVideoDelete = () => {
    form.setValue('videoFeedbackUrl', '');
  };

  const saveDraft = async () => {
    if (!submission) return;
    
    setIsDraftSaving(true);
    try {
      const data = form.getValues();
      data.isDraft = true;
      await submitReview(submission, data, overallScore);
      toast({
        title: "Draft Saved",
        description: "Your review has been saved as a draft.",
      });
    } catch (error: unknown) {
      toast({
        title: "Draft Saved",
        description: error instanceof Error ? error.message : "Failed to save draft.",
      });
    } finally {
      setIsDraftSaving(false);
    }
  };

  const handleFirstConfirmation = () => {
    setShowFirstConfirmation(false);
    setShowSecondConfirmation(true);
  };

  const handleSecondConfirmation = async () => {
    setShowSecondConfirmation(false);
    const data = form.getValues();
    await onSubmit(data);
  };

  const onSubmit = async (data: ReviewFormValues) => {
    if (!submission) {
        toast({
            title: "Submission Not Found",
            description: "Cannot submit review for a non-existent submission.",
            variant: "destructive"
        });
        return;
    };
    setIsLoading(true);

    try {
      data.isDraft = false; // Mark as published
      const { reviewId, reviewUrl } = await submitReview(submission, data, overallScore);
      toast({
        title: "Review Submitted!",
        description: `Your feedback has been published. The artist will receive a link to view their review.`,
      });
      console.log(`Review completed! Artist can view at: ${reviewUrl}`);
      router.push('/dashboard/submissions');
    } catch (error: unknown) {
      toast({
        title: "Submission Failed",
        description: error instanceof Error ? error.message : "There was an error submitting the review.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (submission === undefined) {
    return <ReviewSkeleton />;
  }

  if (submission === null) {
      return (
          <div className="flex flex-col items-center justify-center h-full text-center py-20">
              <ShieldX className="w-16 h-16 text-destructive mb-4" />
              <h1 className="text-2xl font-bold">Submission Not Found</h1>
              <p className="text-muted-foreground">The submission you are looking for does not exist or has been removed.</p>
          </div>
      )
  }

  if (hasReviewBeenSubmitted) {
      return (
          <div className="flex flex-col items-center justify-center h-full text-center py-20">
              <ShieldX className="w-16 h-16 text-yellow-500 mb-4" />
              <h1 className="text-2xl font-bold">Review Already Submitted</h1>
              <p className="text-muted-foreground">You have already submitted a review for this submission. Only one review per submission is allowed.</p>
              <Button asChild className="mt-4" variant="outline">
                  <Link href="/dashboard/submissions">Back to Submissions</Link>
              </Button>
          </div>
      )
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit((data) => setShowFirstConfirmation(true))} className="grid md:grid-cols-3 gap-8 items-start">
        <div className="md:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl font-bold font-headline break-words" title={`Reviewing: &quot;${submission.songTitle}&quot;`}>Reviewing: &quot;{submission.songTitle}&quot;</CardTitle>
              <CardDescription className="break-words" title={`by ${submission.artistName}`}>by {submission.artistName}</CardDescription>
            </CardHeader>
            <CardContent>
              {submission.audioUrl ? (
                <div className="bg-muted rounded-lg p-4 flex flex-col items-center gap-4">
                  <Headphones className="w-16 h-16 text-muted-foreground" />
                  <audio controls className="w-full">
                    <source src={submission.audioUrl} type="audio/mpeg" />
                    Your browser does not support the audio element.
                  </audio>
                </div>
              ) : (
                <div className="bg-muted rounded-lg p-4 flex flex-col items-center gap-4 text-center">
                    <Headphones className="w-16 h-16 text-muted-foreground" />
                                            <p className="text-sm text-muted-foreground">No audio file available for this submission.</p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Your Feedback</CardTitle>
              <CardDescription>Use the sliders and text areas below to provide detailed feedback.</CardDescription>
            </CardHeader>
            <CardContent>
              <ScoringChart form={form} scores={scores} />
            </CardContent>
          </Card>

          {/* Recording Components */}
          <Tabs defaultValue="audio" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="audio">Audio Feedback</TabsTrigger>
              <TabsTrigger value="video">Video Feedback</TabsTrigger>
            </TabsList>
            <TabsContent value="audio" className="space-y-4">
              <AudioRecorder
                onRecordingComplete={handleAudioRecording}
                onRecordingDelete={handleAudioDelete}
                existingAudioUrl={form.watch('audioFeedbackUrl')}
              />
            </TabsContent>
            <TabsContent value="video" className="space-y-4">
              <VideoRecorder
                onRecordingComplete={handleVideoRecording}
                onRecordingDelete={handleVideoDelete}
                existingVideoUrl={form.watch('videoFeedbackUrl')}
              />
            </TabsContent>
          </Tabs>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Review Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Overall Score</span>
                  <span className="text-2xl font-bold text-primary">{overallScore.toFixed(1)}/10</span>
              </div>
              <p className="text-sm text-muted-foreground">
                  The overall score is calculated automatically as you complete the scoring chart.
              </p>

              <div className="flex flex-col gap-2">
                <Button 
                  onClick={saveDraft}
                  type="button"
                  variant="outline" 
                  className="w-full"
                  disabled={isDraftSaving}
                >
                  {isDraftSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  <Save className="mr-2 h-4 w-4" />
                  Save as Draft
                </Button>

                <Button 
                  type="submit" 
                  className="w-full bg-accent hover:bg-accent/90" 
                  disabled={isLoading}
                >
                  {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  <Send className="mr-2 h-4 w-4" />
                  Submit Review
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </form>

      {/* First Confirmation Dialog */}
      <AlertDialog open={showFirstConfirmation} onOpenChange={setShowFirstConfirmation}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you ready to submit this review?</AlertDialogTitle>
            <AlertDialogDescription>
              Please review your feedback before submitting. This review will be sent to the artist and cannot be easily modified after submission.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleFirstConfirmation}>Continue</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Second Confirmation Dialog */}
      <AlertDialog open={showSecondConfirmation} onOpenChange={setShowSecondConfirmation}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Final confirmation required</AlertDialogTitle>
            <AlertDialogDescription>
              This is your final chance to review your feedback. Once submitted, this review will be permanently published and the artist will be notified immediately.
              
              <div className="mt-4 p-4 bg-muted rounded-lg">
                <p className="text-sm"><strong>Overall Score:</strong> {overallScore.toFixed(1)}/10</p>
                <p className="text-sm"><strong>Track:</strong> &quot;{submission?.songTitle}&quot; by {submission?.artistName}</p>
                {form.watch('audioFeedbackUrl') && <p className="text-sm">✓ Audio feedback included</p>}
                {form.watch('videoFeedbackUrl') && <p className="text-sm">✓ Video feedback included</p>}
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleSecondConfirmation} disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Yes, Submit Review
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Form>
  );
}
