
'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge, getStatusBadgeVariant } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { FileAudio, Music, Loader2 } from "lucide-react";
import { useState, useEffect } from "react";
import { getSubmissions, Submission, hasReviewerSubmittedReview } from "@/lib/firebase/services";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuthState } from "react-firebase-hooks/auth";
import { auth } from "@/lib/firebase/client";

function SubmissionRowSkeleton() {
    return (
        <TableRow>
            <TableCell><Skeleton className="h-4 w-32" /></TableCell>
            <TableCell><Skeleton className="h-4 w-48" /></TableCell>
            <TableCell><Skeleton className="h-4 w-24" /></TableCell>
            <TableCell><Skeleton className="h-6 w-20 rounded-full" /></TableCell>
            <TableCell><Skeleton className="h-9 w-28" /></TableCell>
        </TableRow>
    )
}

function EmptyState() {
    return (
        <TableRow>
            <TableCell colSpan={5}>
                <div className="text-center py-10">
                    <FileAudio className="mx-auto h-12 w-12 text-gray-400" />
                    <h3 className="mt-2 text-sm font-medium text-gray-900">No Submissions</h3>
                    <p className="mt-1 text-sm text-gray-500">There are no tracks currently in your review queue.</p>
                </div>
            </TableCell>
        </TableRow>
    )
}

export default function SubmissionsPage() {
    const [user, loadingAuth] = useAuthState(auth);
    const [submissions, setSubmissions] = useState<Submission[]>([]);
    const [submissionReviewStatus, setSubmissionReviewStatus] = useState<Record<string, boolean>>({});
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (loadingAuth || !user) return;
        
        const fetchSubmissions = async () => {
            setIsLoading(true);
            const fetchedSubmissions = await getSubmissions({ reviewerId: user.uid });
            setSubmissions(fetchedSubmissions);
            
            // Check review status for each submission
            const reviewStatusMap: Record<string, boolean> = {};
            for (const submission of fetchedSubmissions) {
                reviewStatusMap[submission.id] = await hasReviewerSubmittedReview(submission.id, user.uid);
            }
            setSubmissionReviewStatus(reviewStatusMap);
            
            setIsLoading(false);
        }
        fetchSubmissions();
    }, [user, loadingAuth]);

    return (
        <Card>
            <CardHeader>
                <CardTitle>My Submissions Queue</CardTitle>
                <CardDescription>All tracks assigned to you for review.</CardDescription>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Artist</TableHead>
                            <TableHead>Track Title</TableHead>
                            <TableHead>Genre</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead><span className="sr-only">Actions</span></TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoading || loadingAuth ? (
                            Array.from({length: 5}).map((_, i) => <SubmissionRowSkeleton key={i} />)
                        ) : submissions.length > 0 ? (
                            submissions.map((sub) => {
                                const hasReviewBeenSubmitted = submissionReviewStatus[sub.id];
                                return (
                                    <TableRow key={sub.id}>
                                        <TableCell className="font-medium max-w-[200px] truncate" title={sub.artistName}>{sub.artistName}</TableCell>
                                        <TableCell className="max-w-[250px] truncate" title={sub.songTitle}>{sub.songTitle}</TableCell>
                                        <TableCell className="max-w-[150px] truncate" title={sub.genre}>{sub.genre}</TableCell>
                                        <TableCell>
                                            <Badge variant={'secondary'} className={hasReviewBeenSubmitted ? "bg-green-100 text-green-800 hover:bg-green-200" : getStatusBadgeVariant(sub.status)}>
                                                {hasReviewBeenSubmitted ? "Reviewed" : sub.status}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            {hasReviewBeenSubmitted ? (
                                                <Badge variant="outline" className="text-gray-500">
                                                    Completed
                                                </Badge>
                                            ) : (
                                                <Button asChild size="sm" variant="outline">
                                                    <Link href={`/dashboard/review/${sub.id}`}>
                                                        Start Review
                                                    </Link>
                                                </Button>
                                            )}
                                        </TableCell>
                                    </TableRow>
                                );
                            })
                        ) : (
                           <EmptyState />
                        )}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    );
}
