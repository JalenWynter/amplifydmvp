
'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import ScoringChart, { reviewSchema, ReviewFormValues } from "@/components/review/scoring-chart";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getSubmissionById, Submission, submitReview } from "@/lib/firebase/services";
import { Skeleton } from "@/components/ui/skeleton";
import { Headphones, Music, Loader2, Video, Mic, ShieldX } from "lucide-react";
import { useEffect, useState, useMemo } from "react";
import { Form } from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';

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

export default function ReviewSubmissionPage({ params }: { params: { submissionId: string } }) {
  const [submission, setSubmission] = useState<Submission | null | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const router = useRouter();

  const form = useForm<ReviewFormValues>({
    resolver: zodResolver(reviewSchema),
    defaultValues: {
      originality: 5, structure: 5, melody: 5, lyrics: 5,
      vocal_performance: 5, instrumental_performance: 5, energy: 5, technical_skill: 5,
      sound_quality: 5, mixing: 5, sound_design: 5, mastering: 5,
      commercial_potential: 5, target_audience: 5, branding: 5, uniqueness: 5,
      strengths: '', improvements: '', summary: ''
    }
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
    const fetchSubmission = async () => {
      setSubmission(undefined); // Start in loading state
      const sub = await getSubmissionById(params.submissionId);
      setSubmission(sub);
    }
    fetchSubmission();
  }, [params.submissionId]);

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
      await submitReview(submission, data, overallScore);
      toast({
        title: "Review Submitted!",
        description: "Your feedback has been saved and sent to the artist.",
      });
      router.push('/dashboard/submissions');
    } catch (error: any) {
      toast({
        title: "Submission Failed",
        description: error.message || "There was an error submitting the review.",
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

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="grid md:grid-cols-3 gap-8 items-start">
        <div className="md:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl font-bold font-headline">Reviewing: "{submission.songTitle}"</CardTitle>
              <CardDescription>by {submission.artistName}</CardDescription>
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
                    <p className="text-sm text-muted-foreground">No audio file for this mock submission.</p>
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
        </div>

        <div className="space-y-6 md:sticky top-20">
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
               <div className="space-y-2">
                    <Button variant="outline" className="w-full" disabled={true}>
                        <Mic className="mr-2"/>
                        Record Audio Feedback
                    </Button>
                    <Button variant="outline" className="w-full" disabled={true}>
                        <Video className="mr-2"/>
                        Record Video Feedback
                    </Button>
                </div>
              <Button type="submit" className="w-full bg-accent hover:bg-accent/90" disabled={isLoading}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Submit Review
              </Button>
              <Button variant="outline" className="w-full" disabled={true}>Save as Draft (coming soon)</Button>
            </CardContent>
          </Card>
        </div>
      </form>
    </Form>
  );
}
