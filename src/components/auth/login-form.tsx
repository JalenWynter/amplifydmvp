'use client'

import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { Button } from "@/components/ui/button"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { useToast } from "@/hooks/use-toast"
import { useState } from "react"
import { Loader2 } from "lucide-react"
import { Separator } from "@/components/ui/separator"
import { signInWithEmailAndPassword, signInWithPopup, GoogleAuthProvider } from "firebase/auth"
import { auth, db } from "@/lib/firebase/client"
import { doc, getDoc } from "firebase/firestore"
import { useRouter } from "next/navigation"

const formSchema = z.object({
  email: z.string().email({ message: "Please enter a valid email." }),
  password: z.string().min(1, { message: "Password is required." }),
})

export default function LoginForm() {
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState<boolean>(false)
  const router = useRouter();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  })

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true)
    try {
      await signInWithEmailAndPassword(auth, values.email, values.password);
      toast({
        title: "Login Successful!",
        description: "Redirecting you to your dashboard.",
      });
      router.push('/dashboard');
    } catch (error: unknown) {
      let description = "An unknown error occurred. Please try again.";
      if (error instanceof Error) {
          if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') {
            description = "Invalid email or password. Please check your credentials and try again.";
          }
      }
      toast({
        title: "Login Failed",
        description: description,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false)
    }
  }

  const handleGoogleSignIn = async () => {
    setIsLoading(true)
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      
      // Check if user exists in our database
      const userDoc = await getDoc(doc(db, "users", result.user.uid));
      
      if (!userDoc.exists()) {
        // User doesn't exist in our database - sign them out and redirect to apply
        await auth.signOut();
        toast({
          title: "Account Not Found",
          description: "Please apply for an account first.",
          variant: "destructive",
        });
        router.push('/apply');
        return;
      }
      
      toast({
        title: "Login Successful!",
        description: "Redirecting you to your dashboard.",
      });
      router.push('/dashboard');
    } catch (error: unknown) {
      let description = "An unknown error occurred. Please try again.";
      if (error instanceof Error) {
        if (error.code === 'auth/popup-closed-by-user') {
          description = "Sign-in was cancelled.";
        } else if (error.code === 'auth/popup-blocked') {
          description = "Sign-in popup was blocked. Please allow popups for this site.";
        } else {
          description = error.message;
        }
      }
      toast({
        title: "Google Sign-In Failed",
        description: description,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-4">
      <Button variant="outline" className="w-full" onClick={handleGoogleSignIn} disabled={isLoading}>
        {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 
        <svg className="mr-2 h-4 w-4" aria-hidden="true" focusable="false" data-prefix="fab" data-icon="google" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 488 512"><path fill="currentColor" d="M488 261.8C488 403.3 381.4 512 244 512 110.1 512 0 398.8 0 261.8 0 124.9 110.1 14.9 244 14.9 314.8 14.9 375.4 42.9 416.3 80.5l-65.9 64.2c-20.5-18.9-46.3-31.5-77.9-31.5-59.5 0-107.5 49.3-107.5 109.8s48 109.8 107.5 109.8c68.3 0 97.5-49.3 100.4-74.8H244v-81.8h244z"></path></svg>
        }
        Sign in with Google
      </Button>

      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <Separator />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-card px-2 text-muted-foreground">
            Or continue with
          </span>
        </div>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email</FormLabel>
                <FormControl>
                  <Input placeholder="your@email.com" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Password</FormLabel>
                <FormControl>
                  <Input type="password" placeholder="••••••••" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Login
          </Button>
        </form>
      </Form>
    </div>
  )
}
