import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export function ReviewerCardSkeleton() {
  return (
    <Card className="h-full text-center p-8 rounded-3xl shadow-xl border">
      <Skeleton className="w-24 h-24 mx-auto rounded-full mb-4" />
      <Skeleton className="h-7 w-3/4 mx-auto mb-2" />
      <div className="space-y-2 mb-4 h-12">
        <Skeleton className="h-4 w-full mx-auto" />
        <Skeleton className="h-4 w-5/6 mx-auto" />
      </div>
      <div className="flex flex-wrap gap-2 justify-center mb-4">
        <Skeleton className="h-6 w-20 rounded-full" />
        <Skeleton className="h-6 w-24 rounded-full" />
        <Skeleton className="h-6 w-16 rounded-full" />
      </div>
      <Skeleton className="h-6 w-1/2 mx-auto mb-6" />
      <Skeleton className="h-10 w-full" />
    </Card>
  );
}
