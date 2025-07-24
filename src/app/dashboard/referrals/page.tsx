'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge, getStatusBadgeVariant } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { PlusCircle, Users, Loader2, CheckCircle, Clock, X, DollarSign, TrendingUp, UserCheck, Star, Trophy, Gift, Copy, Key } from "lucide-react";
import { useState, useEffect } from "react";
import { formatDistanceToNow } from 'date-fns';
import { getReferralCodes, getReferralStats, getReferralEarnings, getUserReferralHistory } from "@/lib/firebase/services";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from '@/lib/firebase/client';
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useSearchParams } from 'next/navigation';
import { useToast } from "@/hooks/use-toast";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator, DropdownMenuLabel } from "@/components/ui/dropdown-menu";
import { ChevronDown, Code } from "lucide-react";
import type { ReferralCode, User, ReferralStats, ReferralEarning } from "@/lib/types";

function CodeRowSkeleton() {
    return (
        <TableRow>
            <TableCell><Skeleton className="h-4 w-32" /></TableCell>
            <TableCell><Skeleton className="h-6 w-20 rounded-full" /></TableCell>
            <TableCell><Skeleton className="h-4 w-24" /></TableCell>
            <TableCell><Skeleton className="h-4 w-24" /></TableCell>
            <TableCell><Skeleton className="h-4 w-32" /></TableCell>
        </TableRow>
    )
}

function EmptyState() {
    return (
        <TableRow>
            <TableCell colSpan={5}>
                <div className="text-center py-10">
                    <Users className="mx-auto h-12 w-12 text-gray-400" />
                    <h3 className="mt-2 text-sm font-medium text-gray-900">No Referral Codes</h3>
                    <p className="mt-1 text-sm text-gray-500">You haven&apos;t generated any referral codes yet.</p>
                    <Button asChild className="mt-4">
                        <Link href="/dashboard/referrals/generate">
                            <PlusCircle className="mr-2 h-4 w-4" />
                            Generate Your First Code
                        </Link>
                    </Button>
                </div>
            </TableCell>
        </TableRow>
    )
}

