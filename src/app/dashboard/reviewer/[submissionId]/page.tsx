'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { getSubmissionById } from '@/lib/firebase/submissions';
import { Submission, ReviewFormData, ReviewFormSchema } from '@/lib/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Music, PlayCircle, ArrowLeft } from 'lucide-react';
import ScoringChart from '@/components/review/scoring-chart';
import { useToast } from '@/hooks/use-toast';
import { submitReview } from '@/lib/firebase/reviews';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Form } from '@/components/ui/form';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default function ReviewSubmissionPage() {
  const { submissionId } = useParams();
  const router = useRouter();
  const { currentUser, loading: authLoading } = useAuth();
  const { toast } = useToast();

  const [submission, setSubmission] = useState<Submission | null>(null);
  const [loadingSubmission, setLoadingSubmission] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const form = useForm<ReviewFormData>({
    resolver: zodResolver(ReviewFormSchema),
    defaultValues: {
      scores: {},
      overallScore: 5,
      strengths: '',
      improvements: '',
      summary: '',
      audioFeedbackUrl: '',
      videoFeedbackUrl: '',
    },
  });

  const overallScore = form.watch('overallScore');

  useEffect(() => {
    async function fetchSubmission() {
      if (!submissionId) {
        setError("No submission ID provided.");
        setLoadingSubmission(false);
        return;
      }

      if (!currentUser || currentUser.role !== 'reviewer') {
        setLoadingSubmission(false);
        return;
      }

      try {
        const fetchedSubmission = await getSubmissionById(submissionId as string);
        if (fetchedSubmission) {
          if (fetchedSubmission.reviewerId !== currentUser.id) {
            setError("You are not authorized to review this submission.");
            setSubmission(null);
          } else {
            setSubmission(fetchedSubmission);
          }
        } else {
          setError("Submission not found.");
        }
      } catch (err) {
        console.error("Error fetching submission:", err);
        setError("Failed to load submission details.");
      } finally {
        setLoadingSubmission(false);
      }
    }

    if (!authLoading) {
      fetchSubmission();
    }
  }, [submissionId, currentUser, authLoading]);

  const handleReviewSubmit = async (values: ReviewFormData) => {
    if (!submission || !currentUser) return;

    try {
      await submitReview({ 
        submissionId: submission.id, 
        reviewData: values, 
        overallScore: values.overallScore 
      });
      toast({ 
        title: "Review Submitted!", 
        description: "Your review has been successfully recorded." 
      });
      router.push('/dashboard/reviewer');
    } catch (err: unknown) {
      console.error("Error submitting review:", err);
      let errorMessage = "An unknown error occurred.";
      if (err instanceof Error) {
          errorMessage = err.message;
      } else if (typeof err === "object" && err !== null && "message" in err) {
          errorMessage = (err as { message: string }).message;
      }
      toast({ 
        title: "Error", 
        description: errorMessage || "Failed to submit review.", 
        variant: "destructive" 
      });
    }
  };

  if (authLoading || loadingSubmission) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-20">
        <h1 className="text-2xl font-bold text-destructive">Error</h1>
        <p className="text-muted-foreground">{error}</p>
        <Button asChild className="mt-4">
          <Link href="/dashboard/reviewer">Back to Dashboard</Link>
        </Button>
      </div>
    );
  }

  if (!submission) {
    return (
      <div className="text-center py-20">
        <h1 className="text-2xl font-bold">Submission Not Found</h1>
        <p className="text-muted-foreground">The submission you are looking for does not exist or you do not have access.</p>
        <Button asChild className="mt-4">
          <Link href="/dashboard/reviewer">Back to Dashboard</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8 p-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="outline" size="sm" asChild>
          <Link href="/dashboard/reviewer">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold font-headline">Review Submission</h1>
          <p className="text-muted-foreground">Provide your detailed feedback for this track.</p>
        </div>
      </div>

      {/* Submission Info */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Music className="w-5 h-5" />
            {submission.songTitle}
          </CardTitle>
          <CardDescription>by {submission.artistName}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Genre</p>
              <p className="text-lg">{submission.genre}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Submitted</p>
              <p className="text-lg">{new Date(submission.submittedAt).toLocaleDateString()}</p>
            </div>
          </div>
          <Button asChild className="w-full md:w-auto">
            <a href={submission.songUrl} target="_blank" rel="noopener noreferrer">
              <PlayCircle className="w-5 h-5 mr-2" /> Listen to Track
            </a>
          </Button>
        </CardContent>
      </Card>

      {/* Review Form */}
      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleReviewSubmit)} className="space-y-8">
          <ScoringChart form={form} scores={form.watch()} />
          
          <div className="flex gap-4 pt-6">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => router.push('/dashboard/reviewer')}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              className="flex-1" 
              disabled={form.formState.isSubmitting}
            >
              {form.formState.isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Submitting Review...
                </>
              ) : (
                'Submit Review'
              )}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
