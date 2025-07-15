'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowUpRight, DollarSign, Music, Star, FileAudio, Loader2 } from "lucide-react";
import { useState, useEffect } from "react";
import { getSubmissions, Submission, getReviewsByReviewer, Review } from "@/lib/firebase/services";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuthState } from "react-firebase-hooks/auth";
import { auth } from "@/lib/firebase/client";

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
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (loadingAuth || !user) return;

        const fetchData = async () => {
            setIsLoading(true);
            const [fetchedSubmissions, fetchedReviews] = await Promise.all([
                getSubmissions(),
                getReviewsByReviewer(user.uid)
            ]);
            setSubmissions(fetchedSubmissions);
            setReviews(fetchedReviews);
            setIsLoading(false);
        }
        fetchData();
    }, [user, loadingAuth]);

    const averageScore = reviews.length > 0
        ? (reviews.reduce((sum, rev) => sum + rev.overallScore, 0) / reviews.length).toFixed(1)
        : "N/A";

    const stats = [
        { title: "Pending Reviews", value: submissions.length.toString(), icon: Music },
        { title: "Total Earnings", value: "$0.00", icon: DollarSign }, // Placeholder, requires payout logic
        { title: "Average Rating", value: averageScore, icon: Star },
    ];

    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold font-headline">Welcome back, {user?.displayName || 'Reviewer'}!</h1>
            
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {isLoading || loadingAuth ? (
                    Array.from({length: 3}).map((_, i) => <StatCardSkeleton key={i}/>)
                ) : (
                    stats.map(stat => (
                        <StatCard key={stat.title} title={stat.title} value={stat.value} icon={stat.icon} />
                    ))
                )}
            </div>

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
                                <TableHead>Artist</TableHead>
                                <TableHead>Track Title</TableHead>
                                <TableHead>Genre</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead><span className="sr-only">Actions</span></TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {isLoading || loadingAuth ? (
                                Array.from({length: 3}).map((_, i) => <SubmissionRowSkeleton key={i} />)
                            ) : submissions.length > 0 ? (
                                submissions.slice(0, 4).map(sub => (
                                    <TableRow key={sub.id}>
                                        <TableCell className="font-medium">{sub.artistName}</TableCell>
                                        <TableCell>{sub.songTitle}</TableCell>
                                        <TableCell>{sub.genre}</TableCell>
                                        <TableCell><Badge variant={sub.status === 'Pending Review' ? 'destructive' : 'secondary'}>{sub.status}</Badge></TableCell>
                                        <TableCell className="text-right">
                                            <Button asChild size="sm" variant="outline">
                                                <Link href={`/dashboard/review/${sub.id}`}>
                                                    Start Review
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
        </div>
    )
}
