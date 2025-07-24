'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { getSubmissionStatusByToken } from '@/lib/firebase/submissions';
import { Submission, Review } from '@/lib/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, CheckCircle, XCircle, Clock, Music, FileText } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function SubmissionStatusPage() {
  const searchParams = useSearchParams();
  const initialToken = searchParams.get('token');

  const [trackingToken, setTrackingToken] = useState(initialToken || '');
  const [uploaderEmail, setUploaderEmail] = useState('');
  const [submission, setSubmission] = useState<Partial<Submission> | null>(null);
  const [review, setReview] = useState<Partial<Review> | null>(null);
  const [submissionsList, setSubmissionsList] = useState<Partial<Submission>[]>([]); // New state for list of submissions
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasSearched, setHasSearched] = useState(false);

  const handleSearch = async () => {
    setLoading(true);
    setError(null);
    setSubmission(null);
    setReview(null);
    setSubmissionsList([]); // Clear previous list
    setHasSearched(true);

    if (!trackingToken && !uploaderEmail) {
      setError("Please provide either a tracking token or your email.");
      setLoading(false);
      return;
    }

    try {
      const result = await getSubmissionStatusByToken({ trackingToken, uploaderEmail });
      if (result.success) {
        if (result.submission) {
          setSubmission(result.submission);
          setReview(result.review || null);
        } else if (result.submissions) {
          setSubmissionsList(result.submissions);
        }
      } else {
        setError(result.error || "Failed to fetch submission status. Please check your credentials.");
      }
    } catch (err: unknown) {
      console.error("Error fetching submission status:", err);
      let errorMessage = "An unexpected error occurred.";
      if (err instanceof Error) {
          errorMessage = err.message;
      } else if (typeof err === "object" && err !== null && "message" in err) {
          errorMessage = (err as { message: string }).message;
      }
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (initialToken) {
      setTrackingToken(initialToken);
      // If a token is provided, we still need the email to perform the search.
      // User will need to enter email and click search.
    }
  }, [initialToken]);

  if (loading) {
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
          <Link href="/submission-status">Try Again</Link>
        </Button>
      </div>
    );
  }

  if (!hasSearched || (!submission && submissionsList.length === 0)) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] px-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Track Your Submission</CardTitle>
            <CardDescription>Enter your tracking token or email to view your submission status and review.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label htmlFor="trackingToken" className="block text-sm font-medium text-gray-700">Tracking Token (Optional)</label>
              <input
                type="text"
                id="trackingToken"
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
                value={trackingToken}
                onChange={(e) => setTrackingToken(e.target.value)}
                placeholder="e.g., abcdef123456"
              />
            </div>
            <div>
              <label htmlFor="uploaderEmail" className="block text-sm font-medium text-gray-700">Email Address (Required if no token)</label>
              <input
                type="email"
                id="uploaderEmail"
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
                value={uploaderEmail}
                onChange={(e) => setUploaderEmail(e.target.value)}
                placeholder="e.g., your@example.com"
              />
            </div>
            <Button onClick={handleSearch} className="w-full" disabled={loading}>
              {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Track Submission'}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (submissionsList.length > 1) {
    return (
      <div className="space-y-8 max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold font-headline">Your Submissions</h1>
        <p className="text-muted-foreground">Multiple submissions found for your email. Please select one to view details.</p>
        <div className="grid gap-4 md:grid-cols-2">
          {submissionsList.map((sub) => (
            <Card key={sub.id}>
              <CardHeader>
                <CardTitle>{sub.songTitle}</CardTitle>
                <CardDescription>by {sub.artistName}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                <p className="text-muted-foreground">Status: <span className="font-medium">{sub.status}</span></p>
                <p className="text-muted-foreground">Submitted: {new Date(sub.submittedAt || '').toLocaleDateString()}</p>
                <Button asChild className="w-full">
                  <Link href={`/submission-status?token=${sub.trackingToken}&email=${uploaderEmail}`}>View Details</Link>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (!submission) {
    return (
      <div className="text-center py-20">
        <h1 className="text-2xl font-bold">Submission Not Found</h1>
        <p className="text-muted-foreground">No submission found for the provided criteria. Please check your credentials.</p>
        <Button asChild className="mt-4">
          <Link href="/submission-status">Try Again</Link>
        </Button>
      </div>
    );
  }

  const statusIcon = {
    pending: <Clock className="w-6 h-6 text-yellow-500" />,
    'in-progress': <Music className="w-6 h-6 text-blue-500" />,
    completed: <CheckCircle className="w-6 h-6 text-green-500" />,
    rejected: <XCircle className="w-6 h-6 text-red-500" />,
  }[submission.status || 'pending'];

  const statusText = {
    pending: "Pending Review",
    'in-progress': "In Progress",
    completed: "Review Completed",
    rejected: "Submission Rejected",
  }[submission.status || 'pending'];

  return (
    <div className="space-y-8 max-w-2xl mx-auto">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Submission Status</CardTitle>
          {statusIcon}
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-lg font-semibold">{submission.artistName} - {submission.songTitle}</p>
          <p className="text-muted-foreground">Status: <span className="font-medium">{statusText}</span></p>
          <p className="text-muted-foreground">Submitted: {new Date(submission.submittedAt || '').toLocaleDateString()}</p>
        </CardContent>
      </Card>

      {review && submission.status === 'completed' && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Your Review</CardTitle>
            <FileText className="w-6 h-6 text-primary" />
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-lg font-semibold">Overall Score: {review.overallScore}/10</p>
            <div className="space-y-2">
              <h3 className="font-semibold">Strengths:</h3>
              <p className="text-muted-foreground whitespace-pre-wrap">{review.strengths}</p>
            </div>
            <div className="space-y-2">
              <h3 className="font-semibold">Improvements:</h3>
              <p className="text-muted-foreground whitespace-pre-wrap">{review.improvements}</p>
            </div>
            <div className="space-y-2">
              <h3 className="font-semibold">Summary:</h3>
              <p className="text-muted-foreground whitespace-pre-wrap">{review.summary}</p>
            </div>
            {review.createdAt && (
              <p className="text-sm text-muted-foreground">Reviewed on: {new Date(review.createdAt).toLocaleDateString()}</p>
            )}
          </CardContent>
        </Card>
      )}

      {submission.status !== 'completed' && (
        <div className="text-center py-8">
          <p className="text-muted-foreground">Your review is currently {statusText.toLowerCase()}. Please check back later!</p>
        </div>
      )}
    </div>
  );
}