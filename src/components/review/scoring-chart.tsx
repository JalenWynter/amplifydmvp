'use client';

import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { Label } from '../ui/label';
import { Slider } from '../ui/slider';
import { Textarea } from '../ui/textarea';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '../ui/accordion';
import { FormField, FormMessage, FormControl } from '../ui/form';
import { ReviewFormData } from '@/lib/types';
import AudioRecorder from './audio-recorder';
import VideoRecorder from './video-recorder';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Mic, FileAudio, FileVideo } from 'lucide-react';

const scoringFactors = {
  Composition: [
    { id: 'originality', label: 'Originality & Creativity' },
    { id: 'structure', label: 'Song Structure & Arrangement' },
    { id: 'melody', label: 'Melody & Hooks' },
    { id: 'lyrics', label: 'Lyrics & Storytelling' },
  ],
  Performance: [
    { id: 'vocal_performance', label: 'Vocal Performance' },
    { id: 'instrumental_performance', label: 'Instrumental Performance' },
    { id: 'energy', label: 'Energy & Emotion' },
    { id: 'technical_skill', label: 'Technical Skill' },
  ],
  Production: [
    { id: 'sound_quality', label: 'Sound Quality & Clarity' },
    { id: 'mixing', label: 'Mixing & Balance' },
    { id: 'sound_design', label: 'Sound Design & Effects' },
    { id: 'mastering', label: 'Mastering & Loudness' },
  ],
  Marketability: [
    { id: 'commercial_potential', label: 'Commercial Potential' },
    { id: 'target_audience', label: 'Target Audience Appeal' },
    { id: 'branding', label: 'Artist Branding Cohesion' },
    { id: 'uniqueness', label: 'Uniqueness in Market' },
  ],
};

const allFactorIds = Object.values(scoringFactors).flat().map(f => f.id);

// Create the Zod schema dynamically
const schemaObject = allFactorIds.reduce((acc, id) => {
  acc[id] = z.number().min(0).max(10);
  return acc;
}, {} as Record<string, z.ZodNumber>);

// Add the required fields to the schema
const baseSchema = {
  ...schemaObject,
  strengths: z.string().min(50, 'Please provide at least 50 characters on strengths.'),
  improvements: z.string().min(50, 'Please provide at least 50 characters on areas for improvement.'),
  summary: z.string().min(100, 'Please provide at least 100 characters for the overall review.'),
  audioFeedbackUrl: z.string().optional(),
  videoFeedbackUrl: z.string().optional(),
  isDraft: z.boolean().optional(),
};

export const reviewSchema = z.object(baseSchema);

interface ScoringChartProps {
    form: ReturnType<typeof useForm<ReviewFormData>>;
    scores: Partial<ReviewFormData>;
}

