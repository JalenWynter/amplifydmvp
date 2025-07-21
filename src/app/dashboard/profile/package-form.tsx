
'use client';

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
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
import { Textarea } from "@/components/ui/textarea";
import { ReviewPackage } from "@/lib/firebase/services";
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2 } from "lucide-react";
import { Input as ShadcnInput } from "@/components/ui/input";


const packageSchema = z.object({
  name: z.string().min(5, "Package name must be at least 5 characters."),
  priceInCents: z.coerce.number().min(500, "Price must be at least $5.00."),
  description: z.string().min(20, "Description must be at least 20 characters.").max(200, "Description cannot exceed 200 characters."),
  trackCount: z.coerce.number().int().min(1, "Must allow at least 1 track."),
  formats: z.array(z.enum(['audio', 'video', 'chart', 'written'])).refine(value => value.length > 0, {
    message: "You have to select at least one format.",
  }),
});

type PackageFormValues = z.infer<typeof packageSchema>;

const formatOptions = [
    { id: 'chart', label: '16-Point Scoring Chart' },
    { id: 'written', label: 'Detailed Written Feedback' },
    { id: 'audio', label: 'Audio Commentary' },
    { id: 'video', label: 'Video Breakdown' },
] as const;

interface PackageFormProps {
    pkg: Partial<ReviewPackage> | null;
    onSave: (data: Omit<ReviewPackage, 'id'>) => Promise<void>;
    onCancel: () => void;
    isSaving: boolean;
}

export default function PackageForm({ pkg, onSave, onCancel, isSaving }: PackageFormProps) {
  const form = useForm<PackageFormValues>({
    resolver: zodResolver(packageSchema),
    defaultValues: {
      name: pkg?.name || "",
      priceInCents: pkg?.priceInCents || 500,
      description: pkg?.description || "",
      trackCount: pkg?.trackCount || 1,
      formats: pkg?.formats || [],
    },
  });
  
  const onSubmit = (data: PackageFormValues) => {
    onSave(data);
  };

  if (!pkg) return null;

  return (
     <Dialog open={true} onOpenChange={(isOpen) => !isOpen && onCancel()}>
        <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
                <DialogTitle>{pkg.id ? 'Edit Package' : 'Add New Package'}</DialogTitle>
                <DialogDescription>
                    Define the details of your review service. Click save when you&apos;re done.
                </DialogDescription>
            </DialogHeader>
             <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4 max-h-[70vh] overflow-y-auto pr-2">
                    <FormField control={form.control} name="name" render={({ field }) => (
                        <FormItem><FormLabel>Package Name</FormLabel><FormControl><Input placeholder="e.g., Standard Written Review" {...field} /></FormControl><FormMessage /></FormItem>
                    )} />

                    <FormField control={form.control} name="priceInCents" render={({ field }) => (
                        <FormItem>
                            <FormLabel>Price (USD)</FormLabel>
                             <div className="relative">
                                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-muted-foreground">$</span>
                                <ShadcnInput 
                                    type="number" 
                                    placeholder="25.00"
                                    className="pl-7"
                                    step="0.01"
                                    {...field} 
                                    onChange={e => field.onChange(parseFloat(e.target.value) * 100)}
                                    value={field.value / 100}
                                />
                            </div>
                            <FormMessage />
                        </FormItem>
                     )} />
                    
                    <FormField control={form.control} name="description" render={({ field }) => (
                        <FormItem><FormLabel>Description</FormLabel><FormControl><Textarea placeholder="A short description of what the artist will receive." {...field} /></FormControl><FormMessage /></FormItem>
                    )} />
                    
                    <FormField control={form.control} name="trackCount" render={({ field }) => (
                        <FormItem><FormLabel>Number of Tracks</FormLabel><FormControl><Input type="number" min={1} {...field} /></FormControl><FormMessage /></FormItem>
                    )} />

                     <FormField
                        control={form.control}
                        name="formats"
                        render={() => (
                            <FormItem>
                            <div className="mb-4">
                                <FormLabel className="text-base">Feedback Formats</FormLabel>
                                <FormDescription>Select all formats included in this package.</FormDescription>
                            </div>
                            {formatOptions.map((item) => (
                                <FormField
                                key={item.id}
                                control={form.control}
                                name="formats"
                                render={({ field }) => (
                                    <FormItem key={item.id} className="flex flex-row items-start space-x-3 space-y-0">
                                    <FormControl>
                                        <Checkbox
                                        checked={field.value?.includes(item.id)}
                                        onCheckedChange={(checked) => {
                                            return checked
                                            ? field.onChange([...field.value, item.id])
                                            : field.onChange(
                                                field.value?.filter(
                                                (value) => value !== item.id
                                                )
                                            )
                                        }}
                                        />
                                    </FormControl>
                                    <FormLabel className="font-normal">{item.label}</FormLabel>
                                    </FormItem>
                                )}
                                />
                            ))}
                            <FormMessage />
                            </FormItem>
                        )}
                        />
                    
                    <DialogFooter className="pt-4">
                        <Button type="button" variant="ghost" onClick={onCancel} disabled={isSaving}>Cancel</Button>
                        <Button type="submit" disabled={isSaving}>
                            {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Save Package
                        </Button>
                    </DialogFooter>
                </form>
            </Form>
        </DialogContent>
    </Dialog>
  );
}
