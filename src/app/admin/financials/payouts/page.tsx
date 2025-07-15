
'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge, getStatusBadgeVariant } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MoreHorizontal, DollarSign, PlusCircle, Loader2 } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { getPayouts, Payout, getReviewers, Reviewer, createPayout, updatePayoutStatus } from '@/lib/firebase/services';
import Link from "next/link";
import { useEffect, useState } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import dynamic from "next/dynamic";

const CreatePayoutForm = dynamic(() => import("./create-payout-form"), {
    ssr: false,
});


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

export default function PayoutsPage() {
    const [payouts, setPayouts] = useState<Payout[]>([]);
    const [reviewers, setReviewers] = useState<Reviewer[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [updatingId, setUpdatingId] = useState<string | null>(null);
    const { toast } = useToast();

    const fetchPayouts = async () => {
        setIsLoading(true);
        const [fetchedPayouts, fetchedReviewers] = await Promise.all([getPayouts(), getReviewers()]);
        setPayouts(fetchedPayouts);
        setReviewers(fetchedReviewers);
        setIsLoading(false);
    }

    useEffect(() => {
        fetchPayouts();
    }, []);

    const handleCreatePayout = async (payoutData: Omit<Payout, 'id' | 'date' | 'status'>) => {
        setIsSaving(true);
        try {
            await createPayout(payoutData);
            toast({
                title: 'Payout Created',
                description: `A new pending payout for ${payoutData.reviewer.name} has been created.`
            });
            setIsFormOpen(false);
            fetchPayouts(); // Refresh the list
        } catch (error) {
            console.error("Failed to create payout:", error);
            toast({ title: "Error", description: "Failed to create payout.", variant: "destructive" });
        } finally {
            setIsSaving(false);
        }
    }

    const handleMarkAsPaid = async (payoutId: string) => {
        setUpdatingId(payoutId);
        try {
            await updatePayoutStatus(payoutId, 'Paid');
            toast({ title: "Payout Updated", description: "This payout has been marked as paid." });
            fetchPayouts(); // Refresh the list
        } catch (error) {
            toast({ title: "Error", description: "Failed to update payout status.", variant: "destructive" });
            console.error("Payout update failed:", error);
        } finally {
            setUpdatingId(null);
        }
    }

    return (
        <>
            {isFormOpen && (
                <CreatePayoutForm
                    reviewers={reviewers}
                    onSave={handleCreatePayout}
                    onCancel={() => setIsFormOpen(false)}
                    isSaving={isSaving}
                />
            )}
            <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                        <CardTitle>Reviewer Payouts</CardTitle>
                        <CardDescription>Review and process outstanding payments to reviewers.</CardDescription>
                    </div>
                     <Button onClick={() => setIsFormOpen(true)}>
                        <PlusCircle className="mr-2 h-4 w-4" />
                        Create Payout
                    </Button>
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
                                            {updatingId === payout.id ? (
                                                <Loader2 className="h-4 w-4 animate-spin" />
                                            ) : (
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
                                                        {payout.status === 'Pending' && <DropdownMenuItem onClick={() => handleMarkAsPaid(payout.id)}>Mark as Paid</DropdownMenuItem>}
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            )}
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
        </>
    )
}
