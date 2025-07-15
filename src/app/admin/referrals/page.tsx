
'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge, getStatusBadgeVariant } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { PlusCircle, Key, Loader2 } from "lucide-react";
import { useState, useEffect } from "react";
import { formatDistanceToNow } from 'date-fns';
import { getReferralCodes, ReferralCode } from "@/lib/firebase/services";
import { Skeleton } from "@/components/ui/skeleton";

function CodeRowSkeleton() {
    return (
        <TableRow>
            <TableCell><Skeleton className="h-4 w-32" /></TableCell>
            <TableCell><Skeleton className="h-4 w-48" /></TableCell>
            <TableCell><Skeleton className="h-6 w-20 rounded-full" /></TableCell>
            <TableCell><Skeleton className="h-4 w-24" /></TableCell>
        </TableRow>
    )
}

function EmptyState() {
    return (
        <TableRow>
            <TableCell colSpan={4}>
                <div className="text-center py-10">
                    <Key className="mx-auto h-12 w-12 text-gray-400" />
                    <h3 className="mt-2 text-sm font-medium text-gray-900">No Invite Codes</h3>
                    <p className="mt-1 text-sm text-gray-500">No referral codes have been generated yet.</p>
                </div>
            </TableCell>
        </TableRow>
    )
}

export default function ViewReferralCodesPage() {
    const [referralCodes, setReferralCodes] = useState<ReferralCode[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [_, setNow] = useState(new Date()); // Used to force re-renders for timeago

    useEffect(() => {
        const fetchCodes = async () => {
            setIsLoading(true);
            const codes = await getReferralCodes();
            setReferralCodes(codes);
            setIsLoading(false);
        }
        fetchCodes();

        const interval = setInterval(() => {
            setNow(new Date());
        }, 30000); // Update every 30 seconds

        return () => clearInterval(interval);
    }, []);
    
    const getTimeLeft = (createdAt: string, status: string) => {
        if (status !== 'Active') return 'N/A';
        const createdDate = new Date(createdAt);
        const expiryDate = new Date(createdDate.getTime() + 24 * 60 * 60 * 1000);
        const now = new Date();

        if (now > expiryDate) {
            // In a real app, a background job would update this status to 'Expired'.
            // For now, we'll just display it.
            return 'Expired';
        }
        
        return `${formatDistanceToNow(expiryDate)} left`;
    }

    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between">
                <div>
                    <CardTitle>Recruitment Invites</CardTitle>
                    <CardDescription>View and track all single-use referral invites.</CardDescription>
                </div>
                <Button asChild>
                    <Link href="/admin/referrals/generate">
                        <PlusCircle className="mr-2 h-4 w-4" />
                        Generate New Invite
                    </Link>
                </Button>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Invite Code</TableHead>
                            <TableHead>Associated Referrer</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Expires In</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoading ? (
                            Array.from({ length: 3 }).map((_, i) => <CodeRowSkeleton key={i} />)
                        ) : referralCodes.length > 0 ? (
                            referralCodes.map(c => (
                                <TableRow key={c.id}>
                                    <TableCell className="font-mono">{c.code}</TableCell>
                                    <TableCell>{c.associatedUser}</TableCell>
                                    <TableCell>
                                        <Badge variant="secondary" className={getStatusBadgeVariant(c.status)}>{c.status}</Badge>
                                    </TableCell>
                                    <TableCell className="text-muted-foreground text-xs">{getTimeLeft(c.createdAt, c.status)}</TableCell>
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
