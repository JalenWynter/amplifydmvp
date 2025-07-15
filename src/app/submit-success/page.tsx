import Confetti from '@/components/confetti';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle } from 'lucide-react';
import Link from 'next/link';

export default function SubmitSuccessPage() {
  return (
    <>
      <Confetti />
      <div className="flex items-center justify-center py-12">
        <Card className="w-full max-w-lg text-center shadow-2xl">
          <CardHeader>
            <div className="mx-auto bg-green-100 p-3 rounded-full">
              <CheckCircle className="w-12 h-12 text-green-600" />
            </div>
            <CardTitle className="mt-4 text-2xl font-bold text-primary">Submission Successful!</CardTitle>
            <CardDescription>
              Your track is on its way to our reviewers.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground">
              Thank you for trusting Amplifyd. You'll receive an email at the address you provided once your review is complete. This typically takes 3-5 business days.
            </p>
            <p className="font-semibold">Keep an eye on your inbox!</p>
          </CardContent>
          <CardFooter>
            <Button asChild className="w-full">
              <Link href="/">Submit Another Track</Link>
            </Button>
          </CardFooter>
        </Card>
      </div>
    </>
  );
}
