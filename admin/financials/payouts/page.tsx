'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MoreHorizontal, DollarSign } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { getPayouts, createPayout, updatePayoutStatus } from '@/lib/firebase/payouts';
import { getReviewers } from '@/lib/firebase/reviewers'; // Assuming getReviewers is in reviewers.ts
import { Payout, Reviewer } from '@/lib/types';
import Link from "next/link";
import { useEffect, useState } from "react";
import { Skeleton } from "@/components/ui/skeleton";

function PayoutRowSkeleton() {
    return (
        <TableRow>
            <TableCell><Skeleton className="h-4 w-32" /></TableCell>
            <TableCell><Skeleton className="h-4 w-24" /></TableCell>
            <TableCell><Skeleton className="h-6 w-20 rounded-full" /></TableCell>
            <TableCell><Skeleton className="h-4 w-24" /></TableCell>
            <TableCell><Skeleton className="h-8 w-8" /></TableCell>
        </TableRow>
    )
}

function EmptyState() {
    return (
        <TableRow>
            <TableCell colSpan={5}>
                <div className="text-center py-10">
                    <DollarSign className="mx-auto h-12 w-12 text-gray-400" />
                    <h3 className="mt-2 text-sm font-medium text-gray-900">No Payouts</h3>
                    <p className="mt-1 text-sm text-gray-500">There are no pending or completed payouts to display.</p>
                </div>
            </TableCell>
        </TableRow>
    )
}


const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'Paid': return 'bg-green-100 text-green-800';
      case 'In-Transit': return 'bg-blue-100 text-blue-800';
      default: return 'bg-yellow-100 text-yellow-800';
    }
  }


export default function PayoutsPage() {
    const [payouts, setPayouts] = useState<Payout[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchPayouts = async () => {
            setIsLoading(true);
            const fetchedPayouts = await getPayouts();
            setPayouts(fetchedPayouts);
            setIsLoading(false);
        }
        fetchPayouts();
    }, []);

    return (
        <Card>
            <CardHeader>
                <CardTitle>Reviewer Payouts</CardTitle>
                <CardDescription>Review and process outstanding payments to reviewers.</CardDescription>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Reviewer</TableHead>
                            <TableHead>Amount</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Request Date</TableHead>
                            <TableHead>
                                <span className="sr-only">Actions</span>
                            </TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoading ? (
                            Array.from({length: 3}).map((_, i) => <PayoutRowSkeleton key={i} />)
                        ) : payouts.length > 0 ? (
                            payouts.map((payout) => (
                                <TableRow key={payout.id}>
                                    <TableCell className="font-medium">{payout.reviewer.name}</TableCell>
                                    <TableCell>{payout.amount}</TableCell>
                                    <TableCell>
                                        <Badge variant={'secondary'} className={getStatusBadgeVariant(payout.status)}>
                                            {payout.status}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>{new Date(payout.date).toLocaleDateString()}</TableCell>
                                    <TableCell className="text-right">
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                            <Button aria-haspopup="true" size="icon" variant="ghost">
                                                <MoreHorizontal className="h-4 w-4" />
                                                <span className="sr-only">Toggle menu</span>
                                            </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuItem asChild>
                                                    <Link href={`/admin/financials/payouts/${payout.id}`}>View Details</Link>
                                                </DropdownMenuItem>
                                                {payout.status === 'Pending' && <DropdownMenuItem>Mark as Paid</DropdownMenuItem>}
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
    )
}
