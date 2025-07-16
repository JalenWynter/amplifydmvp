
'use client'

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, CheckCircle, Clock, CreditCard, Loader2 } from "lucide-react";
import Link from "next/link";
import { getPayoutById, Payout, updatePayoutStatus } from "@/lib/firebase/services";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useState, useEffect, useCallback, use } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { getStatusBadgeVariant } from "@/components/ui/badge";

function PayoutDetailSkeleton() {
    return (
        <div className="grid md:grid-cols-3 gap-6">
            <div className="md:col-span-2">
                <Card>
                    <CardHeader>
                        <Skeleton className="h-7 w-1/3" />
                        <Skeleton className="h-4 w-2/3" />
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-2">
                            <Skeleton className="h-10 w-full" />
                            <Skeleton className="h-10 w-full" />
                            <Skeleton className="h-10 w-full" />
                        </div>
                    </CardContent>
                </Card>
            </div>
            <div className="space-y-6">
                <Card>
                    <CardHeader>
                        <Skeleton className="h-7 w-1/2" />
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <Skeleton className="h-10 w-3/4" />
                        <Skeleton className="h-4 w-full" />
                        <Skeleton className="h-4 w-full" />
                    </CardContent>
                </Card>
                 <Card>
                    <CardHeader>
                        <Skeleton className="h-7 w-1/2" />
                    </CardHeader>
                    <CardContent className="space-y-4">
                         <div className="flex items-center gap-3">
                            <Skeleton className="h-12 w-12 rounded-full" />
                            <div>
                                <Skeleton className="h-5 w-24" />
                                <Skeleton className="h-4 w-32 mt-1" />
                            </div>
                         </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}

export default function PayoutDetailPage({ params }: { params: Promise<{ payoutId: string }> }) {
  const resolvedParams = use(params);
  const [payout, setPayout] = useState<Payout | null | undefined>(undefined);
  const [isUpdating, setIsUpdating] = useState(false);
  const { toast } = useToast();

  const fetchPayout = useCallback(async () => {
    setPayout(undefined); // Set to loading state
    const fetchedPayout = await getPayoutById(resolvedParams.payoutId);
    setPayout(fetchedPayout);
  }, [resolvedParams.payoutId]);

  useEffect(() => {
    fetchPayout();
  }, [fetchPayout]);

  const handleMarkAsPaid = async () => {
    if (!payout) return;
    setIsUpdating(true);
    try {
        await updatePayoutStatus(payout.id, 'Paid');
        toast({ title: "Payout Updated", description: "This payout has been marked as paid." });
        await fetchPayout(); // Re-fetch to show updated status
    } catch (error) {
        toast({ title: "Error", description: "Failed to update payout status.", variant: "destructive" });
        console.error("Payout update failed:", error);
    } finally {
        setIsUpdating(false);
    }
  }
  
  return (
    <div className="space-y-6">
        <div>
            <Button asChild variant="outline" size="sm" className="mb-4">
                <Link href="/admin/financials/payouts">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back to Payouts
                </Link>
            </Button>
            <h1 className="text-3xl font-bold font-headline">Payout Details</h1>
        </div>

      {payout === undefined ? (
        <PayoutDetailSkeleton />
      ) : payout === null ? (
        <div className="text-center py-10 border rounded-lg">
            <h2 className="text-2xl font-bold">Payout not found</h2>
            <p className="text-muted-foreground">This payout may have been removed or does not exist.</p>
        </div>
      ) : (
        <div className="grid md:grid-cols-3 gap-6">
            <div className="md:col-span-2">
                <Card>
                    <CardHeader>
                        <CardTitle>Included Reviews</CardTitle>
                        <CardDescription>List of all reviews included in this payout total.</CardDescription>
                    </CardHeader>
                    <CardContent>
                    <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Artist</TableHead>
                                    <TableHead>Song</TableHead>
                                    <TableHead>Review Date</TableHead>
                                    <TableHead className="text-right">Fee</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {payout.reviews.map(review => (
                                    <TableRow key={review.id}>
                                        <TableCell className="font-medium">{review.artist}</TableCell>
                                        <TableCell>{review.song}</TableCell>
                                        <TableCell>{new Date(review.date).toLocaleDateString()}</TableCell>
                                        <TableCell className="text-right font-mono">${review.fee.toFixed(2)}</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                    </Table>
                    </CardContent>
                </Card>
            </div>
            <div className="space-y-6">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-lg">Summary</CardTitle>
                        <Badge variant={'secondary'} className={getStatusBadgeVariant(payout.status)}>
                            {payout.status}
                        </Badge>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="text-4xl font-bold text-primary">{payout.amount}</div>
                        <div className="text-sm text-muted-foreground">
                            <div className="flex items-center gap-2"><Clock className="w-3 h-3"/> Requested on {new Date(payout.date).toLocaleDateString()}</div>
                            {payout.paidDate && <div className="flex items-center gap-2"><CheckCircle className="w-3 h-3"/> Paid on {new Date(payout.paidDate).toLocaleDateString()}</div>}
                        </div>
                    </CardContent>
                    {payout.status === "Pending" && (
                        <CardContent>
                            <Button className="w-full" onClick={handleMarkAsPaid} disabled={isUpdating}>
                                {isUpdating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Mark as Paid
                            </Button>
                        </CardContent>
                    )}
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="text-lg">Reviewer</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex items-center gap-3">
                            <Avatar>
                                <AvatarImage src={payout.reviewer.avatarUrl} alt={payout.reviewer.name} />
                                <AvatarFallback>{payout.reviewer.name.charAt(0)}</AvatarFallback>
                            </Avatar>
                            <div>
                                <div className="font-semibold">{payout.reviewer.name}</div>
                                <div className="text-sm text-muted-foreground">{payout.reviewer.email}</div>
                            </div>
                        </div>
                        <Separator />
                        <div className="text-sm space-y-2">
                            <div className="flex items-center gap-2 text-muted-foreground"><CreditCard className="w-4 h-4" /> Payout Method: {payout.paymentMethod}</div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
      )}
    </div>
  );
}
