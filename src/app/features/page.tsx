'use client';

import { useState, useEffect } from 'react';
import ReviewerCard from "@/components/reviewers/reviewer-card";
import { ReviewerCardSkeleton } from "@/components/reviewers/reviewer-card-skeleton";
import { getReviewers, Reviewer } from "@/lib/firebase/services";

function ReviewerListSkeleton() {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {Array.from({ length: 6 }).map((_, i) => (
                <ReviewerCardSkeleton key={i} />
            ))}
        </div>
    )
}

export default function FeaturesPage() {
  const [reviewers, setReviewers] = useState<Reviewer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchReviewers = async () => {
      try {
        setIsLoading(true);
        const fetchedReviewers = await getReviewers();
        setReviewers(fetchedReviewers);
        setError(null);
      } catch (error) {
        console.error('Error fetching reviewers:', error);
        setError('Failed to load reviewers. Please try again later.');
        setReviewers([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchReviewers();
  }, []);

  return (
    <div className="space-y-8">
      <section className="text-center">
        <h1 className="text-4xl font-bold font-headline text-primary">Meet Our Reviewers</h1>
        <p className="mt-2 text-lg text-muted-foreground max-w-2xl mx-auto">
          A curated network of industry professionals dedicated to helping you improve your craft.
        </p>
      </section>
      
      {isLoading ? (
        <ReviewerListSkeleton />
      ) : error ? (
        <div className="text-center py-10 border border-dashed rounded-lg">
          <h3 className="text-xl font-semibold text-red-500">Error</h3>
          <p className="text-muted-foreground mt-2">{error}</p>
        </div>
      ) : reviewers.length === 0 ? (
        <div className="text-center py-10 border border-dashed rounded-lg">
          <h3 className="text-xl font-semibold">No Reviewers Found</h3>
          <p className="text-muted-foreground mt-2">
            We are currently building our network. Check back soon!
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {reviewers.map(reviewer => (
            <ReviewerCard key={reviewer.id} reviewer={reviewer} />
          ))}
        </div>
      )}
    </div>
  );
}
