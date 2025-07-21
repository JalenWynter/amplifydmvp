
'use client';

import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { Label } from '../ui/label';
import { Slider } from '../ui/slider';
import { Textarea } from '../ui/textarea';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '../ui/accordion';
import { FormField, FormMessage, FormControl } from '../ui/form';

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
}, {} as Record<string, any>);

schemaObject.strengths = z.string().min(50, 'Please provide at least 50 characters on strengths.');
schemaObject.improvements = z.string().min(50, 'Please provide at least 50 characters on areas for improvement.');
schemaObject.overallReview = z.string().min(100, 'Please provide at least 100 characters for the overall review.');
schemaObject.audioFeedbackUrl = z.string().optional();
schemaObject.videoFeedbackUrl = z.string().optional();
schemaObject.isDraft = z.boolean().optional();

export const reviewSchema = z.object(schemaObject);
export type ReviewFormValues = z.infer<typeof reviewSchema>;


interface ScoringChartProps {
    form: ReturnType<typeof useForm<ReviewFormValues>>;
    scores: Partial<ReviewFormValues>;
}

export default function ScoringChart({ form, scores }: ScoringChartProps) {

  return (
    <div className="space-y-6">
        <Accordion type="multiple" defaultValue={Object.keys(scoringFactors)} className="w-full">
            {Object.entries(scoringFactors).map(([category, factors]) => (
                <AccordionItem value={category} key={category}>
                    <AccordionTrigger className="text-lg font-semibold">{category}</AccordionTrigger>
                    <AccordionContent className="space-y-6 pt-4">
                        {factors.map(factor => (
                            <FormField
                                key={factor.id}
                                name={factor.id as keyof ReviewFormValues}
                                control={form.control}
                                render={({ field }) => (
                                     <div className="grid gap-3">
                                        <Label htmlFor={factor.id}>{factor.label}</Label>
                                        <div className="flex items-center gap-4">
                                        <Slider
                                            id={factor.id}
                                            min={0}
                                            max={10}
                                            step={0.5}
                                            value={[field.value]}
                                            onValueChange={(val) => field.onChange(val[0])}
                                            className="flex-1"
                                        />
                                        <span className="w-10 text-right font-mono text-primary font-semibold">
                                            {(scores[factor.id as keyof ReviewFormValues] as number ?? 5).toFixed(1)}
                                        </span>
                                        </div>
                                    </div>
                                )}
                            />
                        ))}
                    </AccordionContent>
                </AccordionItem>
            ))}
        </Accordion>

        <div className="space-y-4 pt-4">
            <FormField
                control={form.control}
                name="strengths"
                render={({ field }) => (
                    <div className="space-y-2">
                        <Label htmlFor="strengths" className="text-lg font-semibold">Strengths</Label>
                        <FormControl>
                            <Textarea id="strengths" rows={4} placeholder="What worked well in this track? Be specific about elements like melody, rhythm, lyrics, production choices, etc." className="mt-2" {...field} />
                        </FormControl>
                        <FormMessage />
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
                            <Textarea id="improvements" rows={4} placeholder="What could be improved? Offer constructive criticism on aspects that could be stronger." className="mt-2" {...field} />
                        </FormControl>
                        <FormMessage />
                    </div>
                )}
            />
            
            <FormField
                control={form.control}
                name="overallReview"
                render={({ field }) => (
                     <div className="space-y-2">
                        <Label htmlFor="overallReview" className="text-lg font-semibold">Overall Review</Label>
                        <FormControl>
                            <Textarea 
                                id="overallReview" 
                                rows={6} 
                                placeholder="Provide a comprehensive overall review of this track. Include your thoughts on the production, performance, commercial potential, and any other relevant aspects. This will be the main review text that appears on the artist's review page."
                                className="mt-2 min-h-[150px] resize-y"
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
        </div>
    </div>
  );
}
