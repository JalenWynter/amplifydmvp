'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Shield, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";

async function fetchRulesContent(filename: string): Promise<string> {
    const response = await fetch(`/api/admin/rules?filename=${filename}`);
    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Failed to fetch ${filename}`);
    }
    const data = await response.json();
    return data.content;
}

export default function SecurityPage() {
    const [firestoreRules, setFirestoreRules] = useState<string | null>(null);
    const [storageRules, setStorageRules] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchRules = async () => {
            setIsLoading(true);
            setError(null);
            try {
                const firestore = await fetchRulesContent('firestore.rules');
                setFirestoreRules(firestore);
                const storage = await fetchRulesContent('storage.rules');
                setStorageRules(storage);
            } catch (err: unknown) {
                console.error("Failed to fetch Firebase rules:", err);
                let errorMessage = "Failed to load security rules. Ensure the files exist and are accessible.";
                if (err instanceof Error) {
                    errorMessage = err.message;
                } else if (typeof err === "object" && err !== null && "message" in err) {
                    errorMessage = (err as { message: string }).message;
                }
                setError(errorMessage);
            } finally {
                setIsLoading(false);
            }
        };
        fetchRules();
    }, []);

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <div className="flex items-center gap-3">
                        <Shield className="w-6 h-6 text-primary" />
                        <CardTitle>Firebase Security Rules</CardTitle>
                    </div>
                    <CardDescription>
                        View and manage your Firestore and Storage security rules.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {isLoading ? (
                        <div className="flex items-center justify-center h-40">
                            <Loader2 className="h-8 w-8 animate-spin text-primary" />
                        </div>
                    ) : error ? (
                        <div className="text-center text-destructive py-4">
                            <p>{error}</p>
                        </div>
                    ) : (
                        <Tabs defaultValue="firestore" className="w-full">
                            <TabsList className="grid w-full grid-cols-2">
                                <TabsTrigger value="firestore">Firestore Rules</TabsTrigger>
                                <TabsTrigger value="storage">Storage Rules</TabsTrigger>
                            </TabsList>
                            <TabsContent value="firestore">
                                <Card>
                                    <CardHeader>
                                        <CardTitle>firestore.rules</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <ScrollArea className="h-[400px] rounded-md border p-4 font-mono text-sm bg-gray-50">
                                            <pre>{firestoreRules || "No firestore.rules content found."}</pre>
                                        </ScrollArea>
                                    </CardContent>
                                </Card>
                            </TabsContent>
                            <TabsContent value="storage">
                                <Card>
                                    <CardHeader>
                                        <CardTitle>storage.rules</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <ScrollArea className="h-[400px] rounded-md border p-4 font-mono text-sm bg-gray-50">
                                            <pre>{storageRules || "No storage.rules content found."}</pre>
                                        </ScrollArea>
                                    </CardContent>
                                </Card>
                            </TabsContent>
                        </Tabs>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
