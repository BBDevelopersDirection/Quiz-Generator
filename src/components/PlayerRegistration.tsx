
'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { hasUserCompletedQuiz, addPlayerToLobby } from '@/lib/actions';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';

const formSchema = z.object({
  name: z.string().min(2, { message: 'Name must be at least 2 characters.' }),
  email: z.string().email({ message: 'Please enter a valid email.' }).refine(
    (email) => email.endsWith('@salesforce.com'),
    { message: 'Only Salesforce emails are allowed.' }
  ),
});

export function PlayerRegistration() {
  const router = useRouter();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      email: '',
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsSubmitting(true);
    try {
      const completed = await hasUserCompletedQuiz(values.email);
      if (completed) {
        toast({
            variant: 'destructive',
            title: 'Already Completed',
            description: 'This email address has already been used to complete the quiz.',
        });
        form.reset();
        return;
      }
      
      const lobbyResult = await addPlayerToLobby(values);
      if (!lobbyResult.success) {
        toast({
            variant: 'destructive',
            title: 'Error Joining Lobby',
            description: lobbyResult.error || 'Could not join the lobby. Please try again.',
        });
        return;
      }

      if (typeof window !== 'undefined') {
          sessionStorage.setItem('playerInfo', JSON.stringify(values));
          return router.push('/lobby');
      }
    } catch (error) {
        toast({
            variant: 'destructive',
            title: 'Error',
            description: 'Could not join the lobby. Please try again.',
        });
    } finally {
        setIsSubmitting(false);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Name</FormLabel>
              <FormControl>
                <Input placeholder="Alex" {...field} disabled={isSubmitting} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input type="email" placeholder="alex@salesforce.com" {...field} disabled={isSubmitting} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" className="w-full bg-accent hover:bg-accent/90 text-accent-foreground" disabled={isSubmitting}>
          {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Join Lobby
        </Button>
      </form>
    </Form>
  );
}
