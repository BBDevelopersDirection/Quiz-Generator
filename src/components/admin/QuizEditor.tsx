
'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm, useFieldArray } from 'react-hook-form';
import { z } from 'zod';
import { useRouter } from 'next/navigation';

import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { RadioGroup, RadioGroupItem } from '../ui/radio-group';
import { saveQuiz } from '@/lib/actions';
import type { QuizData } from '@/lib/types';

const quizFormSchema = z.object({
  id: z.string().min(3, 'Quiz name must be at least 3 characters.').max(50, 'Quiz name is too long.').regex(/^\S*$/, 'Quiz name cannot contain spaces.'),
  passage: z.string().min(50, 'Passage must be at least 50 characters.').max(1000, 'Passage is too long.'),
  explanation: z.string().min(50, 'Explanation must be at least 50 characters.'),
  rootCauses: z.array(z.object({ value: z.string().min(1, 'Cause cannot be empty.') }))
    .length(10, 'There must be 10 root causes.')
    .refine((items) => {
        const values = items.map(item => item.value.trim().toLowerCase()).filter(Boolean);
        if (values.length < 10 && values.length > 0) return true; // Don't validate for uniqueness until all fields are filled
        const uniqueValues = new Set(values);
        return uniqueValues.size === values.length;
    }, {
        message: 'All root causes must be unique.',
    }),
  correctRootCause: z.string({ required_error: "You must select a correct root cause."}).min(1, 'You must select a correct root cause.'),
});

type QuizFormValues = z.infer<typeof quizFormSchema>;

interface QuizEditorProps {
    initialData?: QuizData;
}

export default function QuizEditor({ initialData }: QuizEditorProps) {
  const router = useRouter();
  const { toast } = useToast();
  const isEditing = !!initialData;

  const form = useForm<QuizFormValues>({
    resolver: zodResolver(quizFormSchema),
    defaultValues: initialData ? {
        ...initialData,
        rootCauses: initialData.rootCauses.map(value => ({ value })),
    } : {
      id: '',
      passage: '',
      explanation: '',
      rootCauses: Array.from({ length: 10 }, () => ({ value: '' })),
      correctRootCause: '',
    },
  });

  const { fields } = useFieldArray({
    control: form.control,
    name: 'rootCauses',
  });

  const rootCausesValues = form.watch('rootCauses');

  async function onSubmit(data: QuizFormValues) {
    const quizData = {
        id: data.id,
        passage: data.passage,
        explanation: data.explanation,
        rootCauses: data.rootCauses.map(rc => rc.value),
        correctRootCause: data.correctRootCause,
    };
    
    const result = await saveQuiz(quizData, isEditing);

    if (result.success) {
        toast({
            title: isEditing ? 'Quiz Updated!' : 'Quiz Saved!',
            description: `The quiz has been ${isEditing ? 'updated' : 'saved'} successfully.`,
        });
        router.push('/admin/dashboard');
    } else {
        toast({
            variant: 'destructive',
            title: 'Error',
            description: result.error || 'An unknown error occurred.',
        })
    }
  }

  return (
    <div className="space-y-6">
        <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            <Card>
                <CardHeader><CardTitle>Quiz Details</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                    <FormField
                        control={form.control}
                        name="id"
                        render={({ field }) => (
                            <FormItem>
                            <FormLabel>Quiz Name</FormLabel>
                            <FormControl>
                                <Input placeholder="e.g. AWS-Outage-2020" {...field} disabled={isEditing}/>
                            </FormControl>
                            <FormDescription>This will be the unique ID for your quiz. Cannot be changed after creation and cannot contain spaces.</FormDescription>
                            <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="passage"
                        render={({ field }) => (
                            <FormItem>
                            <FormLabel>Passage</FormLabel>
                            <FormControl>
                                <Textarea rows={4} placeholder="An abstract passage describing a tech failure..." {...field} />
                            </FormControl>
                            <FormDescription>This is the story the participants will read to identify the root cause.</FormDescription>
                            <FormMessage />
                            </FormItem>
                        )}
                    />
                     <FormField
                        control={form.control}
                        name="explanation"
                        render={({ field }) => (
                            <FormItem>
                            <FormLabel>Explanation</FormLabel>
                            <FormControl>
                                <Textarea rows={4} placeholder="A detailed explanation of the event for the results screen." {...field} />
                            </FormControl>
                            <FormDescription>The full story behind the failure, shown at the end of the quiz.</FormDescription>
                            <FormMessage />
                            </FormItem>
                        )}
                    />
                </CardContent>
            </Card>

            <Card>
                <CardHeader><CardTitle>Root Causes</CardTitle></CardHeader>
                <CardContent>
                    <FormField
                        control={form.control}
                        name="rootCauses"
                        render={() => (
                            <FormItem>
                                {form.formState.errors.rootCauses && (
                                    <FormMessage>{form.formState.errors.rootCauses.message}</FormMessage>
                                )}
                            </FormItem>
                        )}
                    />

                    <FormField
                        control={form.control}
                        name="correctRootCause"
                        render={({ field }) => (
                            <FormItem className="space-y-3">
                                <FormLabel>Set the 10 root cause options and select the correct one.</FormLabel>
                                <FormDescription>Enter 10 potential causes. One of them must be the true root cause. All causes must be unique.</FormDescription>
                                <FormControl>
                                    <RadioGroup
                                    onValueChange={field.onChange}
                                    defaultValue={field.value}
                                    className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4 pt-2"
                                    >
                                    {fields.map((item, index) => (
                                        <FormField
                                            key={item.id}
                                            control={form.control}
                                            name={`rootCauses.${index}.value`}
                                            render={({ field: causeField }) => {
                                                const currentCauseValue = rootCausesValues[index]?.value || '';
                                                return (
                                                    <FormItem className='flex items-center space-x-3 space-y-0'>
                                                        <FormControl>
                                                            <RadioGroupItem value={currentCauseValue} disabled={!currentCauseValue} />
                                                        </FormControl>
                                                        <Input {...causeField} placeholder={`Cause #${index + 1}`} onChange={(e) => {
                                                            causeField.onChange(e);
                                                            // If this radio was selected, and the text changes, deselect it.
                                                            if (field.value === field.name) {
                                                                field.onChange('');
                                                            }
                                                            // Trigger validation for the whole array.
                                                            form.trigger('rootCauses');
                                                        }}/>
                                                    </FormItem>
                                                )
                                            }}
                                        />
                                    ))}
                                    </RadioGroup>
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </CardContent>
            </Card>
            
            <div className="flex justify-end">
                <Button type="submit" className="bg-accent hover:bg-accent/90 text-accent-foreground">
                    {isEditing ? 'Update Quiz' : 'Save Quiz'}
                </Button>
            </div>
        </form>
        </Form>
    </div>
  );
}
