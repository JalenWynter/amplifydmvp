'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PlusCircle, Edit, Trash2, Mic, Film, FileText, BarChart3, Package, Loader2, Save } from "lucide-react";
import { Reviewer, ReviewPackage, getReviewerById, addPackage, updatePackage, deletePackage } from "@/lib/firebase/reviewers";
import { getCurrentUserInfo } from "@/lib/firebase/users";
import React, { useState, useEffect, useCallback } from "react";
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
import PackageForm from "./package-form";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from 'zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import Link from "next/link";
import { db } from "@/lib/firebase/client";
import { doc, getDoc } from "firebase/firestore";

const profileSchema = z.object({
    name: z.string().min(3, "Name must be at least 3 characters."),
    turnaround: z.string().min(3, "Turnaround time is required."),
    experience: z.string().min(50, "Experience description must be at least 50 characters long."),
    genres: z.string().min(1, "Please list at least one genre, separated by commas."),
    manualPaymentInfo: z.string().optional(),
});

type ProfileFormValues = z.infer<typeof profileSchema>;

const formatIcons: { [key: string]: React.ElementType } = {
    chart: BarChart3,
    written: FileText,
    audio: Mic,
    video: Film
};

const formatLabels: { [key: string]: string } = {
    chart: "Scoring Chart",
    written: "Written Feedback",
    audio: "Audio Feedback",
    video: "Video Feedback"
};

function PackageCard({ pkg, onEdit, onDelete }: { pkg: ReviewPackage; onEdit: (pkg: ReviewPackage) => void; onDelete: (pkgId: string) => void; }) {
    return (
        <Card>
            <CardHeader className="flex flex-row justify-between items-start gap-4">
                <div className="min-w-0 flex-1">
                    <CardTitle className="text-xl truncate" title={pkg.name}>{pkg.name}</CardTitle>
                    <CardDescription className="truncate">{pkg.trackCount} track(s)</CardDescription>
                </div>
                <div className="text-2xl font-bold text-primary flex-shrink-0">${(pkg.priceInCents / 100).toFixed(2)}</div>
            </CardHeader>
            <CardContent className="space-y-4">
                <p className="text-muted-foreground text-sm h-10 line-clamp-2 overflow-hidden" title={pkg.description}>{pkg.description}</p>
                <div className="flex flex-wrap gap-x-4 gap-y-2">
                    {pkg.formats.map(format => {
                        const Icon = formatIcons[format];
                        return (
                             <div key={format} className="flex items-center gap-2 text-sm text-muted-foreground">
                                <Icon className="w-4 h-4 text-primary" />
                                <span>{formatLabels[format]}</span>
                            </div>
                        )
                    })}
                </div>
                <div className="flex gap-2 pt-2">
                    <Button variant="outline" size="sm" className="w-full" onClick={() => onEdit(pkg)}>
                        <Edit className="mr-2 h-4 w-4" /> Edit
                    </Button>
                     <AlertDialog>
                        <AlertDialogTrigger asChild>
                            <Button variant="outline" size="sm" className="text-destructive hover:text-destructive hover:bg-destructive/10 w-full">
                                <Trash2 className="mr-2 h-4 w-4" /> Delete
                            </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                            <AlertDialogHeader>
                                <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                <AlertDialogDescription>
                                    This will permanently delete the &quot;{pkg.name}&quot; package. This action cannot be undone.
                                </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction onClick={() => onDelete(pkg.id)} className="bg-destructive hover:bg-destructive/90">
                                    Yes, delete it
                                </AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>
                </div>
            </CardContent>
        </Card>
    )
}

