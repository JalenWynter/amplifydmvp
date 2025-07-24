'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import { ReferralCode } from '@/lib/types';
import { createReferralCode, getAllReferralCodes } from '@/lib/firebase/referrals';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useAuth } from '@/context/AuthContext';

const formSchema = z.object({
  associatedUser: z.string().min(1, "Associated user (email or name) is required."),
});

export default function ReferralCodeManager() {
  const { toast } = useToast();
  const { currentUser } = useAuth();
  const [referralCodes, setReferralCodes] = useState<ReferralCode[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      associatedUser: '',
    },
  });

  const fetchReferralCodes = async () => {
    setIsLoading(true);
    try {
      const codes = await getAllReferralCodes();
      setReferralCodes(codes);
    } catch (error) {
      console.error("Error fetching referral codes:", error);
      toast({
        title: "Error",
        description: "Failed to fetch referral codes.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchReferralCodes();
  }, []);

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsCreating(true);
    try {
      if (!currentUser?.uid) {
        throw new Error("User not authenticated.");
      }
      const result = await createReferralCode(values.associatedUser, currentUser.uid);
      toast({
        title: "Success",
        description: `Referral code ${result.code} created successfully.`, 
      });
      form.reset();
      fetchReferralCodes(); // Refresh the list
    } catch (error: unknown) {
      console.error("Error creating referral code:", error);
      let errorMessage = "An unknown error occurred.";
      if (error instanceof Error) {
          errorMessage = error.message;
      } else if (typeof error === "object" && error !== null && "message" in error) {
          errorMessage = (error as { message: string }).message;
      }
      toast({
        title: "Error",
        description: errorMessage || "Failed to create referral code.",
        variant: "destructive",
      });
    } finally {
      setIsCreating(false);
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Create New Referral Code</CardTitle>
          <CardDescription>Generate a new invite code for a reviewer.</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="associatedUser"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Associated User (Email or Name)</FormLabel>
                    <FormControl>
                      <Input placeholder="reviewer@example.com" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" disabled={isCreating}>
                {isCreating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Create Code
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Existing Referral Codes</CardTitle>
          <CardDescription>List of all generated referral codes.</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <Loader2 className="h-8 w-8 animate-spin" />
          ) : referralCodes.length === 0 ? (
            <p>No referral codes found.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Code</TableHead>
                  <TableHead>Associated User</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created At</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {referralCodes.map((code) => (
                  <TableRow key={code.id}>
                    <TableCell className="font-medium">{code.code}</TableCell>
                    <TableCell>{code.associatedUser}</TableCell>
                    <TableCell>{code.status}</TableCell>
                    <TableCell>{new Date(code.createdAt).toLocaleDateString()}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
