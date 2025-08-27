'use client';

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, useEffect } from "react";
import { Loader2, UploadCloud, User, CreditCard, Music, FileAudio, CheckCircle } from "lucide-react";
import { getReviewers } from "@/lib/firebase/services"; // Keep this for now, will move later
import { Reviewer, ReviewPackage, SubmissionSchema as BaseSubmissionSchema } from "@/lib/types";
import { z } from 'zod';
import { uploadMusicFile } from "@/lib/firebase/submissions";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "../ui/card";
import { createCheckoutSession } from "@/app/actions/stripe";
import { Separator } from "../ui/separator";


// Extend the base schema to include musicFile for the form
const SubmissionFormSchema = z.object({
  artistName: z.string().min(1, 'Artist name is required'),
  songTitle: z.string().min(1, 'Song title is required'),
  contactEmail: z.string().email('Valid email required'),
  genre: z.string().min(1, 'Genre is required'),
  reviewerId: z.string().min(1, 'Reviewer is required'),
  packageId: z.string().min(1, 'Package is required'),
  musicFile: z.any().refine((val) => val && val.length > 0, { message: 'Music file is required' }),
});

export default function SubmissionForm({ preselectedReviewerId: initialReviewerId }: { preselectedReviewerId?: string }) {
  const { toast } = useToast();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [fileName, setFileName] = useState('');
  const [reviewers, setReviewers] = useState<Reviewer[]>([]);
  const [selectedReviewer, setSelectedReviewer] = useState<Reviewer | null>(null);
  const [selectedPackage, setSelectedPackage] = useState<ReviewPackage | null>(null);

  // Get pre-selected reviewer and package from URL parameters
  const preselectedReviewerId = searchParams.get('reviewerId') || initialReviewerId;
  const preselectedPackageId = searchParams.get('packageId');

  useEffect(() => {
    const fetchReviewers = async () => {
        const fetchedReviewers = await getReviewers();
        setReviewers(fetchedReviewers);
    }
    fetchReviewers();
  }, []);

  const form = useForm<z.infer<typeof SubmissionFormSchema>>({
    resolver: zodResolver(SubmissionFormSchema),
    defaultValues: {
      artistName: "",
      songTitle: "",
      contactEmail: "",
      genre: "",
      reviewerId: preselectedReviewerId || "",
      packageId: preselectedPackageId || "",
      musicFile: undefined,
    },
  });

  // Initialize form with pre-selected values when reviewers are loaded
  useEffect(() => {
    if (reviewers.length > 0 && preselectedReviewerId) {
      form.setValue('reviewerId', preselectedReviewerId);
      if (preselectedPackageId) {
        form.setValue('packageId', preselectedPackageId);
      }
    }
  }, [reviewers, preselectedReviewerId, preselectedPackageId, form]);

  const fileRef = form.register("musicFile");
  const reviewerId = form.watch('reviewerId');
  const packageId = form.watch('packageId');

  useEffect(() => {
    const reviewer = reviewers.find(r => r.id === reviewerId) || null;
    setSelectedReviewer(reviewer);
    
    // Only reset package selection if it's a manual change (not pre-selected)
    if (reviewerId !== preselectedReviewerId) {
      form.setValue('packageId', '');
      setSelectedPackage(null);
    }
  }, [reviewerId, reviewers, form, preselectedReviewerId]);

  useEffect(() => {
    const pkg = selectedReviewer?.packages.find(p => p.id === packageId) || null;
    setSelectedPackage(pkg);
  }, [packageId, selectedReviewer]);

  useEffect(() => {
    const reviewerIdParam = searchParams.get('reviewerId');
    const packageIdParam = searchParams.get('packageId');

    if (reviewerIdParam) {
      const reviewer = reviewers.find(r => r.id === reviewerIdParam);
      if (reviewer) {
        form.setValue('reviewerId', reviewer.id);
        setSelectedReviewer(reviewer);
        form.setValue('packageId', ''); // Reset package selection when reviewer changes
        setSelectedPackage(null);
      }
    }

    if (packageIdParam) {
      const pkg = selectedReviewer?.packages.find(p => p.id === packageIdParam);
      if (pkg) {
        form.setValue('packageId', pkg.id);
        setSelectedPackage(pkg);
      }
    }
  }, [searchParams, reviewers, selectedReviewer]);


  async function onSubmit(data: z.infer<typeof SubmissionFormSchema>) {
    console.log('clicked');
    setIsSubmitting(true);
    
    if (!selectedReviewer || !selectedPackage) {
        toast({ title: "Please select a reviewer and a package.", variant: "destructive" });
        setIsSubmitting(false);
        return;
    }

    try {
      // Step 1: Upload the file to Firebase Storage.
      const file: File = data.musicFile[0];
      toast({ title: "Uploading your track..." });
      const audioUrl = await uploadMusicFile(file);
      
      toast({ title: "Track uploaded! Redirecting to payment..." });

      // Step 2: Create a Stripe Checkout Session
      const checkoutResult = await createCheckoutSession({
            priceInCents: selectedPackage.priceInCents,
            productName: `Review: ${selectedPackage.name} by ${selectedReviewer.name}`,
            productDescription: `Feedback for '${data.songTitle}'`,
            metadata: {
              artistName: data.artistName,
              songTitle: data.songTitle,
              contactEmail: data.contactEmail,
              audioUrl: audioUrl,
              genre: data.genre,
              reviewerId: data.reviewerId,
              packageId: data.packageId,
            }
          });

      if (checkoutResult.error || !checkoutResult.url) {
        throw new Error(checkoutResult.error || 'Failed to create checkout session.');
      }
      
      // Step 3: Redirect user to Stripe
      router.push(checkoutResult.url);

    } catch (error: unknown) {
      console.error("Submission failed:", error);
      let errorMessage = "An unknown error occurred.";
      if (error instanceof Error) {
          errorMessage = error.message;
      } else if (typeof error === "object" && error !== null && "message" in error) {
          errorMessage = (error as { message: string }).message;
      }
      toast({
        title: "Submission Failed",
        description: errorMessage || "There was an error submitting your track. Please try again.",
        variant: "destructive",
      });
      setIsSubmitting(false);
    }
  }

  // Debug: log form errors
  console.log('form errors', form.formState.errors);
  return (
    <Card className="w-full">
         <CardHeader>
            <CardTitle>Submit Your Track</CardTitle>
            <CardDescription>Fill out the form to get your music in front of our reviewers.</CardDescription>
        </CardHeader>
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)}>
                <CardContent className="space-y-6">
                    <div className="space-y-4 p-4 rounded-lg border bg-muted/50">
                        <div className="flex items-start gap-3">
                             <div className="p-2 bg-primary/10 rounded-full flex-shrink-0 mt-1">
                                <User className="w-5 h-5 text-primary" />
                            </div>
                            <div>
                                <h3 className="font-semibold">Artist & Track Info</h3>
                                <div className="grid md:grid-cols-2 gap-4 mt-2">
                                    <FormField control={form.control} name="artistName" render={({ field }) => ( <FormItem><FormControl><Input placeholder="Artist Name" {...field} /></FormControl><FormMessage /></FormItem> )} />
                                    <FormField control={form.control} name="songTitle" render={({ field }) => ( <FormItem><FormControl><Input placeholder="Song Title" {...field} /></FormControl><FormMessage /></FormItem> )} />
                                    <FormField control={form.control} name="contactEmail" render={({ field }) => ( <FormItem><FormControl><Input type="email" placeholder="Contact Email" {...field} /></FormControl><FormMessage /></FormItem> )} />
                                    <FormField control={form.control} name="genre" render={({ field }) => (
                                        <FormItem>
                                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                <FormControl><SelectTrigger><SelectValue placeholder="Select Genre" /></SelectTrigger></FormControl>
                                                <SelectContent>
                                                    <SelectItem value="Pop">Pop</SelectItem>
                                                    <SelectItem value="Rock/Indie">Rock/Indie</SelectItem>
                                                    <SelectItem value="Hip-Hop/R&B">Hip-Hop/R&B</SelectItem>
                                                    <SelectItem value="Electronic">Electronic</SelectItem>
                                                    <SelectItem value="Acoustic">Acoustic</SelectItem>
                                                    <SelectItem value="Other">Other</SelectItem>
                                                </SelectContent>
                                            </Select>
                                            <FormMessage />
                                        </FormItem>
                                    )} />
                                </div>
                            </div>
                        </div>
                    </div>
                     <div className="space-y-4 p-4 rounded-lg border bg-muted/50">
                        <div className="flex items-start gap-3">
                            <div className="p-2 bg-primary/10 rounded-full flex-shrink-0 mt-1">
                                <FileAudio className="w-5 h-5 text-primary" />
                            </div>
                            <div>
                                <h3 className="font-semibold">Upload Your Music</h3>
                                 <FormField control={form.control} name="musicFile" render={({ field }) => (
                                    <FormItem className="mt-2">
                                    <FormControl>
                                        <div className="relative">
                                        <Input type="file" className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" accept=".mp3,.wav,.m4a" {...fileRef}
                                            onChange={(e) => {
                                                field.onChange(e.target.files);
                                                setFileName(e.target.files?.[0]?.name ?? '');
                                            }} />
                                        <div className="flex items-center justify-center w-full h-24 border-2 border-dashed rounded-md cursor-pointer hover:bg-muted/80">
                                            <div className="text-center">
                                                <UploadCloud className="w-8 h-8 mx-auto text-muted-foreground" />
                                                <p className="mt-2 text-sm text-muted-foreground">
                                                    {fileName ? <span className="text-primary font-medium">{fileName}</span> : 'Click or drag to upload'}
                                                </p>
                                            </div>
                                        </div>
                                        </div>
                                    </FormControl>
                                    <FormMessage />
                                    </FormItem>
                                )} />
                            </div>
                        </div>
                    </div>
                    <div className="space-y-4 p-4 rounded-lg border bg-muted/50">
                        <div className="flex items-start gap-3">
                             <div className="p-2 bg-primary/10 rounded-full flex-shrink-0 mt-1">
                                <CheckCircle className="w-5 h-5 text-primary" />
                            </div>
                            <div>
                                <h3 className="font-semibold">Choose Your Reviewer & Package</h3>
                                <div className="grid md:grid-cols-2 gap-4 mt-2">
                                     <FormField control={form.control} name="reviewerId" render={({ field }) => (
                                        <FormItem>
                                            <Select onValueChange={field.onChange} defaultValue={field.value} disabled={reviewers.length === 0}>
                                                <FormControl><SelectTrigger><SelectValue placeholder="Select a Reviewer" /></SelectTrigger></FormControl>
                                                <SelectContent>
                                                    {reviewers.map(reviewer => (
                                                        <SelectItem key={reviewer.id} value={reviewer.id}>{reviewer.name}</SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                            <FormMessage />
                                        </FormItem>
                                    )} />
                                    <FormField control={form.control} name="packageId" render={({ field }) => (
                                        <FormItem>
                                            <Select onValueChange={field.onChange} value={field.value} disabled={!selectedReviewer}>
                                                <FormControl><SelectTrigger><SelectValue placeholder="Select a Package" /></SelectTrigger></FormControl>
                                                <SelectContent>
                                                    {selectedReviewer?.packages.map(pkg => (
                                                        <SelectItem key={pkg.id} value={pkg.id}>
                                                            {pkg.name} - ${(pkg.priceInCents / 100).toFixed(2)}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                            <FormMessage />
                                        </FormItem>
                                    )} />
                                </div>
                            </div>
                        </div>
                    </div>
                </CardContent>
                <CardFooter className="flex-col items-stretch gap-4">
                    <Separator />
                     <div className="flex justify-between font-bold text-lg">
                        <span>Total</span>
                        <span>${selectedPackage ? (selectedPackage.priceInCents / 100).toFixed(2) : '0.00'}</span>
                    </div>
                    <Button type="submit" className="w-full bg-accent hover:bg-accent/90" size="lg" disabled={isSubmitting}>
                        {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CreditCard className="mr-2 h-4 w-4" />}
                        Proceed to Payment
                    </Button>
                </CardFooter>
            </form>
        </Form>
    </Card>
  );
}
