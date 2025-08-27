'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge, getStatusBadgeVariant } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { MoreHorizontal, UserPlus, Users, Loader2 } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { getUsers, updateUserRole, updateUserStatus } from '@/lib/firebase/admin/users';
import { User, UserSchema, UserRole } from '@/lib/types';
import { useState, useEffect } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"


function UserRowSkeleton() {
    return (
        <TableRow>
            <TableCell>
                <div className="flex items-center gap-3">
                    <Skeleton className="h-10 w-10 rounded-full" />
                    <div>
                        <Skeleton className="h-4 w-24 mb-1" />
                        <Skeleton className="h-3 w-32" />
                    </div>
                </div>
            </TableCell>
            <TableCell><Skeleton className="h-6 w-20 rounded-full" /></TableCell>
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
                    <Users className="mx-auto h-12 w-12 text-gray-400" />
                    <h3 className="mt-2 text-sm font-medium text-gray-900">No Users</h3>
                    <p className="mt-1 text-sm text-gray-500">No users have been created yet. Try seeding the database.</p>
                    <div className="mt-6">
                        <Button asChild>
                            <Link href="/dev-setup">
                                <UserPlus className="mr-2 h-4 w-4" />
                                Seed Sample Users
                            </Link>
                        </Button>
                    </div>
                </div>
            </TableCell>
        </TableRow>
    )
}

export default function ViewUsersPage() {
    const [users, setUsers] = useState<User[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [updatingId, setUpdatingId] = useState<string | null>(null);
    const [dialogUser, setDialogUser] = useState<User | null>(null);
    const [dialogAction, setDialogAction] = useState<'Suspend' | 'Reactivate' | null>(null);
    const { toast } = useToast();

    const fetchUsers = async () => {
        setIsLoading(true);
        const fetchedUsers = await getUsers();
        setUsers(fetchedUsers);
        setIsLoading(false);
    };

    useEffect(() => {
        fetchUsers();
    }, []);

    const onStatusUpdate = async (user: User, status: 'active' | 'suspended') => {
        setUpdatingId(user.id);
        const result = await updateUserStatus(user.id, status);
        setUpdatingId(null);
        setDialogUser(null);
        setDialogAction(null);

        if (result.success) {
            toast({
                title: 'User Updated',
                description: `${user.name} has been ${status === 'active' ? 'reactivated' : 'suspended'}.`,
            });
            await fetchUsers();
        } else {
            toast({ title: "Update Failed", description: result.error, variant: "destructive" });
        }
    }

    const onRoleUpdate = async (user: User, newRole: UserRole) => {
        setUpdatingId(user.id);
        const result = await updateUserRole(user.id, newRole);
        setUpdatingId(null);

        if (result.success) {
            toast({
                title: 'User Role Updated',
                description: `${user.name}'s role has been changed to ${newRole}.`,
            });
            await fetchUsers();
        } else {
            toast({ title: "Update Failed", description: result.error, variant: "destructive" });
        }
    }

    const openConfirmationDialog = (user: User, action: 'Suspend' | 'Reactivate') => {
        setDialogUser(user);
        setDialogAction(action);
    };


    const getRoleBadgeVariant = (role: string) => {
        switch (role) {
            case 'admin': return 'bg-primary/20 text-primary';
            case 'reviewer': return 'bg-blue-100 text-blue-800';
            case 'uploader': return 'bg-purple-100 text-purple-800';
            default: return 'bg-muted text-muted-foreground';
        }
    }

    return (
        <>
        <AlertDialog open={!!dialogUser} onOpenChange={() => setDialogUser(null)}>
             <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                    <AlertDialogDescription>
                        {dialogAction === 'Suspend' 
                            ? `This will suspend ${dialogUser?.name}'s account. They will not be able to log in or perform any actions.`
                            : `This will reactivate ${dialogUser?.name}'s account, allowing them to log in again.`
                        }
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction 
                        onClick={() => {
                            if (dialogUser) {
                                onStatusUpdate(dialogUser, dialogAction === 'Suspend' ? 'suspended' : 'active');
                            }
                        }}
                        className={dialogAction === 'Suspend' ? "bg-destructive hover:bg-destructive/90" : ""}
                    >
                        Yes, {dialogAction} User
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>

        <Card>
            <CardHeader className="flex flex-row items-center justify-between">
                <div>
                    <CardTitle>User Management</CardTitle>
                    <CardDescription>View and manage all users on the platform.</CardDescription>
                </div>
                 <Button asChild>
                    <Link href="/admin/users/search">
                        <UserPlus className="mr-2 h-4 w-4" />
                        Add New User
                    </Link>
                </Button>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>User</TableHead>
                            <TableHead>Role</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Joined Date</TableHead>
                            <TableHead>
                                <span className="sr-only">Actions</span>
                            </TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoading ? (
                            Array.from({ length: 5 }).map((_, i) => <UserRowSkeleton key={i} />)
                        ) : users.length > 0 ? (
                            users.map((user) => (
                                <TableRow key={user.id}>
                                    <TableCell className="max-w-[300px]">
                                        <div className="flex items-center gap-3">
                                            <Avatar className="flex-shrink-0">
                                                <AvatarImage src={user.avatarUrl} alt={user.name} />
                                                <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
                                            </Avatar>
                                            <div className="min-w-0 flex-1">
                                                <div className="font-medium truncate" title={user.name}>{user.name}</div>
                                                <div className="text-sm text-muted-foreground truncate" title={user.email}>{user.email}</div>
                                            </div>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Badge variant="secondary" className={getRoleBadgeVariant(user.role)}>{user.role}</Badge>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="start">
                                                {Object.values(UserSchema.shape.role.enum).map(role => (
                                                    <DropdownMenuItem 
                                                        key={String(role)} 
                                                        onClick={() => onRoleUpdate(user, role as 'admin' | 'reviewer' | 'uploader')} 
                                                        disabled={user.role === role || updatingId === user.id}
                                                    >
                                                        {String(role)}
                                                    </DropdownMenuItem>
                                                ))}
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant="secondary" className={getStatusBadgeVariant(user.status)}>{user.status}</Badge>
                                    </TableCell>
                                    <TableCell>{new Date(user.joinedAt).toLocaleDateString()}</TableCell>
                                    <TableCell className="text-right">
                                        {updatingId === user.id ? (
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
                                                    <DropdownMenuItem disabled>View Profile</DropdownMenuItem>
                                                    <DropdownMenuItem disabled>Edit User</DropdownMenuItem>
                                                    <DropdownMenuSeparator />
                                                    {user.status === 'active' ? (
                                                        <DropdownMenuItem onClick={() => openConfirmationDialog(user, 'Suspend')} className="text-destructive focus:text-destructive">
                                                            Suspend User
                                                        </DropdownMenuItem>
                                                    ) : (
                                                        <DropdownMenuItem onClick={() => openConfirmationDialog(user, 'Reactivate')}>
                                                            Reactivate User
                                                        </DropdownMenuItem>
                                                    )}
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
    );
}