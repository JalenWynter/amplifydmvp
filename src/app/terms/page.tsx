import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function TermsPage() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-3xl font-bold font-headline">Terms of Service</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 text-muted-foreground">
        <p>Last updated: {new Date().toLocaleDateString()}</p>
        <h2 className="text-xl font-semibold text-foreground">1. Introduction</h2>
        <p>
          Welcome to Amplifyd! These Terms of Service (&quot;Terms&quot;) govern your use of our website and services. By accessing or using Amplifyd, you agree to be bound by these Terms.
        </p>
        <h2 className="text-xl font-semibold text-foreground">2. Service Description</h2>
        <p>
          Amplifyd provides a platform for artists to submit music for review by industry professionals. We facilitate the connection but do not guarantee specific outcomes or career advancement.
        </p>
        <h2 className="text-xl font-semibold text-foreground">3. User Obligations</h2>
        <p>
            You agree to provide accurate information during submission and application processes. You retain all ownership rights to the music you submit.
        </p>
        <p>
          [... This is a placeholder document. You should consult with a legal professional to draft a complete and compliant Terms of Service for your specific business needs. ...]
        </p>
      </CardContent>
    </Card>
  );
}
