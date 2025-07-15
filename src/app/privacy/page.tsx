import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function PrivacyPage() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-3xl font-bold font-headline">Privacy Policy</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 text-muted-foreground">
        <p>Last updated: {new Date().toLocaleDateString()}</p>
        <h2 className="text-xl font-semibold text-foreground">1. Information We Collect</h2>
        <p>
          We collect information you provide directly to us, such as your name, email address, and music files when you submit a track or apply to be a reviewer. We also collect anonymous data through analytics to improve our service.
        </p>
        <h2 className="text-xl font-semibold text-foreground">2. How We Use Your Information</h2>
        <p>
          Your information is used to operate and maintain the Amplifyd service, process payments, facilitate reviews, and communicate with you. Your music files are shared only with the reviewers you are assigned to.
        </p>
        <h2 className="text-xl font-semibold text-foreground">3. Data Security</h2>
        <p>
            We implement security measures (including Firebase Security Rules and secure cloud infrastructure) to protect your information. However, no system is completely secure.
        </p>
        <p>
          [... This is a placeholder document. You should consult with a legal professional to draft a complete and compliant Privacy Policy for your specific business needs, especially concerning regulations like GDPR and CCPA. ...]
        </p>
      </CardContent>
    </Card>
  );
}
