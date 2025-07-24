'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge, getStatusBadgeVariant } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MoreHorizontal, CreditCard, RefreshCw, Loader2 } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { getTransactions, getReviewers } from '@/lib/firebase/services';
import { Transaction, Reviewer } from '@/lib/types';
import Link from "next/link";
import { useEffect, useState } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";

function TransactionRowSkeleton() {
    return (
        <TableRow>
            <TableCell><Skeleton className="h-4 w-32" /></TableCell>
            <TableCell><Skeleton className="h-4 w-24" /></TableCell>
            <TableCell><Skeleton className="h-4 w-20" /></TableCell>
            <TableCell><Skeleton className="h-6 w-20 rounded-full" /></TableCell>
            <TableCell><Skeleton className="h-4 w-24" /></TableCell>
            <TableCell><Skeleton className="h-8 w-8" /></TableCell>
        </TableRow>
    )
}

function EmptyState() {
    return (
        <TableRow>
            <TableCell colSpan={6}>
                <div className="text-center py-10">
                    <CreditCard className="mx-auto h-12 w-12 text-gray-400" />
                    <h3 className="mt-2 text-sm font-medium text-gray-900">No Transactions</h3>
                    <p className="mt-1 text-sm text-gray-500">There are no transactions to display.</p>
                </div>
            </TableCell>
        </TableRow>
    )
}

export default function TransactionsPage() {
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [reviewers, setReviewers] = useState<Reviewer[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const { toast } = useToast();

    const fetchTransactions = async () => {
        setIsLoading(true);
        try {
            const [fetchedTransactions, fetchedReviewers] = await Promise.all([getTransactions(), getReviewers()]);
            setTransactions(fetchedTransactions);
            setReviewers(fetchedReviewers);
        } catch (error) {
            console.error('Error fetching transactions:', error);
            toast({
                title: "Error",
                description: "Failed to load transactions.",
                variant: "destructive"
            });
        } finally {
            setIsLoading(false);
        }
    }

    useEffect(() => {
        fetchTransactions();
    }, []);

    const getReviewerName = (reviewerId: string) => {
        const reviewer = reviewers.find(r => r.id === reviewerId);
        return reviewer ? reviewer.name : 'Unknown Reviewer';
    };

    const getStatusBadgeVariant = (status: Transaction['status']) => {
        switch (status) {
            case 'completed': return 'bg-green-100 text-green-800';
            case 'failed': return 'bg-red-100 text-red-800';
            case 'cancelled': return 'bg-gray-100 text-gray-800';
            case 'pending': return 'bg-yellow-100 text-yellow-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    const formatAmount = (amountInCents: number) => {
        return `$${(amountInCents / 100).toFixed(2)}`;
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold font-headline">Transactions</h1>
                <div className="flex gap-2">
                    <Link href="/admin/financials">
                        <button className="px-4 py-2 text-sm font-medium rounded-md bg-gray-100 text-gray-700 hover:bg-gray-200">
                            Overview
                        </button>
                    </Link>
                    <Link href="/admin/financials/payouts">
                        <button className="px-4 py-2 text-sm font-medium rounded-md bg-gray-100 text-gray-700 hover:bg-gray-200">
                            Payouts
                        </button>
                    </Link>
                </div>
            </div>
            
            <Card>
            <CardHeader className="flex flex-row items-center justify-between">
                <div>
                    <CardTitle>Payment Transactions</CardTitle>
                    <CardDescription>View and monitor all Stripe payment transactions.</CardDescription>
                </div>
                <Button onClick={fetchTransactions} disabled={isLoading}>
                    <RefreshCw className={`mr-2 h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
                    Refresh
                </Button>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Artist</TableHead>
                            <TableHead>Song</TableHead>
                            <TableHead>Amount</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Date</TableHead>
                            <TableHead>
                                <span className="sr-only">Actions</span>
                            </TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoading ? (
                            Array.from({length: 5}).map((_, i) => <TransactionRowSkeleton key={i} />)
                        ) : transactions.length > 0 ? (
                            transactions.map((transaction) => (
                                <TableRow key={transaction.id}>
                                    <TableCell className="max-w-[250px]">
                                        <div>
                                            <div className="font-medium truncate" title={transaction.artistName}>{transaction.artistName}</div>
                                            <div className="text-sm text-muted-foreground truncate" title={transaction.uploaderEmail || 'N/A'}>{transaction.uploaderEmail || 'N/A'}</div>
                                        </div>
                                    </TableCell>
                                    <TableCell className="max-w-[250px]">
                                        <div>
                                            <div className="font-medium truncate" title={transaction.songTitle}>{transaction.songTitle}</div>
                                            <div className="text-sm text-muted-foreground truncate" title={getReviewerName(transaction.reviewerId || 'N/A')}>{getReviewerName(transaction.reviewerId || 'N/A')}</div>
                                        </div>
                                    </TableCell>
                                    <TableCell className="font-mono">{formatAmount(transaction.amount)}</TableCell>
                                    <TableCell>
                                        <Badge variant={'secondary'} className={getStatusBadgeVariant(transaction.status)}>
                                            {transaction.status}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>{new Date(transaction.createdAt).toLocaleDateString()}</TableCell>
                                    <TableCell>
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button aria-haspopup="true" size="icon" variant="ghost">
                                                    <MoreHorizontal className="h-4 w-4" />
                                                    <span className="sr-only">Toggle menu</span>
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuItem asChild>
                                                    <Link href={`/admin/financials/transactions/${transaction.id}`}>View Details</Link>
                                                </DropdownMenuItem>
                                                {transaction.stripeSessionId && (
                                                    <DropdownMenuItem asChild>
                                                        <a href={`https://dashboard.stripe.com/test/payments/${transaction.stripePaymentIntentId || transaction.stripeSessionId}`} target="_blank" rel="noopener noreferrer">
                                                            View in Stripe
                                                        </a>
                                                    </DropdownMenuItem>
                                                )}
                                            </DropdownMenuContent>
                                        </DropdownMenu>
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
    );
} 