function ProfileForm({ reviewer, onProfileUpdate }: { reviewer: Reviewer | null, onProfileUpdate: () => void }) {
    const [isSaving, setIsSaving] = useState(false);
    const { toast } = useToast();

    const form = useForm<ProfileFormValues>({
        resolver: zodResolver(profileSchema),
        defaultValues: {
            name: reviewer?.name || "",
            turnaround: reviewer?.turnaround || "",
            experience: reviewer?.experience || "",
            genres: reviewer?.genres?.join(', ') || "",
            manualPaymentInfo: reviewer?.manualPaymentInfo || "",
        },
    });

    if (!reviewer) {
        return <div>Loading profile...</div>;
    }

    async function onSubmit(values: ProfileFormValues) {
        if (!reviewer) return; // Reviewer must exist to update
        setIsSaving(true);
        try {
            const profileData = {
                name: values.name,
                turnaround: values.turnaround,
                experience: values.experience,
                genres: values.genres.split(',').map(g => g.trim()).filter(Boolean),
                manualPaymentInfo: values.manualPaymentInfo,
            };
            await updateReviewerProfile(reviewer.id, profileData);
            toast({ title: "Profile Updated!", description: "Your public information has been saved." });
            onProfileUpdate();
        } catch (error) {
            console.error("Failed to update profile", error);
            toast({ title: "Error", description: "Failed to update profile.", variant: "destructive" });
        } finally {
            setIsSaving(false);
        }
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>Public Information</CardTitle>
                <CardDescription>This information is visible on your public reviewer profile.</CardDescription>
            </CardHeader>
            <CardContent>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <FormField control={form.control} name="name" render={({ field }) => (
                            <FormItem><FormLabel>Display Name</FormLabel><FormControl><Input placeholder="Your professional name" {...field} /></FormControl><FormMessage /></FormItem>
                        )} />
                        <FormField control={form.control} name="turnaround" render={({ field }) => (
                            <FormItem><FormLabel>Turnaround Time</FormLabel><FormControl><Input placeholder="e.g., 3-5 business days" {...field} /></FormControl><FormMessage /></FormItem>
                        )} />
                        <FormField control={form.control} name="genres" render={({ field }) => (
                            <FormItem><FormLabel>Genres</FormLabel><FormControl><Input placeholder="Pop, Rock, Hip-Hop" {...field} /></FormControl><FormMessage /></FormItem>
                        )} />
                        <FormField control={form.control} name="experience" render={({ field }) => (
                            <FormItem><FormLabel>Experience / Bio</FormLabel><FormControl><Textarea rows={5} placeholder="Describe your background and what you bring to the table." {...field} /></FormControl><FormMessage /></FormItem>
                        )} />
                        <FormField control={form.control} name="manualPaymentInfo" render={({ field }) => (
                            <FormItem><FormLabel>Manual Payout Information</FormLabel><FormControl><Textarea rows={3} placeholder="e.g., PayPal: your@email.com, Venmo: @yourhandle, Bank: Account #1234567890" {...field} /></FormControl><FormMessage /></FormItem>
                        )} />
                        <div className="flex justify-end">
                            <Button type="submit" disabled={isSaving}>
                                {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                                Save Profile
                            </Button>
                        </div>
                    </form>
                </Form>
            </CardContent>
        </Card>
    )
}

export default function ProfilePage() {
    const { currentUser, loading: authLoading } = useAuth();
    const [reviewer, setReviewer] = useState<Reviewer | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [editingPackage, setEditingPackage] = useState<Partial<ReviewPackage> | null>(null);
    const [isSaving, setIsSaving] = useState(false);
    const { toast } = useToast();

    const loadProfile = useCallback(async () => {
      console.log("[ProfilePage] loadProfile called.");
      if (!currentUser) {
        console.log("[ProfilePage] No authenticated user in loadProfile.");
        setIsLoading(false);
        return;
      }

      console.log(`[ProfilePage] Authenticated user UID: ${currentUser.id}`);
      try {
        console.log("[ProfilePage] User document found, attempting to load reviewer profile.");
        const profile = await getReviewerById(currentUser.id);
        setReviewer(profile);
        console.log("[ProfilePage] Reviewer profile:", profile);
        setIsLoading(false);
      } catch (error) {
        console.error("[ProfilePage] Error loading profile:", error);
        setIsLoading(false);
      }
    }, [currentUser]);

    useEffect(() => {
        if (!authLoading) {
            loadProfile();
        }
    }, [authLoading, loadProfile]);

    const handleAddPackage = () => {
        if (reviewer && reviewer.packages.length < 5) {
            setEditingPackage({}); 
        } else {
            toast({
                title: "Package Limit Reached",
                description: "You can only have a maximum of 5 packages.",
                variant: "destructive"
            });
        }
    };
    
    const handleEditPackage = (pkg: ReviewPackage) => {
        setEditingPackage(pkg);
    };

    const handleSavePackage = async (pkgData: Omit<ReviewPackage, 'id'>) => {
        if (!currentUser || !reviewer) return;
        setIsSaving(true);
        
        try {
            if ((editingPackage as ReviewPackage)?.id) {
                const updatedPkg = { ...editingPackage, ...pkgData } as ReviewPackage;
                await updatePackage(currentUser.id, updatedPkg);
                 toast({ title: "Package Updated!", description: "Your package has been successfully updated." });
            } else {
                await addPackage(currentUser.id, pkgData);
                toast({ title: "Package Added!", description: "Your new package is now live." });
            }
            setEditingPackage(null);
            await loadProfile();
        } catch (error) {
            console.error("Failed to save package", error);
            toast({ title: "Error", description: "Failed to save the package. Please try again.", variant: "destructive" });
        } finally {
            setIsSaving(false);
        }
    }
    
    const handleDeletePackage = async (pkgId: string) => {
        if (!currentUser) return;
        try {
            await deletePackage(currentUser.id, pkgId);
            toast({ title: "Package Deleted", description: "The package has been removed." });
            await loadProfile(); 
        } catch (error) {
            console.error("Failed to delete package", error);
            toast({ title: "Error", description: "Failed to delete the package. Please try again.", variant: "destructive" });
        }
    };
    
    if (authLoading || isLoading) {
        return <div className="flex items-center justify-center p-20"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
    }

    // Handle case where user is not authenticated
    if (!currentUser) {
        return (
            <div className="text-center py-20">
                <h1 className="text-2xl font-bold">Authentication Required</h1>
                <p className="text-muted-foreground">Please log in to access your profile.</p>
                <Button asChild className="mt-4">
                    <Link href="/login">Log In</Link>
                </Button>
            </div>
        );
    }

    // Handle case where user exists but no reviewer document exists (all signed-in users are reviewers)
    if (currentUser && currentUser.role !== "reviewer") {
        return (
            <div className="text-center py-20">
                <h1 className="text-2xl font-bold">Access Denied</h1>
                <p className="text-muted-foreground">
                    You do not have the necessary permissions to view this page.
                </p>
                <Button asChild className="mt-4">
                    <Link href="/">Go to Homepage</Link>
                </Button>
            </div>
        );
    }

    if (!reviewer) {
        return (
            <div className="text-center py-20">
                <h1 className="text-2xl font-bold">Reviewer Profile Not Found</h1>
                <p className="text-muted-foreground">
                    Your reviewer profile was not found. This might be because your application is still being processed.
                </p>
                <p className="text-sm text-muted-foreground mt-2">
                    User ID: {currentUser.id}
                </p>
                <Button asChild className="mt-4">
                    <Link href="/dev-setup">Run Database Setup</Link>
                </Button>
            </div>
        );
    }

    return (
        <div className="space-y-8">
            {editingPackage && (
                <PackageForm 
                    pkg={editingPackage} 
                    onSave={handleSavePackage} 
                    onCancel={() => setEditingPackage(null)}
                    isSaving={isSaving}
                />
            )}
            <div>
                <h1 className="text-3xl font-bold font-headline">Your Profile</h1>
                <p className="text-muted-foreground">Manage your public information and review packages.</p>
            </div>
            
            <ProfileForm reviewer={reviewer} onProfileUpdate={loadProfile} />

            <div className="space-y-4">
                <div className="flex justify-between items-center">
                    <div>
                        <h2 className="text-2xl font-bold font-headline flex items-center gap-2">
                            <Package className="w-6 h-6 text-primary" />
                            Review Packages
                        </h2>
                        <p className="text-muted-foreground">Define the services you offer to artists. You can create up to 5 packages.</p>
                    </div>
                    {reviewer.packages.length < 5 && (
                        <Button onClick={handleAddPackage}>
                            <PlusCircle className="mr-2 h-4 w-4" />
                            Add Package
                        </Button>
                    )}
                </div>
                
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {reviewer.packages.map(pkg => (
                       <PackageCard key={pkg.id} pkg={pkg} onEdit={handleEditPackage} onDelete={handleDeletePackage} />
                    ))}
                </div>
                 {reviewer.packages.length === 0 && (
                    <div className="text-center py-12 border-2 border-dashed rounded-lg">
                        <Package className="mx-auto h-12 w-12 text-gray-400" />
                        <h3 className="mt-2 text-lg font-medium">No Packages Created</h3>
                        <p className="mt-1 text-sm text-muted-foreground">Click "Add Package" to create your first review offering.</p>
                        <Button onClick={handleAddPackage} className="mt-4">
                            <PlusCircle className="mr-2 h-4 w-4" />
                            Create Your First Package
                        </Button>
                    </div>
                 )}
            </div>
        </div>
    )
}