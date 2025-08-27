'use client';

import { useEffect, useState } from 'react';
import { getSubmissionsForAdmin } from '@/lib/firebase/submissions';
import { getTransactions } from '@/lib/firebase/transactions';
import { Submission, Transaction } from '@/lib/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Loader2, Music, DollarSign, Calendar, User, Mail } from 'lucide-react';
import Link from 'next/link';

export default function AdminSubmissionsPage() {
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        const [fetchedSubmissions, fetchedTransactions] = await Promise.all([
          getSubmissionsForAdmin(),
          getTransactions()
        ]);
        setSubmissions(fetchedSubmissions);
        setTransactions(fetchedTransactions);
      } catch (err) {
        console.error("Error fetching data:", err);
        setError("Failed to load submissions and transactions.");
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, []);

  // Create a map of transactions by session ID for quick lookup
  const transactionMap = new Map<string, Transaction>();
  transactions.forEach(transaction => {
    if (transaction.stripeSessionId) {
      transactionMap.set(transaction.stripeSessionId, transaction);
    }
  });

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
      </div>
    );
  }

  const totalRevenue = submissions.reduce((sum, sub) => sum + (sub.amount || 0), 0);
  const pendingSubmissions = submissions.filter(sub => sub.status === 'pending').length;
  const completedSubmissions = submissions.filter(sub => sub.status === 'completed').length;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold font-headline">Submissions & Transactions</h1>
        <p className="text-muted-foreground">Complete oversight of all music submissions and payment transactions.</p>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Submissions</CardTitle>
            <Music className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{submissions.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${(totalRevenue / 100).toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">From {transactions.length} transactions</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Reviews</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingSubmissions}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed Reviews</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{completedSubmissions}</div>
          </CardContent>
        </Card>
      </div>

      {/* Submissions List */}
      <div className="space-y-4">
        <h2 className="text-2xl font-semibold">All Submissions</h2>
        {submissions.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <Music className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-lg font-medium">No Submissions</h3>
              <p className="text-sm text-muted-foreground">No music submissions have been made yet.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {submissions.map((submission) => {
              const transaction = transactionMap.get(submission.stripeSessionId || '');
              const amount = submission.amount || transaction?.amount || 0;
              
              return (
                <Card key={submission.id}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="flex items-center gap-2">
                          {submission.songTitle}
                          <Badge variant={submission.status === 'pending' ? 'secondary' : 'default'}>
                            {submission.status}
                          </Badge>
                        </CardTitle>
                        <CardDescription>by {submission.artistName}</CardDescription>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-bold text-green-600">
                          ${(amount / 100).toFixed(2)}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {submission.currency?.toUpperCase() || 'USD'}
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div className="flex items-center gap-2">
                        <Music className="w-4 h-4 text-muted-foreground" />
                        <span className="font-medium">Genre:</span>
                        <span>{submission.genre}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4 text-muted-foreground" />
                        <span className="font-medium">Reviewer:</span>
                        <span>{submission.reviewerId}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Mail className="w-4 h-4 text-muted-foreground" />
                        <span className="font-medium">Contact:</span>
                        <span>{submission.contactEmail}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-muted-foreground" />
                        <span className="font-medium">Submitted:</span>
                        <span>{new Date(submission.submittedAt).toLocaleDateString()}</span>
                      </div>
                    </div>

                    {submission.packageName && (
                      <div className="text-sm">
                        <span className="font-medium">Package:</span> {submission.packageName}
                        {submission.packageDescription && (
                          <span className="text-muted-foreground ml-2">- {submission.packageDescription}</span>
                        )}
                      </div>
                    )}

                    <div className="text-sm space-y-1">
                      <div><span className="font-medium">Payment Intent ID:</span> {submission.paymentIntentId}</div>
                      {submission.stripeSessionId && (
                        <div><span className="font-medium">Stripe Session ID:</span> {submission.stripeSessionId}</div>
                      )}
                      <div><span className="font-medium">Tracking Token:</span> {submission.trackingToken}</div>
                    </div>

                    <div className="flex gap-2 pt-2">
                      <Button asChild size="sm">
                        <Link href={`/dashboard/reviewer/${submission.id}`}>
                          View Submission
                        </Link>
                      </Button>
                      {transaction && (
                        <Button variant="outline" size="sm" asChild>
                          <Link href={`/admin/transactions`}>
                            View Transaction
                          </Link>
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
} 