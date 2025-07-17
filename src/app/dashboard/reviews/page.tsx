
'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Eye, FileText, Loader2, Star } from "lucide-react";
import { useState, useEffect } from "react";
import { getReviewsByReviewer, Review } from "@/lib/firebase/services";
import { Skeleton } from "@/components/ui/skeleton";
import { auth } from "@/lib/firebase/client";

function ReviewRowSkeleton() {
    return (
        <TableRow>
            <TableCell><Skeleton className="h-4 w-32" /></TableCell>
            <TableCell><Skeleton className="h-4 w-48" /></TableCell>
            <TableCell><Skeleton className="h-4 w-24" /></TableCell>
            <TableCell><Skeleton className="h-4 w-16" /></TableCell>
            <TableCell><Skeleton className="h-9 w-24" /></TableCell>
        </TableRow>
    )
}

function EmptyState() {
    return (
        <TableRow>
            <TableCell colSpan={5}>
                <div className="text-center py-10">
                    <FileText className="mx-auto h-12 w-12 text-gray-400" />
                    <h3 className="mt-2 text-sm font-medium text-gray-900">No Reviews Completed</h3>
                    <p className="mt-1 text-sm text-gray-500">You haven't completed any reviews yet.</p>
                </div>
            </TableCell>
        </TableRow>
    )
}

export default function ReviewsPage() {
    const [reviews, setReviews] = useState<Review[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const unsubscribe = auth.onAuthStateChanged(user => {
            if (user) {
                const fetchReviews = async () => {
                    setIsLoading(true);
                    const fetchedReviews = await getReviewsByReviewer(user.uid);
                    setReviews(fetchedReviews);
                    setIsLoading(false);
                }
                fetchReviews();
            } else {
                setIsLoading(false);
                setReviews([]);
            }
        });
         return () => unsubscribe();
    }, []);

    return (
        <Card>
            <CardHeader>
                <CardTitle>My Completed Reviews</CardTitle>
                <CardDescription>A history of all the feedback you've provided.</CardDescription>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Artist</TableHead>
                            <TableHead>Track Title</TableHead>
                            <TableHead>Review Date</TableHead>
                            <TableHead>Overall Score</TableHead>
                            <TableHead><span className="sr-only">Actions</span></TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoading ? (
                            Array.from({length: 5}).map((_, i) => <ReviewRowSkeleton key={i} />)
                        ) : reviews.length > 0 ? (
                            reviews.map((rev) => (
                                <TableRow key={rev.id}>
                                    <TableCell className="font-medium max-w-[200px] truncate" title={rev.submissionDetails.artistName}>{rev.submissionDetails.artistName}</TableCell>
                                    <TableCell className="max-w-[250px] truncate" title={rev.submissionDetails.songTitle}>{rev.submissionDetails.songTitle}</TableCell>
                                    <TableCell className="min-w-[100px]">{new Date(rev.createdAt).toLocaleDateString()}</TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-1.5">
                                            <Star className="w-4 h-4 text-yellow-400 fill-current" />
                                            <span className="font-bold">{rev.overallScore.toFixed(1)}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <Button asChild size="sm" variant="outline">
                                            <Link href={`/dashboard/review/${rev.submissionId}`}>
                                                <Eye className="mr-2 h-4 w-4" />
                                                View Review
                                            </Link>
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))
                        ) : (
                           <EmptyState />
                        )}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    );
}

    