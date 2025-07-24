'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { getSubmissions } from '@/lib/firebase/submissions';
import { Submission } from '@/lib/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Music, Clock, CheckCircle } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function ReviewerDashboardPage() {
  const { currentUser, loading: authLoading } = useAuth();
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loadingSubmissions, setLoadingSubmissions] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchSubmissions() {
      if (!currentUser || currentUser.role !== 'reviewer') {
        setLoadingSubmissions(false);
        return;
      }

      try {
        // Fetch submissions assigned to the current reviewer
        const fetchedSubmissions = await getSubmissions({ reviewerId: currentUser.id });
        setSubmissions(fetchedSubmissions);
      } catch (err) {
        console.error("Error fetching submissions:", err);
        setError("Failed to load submissions.");
      } finally {
        setLoadingSubmissions(false);
      }
    }

    if (!authLoading) {
      fetchSubmissions();
    }
  }, [currentUser, authLoading]);

  if (authLoading || loadingSubmissions) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!currentUser || currentUser.role !== 'reviewer') {
    return (
      <div className="text-center py-20">
        <h1 className="text-2xl font-bold">Access Denied</h1>
        <p className="text-muted-foreground">
          You must be a reviewer to access this dashboard.
          <br />
          Current user: {currentUser ? JSON.stringify(currentUser) : 'null'}
          <br />
          Role: {currentUser?.role}
        </p>
        <Button asChild className="mt-4">
          <Link href="/login">Log In as Reviewer</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold font-headline">Reviewer Dashboard</h1>
        <p className="text-muted-foreground">Manage your assigned music submissions.</p>
      </div>

      {error && (
        <div className="text-center py-4 text-destructive">
          <p>{error}</p>
        </div>
      )}

      {submissions.length === 0 ? (
        <div className="text-center py-12 border-2 border-dashed rounded-lg">
          <Music className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-lg font-medium">No Submissions Assigned</h3>
          <p className="mt-1 text-sm text-muted-foreground">You currently have no music submissions to review.</p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {submissions.map((submission) => (
            <Card key={submission.id}>
              <CardHeader>
                <CardTitle>{submission.songTitle}</CardTitle>
                <CardDescription>by {submission.artistName}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  {submission.status === 'pending' ? (
                    <Clock className="w-4 h-4" />
                  ) : (
                    <CheckCircle className="w-4 h-4 text-green-500" />
                  )}
                  <span>Status: {submission.status}</span>
                </div>
                <p className="text-sm text-muted-foreground">Genre: {submission.genre}</p>
                <p className="text-sm text-muted-foreground">Submitted: {new Date(submission.submittedAt).toLocaleDateString()}</p>
                <Button asChild className="w-full mt-4">
                  <Link href={`/dashboard/reviewer/${submission.id}`}>Review Submission</Link>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
