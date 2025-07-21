'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Star, Music, Clock, User, BarChart3, CheckCircle, Mic, Video, Headphones } from "lucide-react";
import { useState, useEffect, use } from "react";
import { getReviewById, getReviewerById, getSubmissionById, Review, Reviewer, Submission } from "@/lib/firebase/services";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import Link from "next/link";

function ReviewSkeleton() {
    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <Skeleton className="h-8 w-3/4" />
                    <Skeleton className="h-4 w-1/2" />
                </CardHeader>
                <CardContent>
                    <Skeleton className="h-16 w-full" />
                </CardContent>
            </Card>
            <Card>
                <CardHeader>
                    <Skeleton className="h-6 w-1/3" />
                </CardHeader>
                <CardContent>
                    <Skeleton className="h-32 w-full" />
                </CardContent>
            </Card>
        </div>
    );
}

const scoreCategories = [
    { key: 'originality', label: 'Originality', icon: '🎨' },
    { key: 'structure', label: 'Structure', icon: '🏗️' },
    { key: 'melody', label: 'Melody', icon: '🎵' },
    { key: 'lyrics', label: 'Lyrics', icon: '📝' },
    { key: 'vocal_performance', label: 'Vocal Performance', icon: '🎤' },
    { key: 'instrumental_performance', label: 'Instrumental Performance', icon: '🎸' },
    { key: 'energy', label: 'Energy', icon: '⚡' },
    { key: 'technical_skill', label: 'Technical Skill', icon: '🔧' },
    { key: 'sound_quality', label: 'Sound Quality', icon: '🔊' },
    { key: 'mixing', label: 'Mixing', icon: '🎛️' },
    { key: 'sound_design', label: 'Sound Design', icon: '🎚️' },
    { key: 'mastering', label: 'Mastering', icon: '💿' },
    { key: 'commercial_potential', label: 'Commercial Potential', icon: '📈' },
    { key: 'target_audience', label: 'Target Audience', icon: '👥' },
    { key: 'branding', label: 'Branding', icon: '🏷️' },
    { key: 'uniqueness', label: 'Uniqueness', icon: '💎' },
];

