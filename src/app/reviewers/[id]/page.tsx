
'use client';

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Clock, Globe, Linkedin, Twitter, Music, Star, Loader2, BarChart3, FileText, Mic, Film, Package } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { createCheckoutSession } from "@/app/actions/stripe";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import React, { useState, useEffect, use } from "react";
import { Reviewer, ReviewPackage, getReviewerById } from "@/lib/firebase/services";

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

function ReviewerProfileSkeleton() {
    return (
        <div className="space-y-8">
            <Card className="overflow-hidden">
                <Skeleton className="h-48 w-full" />
                <div className="p-6">
                    <div className="flex flex-col sm:flex-row items-start gap-6 -mt-20">
                         <Skeleton className="w-32 h-32 rounded-full border-4 border-card ring-4 ring-primary/50" />
                        <div className="pt-20 sm:pt-24 flex-grow">
                             <Skeleton className="h-9 w-1/2" />
                             <Skeleton className="h-5 w-3/4 mt-3" />
                        </div>
                    </div>
                </div>
            </Card>
            <div className="grid md:grid-cols-3 gap-8">
                <div className="md:col-span-2 space-y-6">
                    <Card>
                        <CardHeader><Skeleton className="h-8 w-1/3" /></CardHeader>
                        <CardContent className="space-y-2">
                            <Skeleton className="h-4 w-full" />
                            <Skeleton className="h-4 w-full" />
                            <Skeleton className="h-4 w-5/6" />
                        </CardContent>
                    </Card>
                </div>
                <div className="space-y-6">
                    <Card>
                        <CardHeader><Skeleton className="h-8 w-2/3" /></CardHeader>
                        <CardContent className="space-y-4">
                            <Skeleton className="h-24 w-full" />
                            <Skeleton className="h-10 w-full" />
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    )
}


export default function ReviewerProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const [reviewer, setReviewer] = useState<Reviewer | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const { toast } = useToast();
  const router = useRouter();
  const [submittingPackage, setSubmittingPackage] = useState<string | null>(null);

  useEffect(() => {
    const fetchReviewer = async () => {
        setIsLoading(true);
        const fetchedReviewer = await getReviewerById(resolvedParams.id);
        setReviewer(fetchedReviewer);
        setIsLoading(false);
    }
    fetchReviewer();
  }, [resolvedParams.id]);


  const handleSelectPackage = (pkg: ReviewPackage) => {
      if (!reviewer) return;
      setSubmittingPackage(pkg.id);
      toast({ title: "Let's Get Your Music", description: "You'll be redirected to the homepage to upload your track and complete your submission." });
      
      // Redirect to the submission form on the homepage with pre-selected reviewer and package
      setTimeout(() => {
        router.push(`/?reviewerId=${reviewer.id}&packageId=${pkg.id}`);
      }, 3000);
  };


  if (isLoading) {
    return <ReviewerProfileSkeleton />;
  }

  if (!reviewer) {
    return (
      <div className="text-center py-20">
        <h1 className="text-2xl font-bold">Reviewer not found</h1>
        <p className="text-muted-foreground">The reviewer you are looking for does not exist.</p>
        <Button asChild className="mt-4">
          <Link href="/features">See all reviewers</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-8">
        <Card className="overflow-hidden">
            <div className="relative h-48 w-full">
                <Image src={reviewer.avatarUrl || 'https://placehold.co/1200x400.png'} alt={`${reviewer.name} cover image`} fill style={{ objectFit: 'cover' }} data-ai-hint="sound waves" />
                <div className="absolute inset-0 bg-black/40" />
            </div>
            <div className="p-6">
                <div className="flex flex-col sm:flex-row items-start gap-6 -mt-20">
                    <Avatar className="w-32 h-32 border-4 border-card ring-4 ring-primary/50">
                        <AvatarImage src={reviewer.avatarUrl || 'https://placehold.co/150x150.png'} alt={reviewer.name} data-ai-hint={reviewer.dataAiHint} />
                        <AvatarFallback>{reviewer.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div className="pt-20 sm:pt-24 flex-grow">
                        <h1 className="text-3xl font-bold font-headline break-words">{reviewer.name}</h1>
                        <div className="flex flex-wrap items-center gap-4 mt-2 text-muted-foreground">
                            <div className="flex items-center gap-1.5">
                                <Clock className="w-4 h-4" />
                                <span>{reviewer.turnaround} turnaround</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                                {reviewer.genres.map(g => <Badge key={g} variant="secondary">{g}</Badge>)}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </Card>

        <div className="grid md:grid-cols-3 gap-8">
            <div className="md:col-span-2 space-y-6">
                <Card>
                    <CardHeader>
                        <CardTitle>About {reviewer.name}</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-muted-foreground whitespace-pre-wrap">{reviewer.experience}</p>
                    </CardContent>
                </Card>
                 <Card>
                    <CardHeader>
                        <CardTitle>Showcased Audio</CardTitle>
                    </CardHeader>
                    <CardContent className="text-center text-muted-foreground">
                        <Music className="w-12 h-12 mx-auto mb-2" />
                        <p>This reviewer hasn't showcased any audio yet.</p>
                    </CardContent>
                </Card>
            </div>
            <div className="space-y-6">
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2"><Package className="w-6 h-6 text-primary"/>Select a Review Package</CardTitle>
                        <CardDescription>To purchase, please use the main submission form on the home page.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                       {reviewer.packages.length > 0 ? reviewer.packages.map((pkg, index) => (
                           <React.Fragment key={pkg.id}>
                               {index > 0 && <Separator />}
                               <div className="space-y-3 pt-4">
                                   <div className="flex justify-between items-start">
                                       <div>
                                           <h3 className="font-semibold">{pkg.name}</h3>
                                           <p className="text-sm text-muted-foreground">{pkg.description}</p>
                                       </div>
                                       <div className="text-lg font-bold text-primary">${(pkg.priceInCents / 100).toFixed(2)}</div>
                                   </div>
                                    <div className="flex flex-wrap gap-x-4 gap-y-2">
                                        {pkg.formats.map(format => {
                                            const Icon = formatIcons[format];
                                            return (
                                                <div key={format} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                                    <Icon className="w-3 h-3 text-accent" />
                                                    <span>{formatLabels[format]}</span>
                                                </div>
                                            )
                                        })}
                                    </div>
                                    <Button 
                                        className="w-full bg-accent hover:bg-accent/90" 
                                        onClick={() => handleSelectPackage(pkg)} 
                                        disabled={!!submittingPackage}
                                    >
                                        {submittingPackage === pkg.id && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                        Select this package
                                    </Button>
                               </div>
                           </React.Fragment>
                       )) : (
                           <p className="text-sm text-muted-foreground text-center py-4">This reviewer has not set up any packages yet.</p>
                       )}
                    </CardContent>
                </Card>
            </div>
        </div>
    </div>
  );
}
