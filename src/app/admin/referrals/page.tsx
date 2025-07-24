
'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge, getStatusBadgeVariant } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import Link from "next/link";
import { PlusCircle, Key, Loader2, Search, Users, TrendingUp, Eye, Copy } from "lucide-react";
import { useState, useEffect } from "react";
import { formatDistanceToNow } from 'date-fns';
import { getAllReferralCodes, getReferralTrackingChain, getUsers, getReferralEarnings } from "@/lib/firebase/services";
import { ReferralCode, User, ReferralEarning, UserTrackingData, ReferralStats } from "@/lib/types";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";

function CodeRowSkeleton() {
    return (
        <TableRow>
            <TableCell><Skeleton className="h-4 w-32" /></TableCell>
            <TableCell><Skeleton className="h-4 w-48" /></TableCell>
            <TableCell><Skeleton className="h-6 w-20 rounded-full" /></TableCell>
            <TableCell><Skeleton className="h-4 w-24" /></TableCell>
            <TableCell><Skeleton className="h-4 w-32" /></TableCell>
        </TableRow>
    )
}

function EmptyState({ message = "No data available" }: { message?: string }) {
    return (
        <TableRow>
            <TableCell colSpan={6}>
                <div className="text-center py-10">
                    <Key className="mx-auto h-12 w-12 text-gray-400" />
                    <h3 className="mt-2 text-sm font-medium text-gray-900">{message}</h3>
                </div>
            </TableCell>
        </TableRow>
    )
}