export default function PublicReviewPage({ params }: { params: Promise<{ reviewId: string }> }) {
    const resolvedParams = use(params);
    const [review, setReview] = useState<Review | null | undefined>(undefined);
    const [reviewer, setReviewer] = useState<Reviewer | null>(null);
    const [submission, setSubmission] = useState<Submission | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchReviewData = async () => {
            setIsLoading(true);
            try {
                const fetchedReview = await getReviewById(resolvedParams.reviewId);
                setReview(fetchedReview);
                
                if (fetchedReview) {
                    const [fetchedReviewer, fetchedSubmission] = await Promise.all([
                        getReviewerById(fetchedReview.reviewerId),
                        getSubmissionById(fetchedReview.submissionId)
                    ]);
                    setReviewer(fetchedReviewer);
                    setSubmission(fetchedSubmission);
                }
            } catch (error) {
                console.error('Error fetching review:', error);
                setReview(null);
            } finally {
                setIsLoading(false);
            }
        };

        fetchReviewData();
    }, [resolvedParams.reviewId]);

    if (isLoading) {
        return (
            <div className="max-w-4xl mx-auto p-6">
                <ReviewSkeleton />
            </div>
        );
    }

    if (!review) {
        return (
            <div className="max-w-4xl mx-auto p-6">
                <div className="text-center py-20">
                    <div className="mx-auto bg-red-100 p-3 rounded-full w-fit">
                        <Music className="w-12 h-12 text-red-600" />
                    </div>
                    <h1 className="text-2xl font-bold mt-4">Review Not Found</h1>
                    <p className="text-muted-foreground mt-2">
                        The review you&apos;re looking for doesn&apos;t exist or has been removed.
                    </p>
                    <Button asChild className="mt-6">
                        <Link href="/">Submit a New Track</Link>
                    </Button>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto p-6 space-y-8">
            {/* Header */}
            <div className="text-center space-y-4">
                <div className="mx-auto bg-green-100 p-3 rounded-full w-fit">
                    <CheckCircle className="w-12 h-12 text-green-600" />
                </div>
                <h1 className="text-3xl font-bold font-headline">Your Review is Complete!</h1>
                <p className="text-muted-foreground">
                    Professional feedback for your track by {reviewer?.name || 'Professional Reviewer'}
                </p>
            </div>

            {/* Track Info */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 break-words">
                        <Music className="w-5 h-5 flex-shrink-0" />
                        <span title={`"${review.submissionDetails.songTitle}"`}>"{review.submissionDetails.songTitle}"</span>
                    </CardTitle>
                    <CardDescription className="break-words" title={`by ${review.submissionDetails.artistName}`}>by {review.submissionDetails.artistName}</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                            <Clock className="w-4 h-4" />
                            Reviewed on {new Date(review.createdAt).toLocaleDateString()}
                        </div>
                        {reviewer && (
                            <div className="flex items-center gap-1">
                                <User className="w-4 h-4" />
                                Reviewed by {reviewer.name}
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>

            {/* Original Track Audio */}
            {submission && (
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Headphones className="w-5 h-5" />
                            Listen to the Original Track
                        </CardTitle>
                        <CardDescription>
                            The original song that was submitted for review
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {submission.audioUrl ? (
                            <div className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-lg p-6 flex flex-col items-center gap-4">
                                <div className="flex items-center gap-3">
                                    <Music className="w-8 h-8 text-blue-600" />
                                    <div className="text-center">
                                        <div className="font-semibold text-gray-900">
                                            "{submission.songTitle}"
                                        </div>
                                        <div className="text-sm text-gray-600">
                                            by {submission.artistName}
                                        </div>
                                    </div>
                                </div>
                                <audio controls className="w-full max-w-md">
                                    <source src={submission.audioUrl} type="audio/mpeg" />
                                    <source src={submission.audioUrl} type="audio/wav" />
                                    <source src={submission.audioUrl} type="audio/ogg" />
                                    Your browser does not support the audio element.
                                </audio>
                                <div className="text-xs text-gray-500 text-center">
                                    🎵 Listen to understand the context of the review below
                                </div>
                            </div>
                        ) : (
                            <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 text-center">
                                <Headphones className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                                <p className="text-sm text-gray-600">
                                    Original audio file not available
                                </p>
                            </div>
                        )}
                    </CardContent>
                </Card>
            )}

            {/* Overall Score */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <BarChart3 className="w-5 h-5" />
                        Overall Score
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                            <Star className="w-8 h-8 text-yellow-400 fill-current" />
                            <span className="text-4xl font-bold">{review.overallScore.toFixed(1)}</span>
                            <span className="text-xl text-muted-foreground">/10</span>
                        </div>
                        <Badge variant="secondary" className="text-base px-3 py-1">
                            {review.overallScore >= 8 ? 'Excellent' : 
                             review.overallScore >= 6 ? 'Good' : 
                             review.overallScore >= 4 ? 'Average' : 'Needs Improvement'}
                        </Badge>
                    </div>
                </CardContent>
            </Card>

            {/* Detailed Scores */}
            <Card>
                <CardHeader>
                    <CardTitle>Detailed Scoring</CardTitle>
                    <CardDescription>Breakdown of your track across all review categories</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {scoreCategories.map(category => {
                            const score = review.scores[category.key] || 0;
                            return (
                                <div key={category.key} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                                    <div className="flex items-center gap-2">
                                        <span className="text-xl">{category.icon}</span>
                                        <span className="font-medium">{category.label}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <div className="flex">
                                            {Array.from({ length: 10 }, (_, i) => (
                                                <Star 
                                                    key={i} 
                                                    className={`w-4 h-4 ${i < score ? 'text-yellow-400 fill-current' : 'text-gray-300'}`} 
                                                />
                                            ))}
                                        </div>
                                        <span className="font-bold text-lg">{score}</span>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </CardContent>
            </Card>

            {/* Written Feedback */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                    <CardHeader>
                        <CardTitle className="text-green-600">🎯 Strengths</CardTitle>
                        <CardDescription>What&apos;s working well in your track</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="max-w-full overflow-hidden">
                            <p className="whitespace-pre-wrap text-sm leading-relaxed break-words">
                                {review.strengths || 'No specific strengths noted.'}
                            </p>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="text-orange-600">🔧 Areas for Improvement</CardTitle>
                        <CardDescription>Suggestions to enhance your track</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="max-w-full overflow-hidden">
                            <p className="whitespace-pre-wrap text-sm leading-relaxed break-words">
                                {review.improvements || 'No specific improvements suggested.'}
                            </p>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Summary */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-blue-600">📝 Overall Review</CardTitle>
                    <CardDescription>Comprehensive assessment and recommendations</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="max-w-full overflow-hidden">
                        <p className="whitespace-pre-wrap leading-relaxed text-sm break-words">
                            {review.summary || 'No overall review provided.'}
                        </p>
                    </div>
                    
                    {/* Audio Feedback */}
                    {review.audioFeedbackUrl && (
                        <div className="mt-6 p-4 bg-muted/50 rounded-lg">
                            <h4 className="font-semibold mb-2 flex items-center gap-2">
                                <Mic className="w-4 h-4" />
                                Audio Feedback
                            </h4>
                            <audio controls className="w-full">
                                <source src={review.audioFeedbackUrl} type="audio/webm" />
                                Your browser does not support the audio element.
                            </audio>
                        </div>
                    )}
                    
                    {/* Video Feedback */}
                    {review.videoFeedbackUrl && (
                        <div className="mt-6 p-4 bg-muted/50 rounded-lg">
                            <h4 className="font-semibold mb-2 flex items-center gap-2">
                                <Video className="w-4 h-4" />
                                Video Feedback
                            </h4>
                            <video controls className="w-full max-w-md rounded-lg">
                                <source src={review.videoFeedbackUrl} type="video/webm" />
                                Your browser does not support the video element.
                            </video>
                        </div>
                    )}
                </CardContent>
            </Card>

            <Separator />

            {/* Footer */}
            <div className="text-center space-y-4">
                <p className="text-sm text-muted-foreground">
                    Thank you for using Amplifyd! Ready to get more feedback?
                </p>
                <Button asChild size="lg">
                    <Link href="/">Submit Another Track</Link>
                </Button>
            </div>
        </div>
    );
} 