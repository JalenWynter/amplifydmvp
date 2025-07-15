
'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Code, TestTube2, Database, Loader2 } from "lucide-react";
import Link from "next/link";
import { seedDatabase } from "@/lib/firebase/services";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";

export default function DevSetupPage() {
    const { toast } = useToast();
    const [isSeeding, setIsSeeding] = useState(false);

    const handleSeed = async () => {
        setIsSeeding(true);
        toast({ title: "Seeding Database...", description: "This may take a moment. Please wait." });
        try {
            await seedDatabase();
            toast({ title: "Database Seeded Successfully!", description: "Your test data has been loaded into Firestore." });
        } catch (error) {
            console.error("Seeding failed:", error);
            toast({ title: "Seeding Failed", description: "Could not seed the database. Check the console for errors.", variant: "destructive" });
        } finally {
            setIsSeeding(false);
        }
    }

    return (
        <div className="container mx-auto p-8">
            <h1 className="text-4xl font-bold font-headline mb-2">Developer Setup</h1>
            <p className="text-muted-foreground mb-8">Tools and utilities for local development and testing.</p>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <Card>
                    <CardHeader>
                        <div className="flex items-center gap-3">
                            <Database className="w-6 h-6 text-primary"/>
                            <CardTitle>Seed Database</CardTitle>
                        </div>
                        <CardDescription>Populate your Firestore database with a fresh set of realistic sample data (reviewers, users, payouts, applications). This will overwrite existing data.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Button className="w-full" onClick={handleSeed} disabled={isSeeding}>
                            {isSeeding ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Seed Data"}
                        </Button>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <div className="flex items-center gap-3">
                            <TestTube2 className="w-6 h-6 text-primary"/>
                            <CardTitle>Run Tests</CardTitle>
                        </div>
                        <CardDescription>Execute the comprehensive test suite for the application.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <p className="text-sm text-muted-foreground mb-4 font-code">
                            See <code className="bg-muted p-1 rounded">comprehensive-test.js</code> and <code className="bg-muted p-1 rounded">test-init.js</code>
                        </p>
                        <Button variant="outline" className="w-full">Run Tests</Button>
                    </CardContent>
                </Card>

                 <Card>
                    <CardHeader>
                        <div className="flex items-center gap-3">
                            <Code className="w-6 h-6 text-primary"/>
                            <CardTitle>View Documentation</CardTitle>
                        </div>
                        <CardDescription>Access internal development documentation and changelogs.</CardDescription>
                    </CardHeader>
                    <CardContent className="flex flex-col gap-2">
                        <Button variant="link" asChild className="justify-start p-0"><Link href="/EMAIL_SETUP.md">EMAIL_SETUP.md</Link></Button>
                        <Button variant="link" asChild className="justify-start p-0"><Link href="/changelog.md">changelog.md</Link></Button>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
