import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { Button } from "../ui/button";
import { CheckCircle } from "lucide-react";
import { Reviewer } from "@/lib/firebase/services";

export default function ReviewerCard({ reviewer }: { reviewer: Reviewer }) {
  const startingPrice = reviewer.packages.length > 0 
    ? Math.min(...reviewer.packages.map(p => p.priceInCents))
    : 0;

  return (
    <Link href={`/reviewers/${reviewer.id}`} className="group">
      <Card className="relative h-full text-center p-8 rounded-3xl shadow-xl border transition-all hover:shadow-2xl hover:scale-[1.02]">
        <Avatar className="w-24 h-24 mx-auto border-4 border-primary mb-4">
          <AvatarImage src={reviewer.avatarUrl} alt={reviewer.name} data-ai-hint={reviewer.dataAiHint} />
          <AvatarFallback>{reviewer.name.charAt(0)}</AvatarFallback>
        </Avatar>

        <div className="flex justify-center items-center gap-2 mb-2">
            <h3 className="text-2xl font-bold">{reviewer.name}</h3>
            <Badge variant="secondary" className="bg-green-100 text-green-800 border-green-200">
                <CheckCircle className="w-3 h-3 mr-1" />
                Verified
            </Badge>
        </div>

        <p className="text-sm text-muted-foreground mb-4 h-12 line-clamp-3">{reviewer.experience}</p>

        <div className="flex flex-wrap gap-2 justify-center mb-4">
          {reviewer.genres.slice(0, 3).map(genre => (
            <Badge key={genre} variant="secondary" className="bg-blue-50 text-blue-800 border-blue-200">{genre}</Badge>
          ))}
        </div>

        <div className="text-sm text-muted-foreground mb-6">
            Starts at <span className="font-bold text-primary">${(startingPrice / 100).toFixed(2)}</span> &bull; <span className="font-bold text-primary">{reviewer.turnaround}</span> turnaround
        </div>

        <Button className="w-full">
          View Profile & Packages
        </Button>
      </Card>
    </Link>
  );
}
