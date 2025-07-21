
'use client';

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { CheckCircle, ExternalLink, Mail, User, XCircle, Loader2 } from "lucide-react";
import Link from "next/link";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import { getApplicationById, approveApplication, Application } from '@/lib/firebase/services';
import { useState, useEffect, use } from "react";
import { Skeleton } from "@/components/ui/skeleton";

function ApplicationDetailSkeleton() {
    return (
        <Card>
            <CardHeader>
                <Skeleton className="h-8 w-3/5" />
                <Skeleton className="h-4 w-1/4" />
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="space-y-4">
                    <Skeleton className="h-6 w-1/3" />
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Skeleton className="h-5 w-full" />
                        <Skeleton className="h-5 w-full" />
                        <Skeleton className="h-5 w-full" />
                        <Skeleton className="h-5 w-full" />
                    </div>
                </div>
                <Separator />
                <div className="space-y-2">
                    <Skeleton className="h-6 w-1/3" />
                    <Skeleton className="h-20 w-full" />
                </div>
            </CardContent>
        </Card>
    );
}

export default function ApplicationDetailPage({ params }: { params: Promise<{ applicationId: string }> }) {
  const resolvedParams = use(params);
  const { toast } = useToast();
  const router = useRouter();
  
  const [application, setApplication] = useState<Application | null | undefined>(undefined);
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    const fetchApplication = async () => {
      const app = await getApplicationById(resolvedParams.applicationId);
      setApplication(app);
    };
    fetchApplication();
  }, [resolvedParams.applicationId]);

  const handleStatusUpdate = async (status: 'Approved' | 'Rejected') => {
    if (!application) return;

    setIsUpdating(true);
    try {
        if (status === 'Approved') {
            await approveApplication(application.id);
            toast({
              title: `Application Approved!`,
              description: `${application.name}'s application has been approved and a reviewer account created.`,
            });
        } else if (status === 'Rejected') {
            // TODO: Implement rejection logic here. For now, just show a toast.
            toast({
              title: `Application Rejected`,
              description: `${application.name}'s application has been rejected.`,
              variant: "destructive",
            });
        }
        router.push('/admin/applications');
    } catch (error: unknown) {
        console.error("Failed to update application status:", error);
        toast({ title: "Update Failed", description: error instanceof Error ? error.message : "Could not update application status.", variant: "destructive" });
    } finally {
        setIsUpdating(false);
    }
  };

  const getStatusBadgeVariant = () => {
    if (!application) return '';
    switch (application.status) {
      case 'Approved': return 'bg-green-100 text-green-800';
      case 'Rejected': return 'bg-red-100 text-red-800';
      default: return 'bg-yellow-100 text-yellow-800';
    }
  };

  if (application === undefined) {
    return <ApplicationDetailSkeleton />;
  }

  if (application === null) {
    return (
      <div className="text-center">
        <h2 className="text-2xl font-bold">Application not found</h2>
        <p className="text-muted-foreground">This application may have been removed or does not exist.</p>
        <Button asChild className="mt-4">
          <Link href="/admin/applications">Back to Applications</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <Card>
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="text-2xl font-bold font-headline">Reviewer Application</CardTitle>
              <CardDescription>Submitted on {new Date(application.submittedAt).toLocaleDateString()}</CardDescription>
            </div>
            <Badge variant={'secondary'} className={getStatusBadgeVariant()}>
              {application.status}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <h3 className="font-semibold text-lg">Applicant Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div className="flex items-center gap-2">
                <User className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                <strong>Name:</strong>
                <span className="break-words" title={application.name}>{application.name}</span>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                <strong>Email:</strong>
                <a href={`mailto:${application.email}`} className="text-primary hover:underline break-all" title={application.email}>{application.email}</a>
              </div>
              <div className="flex items-center gap-2">
                <ExternalLink className="w-4 h-4 text-muted-foreground" />
                <strong>Portfolio:</strong>
                <a href={application.portfolioLink} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                  View Portfolio
                </a>
              </div>
               <div className="flex items-center gap-2">
                <strong className="text-muted-foreground">Referred By:</strong>
                <span>{application.referral || 'N/A'}</span>
              </div>
            </div>
          </div>
          
          <Separator />

          <div className="space-y-2">
            <h3 className="font-semibold text-lg">Music Background & Experience</h3>
            <p className="text-muted-foreground whitespace-pre-wrap break-words max-w-full overflow-hidden">{application.musicBackground}</p>
          </div>
          
          <Separator />
          
           <div className="space-y-2">
            <h3 className="font-semibold text-lg">Motivation</h3>
            <p className="text-muted-foreground whitespace-pre-wrap break-words max-w-full overflow-hidden">{application.joinReason}</p>
          </div>

        </CardContent>
        {application.status === 'Pending Review' && (
          <div className="p-6 bg-muted/50 border-t flex justify-end gap-2">
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive" disabled={isUpdating}>
                      <XCircle className="mr-2 h-4 w-4" />
                      Reject
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Are you sure you want to reject this application?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This action cannot be undone. The applicant will be notified that their application has been rejected.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={() => handleStatusUpdate('Rejected')} className="bg-destructive hover:bg-destructive/90">
                      Confirm Rejection
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="default" className="bg-green-600 hover:bg-green-700" disabled={isUpdating}>
                      {isUpdating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CheckCircle className="mr-2 h-4 w-4" />}
                      Approve
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Are you sure you want to approve this application?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This will create a reviewer account for {application.name}, create their public reviewer profile, and send them a welcome email. This action cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={() => handleStatusUpdate('Approved')} className="bg-green-600 hover:bg-green-700">
                      Confirm Approval
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
          </div>
        )}
      </Card>
    </div>
  );
}
