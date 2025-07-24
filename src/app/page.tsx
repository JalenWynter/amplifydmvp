
'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Music, CheckCircle, Headphones } from 'lucide-react';
import dynamic from 'next/dynamic';
import { Skeleton } from '@/components/ui/skeleton';
import { useEffect, useState } from 'react';
import { getReviewers } from '@/lib/firebase/reviewers';
import { Reviewer } from '@/lib/types';
import ReviewerCard from '@/components/reviewers/reviewer-card';

const SubmissionForm = dynamic(() => import('@/components/submission/submission-form'), {
    loading: () => <Skeleton className="w-full h-[600px]" />
});

export default function Home() {
  const [reviewers, setReviewers] = useState<Reviewer[]>([]);
  const [loadingReviewers, setLoadingReviewers] = useState(true);

  useEffect(() => {
    async function fetchReviewers() {
      try {
        const fetchedReviewers = await getReviewers();
        setReviewers(fetchedReviewers);
      } catch (error) {
        console.error("Error fetching reviewers:", error);
      } finally {
        setLoadingReviewers(false);
      }
    }
    fetchReviewers();
  }, []);

  return (
    <div className="space-y-12">
      <section className="text-center">
        <h1 className="text-4xl md:text-6xl font-bold font-headline text-primary tracking-tighter mb-4">
          Get Your Music Heard
        </h1>
        <p className="text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto">
          Tired of sending demos into the void? Submit your tracks to Amplifyd and get guaranteed feedback from verified industry professionals.
        </p>
      </section>

      <section className="space-y-8">
        <h2 className="text-3xl font-bold font-headline text-center">Our Expert Reviewers</h2>
        {loadingReviewers ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(3)].map((_, i) => (
              <Skeleton key={i} className="h-[300px] w-full" />
            ))}
          </div>
        ) : reviewers.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {reviewers.map(reviewer => (
              <ReviewerCard key={reviewer.id} reviewer={reviewer} />
            ))}
          </div>
        ) : (
          <p className="text-center text-muted-foreground">No reviewers available at the moment. Please check back later.</p>
        )}
      </section>

      <section className="grid grid-cols-1 md:grid-cols-3 gap-8 items-start">
        <div className="md:col-span-2">
           <SubmissionForm />
        </div>
        <div className="space-y-6 pt-0 md:pt-4">
            <h2 className="text-2xl font-bold font-headline text-primary">Why Amplifyd?</h2>
            <p className="text-muted-foreground">We connect talented artists like you with a network of verified reviewers who provide honest, constructive, and comprehensive feedback to help you grow.</p>
            <div className="space-y-4">
                <div className="flex items-start gap-4">
                    <div className="p-2 bg-primary/10 rounded-full">
                        <Music className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                        <h3 className="font-semibold">Simple Submission</h3>
                        <p className="text-sm text-muted-foreground">Our anonymous, straightforward upload process gets your music to reviewers in minutes.</p>
                    </div>
                </div>
                <div className="flex items-start gap-4">
                    <div className="p-2 bg-primary/10 rounded-full">
                        <Headphones className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                        <h3 className="font-semibold">Expert Reviewers</h3>
                        <p className="text-sm text-muted-foreground">Access a curated network of producers, A&Rs, and music journalists.</p>
                    </div>
                </div>
                <div className="flex items-start gap-4">
                    <div className="p-2 bg-primary/10 rounded-full">
                        <CheckCircle className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                        <h3 className="font-semibold">Guaranteed Feedback</h3>
                        <p className="text-sm text-muted-foreground">Every submission receives a detailed, 16-point review.</p>
                    </div>
                </div>
            </div>
        </div>
      </section>
    </div>
  );
}
