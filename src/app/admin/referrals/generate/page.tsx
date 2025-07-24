
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
import { Loader2, Info } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { createReferralCode } from "@/lib/firebase/services";
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from '@/lib/firebase/client';

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
    const [user] = useAuthState(auth);
    const { toast } = useToast();
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);
    
    const form = useForm<z.infer<typeof referralCodeSchema>>({
        resolver: zodResolver(referralCodeSchema),
        defaultValues: {
            associatedUser: "",
        },
    });

    async function onSubmit(values: z.infer<typeof referralCodeSchema>) {
        setIsLoading(true);
        try {
            if (!user) throw new Error('User not authenticated');
            const newCode = await createReferralCode(values.associatedUser, user.uid);
            toast({
                title: "Invite Code Generated!",
                description: `New single-use code created: ${newCode.code}`,
            });
            router.push('/admin/referrals');
        } catch (error) {
             toast({
                title: "Failed to Generate Code",
                description: "There was a problem creating the referral code. Please try again.",
                variant: 'destructive'
            });
        } finally {
            setIsLoading(false);
        }
    }
    
    return (
        <Card className="max-w-2xl mx-auto">
            <CardHeader>
                <CardTitle>Generate Single-Use Invite Code</CardTitle>
                <CardDescription>Create a unique, 24-hour invite link for a specific referrer.</CardDescription>
            </CardHeader>
            <CardContent>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                         <FormField
                            control={form.control}
                            name="associatedUser"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Associated Referrer&apos;s Email or Phone</FormLabel>
                                    <FormControl>
                                        <Input placeholder="Enter a valid email or phone number" {...field} />
                                    </FormControl>
                                    <FormDescription>Link this invite to a specific reviewer or affiliate for tracking.</FormDescription>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <Button type="submit" className="w-full" disabled={isLoading}>
                             {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Generate Invite & View List
                        </Button>
                    </form>
                </Form>
                 <Alert className="mt-6">
                  <Info className="h-4 w-4" />
                  <AlertTitle>Heads Up!</AlertTitle>
                  <AlertDescription>
                    All generated codes are single-use and expire 24 hours after creation. Generation is limited to 10 per hour and 25 per day to prevent spam.
                  </AlertDescription>
                </Alert>
            </CardContent>
        </Card>
    )
}