export default function ReviewerReferralsPage() {
    const [user, loading] = useAuthState(auth);
    const searchParams = useSearchParams();
    const newCodeId = searchParams.get('newCode');
    const { toast } = useToast();
    const [referralCodes, setReferralCodes] = useState<ReferralCode[]>([]);
    const [referralStats, setReferralStats] = useState<ReferralStats | null>(null);
    const [referralEarnings, setReferralEarnings] = useState<ReferralEarning[]>([]);
    const [referralHistory, setReferralHistory] = useState<{
        myReferralInfo: { referredBy: User | null; referralCode: ReferralCode | null; joinedAt: string; };
        myGeneratedCodes: ReferralCode[];
        myReferrals: User[];
    } | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [_, setNow] = useState(new Date()); // Used to force re-renders for timeago

    useEffect(() => {
        if (loading || !user) return;

        const fetchData = async () => {
            setIsLoading(true);
            try {
                // Fetch all referral-related data
                const [codes, stats, earnings, history] = await Promise.all([
                    getReferralCodes(),
                    getReferralStats(user.uid),
                    getReferralEarnings(user.uid),
                    getUserReferralHistory(user.uid)
                ]);

                // Filter codes to only show those created by this reviewer
                const myReferralCodes = codes.filter(code => 
                    code.referrerId === user.uid
                );
                
                setReferralCodes(myReferralCodes);
                setReferralStats(stats);
                setReferralEarnings(earnings);
                // Transform history to match expected structure
                setReferralHistory({
                    myReferralInfo: history.myReferralInfo || { referredBy: null, referralCode: null, joinedAt: '' },
                    myGeneratedCodes: history.referralCodes || [],
                    myReferrals: history.referralEarnings || []
                });
            } catch (error) {
                console.error("Error fetching referral data:", error);
            } finally {
                setIsLoading(false);
            }
        }
        fetchData();

        const interval = setInterval(() => {
            setNow(new Date());
        }, 30000); // Update every 30 seconds

        return () => clearInterval(interval);
    }, [user, loading]);

    const copyToClipboard = async (code: string) => {
        try {
            await navigator.clipboard.writeText(code);
            toast({
                title: "Code Copied!",
                description: "Referral code has been copied to your clipboard.",
            });
        } catch (err) {
            toast({
                title: "Copy Failed",
                description: "Failed to copy code. Please copy it manually.",
                variant: "destructive",
            });
        }
    };
    
    const getTimeLeft = (createdAt: string, status: string) => {
        if (status !== 'Active') return 'N/A';
        const createdDate = new Date(createdAt);
        const expiryDate = new Date(createdDate.getTime() + 24 * 60 * 60 * 1000);
        const now = new Date();

        if (now > expiryDate) {
            return 'Expired';
        }
        
        return `${formatDistanceToNow(expiryDate)} left`;
    }

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'Active':
                return <Clock className="w-4 h-4 text-green-600" />;
            case 'Used':
                return <CheckCircle className="w-4 h-4 text-blue-600" />;
            case 'Expired':
                return <X className="w-4 h-4 text-red-600" />;
            default:
                return null;
        }
    }

    if (loading) {
        return (
            <div className="flex justify-center items-center h-64">
                <Loader2 className="h-8 w-8 animate-spin" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold font-headline">Referral Program</h1>
                <p className="text-muted-foreground">Invite music industry professionals and earn 7% commission on their earnings.</p>
            </div>

            {/* Referral Codes Dropdown */}
            <div className="flex items-center gap-4">
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="outline" className="flex items-center gap-2">
                            <Code className="h-4 w-4" />
                            View All Codes ({referralCodes.length})
                            <ChevronDown className="h-4 w-4" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start" className="w-80">
                        <DropdownMenuLabel>Your Referral Codes</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        {isLoading ? (
                            <div className="p-4">
                                <div className="flex items-center gap-2">
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                    <span className="text-sm text-muted-foreground">Loading codes...</span>
                                </div>
                            </div>
                        ) : referralCodes.length === 0 ? (
                            <div className="p-4 text-center">
                                <p className="text-sm text-muted-foreground mb-2">No referral codes yet</p>
                                <Button size="sm" asChild>
                                    <Link href="/dashboard/referrals/generate">Generate First Code</Link>
                                </Button>
                            </div>
                        ) : (
                            referralCodes.map(code => (
                                <DropdownMenuItem 
                                    key={code.id}
                                    className="flex items-center justify-between p-3 cursor-pointer"
                                    onClick={() => copyToClipboard(code.code)}
                                >
                                    <div className="flex-1 min-w-0">
                                        <div className="font-mono text-sm font-medium truncate">
                                            {code.code}
                                        </div>
                                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                            <Badge variant="secondary" className={getStatusBadgeVariant(code.status)}>
                                                {code.status}
                                            </Badge>
                                            <span>{formatDistanceToNow(new Date(code.createdAt))} ago</span>
                                        </div>
                                    </div>
                                    {code.status === 'Active' && (
                                        <Copy className="h-4 w-4 text-muted-foreground hover:text-foreground flex-shrink-0" />
                                    )}
                                </DropdownMenuItem>
                            ))
                        )}
                        <DropdownMenuSeparator />
                        <DropdownMenuItem asChild>
                            <Link href="/dashboard/referrals/generate" className="w-full">
                                <PlusCircle className="h-4 w-4 mr-2" />
                                Generate New Code
                            </Link>
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>

            <Alert>
                <Gift className="h-4 w-4" />
                <AlertDescription>
                    <strong>Earn 7% commission</strong> on all earnings from reviewers you refer! Generate invite codes to invite other music industry professionals to join Amplifyd. Each code is valid for 24 hours and can only be used once.
                </AlertDescription>
            </Alert>

            {/* Show newly created code prominently */}
            {newCodeId && !isLoading && (
                (() => {
                    const newCode = referralCodes.find(code => code.id === newCodeId);
                    return newCode ? (
                        <Alert className="border-green-200 bg-green-50">
                            <CheckCircle className="h-4 w-4 text-green-600" />
                            <AlertDescription>
                                <div className="space-y-2">
                                    <div className="font-semibold text-green-800">
                                        🎉 Your referral code has been generated!
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <div className="font-mono text-lg font-bold text-green-900 bg-green-100 p-2 rounded border flex-1">
                                            {newCode.code}
                                        </div>
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            onClick={() => copyToClipboard(newCode.code)}
                                            className="bg-green-100 hover:bg-green-200 border-green-300"
                                        >
                                            <Copy className="h-4 w-4" />
                                        </Button>
                                    </div>
                                    <div className="text-sm text-green-700">
                                        Share this code with music industry professionals you&apos;d like to invite. 
                                        It&apos;s valid for 24 hours from now.
                                    </div>
                                </div>
                            </AlertDescription>
                        </Alert>
                    ) : null;
                })()
            )}

            {/* Show how this user was referred */}
            {referralHistory?.myReferralInfo?.referredBy && (
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <UserCheck className="w-5 h-5" />
                            How You Joined Amplifyd
                        </CardTitle>
                        <CardDescription>You were referred by another reviewer.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg border border-blue-200">
                                <div>
                                    <p className="font-medium text-blue-900">Referred by:</p>
                                    <p className="text-blue-800">{referralHistory?.myReferralInfo?.referredBy?.name}</p>
                                    <p className="text-sm text-blue-600">{referralHistory?.myReferralInfo?.referredBy?.email}</p>
                                </div>
                                <div className="text-right">
                                    <p className="font-medium text-blue-900">Invite Code:</p>
                                    <p className="font-mono text-blue-800">{referralHistory?.myReferralInfo?.referralCode?.code}</p>
                                    <p className="text-sm text-blue-600">
                                        Joined {referralHistory?.myReferralInfo?.joinedAt ? formatDistanceToNow(new Date(referralHistory?.myReferralInfo?.joinedAt)) : 'Unknown'} ago
                                    </p>
                                </div>
                            </div>
                            <div className="text-sm text-muted-foreground">
                                💡 Thanks to their referral, you&apos;re now part of the Amplifyd reviewer community! 
                                Your referrer earns 7% commission on your earnings.
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Complete Referral History */}
            {(referralHistory?.myGeneratedCodes?.length ?? 0) > 0 && (
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Key className="w-5 h-5" />
                            Complete Code History
                        </CardTitle>
                        <CardDescription>
                            All referral codes you've ever generated (showing all {(referralHistory?.myGeneratedCodes?.length ?? 0) || 0} codes)
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-2">
                            {(referralHistory?.myGeneratedCodes ?? []).map((code: ReferralCode) => (
                                <div key={code.id} className="flex items-center justify-between p-3 border rounded-lg">
                                    <div className="flex items-center gap-3">
                                        <span className="font-mono font-medium">{code.code}</span>
                                        <Badge variant="secondary" className={getStatusBadgeVariant(code.status)}>
                                            {code.status}
                                        </Badge>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-sm text-muted-foreground">
                                            Created {formatDistanceToNow(new Date(code.createdAt))} ago
                                        </p>
                                        {code.usedByEmail && (
                                            <p className="text-sm text-green-600 font-medium">
                                                Used by {code.usedByEmail}
                                            </p>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                        <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                            <p className="text-sm text-muted-foreground">
                                📊 <strong>Total Stats:</strong> {(referralHistory?.myGeneratedCodes?.length ?? 0) || 0} codes generated, {(referralHistory?.myGeneratedCodes?.filter((c: ReferralCode) => c.status === 'Used').length ?? 0)} used, {(referralHistory?.myReferrals?.length ?? 0)} people referred
                            </p>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Referral Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-muted-foreground">Total Referrals</p>
                                <div className="text-2xl font-bold">{isLoading ? <Skeleton className="h-8 w-16" /> : referralStats?.totalReferrals || 0}</div>
                            </div>
                            <Users className="h-8 w-8 text-blue-500" />
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-muted-foreground">Active Referrals</p>
                                <div className="text-2xl font-bold">{isLoading ? <Skeleton className="h-8 w-16" /> : referralStats?.activeReferrals || 0}</div>
                            </div>
                            <UserCheck className="h-8 w-8 text-green-500" />
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-muted-foreground">Total Earnings</p>
                                <div className="text-2xl font-bold">{isLoading ? <Skeleton className="h-8 w-16" /> : `$${((referralStats?.totalEarnings || 0) / 100).toFixed(2)}`}</div>
                            </div>
                            <DollarSign className="h-8 w-8 text-yellow-500" />
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-muted-foreground">Pending Earnings</p>
                                <div className="text-2xl font-bold">{isLoading ? <Skeleton className="h-8 w-16" /> : `$${((referralStats?.pendingEarnings || 0) / 100).toFixed(2)}`}</div>
                            </div>
                            <TrendingUp className="h-8 w-8 text-purple-500" />
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Recent Referral Earnings */}
            {referralEarnings.length > 0 && (
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Trophy className="w-5 h-5" />
                            Recent Referral Earnings
                        </CardTitle>
                        <CardDescription>Your latest commission earnings from referred reviewers.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Referred User</TableHead>
                                    <TableHead>Original Amount</TableHead>
                                    <TableHead>Commission (7%)</TableHead>
                                    <TableHead>Date</TableHead>
                                    <TableHead>Status</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {referralEarnings.slice(0, 5).map(earning => (
                                    <TableRow key={earning.id}>
                                        <TableCell className="max-w-[250px]">
                                            <div>
                                                <div className="font-medium truncate" title={earning.referredUserName}>{earning.referredUserName}</div>
                                                <div className="text-sm text-muted-foreground truncate" title={earning.referredUserEmail}>{earning.referredUserEmail}</div>
                                            </div>
                                        </TableCell>
                                        <TableCell>${(earning.originalAmount / 100).toFixed(2)}</TableCell>
                                        <TableCell className="font-medium text-green-600">${(earning.commissionAmount / 100).toFixed(2)}</TableCell>
                                        <TableCell className="text-sm text-muted-foreground">
                                            {formatDistanceToNow(new Date(earning.createdAt))} ago
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant={earning.status === 'pending' ? 'secondary' : 'default'}>
                                                {earning.status}
                                            </Badge>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            )}

            <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                        <CardTitle>Invite Code Management</CardTitle>
                        <CardDescription>Generate and track your referral codes for inviting new reviewers.</CardDescription>
                    </div>
                    <Button asChild>
                        <Link href="/dashboard/referrals/generate">
                            <PlusCircle className="mr-2 h-4 w-4" />
                            Generate New Code
                        </Link>
                    </Button>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Invite Code</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Used By</TableHead>
                                <TableHead>Created</TableHead>
                                <TableHead>Expires</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {isLoading ? (
                                Array.from({ length: 3 }).map((_, i) => <CodeRowSkeleton key={i} />)
                            ) : referralCodes.length > 0 ? (
                                referralCodes.map(code => (
                                    <TableRow key={code.id} className={code.id === newCodeId ? "bg-green-50 border-l-4 border-l-green-500" : ""}>
                                        <TableCell className="font-mono font-medium max-w-[200px]">
                                            <div className="flex items-center gap-2">
                                                <span className="truncate" title={code.code}>{code.code}</span>
                                                {code.status === 'Active' && (
                                                    <Button
                                                        size="sm"
                                                        variant="ghost"
                                                        onClick={() => copyToClipboard(code.code)}
                                                        className="h-6 w-6 p-0 opacity-60 hover:opacity-100 flex-shrink-0"
                                                    >
                                                        <Copy className="h-3 w-3" />
                                                    </Button>
                                                )}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-2">
                                                {getStatusIcon(code.status)}
                                                <Badge variant="secondary" className={getStatusBadgeVariant(code.status)}>
                                                    {code.status}
                                                </Badge>
                                            </div>
                                        </TableCell>
                                        <TableCell className="max-w-[200px]">
                                            {code.usedByEmail ? (
                                                <div className="text-sm">
                                                    <div className="font-medium truncate" title={code.usedByEmail}>{code.usedByEmail}</div>
                                                    <div className="text-muted-foreground">
                                                        {code.usedAt ? formatDistanceToNow(new Date(code.usedAt)) + ' ago' : ''}
                                                    </div>
                                                </div>
                                            ) : (
                                                <span className="text-muted-foreground">-</span>
                                            )}
                                        </TableCell>
                                        <TableCell className="text-muted-foreground text-sm">
                                            {formatDistanceToNow(new Date(code.createdAt))} ago
                                        </TableCell>
                                        <TableCell className="text-muted-foreground text-sm">
                                            {getTimeLeft(code.createdAt, code.status)}
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