'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { getReviewerById } from '@/lib/firebase/reviewers';
import { Reviewer } from '@/lib/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Mic, FileText, BarChart3, Film, ChevronDown, ChevronUp } from 'lucide-react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Button } from '@/components/ui/button';
import SubmissionForm from '@/components/submission/submission-form';

const formatIcons: { [key: string]: React.ElementType } = {
    chart: BarChart3,
    written: FileText,
    audio: Mic,
    video: Film
};

const formatLabels: { [key: string]: string } = {
    chart: "Scoring Chart",
    written: "Written Feedback",
    audio: "Audio Feedback",
    video: "Video Feedback"
};

export default function ReviewerProfilePage() {
  const { id } = useParams();
  const [reviewer, setReviewer] = useState<Reviewer | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchReviewer() {
      if (id) {
        try {
          const fetchedReviewer = await getReviewerById(id as string);
          if (fetchedReviewer) {
            setReviewer(fetchedReviewer);
          } else {
            setError("Reviewer not found.");
          }
        } catch (err) {
          console.error("Error fetching reviewer:", err);
          setError("Failed to load reviewer profile.");
        } finally {
          setLoading(false);
        }
      }
    }
    fetchReviewer();
  }, [id]);

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

  if (!reviewer) {
    return (
      <div className="text-center py-20">
        <h1 className="text-2xl font-bold">Reviewer Not Found</h1>
        <p className="text-muted-foreground">The reviewer you are looking for does not exist.</p>
      </div>
    );
  }

  return (
    <div className="space-y-12">
      <section className="text-center">
        <h1 className="text-4xl md:text-6xl font-bold font-headline text-primary tracking-tighter mb-4">
          {reviewer.name}
        </h1>
        <p className="text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto">
          {reviewer.bio || reviewer.experience || "No bio provided yet."}
        </p>
        {reviewer.genres && reviewer.genres.length > 0 && (
          <p className="text-md text-muted-foreground mt-2">
            Genres: {reviewer.genres.join(', ')}
          </p>
        )}
        {reviewer.turnaroundTime && (
          <p className="text-md text-muted-foreground mt-2">
            Average Turnaround: {reviewer.turnaroundTime} days
          </p>
        )}
      </section>

      <section className="grid grid-cols-1 md:grid-cols-3 gap-8 items-start">
        <div className="md:col-span-2">
          {reviewer && <SubmissionForm preselectedReviewerId={reviewer.id} />}
        </div>
        <div className="space-y-6 pt-0 md:pt-4">
          <h2 className="text-2xl font-bold font-headline text-primary">Review Packages</h2>
          {reviewer.packages && reviewer.packages.length > 0 ? (
            <div className="space-y-4">
              {reviewer.packages.map(pkg => (
                <Collapsible key={pkg.id} className="rounded-lg border bg-card text-card-foreground shadow-sm">
                  <CollapsibleTrigger asChild>
                    <div className="flex items-center justify-between space-x-4 p-6 cursor-pointer hover:bg-muted transition-colors">
                      <div>
                        <CardTitle>{pkg.name}</CardTitle>
                        <CardDescription>${(pkg.priceInCents / 100).toFixed(2)} - {pkg.trackCount} track(s)</CardDescription>
                      </div>
                      <Button variant="ghost" size="icon">
                        <ChevronDown className="h-4 w-4 collapsible-open:hidden" />
                        <ChevronUp className="h-4 w-4 collapsible-closed:hidden" />
                        <span className="sr-only">Toggle</span>
                      </Button>
                    </div>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <CardContent className="p-6 pt-0">
                      <p className="text-muted-foreground text-sm mb-2">{pkg.description}</p>
                      <div className="flex flex-wrap gap-x-4 gap-y-2">
                        {pkg.formats.map(format => {
                          const Icon = formatIcons[format];
                          return (
                            <div key={format} className="flex items-center gap-2 text-sm text-muted-foreground">
                              <Icon className="w-4 h-4 text-primary" />
                              <span>{formatLabels[format]}</span>
                            </div>
                          );
                        })}
                      </div>
                    </CardContent>
                  </CollapsibleContent>
                </Collapsible>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground">No review packages available yet.</p>
          )}
        </div>
      </section>
    </div>
  );
}