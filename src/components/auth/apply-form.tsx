
'use client'

import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { Button } from "@/components/ui/button"
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { useToast } from "@/hooks/use-toast"
import { useState, useEffect } from "react"
import { Loader2 } from "lucide-react"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select"
import { addApplication, AppSettings } from "@/lib/firebase/services"
import { useRouter } from "next/navigation"

const applySchemaBase = {
  fullName: z.string().min(3, "Full name is required."),
  email: z.string().email("Invalid email address."),
  primaryRole: z.string().min(1, "Please select your primary role."),
  portfolioLink: z.string().url("Please enter a valid URL (e.g., LinkedIn, website).").optional().or(z.literal('')),
  musicBackground: z.string().min(100, "Please provide at least 100 characters about your background."),
  joinReason: z.string().min(100, "Please provide at least 100 characters."),
  referral: z.string().optional(),
};

const inviteOnlySchema = z.object({
    ...applySchemaBase,
    referral: z.string().min(1, "An invite code is required to apply."),
});

const openSchema = z.object(applySchemaBase);


export default function ApplyForm({ appSettings }: { appSettings: AppSettings }) {
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState<boolean>(false)
  const router = useRouter();

  const currentSchema = appSettings?.applicationMode === 'invite-only' ? inviteOnlySchema : openSchema;

  const form = useForm<z.infer<typeof currentSchema>>({
    resolver: zodResolver(currentSchema),
    defaultValues: {
      fullName: "",
      email: "",
      primaryRole: "",
      portfolioLink: "",
      musicBackground: "",
      joinReason: "",
      referral: "",
    },
  })

  async function onSubmit(values: z.infer<typeof currentSchema>) {
    setIsLoading(true);
    
    try {
      const applicationData = {
        name: values.fullName,
        email: values.email,
        primaryRole: values.primaryRole,
        portfolioLink: values.portfolioLink || '',
        musicBackground: values.musicBackground,
        joinReason: values.joinReason,
        referral: values.referral || '',
      };
      
      await addApplication(applicationData);

      toast({
        title: "Application Submitted!",
        description: "Your account has been created. We'll review your application shortly. Redirecting you to the home page.",
      });
      form.reset();
      router.push('/');

    } catch (error: any) {
       let description = "There was an error submitting your application. Please try again.";
       if (error.code === 'auth/email-already-in-use') {
           description = "This email address is already in use. Please try another one or login.";
       } else if (error.message.includes("code is required") || error.message.includes("code is invalid") || error.message.includes("code is no longer active") || error.message.includes("code has expired")) {
           description = error.message;
       }
      toast({
        title: "Submission Failed",
        description: description,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }
  
  const isInviteOnly = appSettings?.applicationMode === 'invite-only';

  if (!appSettings) {
      return <div className="flex justify-center items-center h-40"><Loader2 className="w-6 h-6 animate-spin" /></div>
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="fullName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Full Name</FormLabel>
              <FormControl><Input placeholder="John Doe" {...field} /></FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl><Input type="email" placeholder="you@example.com" {...field} /></FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="primaryRole"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Primary Role</FormLabel>
               <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select your main role in the industry" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="a&r">A&R</SelectItem>
                  <SelectItem value="producer">Producer / Engineer</SelectItem>
                  <SelectItem value="journalist">Music Journalist / Blogger</SelectItem>
                  <SelectItem value="label_manager">Label Manager</SelectItem>
                  <SelectItem value="dj">DJ</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
         <FormField
          control={form.control}
          name="musicBackground"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Your Music Background</FormLabel>
              <FormControl>
                <Textarea rows={5} placeholder="Describe your catalog background, genres you specialize in, notable achievements, and your overall experience in the music industry..." {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
         <FormField
          control={form.control}
          name="joinReason"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Why do you want to join Amplifyd?</FormLabel>
              <FormControl>
                <Textarea rows={4} placeholder="What motivates you to review music and help emerging artists? What makes you a good fit for our community?" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
         <FormField
          control={form.control}
          name="portfolioLink"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Portfolio Link</FormLabel>
              <FormControl><Input placeholder="https://linkedin.com/in/..." {...field} /></FormControl>
              <FormDescription>Your website, LinkedIn, or portfolio link.</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="referral"
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                Invite Code {isInviteOnly ? <span className="text-destructive">*</span> : '(Optional)'}
              </FormLabel>
              <FormControl><Input placeholder="INVITE-..." {...field} /></FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" className="w-full bg-accent hover:bg-accent/90" disabled={isLoading}>
          {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Submit Application
        </Button>
      </form>
    </Form>
  )
}
