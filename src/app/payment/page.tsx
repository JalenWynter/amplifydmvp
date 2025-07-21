'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { CreditCard, Music, FileAudio, Loader2 } from "lucide-react";
import { createCheckoutSession } from "@/app/actions/stripe";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";

export default function PaymentPage() {
  const { toast } = useToast();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  
  // In a real app, this data would be passed via state or query params
  // For the demo, we&apos;ll keep it static, but the checkout session will handle real data.
  const submissionDetails = {
    artistName: "Cosmic Dreamer",
    songTitle: "Starlight Echoes",
    priceInCents: 2500
  };

  const handlePayment = async () => {
    setIsLoading(true);
    toast({ title: "Redirecting to Stripe..." });
    // The actual data is passed in the submission form now.
    // This button click is just a conceptual step for the user.
    // A more robust implementation would pass a submission ID here
    // to retrieve details and prevent redundant uploads.
    // For now, we assume the user has just come from the form.
    
    // Since the logic is now handled in the previous page,
    // this page becomes more of a confirmation/summary.
    // We can disable the button after one click if needed.
    // Let's simulate a delay for UX.
    setTimeout(() => {
        // This is a fallback in case the previous page failed to redirect.
        // In the ideal flow, the user wouldn't even see this page's button.
        // They would be sent directly to Stripe from the submission form.
        toast({
            title: "Already processed",
            description: "You should be redirected automatically.",
            variant: "destructive"
        })
        setIsLoading(false);
        // Maybe redirect back to home if they land here improperly
        // router.push('/');
    }, 2000)
  }

  return (
    <div className="flex items-center justify-center py-12">
      <Card className="w-full max-w-lg shadow-xl">
        <CardHeader>
          <div className="flex items-center justify-center mb-4">
            <div className="p-3 bg-primary/10 rounded-full">
              <CreditCard className="w-8 h-8 text-primary" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold font-headline text-center">Confirm Your Submission</CardTitle>
          <CardDescription className="text-center">
            Review your details and complete the payment to send your track for review. You will be redirected to Stripe.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
            <div className="space-y-4 rounded-lg border bg-muted/50 p-4">
                <div className="flex items-start gap-4">
                    <div className="p-3 bg-accent/20 rounded-lg">
                        <Music className="w-6 h-6 text-accent" />
                    </div>
                    <div className="min-w-0 flex-1">
                        <p className="text-sm text-muted-foreground">Artist</p>
                        <p className="font-semibold break-words" title={submissionDetails.artistName}>{submissionDetails.artistName}</p>
                    </div>
                </div>
                 <div className="flex items-start gap-4">
                    <div className="p-3 bg-accent/20 rounded-lg">
                        <FileAudio className="w-6 h-6 text-accent" />
                    </div>
                    <div className="min-w-0 flex-1">
                        <p className="text-sm text-muted-foreground">Track</p>
                        <p className="font-semibold break-words" title={submissionDetails.songTitle}>{submissionDetails.songTitle}</p>
                    </div>
                </div>
            </div>
          
            <Separator />
            <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                    <span className="text-muted-foreground">Standard Review Fee</span>
                    <span>${(submissionDetails.priceInCents / 100).toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                    <span className="text-muted-foreground">Processing Fee</span>
                    <span>$0.00</span>
                </div>
                <div className="flex justify-between font-bold text-lg">
                    <span>Total</span>
                    <span>${(submissionDetails.priceInCents / 100).toFixed(2)}</span>
                </div>
            </div>
        </CardContent>
        <CardFooter>
            <Button className="w-full bg-accent hover:bg-accent/90" size="lg" onClick={handlePayment} disabled={true}>
                 {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Redirecting to payment...
            </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
