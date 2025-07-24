'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { getSubmissionById } from '@/lib/firebase/submissions';
import { Submission, ReviewFormData, ReviewFormSchema } from '@/lib/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Music, PlayCircle } from 'lucide-react';
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
        // Access control handled by AuthProvider and further by Firestore rules
        setLoadingSubmission(false);
        return;
      }

      try {
        const fetchedSubmission = await getSubmissionById(submissionId as string);
        if (fetchedSubmission) {
          // Security: Ensure the current user is the assigned reviewer
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
      await submitReview({ submissionId: submission.id, reviewData: values, overallScore: values.overallScore });
      toast({ title: "Review Submitted!", description: "Your review has been successfully recorded." });
      router.push('/dashboard/reviewer'); // Redirect back to dashboard
    } catch (err: unknown) {
      console.error("Error submitting review:", err);
      let errorMessage = "An unknown error occurred.";
      if (err instanceof Error) {
          errorMessage = err.message;
      } else if (typeof err === "object" && err !== null && "message" in err) {
          errorMessage = (err as { message: string }).message;
      }
      toast({ title: "Error", description: errorMessage || "Failed to submit review.", variant: "destructive" });
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
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold font-headline">Review Submission</h1>
        <p className="text-muted-foreground">Provide your detailed feedback for this track.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{submission.songTitle}</CardTitle>
          <CardDescription>by {submission.artistName}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-muted-foreground">Genre: {submission.genre}</p>
          <p className="text-muted-foreground">Submitted: {new Date(submission.submittedAt).toLocaleDateString()}</p>
          <Button asChild>
            <a href={submission.songUrl} target="_blank" rel="noopener noreferrer">
              <PlayCircle className="w-5 h-5 mr-2" /> Listen to Track
            </a>
          </Button>
        </CardContent>
      </Card>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleReviewSubmit)} className="space-y-8">
          <ScoringChart form={form} scores={form.watch()} />
          <Button type="submit" className="w-full" disabled={form.formState.isSubmitting}>
            {form.formState.isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Submit Review'}
          </Button>
        </form>
      </Form>
    </div>
  );
}
