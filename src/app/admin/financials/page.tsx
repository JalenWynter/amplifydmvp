
'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { DollarSign, Banknote, Users, CreditCard, TrendingUp } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Link from "next/link";
import { getFinancialStats, FinancialStats, getPayouts, Payout, getTransactionStats } from "@/lib/firebase/services";
import { useEffect, useState } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { subMonths, format } from 'date-fns';
import dynamic from "next/dynamic";

const RevenueChart = dynamic(() => import("@/components/admin/financials/revenue-chart"), {
    ssr: false,
    loading: () => <Skeleton className="h-96" />
});

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

function processPayoutsForChart(payouts: Payout[]) {
    const now = new Date();
    const monthlyData: { [key: string]: { month: string; revenue: number } } = {};

    // Initialize the last 6 months
    for (let i = 5; i >= 0; i--) {
        const date = subMonths(now, i);
        const monthKey = format(date, 'yyyy-MM');
        const monthName = format(date, 'MMM');
        monthlyData[monthKey] = { month: monthName, revenue: 0 };
    }

    payouts.forEach(payout => {
        const payoutDate = new Date(payout.date);
        const monthKey = format(payoutDate, 'yyyy-MM');
        if (monthlyData[monthKey]) {
            const amount = parseFloat(payout.amount.replace('$', ''));
            // This is a proxy for revenue. In a real app, this would come from submissions.
            monthlyData[monthKey].revenue += amount;
        }
    });

    return Object.values(monthlyData);
}

export default function FinancialsPage() {
    const [stats, setStats] = useState<FinancialStats | null>(null);
    const [transactionStats, setTransactionStats] = useState<any>(null);
    const [revenueData, setRevenueData] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            setIsLoading(true);
            const [fetchedStats, fetchedPayouts, fetchedTransactionStats] = await Promise.all([
                getFinancialStats(),
                getPayouts(),
                getTransactionStats()
            ]);
            setStats(fetchedStats);
            setTransactionStats(fetchedTransactionStats);
            setRevenueData(processPayoutsForChart(fetchedPayouts));
            setIsLoading(false);
        }
        fetchData();
    }, []);

    const financialStatsCards = stats && transactionStats ? [
        { title: "Total Revenue (All Time)", value: `$${stats.totalRevenue.toFixed(2)}`, icon: DollarSign },
        { title: "Successful Transactions", value: transactionStats.successfulTransactions.toString(), icon: CreditCard, description: `${transactionStats.totalTransactions} total transactions` },
        { title: "Conversion Rate", value: `${transactionStats.conversionRate.toFixed(1)}%`, icon: TrendingUp, description: `${transactionStats.failedTransactions} failed transactions` },
        { title: "Average Revenue Per User", value: `$${stats.avgRevenuePerUser.toFixed(2)}`, icon: Users, description: `Based on ${stats.totalUsers} users` },
        { title: "Pending Payouts", value: `$${stats.pendingPayouts.toFixed(2)}`, icon: Banknote, description: `${stats.pendingPayoutsCount} payouts pending` },
    ] : [];

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold font-headline">Financials</h1>
                <div className="flex gap-2">
                    <Link href="/admin/financials/payouts">
                        <button className="px-4 py-2 text-sm font-medium rounded-md bg-gray-100 text-gray-700 hover:bg-gray-200">
                            Payouts
                        </button>
                    </Link>
                    <Link href="/admin/financials/transactions">
                        <button className="px-4 py-2 text-sm font-medium rounded-md bg-gray-100 text-gray-700 hover:bg-gray-200">
                            Transactions
                        </button>
                    </Link>
                </div>
            </div>
            
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
                {isLoading ? (
                    Array.from({ length: 5 }).map((_, i) => <StatCardSkeleton key={i} />)
                ) : (
                    financialStatsCards.map(stat => <StatCard key={stat.title} {...stat} />)
                )}
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Revenue Over Time</CardTitle>
                    <CardDescription>Monthly revenue based on payouts over the last 6 months.</CardDescription>
                </CardHeader>
                <CardContent className="pl-2">
                   {isLoading ? <Skeleton className="h-96" /> : <RevenueChart data={revenueData} />}
                </CardContent>
            </Card>
        </div>
    )
}
