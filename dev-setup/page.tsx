import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Code, TestTube2, Database } from "lucide-react";
import Link from "next/link";

export default function DevSetupPage() {
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
                        <CardDescription>Populate your local Firestore emulator with sample data (reviewers, submissions).</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Button className="w-full">Seed Data</Button>
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
                        <Button variant="link" asChild className="justify-start p-0"><Link href="#">EMAIL_SETUP.md</Link></Button>
                        <Button variant="link" asChild className="justify-start p-0"><Link href="#">changelog-frontend.md</Link></Button>
                        <Button variant="link" asChild className="justify-start p-0"><Link href="#">changelog-backend.md</Link></Button>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
