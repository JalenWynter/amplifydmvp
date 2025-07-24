'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowUpRight, DollarSign, Music, Star, FileAudio, Loader2 } from "lucide-react";
import { useState, useEffect } from "react";
import { getSubmissions, getReviewsByReviewer, getReferralEarnings, hasReviewerSubmittedReview } from "@/lib/firebase/services";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuthState } from "react-firebase-hooks/auth";
import { auth } from "@/lib/firebase/client";
import type { Submission, Review } from '@/lib/types';

function StatCardSkeleton() {
    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <Skeleton className="h-4 w-2/3" />
                <Skeleton className="h-4 w-4" />
            </CardHeader>
            <CardContent>
                <Skeleton className="h-8 w-1/3" />
                <Skeleton className="h-3 w-1/2 mt-1" />
            </CardContent>
        </Card>
    )
}

function StatCard({ title, value, icon: Icon }: { title: string, value: string, icon: React.ElementType }) {
    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{title}</CardTitle>
                <Icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold">{value}</div>
            </CardContent>
        </Card>
    )
}

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
                    <h3 className="mt-2 text-sm font-medium text-gray-900">No New Submissions</h3>
                    <p className="mt-1 text-sm text-gray-500">There are no tracks currently waiting for your review.</p>
                </div>
            </TableCell>
        </TableRow>
    )
}

