'use client';

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Info, ArrowLeft, Users } from "lucide-react";
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { createReferralCode, getCodesCreatedToday } from "@/lib/firebase/services";
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from '@/lib/firebase/client';
import Link from "next/link";

const phoneRegex = new RegExp(
  /^([+]?[\s0-9]+)?(\d{3}|[(]?[0-9]+[)])?([-]?[\s]?[0-9])+$/
);

const referralCodeSchema = z.object({
    associatedUser: z.string().superRefine((val, ctx) => {
        const isEmail = z.string().email().safeParse(val).success;
        const isPhone = phoneRegex.test(val) && val.length >= 10;

        if (!isEmail && !isPhone) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: "Must be a valid email or a phone number with at least 10 digits.",
            });
        }
    }),
});

export default function GenerateReferralCodePage() {
    const [user, loading] = useAuthState(auth);
    const { toast } = useToast();
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);
    const [codesCreatedToday, setCodesCreatedToday] = useState(0);
    const [isLoadingDailyCount, setIsLoadingDailyCount] = useState(true);
    
    const form = useForm<z.infer<typeof referralCodeSchema>>({
        resolver: zodResolver(referralCodeSchema),
        defaultValues: {
            associatedUser: "",
        },
    });

    // Pre-fill with user's email when form loads
    useEffect(() => {
        if (user && user.email) {
            form.setValue("associatedUser", user.email);
        }
    }, [user, form]);

    // Load daily codes count
    useEffect(() => {
        if (user && !loading) {
            const fetchDailyCount = async () => {
                try {
                    const count = await getCodesCreatedToday(user.uid);
                    setCodesCreatedToday(count);
                } catch (error) {
                    console.error("Error fetching daily codes count:", error);
                } finally {
                    setIsLoadingDailyCount(false);
                }
            };
            fetchDailyCount();
        }
    }, [user, loading]);

    async function onSubmit(values: z.infer<typeof referralCodeSchema>) {
        setIsLoading(true);
        try {
            const newCode = await createReferralCode(values.associatedUser);
            setCodesCreatedToday(prev => prev + 1);
            toast({
                title: "Referral Code Generated! 🎉",
                description: `Your invite code: ${newCode.code} - Share this with industry professionals you'd like to invite.`,
                duration: 8000, // Show toast longer
            });
            // Include the code ID in the redirect to highlight it
            router.push(`/dashboard/referrals?newCode=${newCode.id}`);
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : "There was a problem creating the referral code. Please try again.";
            toast({
                title: "Failed to Generate Code",
                description: errorMessage,
                variant: 'destructive'
            });
        } finally {
            setIsLoading(false);
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
            <div className="flex items-center gap-4">
                <Button variant="outline" size="sm" asChild>
                    <Link href="/dashboard/referrals">
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Back to Referrals
                    </Link>
                </Button>
                <div>
                    <h1 className="text-3xl font-bold font-headline">Generate Referral Code</h1>
                    <p className="text-muted-foreground">Create a unique invite code for music industry professionals.</p>
                </div>
            </div>

            <Card className="max-w-2xl">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Users className="w-5 h-5" />
                        Generate Invite Code
                    </CardTitle>
                    <CardDescription>
                        Create a unique, 24-hour invite code to help grow the Amplifyd community.
                    </CardDescription>
                    {!isLoadingDailyCount && (
                        <div className="mt-2 p-3 bg-blue-50 rounded-lg border border-blue-200">
                            <div className="flex items-center justify-between">
                                <span className="text-sm font-medium text-blue-900">
                                    Daily Limit: {codesCreatedToday}/10 codes used
                                </span>
                                <span className="text-sm text-blue-700">
                                    {10 - codesCreatedToday} remaining
                                </span>
                            </div>
                        </div>
                    )}
                </CardHeader>
                <CardContent>
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                             <FormField
                                control={form.control}
                                name="associatedUser"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Your Contact Information</FormLabel>
                                        <FormControl>
                                            <Input placeholder="Enter your email or phone number" {...field} />
                                        </FormControl>
                                        <FormDescription>
                                            This referral code will be linked to your account for tracking purposes.
                                        </FormDescription>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <Button type="submit" className="w-full" disabled={isLoading || isLoadingDailyCount || codesCreatedToday >= 10}>
                                 {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                {codesCreatedToday >= 10 ? "Daily Limit Reached" : "Generate Referral Code"}
                            </Button>
                        </form>
                    </Form>
                     
                    {!isLoadingDailyCount && codesCreatedToday >= 10 && (
                        <Alert className="mt-6 border-orange-200 bg-orange-50">
                            <Info className="h-4 w-4 text-orange-600" />
                            <AlertTitle className="text-orange-900">Daily Limit Reached</AlertTitle>
                            <AlertDescription className="text-orange-800">
                                You've generated 10 referral codes today. The daily limit resets at midnight to ensure fair usage across all reviewers.
                            </AlertDescription>
                        </Alert>
                    )}

                    <Alert className="mt-6">
                        <Info className="h-4 w-4" />
                        <AlertTitle>How It Works</AlertTitle>
                        <AlertDescription>
                            Your referral code will be valid for 24 hours and can only be used once. 
                            Share it with music industry professionals you'd like to invite to join Amplifyd as reviewers.
                        </AlertDescription>
                    </Alert>
                </CardContent>
            </Card>
        </div>
    )
} 