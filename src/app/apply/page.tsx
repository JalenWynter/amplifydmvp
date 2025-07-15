import ApplyForm from "@/components/auth/apply-form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getAppSettingsAdmin } from "@/lib/firebase/admin";
import { ListChecks } from "lucide-react";
import Link from "next/link";

export default async function ApplyPage() {
  const appSettings = await getAppSettingsAdmin();

  return (
    <div className="grid md:grid-cols-2 gap-12 items-start">
      <div>
        <h1 className="text-3xl font-bold font-headline text-primary mb-4">Join Our Reviewer Network</h1>
        <p className="text-muted-foreground mb-6">
          Are you an A&R, producer, label manager, or music journalist with a passion for discovering new talent? Apply to become a verified reviewer on Amplifyd and get paid for your expertise.
        </p>
        <div className="space-y-4">
          <div className="flex items-start gap-3">
            <ListChecks className="w-6 h-6 text-accent mt-1 flex-shrink-0" />
            <div>
              <h3 className="font-semibold">Flexible Workflow</h3>
              <p className="text-sm text-muted-foreground">Review tracks on your own schedule, from anywhere.</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <ListChecks className="w-6 h-6 text-accent mt-1 flex-shrink-0" />
            <div>
              <h3 className="font-semibold">Get Paid for Your Skills</h3>
              <p className="text-sm text-muted-foreground">Earn money for providing valuable, detailed feedback.</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <ListChecks className="w-6 h-6 text-accent mt-1 flex-shrink-0" />
            <div>
              <h3 className="font-semibold">Discover New Music</h3>
              <p className="text-sm text-muted-foreground">Be the first to hear tracks from emerging artists worldwide.</p>
            </div>
          </div>
        </div>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Reviewer Application</CardTitle>
          <CardDescription>
            Tell us about your experience. All applications are manually reviewed.
            Already have an account? <Link href="/login" className="text-primary hover:underline">Login</Link>.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ApplyForm appSettings={appSettings} />
        </CardContent>
      </Card>
    </div>
  );
}
