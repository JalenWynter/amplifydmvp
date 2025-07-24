
'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { getAppSettings, updateAppSettings } from "@/lib/firebase/services";
import { AppSettings } from '@/lib/types';
import { useEffect, useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

function SettingsSkeleton() {
    return (
        <Card>
            <CardHeader>
                <div className="h-8 w-1/3 bg-muted rounded-md animate-pulse" />
                <div className="h-4 w-2/3 bg-muted rounded-md animate-pulse" />
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="flex items-center justify-between rounded-lg border p-4">
                    <div className="space-y-1">
                         <div className="h-5 w-1/4 bg-muted rounded-md animate-pulse" />
                         <div className="h-4 w-3/4 bg-muted rounded-md animate-pulse" />
                    </div>
                    <div className="h-6 w-11 bg-muted rounded-full animate-pulse" />
                </div>
            </CardContent>
        </Card>
    )
}

export default function SettingsPage() {
    const [settings, setSettings] = useState<AppSettings | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const { toast } = useToast();

    useEffect(() => {
        const fetchSettings = async () => {
            setIsLoading(true);
            const appSettings = await getAppSettings();
            setSettings(appSettings);
            setIsLoading(false);
        };
        fetchSettings();
    }, []);

    const handleApplicationModeChange = async (isInviteOnly: boolean) => {
        if (!settings) return;

        setIsSaving(true);
        const newMode = isInviteOnly ? 'invite-only' : 'open';
        
        try {
            await updateAppSettings({ applicationMode: newMode });
            setSettings(prev => prev ? { ...prev, applicationMode: newMode } : null);
            toast({
                title: "Settings Updated",
                description: `Reviewer applications are now ${newMode === 'invite-only' ? 'invite-only' : 'open to everyone'}.`
            });
        } catch (error) {
            console.error("Failed to update settings:", error);
            toast({ title: "Error", description: "Could not save settings.", variant: "destructive" });
        } finally {
            setIsSaving(false);
        }
    }


    if (isLoading) {
        return <SettingsSkeleton />;
    }

    if (!settings) {
        return <div>Could not load application settings.</div>
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>Platform Settings</CardTitle>
                <CardDescription>Manage global settings for the Amplifyd application.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="flex items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                        <Label htmlFor="invite-only-mode" className="text-base">Invite-Only Applications</Label>
                        <p className="text-sm text-muted-foreground">
                            When enabled, new reviewers must provide a valid invite code to apply.
                        </p>
                    </div>
                     <div className="flex items-center gap-2">
                        {isSaving && <Loader2 className="h-4 w-4 animate-spin" />}
                        <Switch
                            id="invite-only-mode"
                            checked={settings.applicationMode === 'invite-only'}
                            onCheckedChange={handleApplicationModeChange}
                            disabled={isSaving}
                        />
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
