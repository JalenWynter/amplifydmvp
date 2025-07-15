import ReviewerCard from "@/components/reviewers/reviewer-card";
import { ReviewerCardSkeleton } from "@/components/reviewers/reviewer-card-skeleton";
import { getReviewers, Reviewer } from "@/lib/firebase/services";
import { Suspense } from "react";

async function ReviewerList() {
    const reviewers: Reviewer[] = await getReviewers();

    if (reviewers.length === 0) {
        return (
            <div className="text-center py-10 border border-dashed rounded-lg">
                <h3 className="text-xl font-semibold">No Reviewers Found</h3>
                <p className="text-muted-foreground mt-2">
                    We are currently building our network. Check back soon!
                </p>
            </div>
        )
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {reviewers.map(reviewer => (
                <ReviewerCard key={reviewer.id} reviewer={reviewer} />
            ))}
        </div>
    )
}

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
  return (
    <div className="space-y-8">
      <section className="text-center">
        <h1 className="text-4xl font-bold font-headline text-primary">Meet Our Reviewers</h1>
        <p className="mt-2 text-lg text-muted-foreground max-w-2xl mx-auto">
          A curated network of industry professionals dedicated to helping you improve your craft.
        </p>
      </section>
      
      <Suspense fallback={<ReviewerListSkeleton />}>
        <ReviewerList />
      </Suspense>
    </div>
  );
}
