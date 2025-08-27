
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
import { signInWithPopup, GoogleAuthProvider } from "firebase/auth"
import { auth, db } from "@/lib/firebase/client"
import { doc, getDoc, setDoc } from "firebase/firestore"

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
  const [isGoogleLoading, setIsGoogleLoading] = useState<boolean>(false)
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

    } catch (error: unknown) {
       let description = "There was an error submitting your application. Please try again.";
       if (error instanceof Error) {
           if (error.code === 'auth/email-already-in-use') {
               description = "This email address is already in use. Please try another one or login.";
           } else if (error.message.includes("code is required") || error.message.includes("code is invalid") || error.message.includes("code is no longer active") || error.message.includes("code has expired")) {
               description = error.message;
           }
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

  const handleGoogleSignUp = async () => {
    setIsGoogleLoading(true);
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      
      // Check if user already exists in our database
      const userDoc = await getDoc(doc(db, "users", result.user.uid));
      
      if (userDoc.exists()) {
        // User already exists - sign them out and show message
        await auth.signOut();
        toast({
          title: "Account Already Exists",
          description: "This Google account is already registered. Please login instead.",
          variant: "destructive",
        });
        router.push('/login');
        return;
      }

      // Create user document in Firestore
      const userData = {
        id: result.user.uid,
        name: result.user.displayName || 'Unknown User',
        email: result.user.email || '',
        avatarUrl: result.user.photoURL || '/USETHIS.png',
        role: 'uploader' as const,
        status: 'active' as const,
        joinedAt: new Date().toISOString(),
      };

      await setDoc(doc(db, "users", result.user.uid), userData);

      toast({
        title: "Account Created Successfully!",
        description: "Your Google account has been linked. You can now submit music for review.",
      });
      
      router.push('/dashboard');
    } catch (error: unknown) {
      console.error("Google sign-up error:", error);
      let description = "An unknown error occurred. Please try again.";
      if (error instanceof Error) {
        if (error.code === 'auth/popup-closed-by-user') {
          description = "Sign-up was cancelled.";
        } else if (error.code === 'auth/popup-blocked') {
          description = "Sign-up popup was blocked. Please allow popups for this site.";
        } else {
          description = error.message;
        }
      }
      toast({
        title: "Google Sign-Up Failed",
        description: description,
        variant: "destructive",
      });
    } finally {
      setIsGoogleLoading(false);
    }
  };

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
        <div className="space-y-4">
          <Button type="submit" className="w-full bg-accent hover:bg-accent/90" disabled={isLoading}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Submit Application
          </Button>
          
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">Or</span>
            </div>
          </div>
          
          <Button 
            type="button" 
            variant="outline" 
            className="w-full" 
            onClick={handleGoogleSignUp}
            disabled={isGoogleLoading}
          >
            {isGoogleLoading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
                <path
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  fill="#4285F4"
                />
                <path
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  fill="#34A853"
                />
                <path
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  fill="#FBBC05"
                />
                <path
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  fill="#EA4335"
                />
              </svg>
            )}
            Sign up with Google
          </Button>
        </div>
      </form>
    </Form>
  )
}
