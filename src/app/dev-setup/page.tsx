
'use client'

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { seedDatabase, getCurrentUserInfo, updateDatabaseWithRealUIDs } from "@/lib/firebase/services";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import { Loader2, Database, User, Bug, RefreshCw } from "lucide-react";
import { useAuthState } from "react-firebase-hooks/auth";
import { auth } from "@/lib/firebase/client";

export default function DevSetupPage() {
  const [isSeeding, setIsSeeding] = useState(false);
  const [isUpdatingUIDs, setIsUpdatingUIDs] = useState(false);
  const [user, loading] = useAuthState(auth);
  const [userInfo, setUserInfo] = useState<any>(null);
  const { toast } = useToast();

  const handleSeedDatabase = async () => {
    setIsSeeding(true);
    try {
      await seedDatabase();
      toast({
        title: "Database seeded successfully!",
        description: "All test data has been created.",
      });
    } catch (error) {
      console.error("Error seeding database:", error);
      toast({
        title: "Error seeding database",
        description: "Check console for details.",
        variant: "destructive",
      });
    } finally {
      setIsSeeding(false);
    }
  };

  const handleUpdateUIDs = async () => {
    setIsUpdatingUIDs(true);
    try {
      await updateDatabaseWithRealUIDs();
      toast({
        title: "Database updated successfully!",
        description: "All UIDs have been mapped to real Firebase Auth UIDs.",
      });
    } catch (error) {
      console.error("Error updating UIDs:", error);
      toast({
        title: "Error updating UIDs",
        description: "Check console for details.",
        variant: "destructive",
      });
    } finally {
      setIsUpdatingUIDs(false);
    }
  };

  const handleGetCurrentUserInfo = async () => {
    try {
      const info = await getCurrentUserInfo();
      setUserInfo(info);
      if (info) {
        toast({
          title: "Current user info retrieved",
          description: `UID: ${info.id}`,
        });
      } else {
        toast({
          title: "No user logged in",
          description: "Please log in first to see user info.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error getting user info:", error);
      toast({
        title: "Error getting user info",
        description: "Check console for details.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="container mx-auto p-8 max-w-2xl">
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold font-headline">Development Setup</h1>
          <p className="text-muted-foreground">Tools for setting up and debugging the development environment.</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="w-5 h-5" />
              Database Seeding
            </CardTitle>
            <CardDescription>
              Populate the database with test data including reviewers, applications, and payouts.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              onClick={handleSeedDatabase} 
              disabled={isSeeding}
              className="w-full"
            >
              {isSeeding ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Seeding Database...
                </>
              ) : (
                <>
                  <Database className="mr-2 h-4 w-4" />
                  Seed Database
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <RefreshCw className="w-5 h-5" />
              Fix UID Mapping
            </CardTitle>
            <CardDescription>
              Update database with your actual Firebase Auth UIDs to fix submission assignment.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              onClick={handleUpdateUIDs} 
              disabled={isUpdatingUIDs}
              className="w-full"
              variant="outline"
            >
              {isUpdatingUIDs ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Updating UIDs...
                </>
              ) : (
                <>
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Update Database UIDs
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bug className="w-5 h-5" />
              Debug Current User
            </CardTitle>
            <CardDescription>
              Check your current Firebase Auth UID to debug submission assignment issues.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button 
              onClick={handleGetCurrentUserInfo}
              variant="outline"
              className="w-full"
            >
              <User className="mr-2 h-4 w-4" />
              Get Current User Info
            </Button>
            
            {userInfo && (
              <div className="bg-muted p-4 rounded-lg">
                <h3 className="font-semibold mb-2">Current User Info:</h3>
                <div className="space-y-1 text-sm">
                  <p><strong>UID:</strong> {userInfo.uid}</p>
                  <p><strong>Email:</strong> {userInfo.email}</p>
                  <p><strong>Display Name:</strong> {userInfo.displayName || 'Not set'}</p>
                </div>
              </div>
            )}
            
            {!loading && !user && (
              <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg">
                <p className="text-yellow-800 text-sm">
                  ⚠️ No user is currently logged in. Please log in first to see user info.
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Current Firebase Auth UIDs</CardTitle>
            <CardDescription>
              Configured UIDs for the system
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="text-sm space-y-1">
              <p><strong>Admin:</strong> jwynterthomas@gmail.com → M4p6FIGGtdRxNIIoUyqymXkhQqz2</p>
              <p><strong>Brenda:</strong> brenda.lee@amplifyd.com → GpYWDpUlmJZvosqsoQa9LDkdJmZ2</p>
              <p><strong>Alex:</strong> alex.chen@amplifyd.com → SFeyJyIzw1TtHReRVPIDM5L9lTs1</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