export default function DashboardPage() {
    const [user, loadingAuth] = useAuthState(auth);
    const [submissions, setSubmissions] = useState<Submission[]>([]);
    const [reviews, setReviews] = useState<Review[]>([]);
    const [earnings, setEarnings] = useState<{
        totalEarnings: number;
        completedReviews: number;
        pendingEarnings: number;
        averageEarningPerReview: number;
        referralEarnings: number;
        totalEarningsWithReferrals: number;
    } | null>(null);
    const [submissionReviewStatus, setSubmissionReviewStatus] = useState<Record<string, boolean>>({});
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (loadingAuth || !user) return;

        const fetchData = async () => {
            setIsLoading(true);
            
            const [fetchedSubmissions, fetchedReviews, fetchedEarnings] = await Promise.all([
                getSubmissions({ reviewerId: user.uid }),
                getReviewsByReviewer(user.uid),
                getReferralEarnings(user.uid)
            ]);
            
            setSubmissions(fetchedSubmissions);
            setReviews(fetchedReviews);
            setEarnings({
                totalEarnings: fetchedEarnings.reduce((sum, e) => sum + e.commissionAmount, 0),
                completedReviews: reviews.length,
                pendingEarnings: 0, // or your logic
                averageEarningPerReview: reviews.length ? fetchedEarnings.reduce((sum, e) => sum + e.commissionAmount, 0) / reviews.length : 0,
                referralEarnings: 0, // or your logic
                totalEarningsWithReferrals: 0 // or your logic
            });
            
            // Check review status for each submission
            const reviewStatusMap: Record<string, boolean> = {};
            for (const submission of fetchedSubmissions) {
                reviewStatusMap[submission.id] = await hasReviewerSubmittedReview(submission.id, user.uid);
            }
            setSubmissionReviewStatus(reviewStatusMap);
            
            setIsLoading(false);
        }
        fetchData();
    }, [user, loadingAuth]);

    const averageScore = reviews.length > 0
        ? (reviews.reduce((sum, rev) => sum + rev.overallScore, 0) / reviews.length).toFixed(1)
        : "N/A";

    const pendingReviewsCount = submissions.filter(sub => !submissionReviewStatus[sub.id]).length;
    
    const stats = [
        { title: "Pending Reviews", value: pendingReviewsCount.toString(), icon: Music },
        { title: "Available Earnings", value: earnings ? `${((earnings.totalEarnings || 0) + (earnings.pendingEarnings || 0) + ((earnings.referralEarnings || 0) / 100)).toFixed(2)}` : "$0.00", icon: DollarSign },
        { title: "Completed Reviews", value: earnings ? (earnings.completedReviews || 0).toString() : "0", icon: Star },
    ];

    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold font-headline break-words">Welcome back, {user?.displayName || 'Reviewer'}!</h1>
            
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {isLoading || loadingAuth ? (
                    Array.from({length: 3}).map((_, i) => <StatCardSkeleton key={i}/>)
                ) : (
                    stats.map(stat => (
                        <StatCard key={stat.title} title={stat.title} value={stat.value} icon={stat.icon} />
                    ))
                )}
            </div>

            {/* Simplified earnings message */}
            {earnings && !isLoading && (
                <Card>
                    <CardContent className="p-4">
                        {earnings.pendingEarnings > 0 ? (
                            <div className="flex items-center gap-3 p-3 bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg">
                                <DollarSign className="w-6 h-6 text-green-600" />
                                <div>
                                    <div className="font-semibold text-green-800">
                                        ${earnings.pendingEarnings.toFixed(2)} ready to be earned!
                                    </div>
                                    <div className="text-sm text-green-600">
                                        Complete your pending reviews to earn this amount.
                                    </div>
                                </div>
                            </div>
                        ) : earnings.totalEarnings > 0 ? (
                            <div className="flex items-center gap-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                                <Star className="w-6 h-6 text-blue-600" />
                                <div>
                                    <div className="font-semibold text-blue-800">
                                        Great job! You&apos;ve earned ${earnings.totalEarnings.toFixed(2)}
                                    </div>
                                    <div className="text-sm text-blue-600">
                                        Keep up the excellent work reviewing tracks.
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="flex items-center gap-3 p-3 bg-gray-50 border border-gray-200 rounded-lg">
                                <Music className="w-6 h-6 text-gray-600" />
                                <div>
                                    <div className="font-semibold text-gray-800">
                                        Ready to start earning?
                                    </div>
                                    <div className="text-sm text-gray-600">
                                        When artists submit tracks, you&apos;ll see your earnings here.
                                    </div>
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>
            )}

            <Card>
                <CardHeader className="flex flex-row items-center">
                    <div className="grid gap-2">
                        <CardTitle>New Submissions</CardTitle>
                        <CardDescription>
                            Your most recent tracks waiting for review.
                        </CardDescription>
                    </div>
                    <Button asChild size="sm" className="ml-auto gap-1">
                        <Link href="/dashboard/submissions">
                            View All
                            <ArrowUpRight className="h-4 w-4" />
                        </Link>
                    </Button>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Track</TableHead>
                                <TableHead>Artist</TableHead>
                                <TableHead>Genre</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {isLoading || loadingAuth ? (
                                Array.from({length: 3}).map((_, i) => (
                                    <TableRow key={i}>
                                        <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                                        <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                                        <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                                        <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                                        <TableCell><Skeleton className="h-8 w-16" /></TableCell>
                                    </TableRow>
                                ))
                            ) :                             submissions.length > 0 ? (
                                submissions.slice(0, 5).map((submission) => {
                                    const hasReviewBeenSubmitted = submissionReviewStatus[submission.id];
                                    return (
                                        <TableRow key={submission.id} className="bg-gradient-to-r from-blue-50/30 to-purple-50/30 hover:from-blue-50/60 hover:to-purple-50/60 border-l-4 border-l-blue-500">
                                            <TableCell className="font-medium text-gray-900 max-w-[250px] truncate" title={submission.songTitle}>{submission.songTitle}</TableCell>
                                            <TableCell className="font-medium text-gray-700 max-w-[200px] truncate" title={submission.artistName}>{submission.artistName}</TableCell>
                                            <TableCell className="text-gray-600 max-w-[150px] truncate" title={submission.genre}>{submission.genre}</TableCell>
                                            <TableCell>
                                                <Badge variant="secondary" className={hasReviewBeenSubmitted ? "bg-green-100 text-green-800 hover:bg-green-200" : "bg-orange-100 text-orange-800 hover:bg-orange-200"}>
                                                    {hasReviewBeenSubmitted ? "Reviewed" : submission.status}
                                                </Badge>
                                            </TableCell>
                                            <TableCell>
                                                {hasReviewBeenSubmitted ? (
                                                    <Badge variant="outline" className="text-gray-500">
                                                        Completed
                                                    </Badge>
                                                ) : (
                                                    <Button asChild variant="default" size="sm" className="bg-blue-600 hover:bg-blue-700">
                                                        <Link href={`/dashboard/review/${submission.id}`}>
                                                            <FileAudio className="h-4 w-4 mr-1" />
                                                            Review
                                                        </Link>
                                                    </Button>
                                                )}
                                            </TableCell>
                                        </TableRow>
                                    );
                                })
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                                        No submissions to review at this time.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
}
