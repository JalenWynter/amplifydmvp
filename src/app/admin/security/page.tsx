import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Shield } from "lucide-react";

export default function SecurityPage() {
    return (
        <Card>
            <CardHeader>
                <div className="flex items-center gap-3">
                    <Shield className="w-6 h-6 text-primary"/>
                    <CardTitle>Firebase Security Rules</CardTitle>
                </div>
                <CardDescription>
                    Security rules management interface for Firestore and Storage access control.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <div className="p-4 bg-muted rounded-md text-sm text-muted-foreground">
                    <p>In a real application, this page would fetch and display the contents of your <code className="font-mono bg-muted-foreground/10 p-1 rounded">firestore.rules</code> and <code className="font-mono bg-muted-foreground/10 p-1 rounded">storage.rules</code> files.</p>
                    <p className="mt-2">It could also include a simulator or a test runner to validate rule changes before deployment.</p>
                </div>
            </CardContent>
        </Card>
    );
}
