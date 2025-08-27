'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Reviewer, Payout } from '@/lib/types';
import { Loader2 } from 'lucide-react';

interface CreatePayoutFormProps {
  reviewers: Reviewer[];
  onSave: (payoutData: Omit<Payout, 'id' | 'date' | 'status' | 'amount'> & { amountInCents: number }) => void;
  onCancel: () => void;
  isSaving: boolean;
}

export default function CreatePayoutForm({ reviewers, onSave, onCancel, isSaving }: CreatePayoutFormProps) {
  const [selectedReviewerId, setSelectedReviewerId] = useState('');
  const [amount, setAmount] = useState('');
  const [notes, setNotes] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedReviewerId || !amount) return;

    const selectedReviewer = reviewers.find(r => r.id === selectedReviewerId);
    if (!selectedReviewer) return;

    const amountInCents = Math.round(parseFloat(amount) * 100);
    
    onSave({
      reviewer: selectedReviewer,
      amountInCents,
      notes: notes || undefined,
      paymentMethod: 'bank_transfer',
      reviews: []
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Create New Payout</CardTitle>
        <CardDescription>Create a new payout for a reviewer.</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="reviewer">Reviewer</Label>
            <Select value={selectedReviewerId} onValueChange={setSelectedReviewerId}>
              <SelectTrigger>
                <SelectValue placeholder="Select a reviewer" />
              </SelectTrigger>
              <SelectContent>
                {reviewers.map((reviewer) => (
                  <SelectItem key={reviewer.id} value={reviewer.id}>
                    {reviewer.name} ({reviewer.email})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="amount">Amount (USD)</Label>
            <Input
              id="amount"
              type="number"
              step="0.01"
              min="0"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes (Optional)</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add any notes about this payout..."
            />
          </div>

          <div className="flex gap-2">
            <Button type="submit" disabled={isSaving || !selectedReviewerId || !amount}>
              {isSaving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                'Create Payout'
              )}
            </Button>
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancel
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
