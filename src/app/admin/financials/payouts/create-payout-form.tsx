'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Loader2 } from 'lucide-react';
import { Payout, Reviewer } from '@/lib/types';

const formSchema = z.object({
  reviewerId: z.string().min(1, "Reviewer is required."),
  amountInCents: z.coerce.number().int().positive("Amount must be a positive number."),
  paymentMethod: z.string().min(1, "Payment method is required."),
  reviews: z.string().optional(), // Comma-separated review IDs or descriptions
});

interface CreatePayoutFormProps {
  reviewers: Reviewer[];
  onSave: (payoutData: Omit<Payout, 'id' | 'date' | 'status' | 'amount'> & { amountInCents: number }) => void;
  onCancel: () => void;
  isSaving: boolean;
}

export default function CreatePayoutForm({ reviewers, onSave, onCancel, isSaving }: CreatePayoutFormProps) {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      reviewerId: '',
      amountInCents: 0,
      paymentMethod: '',
      reviews: '',
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    const selectedReviewer = reviewers.find(r => r.id === values.reviewerId);
    if (!selectedReviewer) {
      form.setError("reviewerId", { message: "Selected reviewer not found." });
      return;
    }

    const payoutData = {
      reviewerId: values.reviewerId,
      reviewer: {
        id: selectedReviewer.id,
        name: selectedReviewer.name,
        email: selectedReviewer.email,
        avatarUrl: selectedReviewer.avatarUrl,
      },
      amount: values.amountInCents / 100, // Convert cents to dollars for display
      amountInCents: values.amountInCents,
      paymentMethod: values.paymentMethod,
      reviews: values.reviews ? values.reviews.split(',').map(s => s.trim()).filter(s => s).map(reviewId => ({
        id: reviewId,
        date: new Date().toISOString(),
        artist: '',
        song: '',
        fee: 0,
      })) : [],
    };
    onSave(payoutData);
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center">
      <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-md">
        <h2 className="text-xl font-bold mb-4">Create New Payout</h2>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="reviewerId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Reviewer</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a reviewer" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {reviewers.map((reviewer) => (
                        <SelectItem key={reviewer.id} value={reviewer.id}>
                          {reviewer.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="amountInCents"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Amount (in cents)</FormLabel>
                  <FormControl>
                    <Input type="number" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="paymentMethod"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Payment Method</FormLabel>
                  <FormControl>
                    <Input placeholder="PayPal, Bank Transfer, etc." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="reviews"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Associated Reviews (Optional, comma-separated IDs)</FormLabel>
                  <FormControl>
                    <Textarea placeholder="review123, review456" {...field} />
                  </FormControl>
                  <FormDescription>Enter review IDs associated with this payout.</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={onCancel} disabled={isSaving}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSaving}>
                {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Create Payout
              </Button>
            </div>
          </form>
        </Form>
      </div>
    </div>
  );
}
