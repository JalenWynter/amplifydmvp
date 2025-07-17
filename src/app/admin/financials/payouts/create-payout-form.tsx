
'use client';

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, useFieldArray } from "react-hook-form";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { Payout, Reviewer } from "@/lib/firebase/services";
import { Loader2, PlusCircle, Trash2 } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";

const payoutSchema = z.object({
  reviewerId: z.string().min(1, "Please select a reviewer."),
  paymentMethod: z.string().min(3, "Payment method is required."),
  reviews: z.array(z.object({
    artist: z.string().min(1, "Artist name is required."),
    song: z.string().min(1, "Song title is required."),
    fee: z.coerce.number().min(0, "Fee must be a positive number."),
  })).min(1, "At least one review must be added to the payout."),
});

type PayoutFormValues = z.infer<typeof payoutSchema>;

interface CreatePayoutFormProps {
    reviewers: Reviewer[];
    onSave: (data: Omit<Payout, 'id' | 'date' | 'status'>) => Promise<void>;
    onCancel: () => void;
    isSaving: boolean;
}

export default function CreatePayoutForm({ reviewers, onSave, onCancel, isSaving }: CreatePayoutFormProps) {
  const form = useForm<PayoutFormValues>({
    resolver: zodResolver(payoutSchema),
    defaultValues: {
      reviewerId: "",
      paymentMethod: "PayPal",
      reviews: [{ artist: '', song: '', fee: 0 }],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "reviews"
  });

  const onSubmit = (data: PayoutFormValues) => {
    const selectedReviewer = reviewers.find(r => r.id === data.reviewerId);
    if (!selectedReviewer) return;

    const totalAmount = data.reviews.reduce((sum, review) => sum + review.fee, 0);
    
    const payoutData: Omit<Payout, 'id' | 'date' | 'status'> = {
        reviewer: {
            id: selectedReviewer.id,
            name: selectedReviewer.name,
            email: `${selectedReviewer.name.toLowerCase().replace(/\s+/g, '.')}@amplifyd.com`, // Generate email from name
            avatarUrl: selectedReviewer.avatarUrl || ''
        },
        amount: `$${totalAmount.toFixed(2)}`,
        paymentMethod: data.paymentMethod,
        reviews: data.reviews.map(r => ({
            ...r,
            id: `rev_${Math.random().toString(36).substring(2, 9)}`,
            date: new Date().toISOString()
        }))
    };

    onSave(payoutData);
  };

  return (
     <Dialog open={true} onOpenChange={(isOpen) => !isOpen && onCancel()}>
        <DialogContent className="sm:max-w-2xl">
            <DialogHeader>
                <DialogTitle>Create Manual Payout</DialogTitle>
                <DialogDescription>
                    Fill in the details to create a new payout record.
                </DialogDescription>
            </DialogHeader>
             <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4 max-h-[70vh] overflow-y-auto pr-2">
                    <div className="grid grid-cols-2 gap-4">
                        <FormField control={form.control} name="reviewerId" render={({ field }) => (
                            <FormItem>
                                <FormLabel>Reviewer</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                    <FormControl>
                                    <SelectTrigger><SelectValue placeholder="Select a reviewer" /></SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                    {reviewers.map(r => <SelectItem key={r.id} value={r.id}>{r.name}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                                <FormMessage />
                            </FormItem>
                        )} />

                         <FormField control={form.control} name="paymentMethod" render={({ field }) => (
                            <FormItem>
                                <FormLabel>Payment Method</FormLabel>
                                <FormControl><Input placeholder="e.g. PayPal, Stripe Connect" {...field} /></FormControl>
                                <FormMessage />
                            </FormItem>
                        )} />
                    </div>

                    <Separator className="my-6"/>

                    <div>
                        <h3 className="text-lg font-medium mb-2">Included Reviews</h3>
                        <div className="space-y-4">
                        {fields.map((field, index) => (
                            <div key={field.id} className="grid grid-cols-12 gap-2 items-end p-2 border rounded-md">
                                <FormField
                                    control={form.control}
                                    name={`reviews.${index}.artist`}
                                    render={({ field }) => (
                                        <FormItem className="col-span-4">
                                            <FormLabel className="text-xs">Artist</FormLabel>
                                            <FormControl><Input placeholder="Artist Name" {...field} /></FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name={`reviews.${index}.song`}
                                    render={({ field }) => (
                                        <FormItem className="col-span-4">
                                            <FormLabel className="text-xs">Song</FormLabel>
                                            <FormControl><Input placeholder="Song Title" {...field} /></FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                 <FormField
                                    control={form.control}
                                    name={`reviews.${index}.fee`}
                                    render={({ field }) => (
                                        <FormItem className="col-span-3">
                                            <FormLabel className="text-xs">Fee ($)</FormLabel>
                                            <FormControl><Input type="number" placeholder="25.00" {...field} /></FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <div className="col-span-1">
                                    {fields.length > 1 && (
                                        <Button type="button" variant="ghost" size="icon" onClick={() => remove(index)}>
                                            <Trash2 className="h-4 w-4 text-destructive" />
                                        </Button>
                                    )}
                                </div>
                            </div>
                        ))}
                        </div>
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="mt-2"
                            onClick={() => append({ artist: '', song: '', fee: 0 })}
                        >
                            <PlusCircle className="mr-2 h-4 w-4" />
                            Add Another Review
                        </Button>
                         {form.formState.errors.reviews && <FormMessage className="mt-2">{form.formState.errors.reviews.message}</FormMessage>}
                    </div>
                    
                    <DialogFooter className="pt-4">
                        <Button type="button" variant="ghost" onClick={onCancel} disabled={isSaving}>Cancel</Button>
                        <Button type="submit" disabled={isSaving}>
                            {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Create Payout
                        </Button>
                    </DialogFooter>
                </form>
            </Form>
        </DialogContent>
    </Dialog>
  );
}
