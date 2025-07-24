
'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge, getStatusBadgeVariant } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { MoreHorizontal, FileText, Loader2 } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { getApplications } from '@/lib/firebase/services';
import { Application } from '@/lib/types';
import { useState, useEffect } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";

function ApplicationRowSkeleton() {
    return (
        <TableRow>
            <TableCell><Skeleton className="h-4 w-32" /></TableCell>
            <TableCell><Skeleton className="h-4 w-48" /></TableCell>
            <TableCell><Skeleton className="h-6 w-24 rounded-full" /></TableCell>
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
                    <FileText className="mx-auto h-12 w-12 text-gray-400" />
                    <h3 className="mt-2 text-sm font-medium text-gray-900">No Applications</h3>
                    <p className="mt-1 text-sm text-gray-500">There are currently no pending or completed applications.</p>
                </div>
            </TableCell>
        </TableRow>
    )
}

export default function ReviewerApplicationsPage() {
  const [applications, setApplications] = useState<Application[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const { toast } = useToast();
  const router = useRouter();

  const fetchAndSetApplications = async () => {
    setIsLoading(true);
    const fetchedApplications = await getApplications();
    setApplications(fetchedApplications);
    setIsLoading(false);
  };

  useEffect(() => {
    fetchAndSetApplications();
  }, []);

  const handleStatusUpdate = async (app: Application, status: 'Approved' | 'Rejected') => {
    setUpdatingId(app.id);
    try {
        // The approval/rejection logic is now handled on the detail page
        // This page will simply re-fetch applications to reflect changes
        toast({
          title: `Action Initiated`,
          description: `Please go to the application detail page to ${status.toLowerCase()} ${app.name}'s application.`,
        });
        fetchAndSetApplications(); // Re-fetch to update UI
    } catch(error) {
        console.error("Failed to initiate action:", error);
        toast({ title: "Action Failed", description: "Could not initiate action.", variant: "destructive" });
    } finally {
        setUpdatingId(null);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Reviewer Applications</CardTitle>
        <CardDescription>Manage and review pending applications from potential reviewers.</CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Applicant</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Submitted</TableHead>
              <TableHead>
                <span className="sr-only">Actions</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 3 }).map((_, i) => <ApplicationRowSkeleton key={i} />)
            ) : applications.length > 0 ? (
              applications.map((app) => (
                <TableRow key={app.id}>
                  <TableCell className="font-medium">{app.name}</TableCell>
                  <TableCell>{app.email}</TableCell>
                  <TableCell>
                    <Badge variant={'secondary'} className={getStatusBadgeVariant(app.status)}>
                      {app.status}
                    </Badge>
                  </TableCell>
                  <TableCell>{new Date(app.submittedAt).toLocaleDateString()}</TableCell>
                  <TableCell className="text-right">
                    {updatingId === app.id ? (
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
                            <Link href={`/admin/applications/${app.id}`}>View Application</Link>
                            </DropdownMenuItem>
                            {app.status === 'pending' && (
                            <>
                                <DropdownMenuItem onClick={() => handleStatusUpdate(app, 'Approved')}>Approve</DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleStatusUpdate(app, 'Rejected')} className="text-destructive focus:text-destructive">Reject</DropdownMenuItem>
                            </>
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
  );
}
