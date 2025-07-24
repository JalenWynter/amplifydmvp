'use client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getDashboardStats, getUsers, getSubmissions, getRecentActivityEvents } from "@/lib/firebase/services";
import { DashboardStats, User, Submission, ActivityEvent } from "@/lib/types";
import { useEffect, useState } from 'react';
import { Skeleton } from "@/components/ui/skeleton";
import { subMonths, format } from 'date-fns';
import dynamic from "next/dynamic";
import { Users, UserCheck, Music, CheckSquare } from 'lucide-react';

const UserGrowthChart = dynamic(() => import("@/components/admin/dashboard/user-growth-chart"), {
    ssr: false,
    loading: () => <Skeleton className="h-80" />
});
const SubmissionTrendChart = dynamic(() => import("@/components/admin/dashboard/submission-trend-chart"), {
    ssr: false,
    loading: () => <Skeleton className="h-80" />
});

const ReferralCodeManager = dynamic(() => import("@/components/admin/referral-code-manager"), {
    ssr: false,
    loading: () => <Skeleton className="h-80" />
});

function StatCard({ title, value, icon: Icon, description }: { title: string, value: string, icon: React.ElementType, description?: string }) {
    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{title}</CardTitle>
                <Icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold">{value}</div>
                {description && <p className="text-xs text-muted-foreground">{description}</p>}
            </CardContent>
        </Card>
    )
}

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

function processUserDataForChart(users: User[]) {
    const now = new Date();
    const monthlyData: { [key: string]: { month: string; users: number; reviewers: number } } = {};

    // Initialize the last 6 months
    for (let i = 5; i >= 0; i--) {
        const date = subMonths(now, i);
        const monthKey = format(date, 'yyyy-MM');
        const monthName = format(date, 'MMM');
        monthlyData[monthKey] = { month: monthName, users: 0, reviewers: 0 };
    }

    users.forEach(user => {
        const joinedDate = new Date(user.joinedAt);
        const monthKey = format(joinedDate, 'yyyy-MM');
        if (monthlyData[monthKey]) {
            monthlyData[monthKey].users++;
            if (user.role === 'reviewer') {
                monthlyData[monthKey].reviewers++;
            }
        }
    });

    return Object.values(monthlyData);
}

function processSubmissionDataForChart(submissions: Submission[]) {
    const now = new Date();
    const monthlyData: { [key: string]: { month: string; pop: number; rock: number; hiphop: number, electronic: number } } = {};

    for (let i = 5; i >= 0; i--) {
        const date = subMonths(now, i);
        const monthKey = format(date, 'yyyy-MM');
        const monthName = format(date, 'MMM');
        monthlyData[monthKey] = { month: monthName, pop: 0, rock: 0, hiphop: 0, electronic: 0 };
    }

    submissions.forEach(sub => {
        const subDate = new Date(sub.submittedAt);
        const monthKey = format(subDate, 'yyyy-MM');
        if (monthlyData[monthKey]) {
            switch(sub.genre) {
                case 'Pop': monthlyData[monthKey].pop++; break;
                case 'Rock/Indie': monthlyData[monthKey].rock++; break;
                case 'Hip-Hop/R&B': monthlyData[monthKey].hiphop++; break;
                case 'Electronic': monthlyData[monthKey].electronic++; break;
            }
        }
    });

    return Object.values(monthlyData);
}

export default function AdminPage() {
    const [stats, setStats] = useState<DashboardStats | null>(null);
    const [userGrowthData, setUserGrowthData] = useState<{ month: string; users: number; reviewers: number }[]>([]);
    const [submissionTrendData, setSubmissionTrendData] = useState<{ month: string; pop: number; rock: number; hiphop: number; electronic: number }[]>([]);
    const [recentActivity, setRecentActivity] = useState<ActivityEvent[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            setIsLoading(true);
            const [fetchedStats, fetchedUsers, fetchedSubmissions, fetchedActivity] = await Promise.all([
                getDashboardStats(),
                getUsers(),
                getSubmissions({ all: true }), // Fetch all submissions for chart
                getRecentActivityEvents(5) // Fetch recent activity events
            ]);
            setStats(fetchedStats);
            setUserGrowthData(processUserDataForChart(fetchedUsers));
            setSubmissionTrendData(processSubmissionDataForChart(fetchedSubmissions));
            setRecentActivity(fetchedActivity);
            setIsLoading(false);
        }
        fetchData();
    }, []);

    const adminStats = stats ? [
        { title: "Total Users", value: stats.totalUsers.toString(), icon: Users },
        { title: "Total Reviewers", value: stats.totalReviewers.toString(), icon: UserCheck },
        { title: "Music Submissions", value: stats.totalSubmissions.toString(), icon: Music },
        { title: "Completed Reviews", value: stats.completedReviews.toString(), icon: CheckSquare },
    ] : [];

    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold font-headline">Platform Overview</h1>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                {isLoading ? (
                    Array.from({length: 4}).map((_, i) => <StatCardSkeleton key={i} />)
                ) : (
                    adminStats.map(stat => <StatCard key={stat.title} {...stat} />)
                )}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                 <Card>
                    <CardHeader>
                        <CardTitle>User Growth</CardTitle>
                        <CardDescription>
                            Monthly new users and reviewers over the last 6 months.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="pl-2">
                        {isLoading ? <Skeleton className="h-80" /> : <UserGrowthChart data={userGrowthData} />}
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader>
                        <CardTitle>Submission Trends</CardTitle>
                        <CardDescription>
                            Monthly music submissions by genre.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="pl-2">
                       {isLoading ? <Skeleton className="h-80" /> : <SubmissionTrendChart data={submissionTrendData} />}
                    </CardContent>
                </Card>
            </div>
             <div className="grid grid-cols-1 gap-6">
                <Card>
                    <CardHeader>
                        <CardTitle>Recent Activity</CardTitle>
                        <CardDescription>
                            Recent platform events and actions.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                       {isLoading ? (
                            <Skeleton className="h-40 w-full" />
                        ) : recentActivity.length > 0 ? (
                            <ul className="space-y-2">
                                {recentActivity.map((event) => (
                                    <li key={event.id} className="border-b pb-2 last:border-b-0">
                                        <p className="text-sm font-medium">{event.type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</p>
                                        <p className="text-xs text-muted-foreground">{new Date(event.timestamp).toLocaleString()}</p>
                                        {event.userEmail && <p className="text-xs text-muted-foreground">By: {event.userEmail}</p>}
                                        {event.details && Object.keys(event.details).length > 0 && (
                                            <p className="text-xs text-muted-foreground">Details: {JSON.stringify(event.details)}</p>
                                        )}
                                    </li>
                                ))}
                            </ul>
                        ) : (
                            <div className="text-center py-10 border-2 border-dashed rounded-lg">
                                <p className="text-muted-foreground">No recent activity to display.</p>
                            </div>
                        )}
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader>
                        <CardTitle>Referral Code Management</CardTitle>
                        <CardDescription>
                            Create and manage referral codes for reviewers.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <ReferralCodeManager />
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}