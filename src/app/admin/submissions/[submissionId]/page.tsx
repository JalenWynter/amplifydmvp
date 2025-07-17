'use client';

import { use, useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { getSubmissionById, getReviewers, submitReviewAsAdmin, Submission, Reviewer } from "@/lib/firebase/services";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import { Skeleton } from "@/components/ui/skeleton";
import { ShieldX, Loader2, User, Calendar, Music, FileAudio, Crown } from "lucide-react";
import ScoringChart, { reviewSchema, ReviewFormValues } from "@/components/review/scoring-chart";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

function ReviewSkeleton() {
    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <div className="flex items-center gap-2">
                        <Skeleton className="h-8 w-8 rounded-full" />
                        <div>
                            <Skeleton className="h-6 w-48" />
                            <Skeleton className="h-4 w-32 mt-1" />
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="space-y-4">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-4 w-1/2" />
                </CardContent>
            </Card>
            <Skeleton className="h-96 w-full" />
        </div>
    );
}

export default function AdminSubmissionReviewPage({ params }: { params: Promise<{ submissionId: string }> }) {
    const resolvedParams = use(params);
    const [submission, setSubmission] = useState<Submission | null | undefined>(undefined);
    const [reviewers, setReviewers] = useState<Reviewer[]>([]);
    const [selectedReviewerId, setSelectedReviewerId] = useState<string>('');
    const [isLoading, setIsLoading] = useState(false);
    const { toast } = useToast();
    const router = useRouter();

    const form = useForm<ReviewFormValues>({
        resolver: zodResolver(reviewSchema),
        defaultValues: {
            originality: 5, structure: 5, melody: 5, lyrics: 5,
            vocal_performance: 5, instrumental_performance: 5, energy: 5, technical_skill: 5,
            sound_quality: 5, mixing: 5, sound_design: 5, mastering: 5,
            commercial_potential: 5, target_audience: 5, branding: 5, uniqueness: 5,
            strengths: '', improvements: '', overallReview: '',
            audioFeedbackUrl: '', videoFeedbackUrl: '', isDraft: false
        } as any
    });

    const scores = form.watch();

    const overallScore = useMemo(() => {
        const numericScores = Object.keys(scores)
            .filter(key => typeof scores[key as keyof ReviewFormValues] === 'number')
            .map(key => scores[key as keyof ReviewFormValues] as number);
        
        if (numericScores.length === 0) return 0;
        
        const sum = numericScores.reduce((total, score) => total + score, 0);
        return sum / numericScores.length;
    }, [scores]);

    useEffect(() => {
        const fetchData = async () => {
            setSubmission(undefined);
            const [fetchedSubmission, fetchedReviewers] = await Promise.all([
                getSubmissionById(resolvedParams.submissionId),
                getReviewers()
            ]);
            setSubmission(fetchedSubmission);
            setReviewers(fetchedReviewers);
            
            // Pre-select the assigned reviewer
            if (fetchedSubmission) {
                setSelectedReviewerId(fetchedSubmission.reviewerId);
            }
        };
        fetchData();
    }, [resolvedParams.submissionId]);

    const onSubmit = async (data: ReviewFormValues) => {
        if (!submission) {
            toast({
                title: "Submission Not Found",
                description: "Cannot submit review for a non-existent submission.",
                variant: "destructive"
            });
            return;
        }

        if (!selectedReviewerId) {
            toast({
                title: "Reviewer Required",
                description: "Please select a reviewer to submit the review on behalf of.",
                variant: "destructive"
            });
            return;
        }

        setIsLoading(true);

        try {
            const { reviewId, reviewUrl } = await submitReviewAsAdmin(
                submission, 
                data, 
                overallScore, 
                selectedReviewerId
            );
            
            toast({
                title: "Review Submitted!",
                description: `Review completed on behalf of selected reviewer. Artist will receive notification.`,
            });
            
            console.log(`Admin review completed! Artist can view at: ${reviewUrl}`);
            router.push('/admin/submissions');
        } catch (error: any) {
            toast({
                title: "Submission Failed",
                description: error.message || "There was an error submitting the review.",
                variant: "destructive",
            });
        } finally {
            setIsLoading(false);
        }
    };

    if (submission === undefined) {
        return <ReviewSkeleton />;
    }

    if (submission === null) {
        return (
            <div className="flex flex-col items-center justify-center h-full text-center py-20">
                <ShieldX className="w-16 h-16 text-destructive mb-4" />
                <h1 className="text-2xl font-bold">Submission Not Found</h1>
                <p className="text-muted-foreground">The submission you are looking for does not exist or has been removed.</p>
            </div>
        );
    }

    const assignedReviewer = reviewers.find(r => r.id === submission.reviewerId);

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="bg-orange-100 p-2 rounded-full">
                                <Crown className="w-6 h-6 text-orange-600" />
                            </div>
                            <div>
                                <CardTitle className="text-2xl">Admin Review</CardTitle>
                                <CardDescription>Complete review on behalf of reviewer</CardDescription>
                            </div>
                        </div>
                        <Badge variant={submission.status === 'Pending Review' ? 'destructive' : 'secondary'}>
                            {submission.status}
                        </Badge>
                    </div>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <h3 className="font-semibold flex items-center gap-2">
                                <Music className="w-4 h-4" />
                                Track Details
                            </h3>
                            <div className="space-y-1">
                                <p><span className="font-medium">Artist:</span> <span className="break-words" title={submission.artistName}>{submission.artistName}</span></p>
                                <p><span className="font-medium">Song:</span> <span className="break-words" title={submission.songTitle}>{submission.songTitle}</span></p>
                                <p><span className="font-medium">Genre:</span> <span className="break-words" title={submission.genre}>{submission.genre}</span></p>
                            </div>
                        </div>
                        <div className="space-y-2">
                            <h3 className="font-semibold flex items-center gap-2">
                                <Calendar className="w-4 h-4" />
                                Submission Info
                            </h3>
                            <div className="space-y-1">
                                <p><span className="font-medium">Submitted:</span> {new Date(submission.submittedAt).toLocaleDateString()}</p>
                                <p><span className="font-medium">Contact:</span> {submission.contactEmail}</p>
                                <p><span className="font-medium">ID:</span> {submission.id}</p>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <h3 className="font-semibold flex items-center gap-2">
                            <User className="w-4 h-4" />
                            Reviewer Selection
                        </h3>
                        <div className="flex items-center gap-4">
                            <Select value={selectedReviewerId} onValueChange={setSelectedReviewerId}>
                                <SelectTrigger className="w-64">
                                    <SelectValue placeholder="Select reviewer" />
                                </SelectTrigger>
                                <SelectContent>
                                    {reviewers.map((reviewer) => (
                                        <SelectItem key={reviewer.id} value={reviewer.id}>
                                            {reviewer.name} 
                                            {reviewer.id === submission.reviewerId && ' (Assigned)'}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            {assignedReviewer && (
                                <p className="text-sm text-muted-foreground">
                                    Originally assigned to: <span className="font-medium">{assignedReviewer.name}</span>
                                </p>
                            )}
                        </div>
                    </div>

                    <div className="space-y-2">
                        <h3 className="font-semibold flex items-center gap-2">
                            <FileAudio className="w-4 h-4" />
                            Audio File
                        </h3>
                        <audio controls className="w-full">
                            <source src={submission.audioUrl} type="audio/mpeg" />
                            Your browser does not support the audio element.
                        </audio>
                    </div>
                </CardContent>
            </Card>

            <div className="grid md:grid-cols-3 gap-8">
                <div className="md:col-span-2 space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Your Feedback</CardTitle>
                            <CardDescription>Use the sliders and text areas below to provide detailed feedback.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <ScoringChart form={form} scores={scores} />
                        </CardContent>
                    </Card>
                </div>

                <div className="space-y-6 md:sticky top-20">
                    <Card>
                        <CardHeader>
                            <CardTitle>Review Summary</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex justify-between items-center">
                                <span className="text-muted-foreground">Overall Score</span>
                                <span className="text-2xl font-bold text-primary">{overallScore.toFixed(1)}/10</span>
                            </div>
                            <p className="text-sm text-muted-foreground">
                                The overall score is calculated automatically as you complete the scoring chart.
                            </p>
                            <Button
                                onClick={form.handleSubmit(onSubmit)}
                                type="submit"
                                className="w-full bg-accent hover:bg-accent/90"
                                disabled={isLoading}
                            >
                                {isLoading ? (
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                ) : (
                                    <Crown className="mr-2 h-4 w-4" />
                                )}
                                {isLoading ? "Submitting Review..." : "Submit Review as Admin"}
                            </Button>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
} 