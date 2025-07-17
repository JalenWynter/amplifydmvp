'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { Eye, FileText, Loader2, Star, Clock, User, Music2 } from "lucide-react";
import { useState, useEffect } from "react";
import { getSubmissionsForAdmin, getReviewers, Submission, Reviewer } from "@/lib/firebase/services";
import { Skeleton } from "@/components/ui/skeleton";

function SubmissionRowSkeleton() {
    return (
        <TableRow>
            <TableCell><Skeleton className="h-4 w-32" /></TableCell>
            <TableCell><Skeleton className="h-4 w-48" /></TableCell>
            <TableCell><Skeleton className="h-4 w-24" /></TableCell>
            <TableCell><Skeleton className="h-4 w-24" /></TableCell>
            <TableCell><Skeleton className="h-4 w-20" /></TableCell>
            <TableCell><Skeleton className="h-4 w-16" /></TableCell>
            <TableCell><Skeleton className="h-9 w-32" /></TableCell>
        </TableRow>
    )
}

function EmptyState() {
    return (
        <TableRow>
            <TableCell colSpan={7}>
                <div className="text-center py-10">
                    <Music2 className="mx-auto h-12 w-12 text-gray-400" />
                    <h3 className="mt-2 text-sm font-medium text-gray-900">No Submissions Found</h3>
                    <p className="mt-1 text-sm text-gray-500">There are no submissions in the system yet.</p>
                </div>
            </TableCell>
        </TableRow>
    )
}

function getStatusBadgeVariant(status: string) {
    switch (status) {
        case 'Pending Review':
            return 'bg-yellow-100 text-yellow-800';
        case 'In Progress':
            return 'bg-blue-100 text-blue-800';
        case 'Reviewed':
            return 'bg-green-100 text-green-800';
        default:
            return 'bg-gray-100 text-gray-800';
    }
}

export default function AdminSubmissionsPage() {
    const [submissions, setSubmissions] = useState<Submission[]>([]);
    const [reviewers, setReviewers] = useState<Reviewer[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            setIsLoading(true);
            const [fetchedSubmissions, fetchedReviewers] = await Promise.all([
                getSubmissionsForAdmin(),
                getReviewers()
            ]);
            setSubmissions(fetchedSubmissions);
            setReviewers(fetchedReviewers);
            setIsLoading(false);
        }
        fetchData();
    }, []);

    const getReviewerName = (reviewerId: string) => {
        const reviewer = reviewers.find(r => r.id === reviewerId);
        return reviewer?.name || 'Unknown';
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle>All Submissions</CardTitle>
                <CardDescription>
                    Manage all track submissions and complete reviews on behalf of reviewers.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Artist</TableHead>
                            <TableHead>Track Title</TableHead>
                            <TableHead>Genre</TableHead>
                            <TableHead>Assigned Reviewer</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Submitted</TableHead>
                            <TableHead><span className="sr-only">Actions</span></TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoading ? (
                            Array.from({length: 8}).map((_, i) => <SubmissionRowSkeleton key={i} />)
                        ) : submissions.length > 0 ? (
                            submissions.map((submission) => (
                                <TableRow key={submission.id}>
                                    <TableCell className="font-medium max-w-[200px] truncate" title={submission.artistName}>{submission.artistName}</TableCell>
                                    <TableCell className="max-w-[250px] truncate" title={submission.songTitle}>{submission.songTitle}</TableCell>
                                    <TableCell className="max-w-[150px] truncate" title={submission.genre}>{submission.genre}</TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-2">
                                            <User className="w-4 h-4 text-muted-foreground" />
                                            <span>{getReviewerName(submission.reviewerId)}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant={'secondary'} className={getStatusBadgeVariant(submission.status)}>
                                            {submission.status}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-2">
                                            <Clock className="w-4 h-4 text-muted-foreground" />
                                            <span className="text-sm">
                                                {new Date(submission.submittedAt).toLocaleDateString()}
                                            </span>
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex items-center gap-2">
                                            <Button asChild size="sm" variant="outline">
                                                <Link href={`/admin/submissions/${submission.id}`}>
                                                    <Eye className="mr-2 h-4 w-4" />
                                                    {submission.status === 'Pending Review' ? 'Review' : 'View'}
                                                </Link>
                                            </Button>
                                        </div>
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