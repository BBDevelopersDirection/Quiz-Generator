
'use client';

import { useEffect, useState, Suspense, useCallback, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import { saveQuizResult } from '@/lib/actions';
import type { Player } from '@/lib/types';

function ResultsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [player, setPlayer] = useState<Player | null>(null);
  const [results, setResults] = useState<{ time: number; explanation: string } | null>(null);
  const [isSaving, setIsSaving] = useState(true);
  const hasSaved = useRef(false);

  const saveResults = useCallback(async (playerInfo: Player, time: number, explanation: string, quizId: string) => {
    try {
      await saveQuizResult({
        name: playerInfo.name,
        email: playerInfo.email,
        time,
        explanation,
        quizId,
      });
    } catch (error) {
      console.error('Failed to save results:', error);
      // Optional: show a toast to the user
    } finally {
      setIsSaving(false);
    }
  }, []);

  useEffect(() => {
    if (hasSaved.current) return;

    const storedPlayerInfo = sessionStorage.getItem('playerInfo');
    const timeStr = searchParams.get('time');
    const explanation = searchParams.get('explanation');
    const quizId = searchParams.get('quizId');
    
    if (storedPlayerInfo && timeStr && explanation && quizId) {
      const playerInfo: Player = JSON.parse(storedPlayerInfo);
      const time = parseInt(timeStr, 10);
      const decodedExplanation = decodeURIComponent(explanation);

      setPlayer(playerInfo);
      setResults({
        time,
        explanation: decodedExplanation,
      });
      
      if (!hasSaved.current) {
        saveResults(playerInfo, time, decodedExplanation, quizId);
        hasSaved.current = true;
      }

    } else {
      router.push('/');
    }
  }, [router, searchParams, saveResults]);

  const formatTime = (timeInSeconds: number) => {
    const minutes = Math.floor(timeInSeconds / 60).toString().padStart(2, '0');
    const seconds = (timeInSeconds % 60).toString().padStart(2, '0');
    return `${minutes}:${seconds}`;
  };

  const handleReturnHome = () => {
    sessionStorage.removeItem('quizStatus');
    sessionStorage.removeItem('playerInfo');
    router.push('/');
  };

  if (!results || !player) {
    return (
        <div className="flex min-h-screen w-full items-center justify-center bg-background">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
        </div>
    );
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-background p-4 sm:p-6 md:p-8">
      <Card className="w-full max-w-2xl shadow-2xl animate-in fade-in-50 duration-500">
        <CardHeader className="text-center space-y-2">
          <CardTitle className="text-3xl font-bold text-primary">Well done, {player.name}!</CardTitle>
          <CardDescription className="pt-2 text-2xl font-mono text-accent">
            Your Final Time: {formatTime(results.time)}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <h3 className="text-xl font-semibold text-primary">The Full Story</h3>
          <div className="prose max-w-none rounded-lg border bg-secondary/50 p-4 text-secondary-foreground">
            <p>{results.explanation}</p>
          </div>
          {isSaving && (
            <div className="flex items-center justify-center text-sm text-muted-foreground">
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                <span>Saving your score...</span>
            </div>
          )}
        </CardContent>
        <CardFooter className="flex justify-center">
          <Button onClick={handleReturnHome} className="bg-accent hover:bg-accent/90 text-accent-foreground" disabled={isSaving}>
            Return to Home
          </Button>
        </CardFooter>
      </Card>
    </main>
  );
}

export default function ResultsPage() {
    return (
        <Suspense fallback={<div className="flex min-h-screen w-full items-center justify-center bg-background">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
        </div>}>
            <ResultsContent />
        </Suspense>
    )
}