export default function ScoringChart({ form, scores }: ScoringChartProps) {

  return (
    <div className="space-y-8">
        {/* Scoring Section */}
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <FileAudio className="w-5 h-5" />
                    Scoring & Evaluation
                </CardTitle>
            </CardHeader>
            <CardContent className="px-6">
        <Accordion type="multiple" defaultValue={Object.keys(scoringFactors)} className="w-full">
            {Object.entries(scoringFactors).map(([category, factors]) => (
                <AccordionItem value={category} key={category}>
                            <AccordionTrigger className="text-lg font-semibold hover:no-underline">
                                {category} ({factors.length} criteria)
                            </AccordionTrigger>
                            <AccordionContent className="space-y-6 pt-6">
                                <div className="space-y-6">
                        {factors.map(factor => (
                            <FormField
                                key={factor.id}
                                            name={factor.id as keyof ReviewFormData}
                                control={form.control}
                                render={({ field }) => (
                                                <div className="space-y-3">
                                                    <Label htmlFor={factor.id} className="text-base font-medium">
                                                        {factor.label}
                                                    </Label>
                                        <div className="flex items-center gap-4">
                                        <Slider
                                            id={factor.id}
                                            min={0}
                                            max={10}
                                            step={0.5}
                                                            value={[field.value || 5]}
                                            onValueChange={(val) => field.onChange(val[0])}
                                            className="flex-1"
                                        />
                                                        <span className="w-16 text-center font-mono text-lg font-bold text-primary bg-primary/10 px-3 py-2 rounded min-w-0">
                                                            {(scores[factor.id as keyof ReviewFormData] as number ?? 5).toFixed(1)}
                                        </span>
                                        </div>
                                    </div>
                                )}
                            />
                        ))}
                                </div>
                    </AccordionContent>
                </AccordionItem>
            ))}
        </Accordion>
            </CardContent>
        </Card>

        {/* Audio/Video Feedback Section */}
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Mic className="w-5 h-5" />
                    Audio & Video Feedback (Optional)
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="grid gap-6 md:grid-cols-2">
                    <div className="space-y-4">
                        <Label className="text-base font-medium flex items-center gap-2">
                            <FileAudio className="w-4 h-4" />
                            Audio Feedback
                        </Label>
                        <AudioRecorder
                            onRecordingComplete={(url) => form.setValue('audioFeedbackUrl', url)}
                            existingAudioUrl={scores.audioFeedbackUrl}
                        />
                    </div>
                    <div className="space-y-4">
                        <Label className="text-base font-medium flex items-center gap-2">
                            <FileVideo className="w-4 h-4" />
                            Video Feedback
                        </Label>
                        <VideoRecorder
                            onRecordingComplete={(url) => form.setValue('videoFeedbackUrl', url)}
                            existingVideoUrl={scores.videoFeedbackUrl}
                        />
                    </div>
                </div>
            </CardContent>
        </Card>

        {/* Written Feedback Section */}
        <Card>
            <CardHeader>
                <CardTitle>Written Feedback</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
            <FormField
                control={form.control}
                name="strengths"
                render={({ field }) => (
                    <div className="space-y-2">
                        <Label htmlFor="strengths" className="text-lg font-semibold">Strengths</Label>
                        <FormControl>
                                <Textarea 
                                    id="strengths" 
                                    rows={4} 
                                    placeholder="What worked well in this track? Be specific about elements like melody, rhythm, lyrics, production choices, etc." 
                                    className="resize-y" 
                                    {...field} 
                                />
                        </FormControl>
                        <FormMessage />
                            <div className="text-xs text-muted-foreground">
                                {field.value?.length || 0} characters (minimum 50 required)
                            </div>
                    </div>
                )}
            />
                
             <FormField
                control={form.control}
                name="improvements"
                render={({ field }) => (
                     <div className="space-y-2">
                        <Label htmlFor="improvements" className="text-lg font-semibold">Areas for Improvement</Label>
                        <FormControl>
                                <Textarea 
                                    id="improvements" 
                                    rows={4} 
                                    placeholder="What could be improved? Offer constructive criticism on aspects that could be stronger." 
                                    className="resize-y" 
                                    {...field} 
                                />
                        </FormControl>
                        <FormMessage />
                            <div className="text-xs text-muted-foreground">
                                {field.value?.length || 0} characters (minimum 50 required)
                            </div>
                    </div>
                )}
            />
            
            <FormField
                control={form.control}
                name="summary"
                render={({ field }) => (
                     <div className="space-y-2">
                        <Label htmlFor="summary" className="text-lg font-semibold">Overall Review</Label>
                        <FormControl>
                            <Textarea 
                                id="summary" 
                                rows={6} 
                                placeholder="Provide a comprehensive overall review of this track. Include your thoughts on the production, performance, commercial potential, and any other relevant aspects. This will be the main review text that appears on the artist's review page."
                                    className="min-h-[150px] resize-y"
                                {...field} 
                            />
                        </FormControl>
                        <FormMessage />
                        <div className="text-xs text-muted-foreground">
                            {field.value?.length || 0} characters (minimum 100 required)
                        </div>
                    </div>
                )}
            />
            </CardContent>
        </Card>
    </div>
  );
}