function UserTrackingDialog({ userId, userName }: { userId: string, userName: string }) {
    const [trackingData, setTrackingData] = useState<UserTrackingData | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const { toast } = useToast();

    const loadTrackingData = async () => {
        setIsLoading(true);
        try {
            const data = await getReferralTrackingChain(userId);
            setTrackingData(data);
        } catch (error) {
            toast({
                title: "Error",
                description: "Failed to load tracking data",
                variant: "destructive"
            });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Dialog>
            <DialogTrigger asChild>
                <Button variant="outline" size="sm" onClick={loadTrackingData}>
                    <Eye className="h-4 w-4 mr-2" />
                    View Chain
                </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Complete Referral Tracking Chain for {userName}</DialogTitle>
                </DialogHeader>
                {isLoading ? (
                    <div className="flex items-center justify-center p-8">
                        <Loader2 className="h-8 w-8 animate-spin" />
                    </div>
                ) : trackingData ? (
                    <div className="space-y-6">
                        {/* User Info */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-lg">User Information</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <p className="font-medium">Name:</p>
                                        <p className="text-muted-foreground">{trackingData.userInfo?.name || 'N/A'}</p>
                                    </div>
                                    <div>
                                        <p className="font-medium">Email:</p>
                                        <p className="text-muted-foreground">{trackingData.userInfo?.email || 'N/A'}</p>
                                    </div>
                                    <div>
                                        <p className="font-medium">Joined:</p>
                                        <p className="text-muted-foreground">{trackingData.userInfo?.joinedAt ? formatDistanceToNow(new Date(trackingData.userInfo.joinedAt)) + ' ago' : 'N/A'}</p>
                                    </div>
                                    <div>
                                        <p className="font-medium">Role:</p>
                                        <p className="text-muted-foreground">{trackingData.userInfo?.role || 'N/A'}</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Referral Info */}
                        {trackingData.referrer && (
                            <Card>
                                <CardHeader>
                                    <CardTitle className="text-lg">How This User Was Referred</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-2">
                                        <p><strong>Referred by:</strong> {trackingData.referrer.name} ({trackingData.referrer.email})</p>
                                        <p><strong>Referral Code:</strong> {trackingData.referralCode?.code || 'N/A'}</p>
                                        <p><strong>Code Used:</strong> {trackingData.referralCode?.usedAt ? formatDistanceToNow(new Date(trackingData.referralCode.usedAt)) + ' ago' : 'N/A'}</p>
                                    </div>
                                </CardContent>
                            </Card>
                        )}

                        {/* Generated Codes */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-lg">Codes Generated ({trackingData.generatedCodes.length})</CardTitle>
                            </CardHeader>
                            <CardContent>
                                {trackingData.generatedCodes.length > 0 ? (
                                    <div className="space-y-2">
                                        {trackingData.generatedCodes.map((code: ReferralCode) => (
                                            <div key={code.id} className="flex items-center justify-between p-2 border rounded">
                                                <span className="font-mono">{code.code}</span>
                                                <div className="flex items-center gap-2">
                                                    <Badge variant="secondary" className={getStatusBadgeVariant(code.status)}>
                                                        {code.status}
                                                    </Badge>
                                                    <span className="text-sm text-muted-foreground">
                                                        {formatDistanceToNow(new Date(code.createdAt))} ago
                                                    </span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="text-muted-foreground">No codes generated</p>
                                )}
                            </CardContent>
                        </Card>

                        {/* Referred Users */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-lg">Users Referred ({trackingData.referredUsers.length})</CardTitle>
                            </CardHeader>
                            <CardContent>
                                {trackingData.referredUsers.length > 0 ? (
                                    <div className="space-y-2">
                                        {trackingData.referredUsers.map((user: User) => (
                                            <div key={user.id} className="flex items-center justify-between p-2 border rounded">
                                                <div>
                                                    <p className="font-medium">{user.name}</p>
                                                    <p className="text-sm text-muted-foreground">{user.email}</p>
                                                </div>
                                                <span className="text-sm text-muted-foreground">
                                                    {formatDistanceToNow(new Date(user.joinedAt))} ago
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="text-muted-foreground">No users referred</p>
                                )}
                            </CardContent>
                        </Card>

                        {/* Earnings */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-lg">Referral Earnings ({trackingData.earningsReceived.length})</CardTitle>
                            </CardHeader>
                            <CardContent>
                                {trackingData.earningsReceived.length > 0 ? (
                                    <div className="space-y-2">
                                        {trackingData.earningsReceived.map((earning: ReferralEarning) => (
                                            <div key={earning.id} className="flex items-center justify-between p-2 border rounded">
                                                <div>
                                                    <p className="font-medium">{earning.referredUserName}</p>
                                                    <p className="text-sm text-muted-foreground">{earning.referredUserEmail}</p>
                                                </div>
                                                <div className="text-right">
                                                    <p className="font-medium text-green-600">${(earning.commissionAmount / 100).toFixed(2)}</p>
                                                    <p className="text-sm text-muted-foreground">{formatDistanceToNow(new Date(earning.createdAt))} ago</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="text-muted-foreground">No earnings yet</p>
                                )}
                            </CardContent>
                        </Card>
                    </div>
                ) : null}
            </DialogContent>
        </Dialog>
    );
}

export default function AdminReferralTrackingPage() {
    const [allCodes, setAllCodes] = useState<ReferralCode[]>([]);
    const [allUsers, setAllUsers] = useState<User[]>([]);
    const [allEarnings, setAllEarnings] = useState<ReferralEarning[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const { toast } = useToast();

    useEffect(() => {
        const fetchAllData = async () => {
            setIsLoading(true);
            try {
                const [codes, users, earnings] = await Promise.all([
                    getAllReferralCodes(),
                    getUsers(),
                    getReferralEarnings('all') // Get all earnings for admin view
                ]);
                setAllCodes(codes);
                setAllUsers(users);
                setAllEarnings(earnings);
            } catch (error: unknown) {
                toast({
                    title: "Error",
                    description: error instanceof Error ? error.message : "Failed to load referral data",
                    variant: "destructive"
                });
            } finally {
                setIsLoading(false);
            }
        };
        fetchAllData();
    }, []);

    const filteredCodes = allCodes.filter(code => 
        code.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
        code.associatedUser.toLowerCase().includes(searchTerm.toLowerCase()) ||
        code.usedByEmail?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const filteredUsers = allUsers.filter(user => 
        user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const copyToClipboard = async (text: string) => {
        try {
            await navigator.clipboard.writeText(text);
            toast({
                title: "Copied!",
                description: "Code copied to clipboard",
            });
        } catch (err) {
            toast({
                title: "Copy Failed",
                description: "Failed to copy code",
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
    };

    const totalEarnings = allEarnings.reduce((sum, earning) => sum + earning.commissionAmount, 0);
    const usedCodes = allCodes.filter(code => code.status === 'Used').length;
    const referredUsers = allUsers.filter(user => user.referredBy != null).length;

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold">Referral Tracking System</h1>
                    <p className="text-muted-foreground">Complete permanent tracking of all referral activities</p>
                </div>
                <Button asChild>
                    <Link href="/admin/referrals/generate">
                        <PlusCircle className="mr-2 h-4 w-4" />
                        Generate New Invite
                    </Link>
                </Button>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-muted-foreground">Total Codes</p>
                                <p className="text-2xl font-bold">{allCodes.length}</p>
                            </div>
                            <Key className="h-8 w-8 text-blue-500" />
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-muted-foreground">Used Codes</p>
                                <p className="text-2xl font-bold">{usedCodes}</p>
                            </div>
                            <Users className="h-8 w-8 text-green-500" />
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-muted-foreground">Referred Users</p>
                                <p className="text-2xl font-bold">{referredUsers}</p>
                            </div>
                            <Users className="h-8 w-8 text-purple-500" />
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-muted-foreground">Total Earnings</p>
                                <p className="text-2xl font-bold">${(totalEarnings / 100).toFixed(2)}</p>
                            </div>
                            <TrendingUp className="h-8 w-8 text-yellow-500" />
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Search */}
            <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                    placeholder="Search codes, users, or emails..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                />
            </div>

            {/* Tabs */}
            <Tabs defaultValue="codes" className="space-y-4">
                <TabsList>
                    <TabsTrigger value="codes">All Codes ({allCodes.length})</TabsTrigger>
                    <TabsTrigger value="users">All Users ({allUsers.length})</TabsTrigger>
                    <TabsTrigger value="earnings">Earnings ({allEarnings.length})</TabsTrigger>
                </TabsList>

                <TabsContent value="codes">
                    <Card>
                        <CardHeader>
                            <CardTitle>All Referral Codes (Permanent Tracking)</CardTitle>
                            <CardDescription>Complete history of all referral codes ever generated</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Code</TableHead>
                                        <TableHead>Generator</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead>Used By</TableHead>
                                        <TableHead>Created</TableHead>
                                        <TableHead>Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {isLoading ? (
                                        Array.from({ length: 5 }).map((_, i) => <CodeRowSkeleton key={i} />)
                                    ) : filteredCodes.length > 0 ? (
                                        filteredCodes.map(code => (
                                            <TableRow key={code.id}>
                                                <TableCell className="font-mono">
                                                    <div className="flex items-center gap-2">
                                                        <span>{code.code}</span>
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={() => copyToClipboard(code.code)}
                                                            className="h-6 w-6 p-0"
                                                        >
                                                            <Copy className="h-3 w-3" />
                                                        </Button>
                                                    </div>
                                                </TableCell>
                                                <TableCell>{code.associatedUser}</TableCell>
                                                <TableCell>
                                                    <Badge variant="secondary" className={getStatusBadgeVariant(code.status)}>
                                                        {code.status}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell>
                                                    {code.usedByEmail ? (
                                                        <div>
                                                            <p className="font-medium">{code.usedByEmail}</p>
                                                            <p className="text-sm text-muted-foreground">
                                                                {code.usedAt ? formatDistanceToNow(new Date(code.usedAt)) + ' ago' : ''}
                                                            </p>
                                                        </div>
                                                    ) : (
                                                        <span className="text-muted-foreground">-</span>
                                                    )}
                                                </TableCell>
                                                <TableCell className="text-muted-foreground">
                                                    {formatDistanceToNow(new Date(code.createdAt))} ago
                                                </TableCell>
                                                <TableCell>
                                                    {code.usedBy && (
                                                        <UserTrackingDialog 
                                                            userId={code.usedBy} 
                                                            userName={code.usedByEmail || 'Unknown'} 
                                                        />
                                                    )}
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    ) : (
                                        <EmptyState message="No referral codes found" />
                                    )}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="users">
                    <Card>
                        <CardHeader>
                            <CardTitle>All Users with Referral Tracking</CardTitle>
                            <CardDescription>Complete referral chain for all users</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>User</TableHead>
                                        <TableHead>Referred By</TableHead>
                                        <TableHead>Referral Code</TableHead>
                                        <TableHead>Joined</TableHead>
                                        <TableHead>Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {isLoading ? (
                                        Array.from({ length: 5 }).map((_, i) => <CodeRowSkeleton key={i} />)
                                    ) : filteredUsers.length > 0 ? (
                                        filteredUsers.map(user => (
                                            <TableRow key={user.id}>
                                                <TableCell>
                                                    <div>
                                                        <p className="font-medium">{user.name}</p>
                                                        <p className="text-sm text-muted-foreground">{user.email}</p>
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    {user.referredByEmail ? (
                                                        <span className="text-sm">{user.referredByEmail}</span>
                                                    ) : (
                                                        <span className="text-muted-foreground">Direct signup</span>
                                                    )}
                                                </TableCell>
                                                <TableCell>
                                                    {user.referralCode ? (
                                                        <span className="font-mono text-sm">{user.referralCode}</span>
                                                    ) : (
                                                        <span className="text-muted-foreground">-</span>
                                                    )}
                                                </TableCell>
                                                <TableCell className="text-muted-foreground">
                                                    {formatDistanceToNow(new Date(user.joinedAt))} ago
                                                </TableCell>
                                                <TableCell>
                                                    <UserTrackingDialog userId={user.id} userName={user.name} />
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    ) : (
                                        <EmptyState message="No users found" />
                                    )}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="earnings">
                    <Card>
                        <CardHeader>
                            <CardTitle>All Referral Earnings</CardTitle>
                            <CardDescription>Complete history of all referral commission payments</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Referrer</TableHead>
                                        <TableHead>Referred User</TableHead>
                                        <TableHead>Original Amount</TableHead>
                                        <TableHead>Commission</TableHead>
                                        <TableHead>Date</TableHead>
                                        <TableHead>Status</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {isLoading ? (
                                        Array.from({ length: 5 }).map((_, i) => <CodeRowSkeleton key={i} />)
                                    ) : allEarnings.length > 0 ? (
                                        allEarnings.map(earning => (
                                            <TableRow key={earning.id}>
                                                <TableCell>
                                                    <div>
                                                        <p className="font-medium">Referrer ID</p>
                                                        <p className="text-sm text-muted-foreground">{earning.referrerId}</p>
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <div>
                                                        <p className="font-medium">{earning.referredUserName}</p>
                                                        <p className="text-sm text-muted-foreground">{earning.referredUserEmail}</p>
                                                    </div>
                                                </TableCell>
                                                <TableCell>${(earning.originalAmount / 100).toFixed(2)}</TableCell>
                                                <TableCell className="font-medium text-green-600">
                                                    ${(earning.commissionAmount / 100).toFixed(2)}
                                                </TableCell>
                                                <TableCell className="text-muted-foreground">
                                                    {formatDistanceToNow(new Date(earning.createdAt))} ago
                                                </TableCell>
                                                <TableCell>
                                                    <Badge variant={earning.status === 'pending' ? 'secondary' : 'default'}>
                                                        {earning.status}
                                                    </Badge>
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    ) : (
                                        <EmptyState message="No earnings found" />
                                    )}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}
