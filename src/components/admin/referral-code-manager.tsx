'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { createReferralCode, getAllReferralCodes } from '@/lib/firebase/referrals';
import { useToast } from "@/hooks/use-toast";
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from '@/lib/firebase/client';
import { ReferralCode } from '@/lib/types';
import { Plus, Copy, Loader2 } from 'lucide-react';

export default function ReferralCodeManager() {
  const [codes, setCodes] = useState<ReferralCode[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [newCodeEmail, setNewCodeEmail] = useState('');
  const [user] = useAuthState(auth);
  const { toast } = useToast();

  useEffect(() => {
    fetchCodes();
  }, []);

  const fetchCodes = async () => {
    setIsLoading(true);
    try {
      const fetchedCodes = await getAllReferralCodes();
      setCodes(fetchedCodes);
    } catch (error) {
      console.error('Error fetching codes:', error);
      toast({
        title: "Error",
        description: "Failed to load referral codes",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateCode = async () => {
    if (!user || !newCodeEmail.trim()) return;

    setIsCreating(true);
    try {
      const newCode = await createReferralCode(newCodeEmail, user.uid);
      toast({
        title: "Code Created",
        description: `New referral code: ${newCode.code}`,
      });
      setNewCodeEmail('');
      fetchCodes();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create referral code",
        variant: "destructive"
      });
    } finally {
      setIsCreating(false);
    }
  };

  const copyToClipboard = async (code: string) => {
    try {
      await navigator.clipboard.writeText(code);
      toast({
        title: "Copied!",
        description: "Code copied to clipboard",
      });
    } catch (err) {
      toast({
        title: "Copy Failed",
        description: "Failed to copy code",
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Referral Code Management</CardTitle>
          <CardDescription>Create and manage referral codes for reviewers.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center p-8">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Referral Code Management</CardTitle>
        <CardDescription>Create and manage referral codes for reviewers.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <Input
            placeholder="Enter email for new code"
            value={newCodeEmail}
            onChange={(e) => setNewCodeEmail(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleCreateCode()}
          />
          <Button 
            onClick={handleCreateCode} 
            disabled={isCreating || !newCodeEmail.trim()}
          >
            {isCreating ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Plus className="h-4 w-4" />
            )}
          </Button>
        </div>

        <div className="space-y-2">
          <h4 className="font-medium">Recent Codes</h4>
          {codes.length === 0 ? (
            <p className="text-sm text-muted-foreground">No referral codes created yet.</p>
          ) : (
            <div className="space-y-2">
              {codes.slice(0, 5).map((code) => (
                <div key={code.id} className="flex items-center justify-between p-2 border rounded">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-sm">{code.code}</span>
                    <Badge variant="secondary">{code.status}</Badge>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => copyToClipboard(code.code)}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
