'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Search, Star, Calendar, User, Music } from "lucide-react";
import { getAllReviews, getReviewers, Review, Reviewer } from "@/lib/firebase/services";
import { Skeleton } from "@/components/ui/skeleton";
import Link from "next/link";

function ReviewCardSkeleton() {
    return (
        <Card className="h-48">
            <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                    <Skeleton className="h-6 w-48" />
                    <Skeleton className="h-6 w-16" />
                </div>
                <Skeleton className="h-4 w-32" />
            </CardHeader>
            <CardContent className="space-y-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
                <div className="flex items-center gap-2 pt-2">
                    <Skeleton className="h-4 w-20" />
                    <Skeleton className="h-4 w-24" />
                </div>
            </CardContent>
        </Card>
    );
}

function getRatingBadge(score: number) {
    if (score >= 8) return { label: "Excellent", variant: "default" as const };
    if (score >= 6) return { label: "Good", variant: "secondary" as const };
    if (score >= 4) return { label: "Average", variant: "outline" as const };
    return { label: "Needs Work", variant: "destructive" as const };
}

export default function ReviewsPage() {
    const [reviews, setReviews] = useState<Review[]>([]);
    const [reviewers, setReviewers] = useState<Reviewer[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            setIsLoading(true);
            const [fetchedReviews, fetchedReviewers] = await Promise.all([
                getAllReviews(),
                getReviewers()
            ]);
            setReviews(fetchedReviews);
            setReviewers(fetchedReviewers);
            setIsLoading(false);
        };
        fetchData();
    }, []);

    const filteredReviews = reviews.filter(review => {
        const reviewer = reviewers.find(r => r.id === review.reviewerId);
        const reviewerName = reviewer?.name || '';
        const artistName = review.submissionDetails.artistName;
        const songTitle = review.submissionDetails.songTitle;
        
        const searchLower = searchTerm.toLowerCase();
        return (
            reviewerName.toLowerCase().includes(searchLower) ||
            artistName.toLowerCase().includes(searchLower) ||
            songTitle.toLowerCase().includes(searchLower)
        );
    });

    return (
        <div className="container mx-auto py-8 px-4">
            <div className="mb-8">
                <h1 className="text-3xl font-bold mb-2">Music Reviews</h1>
                <p className="text-muted-foreground mb-6">
                    Discover professional reviews from our expert reviewers
                </p>
                
                <div className="relative max-w-md">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Search by reviewer, artist, or song name..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10"
                    />
                </div>
            </div>

            {isLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {Array.from({ length: 6 }).map((_, i) => (
                        <ReviewCardSkeleton key={i} />
                    ))}
                </div>
            ) : filteredReviews.length === 0 ? (
                <div className="text-center py-12">
                    <Music className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                    <h3 className="text-lg font-medium mb-2">No reviews found</h3>
                    <p className="text-muted-foreground">
                        {searchTerm ? "Try adjusting your search terms" : "No reviews have been published yet"}
                    </p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredReviews.map((review) => {
                        const reviewer = reviewers.find(r => r.id === review.reviewerId);
                        const rating = getRatingBadge(review.overallScore);
                        
                        return (
                            <Card key={review.id} className="hover:shadow-lg transition-shadow">
                                <CardHeader className="pb-3">
                                    <div className="flex items-center justify-between">
                                        <CardTitle className="text-lg truncate">
                                            {review.submissionDetails.songTitle}
                                        </CardTitle>
                                        <div className="flex items-center gap-1">
                                            <Star className="w-4 h-4 text-yellow-400 fill-current" />
                                            <span className="font-bold">{review.overallScore.toFixed(1)}</span>
                                        </div>
                                    </div>
                                    <CardDescription>
                                        by {review.submissionDetails.artistName}
                                    </CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-3">
                                        <Badge variant={rating.variant}>{rating.label}</Badge>
                                        
                                        <p className="text-sm text-muted-foreground line-clamp-2">
                                            {review.summary || 'No review summary available.'}
                                        </p>
                                        
                                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                                            <div className="flex items-center gap-1">
                                                <User className="w-3 h-3" />
                                                <span>{reviewer?.name || 'Unknown'}</span>
                                            </div>
                                            <div className="flex items-center gap-1">
                                                <Calendar className="w-3 h-3" />
                                                <span>{new Date(review.createdAt).toLocaleDateString()}</span>
                                            </div>
                                        </div>
                                        
                                        <Button asChild size="sm" className="w-full">
                                            <Link href={`/review/${review.id}`}>
                                                See Full Review
                                            </Link>
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
                        );
                    })}
                </div>
            )}
        </div>
    );
} 
