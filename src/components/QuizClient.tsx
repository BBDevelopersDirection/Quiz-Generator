
'use client';

import { useState, useEffect, useMemo, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import type { QuizData } from '@/lib/types';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from './ui/card';
import Timer from './Timer';
import { cn } from '@/lib/utils';
import { AlertDialog, AlertDialogAction, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from './ui/alert-dialog';
import { doc, getDoc, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Loader2 } from 'lucide-react';
import type { Lobby } from '@/lib/types';

type Round = 1 | 2;

function QuizCore() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const quizId = searchParams.get('id');

  const [quizData, setQuizData] = useState<QuizData | null>(null);
  const [round, setRound] = useState<Round>(1);
  const [selectedCauses, setSelectedCauses] = useState<string[]>([]);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [finalTime, setFinalTime] = useState(0);
  const [showFailureDialog, setShowFailureDialog] = useState(false);
  const [showRound2FailureDialog, setShowRound2FailureDialog] = useState(false);
  const [round1Selection, setRound1Selection] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const quizStatus = sessionStorage.getItem('quizStatus');

    if (quizStatus !== 'started' || !quizId) {
        router.push('/');
        return;
    }

    const fetchQuiz = async () => {
        setLoading(true);
        const quizRef = doc(db, 'quizzes', quizId);
        const docSnap = await getDoc(quizRef);

        if (docSnap.exists()) {
            setQuizData({id: docSnap.id, ...docSnap.data()} as QuizData);
            setIsTimerRunning(true);
        } else {
            console.error("Quiz not found!");
            router.push('/');
        }
        setLoading(false);
    }

    fetchQuiz();

    // Add a listener to handle the admin stopping the quiz mid-game
    const lobbyRef = doc(db, 'lobby', 'main_lobby');
    const unsubscribe = onSnapshot(lobbyRef, (docSnap) => {
        if (docSnap.exists()) {
            const lobbyData = docSnap.data() as Lobby;
            // If lobby is reset while quiz is in progress, boot user
            if (lobbyData.status === 'waiting') {
                sessionStorage.removeItem('playerInfo');
                sessionStorage.removeItem('quizStatus');
                sessionStorage.setItem('quizStopped', 'true');
                router.push('/');
            }
        }
    });

    return () => unsubscribe();

  }, [router, quizId]);

  const handleCauseSelect = (cause: string) => {
    if (round === 1) {
      setSelectedCauses((prev) => {
        if (prev.includes(cause)) {
          return prev.filter((c) => c !== cause);
        }
        if (prev.length < 5) {
          return [...prev, cause];
        }
        return prev;
      });
    } else {
        // Round 2, single selection
        setSelectedCauses([cause]);
    }
  };

  const handleSubmitRound1 = () => {
    if (!quizData) return;
    if (selectedCauses.includes(quizData.correctRootCause)) {
      setRound1Selection([...selectedCauses]);
      setRound(2);
      setSelectedCauses([]); // Clear selection for round 2
    } else {
      setShowFailureDialog(true);
    }
  };

  const handleSubmitRound2 = () => {
    if (!quizData || selectedCauses.length !== 1 || !quizId) return;

    if (selectedCauses[0] === quizData.correctRootCause) {
      setIsTimerRunning(false);
      // Success
      const explanation = encodeURIComponent(quizData.explanation);
      router.push(`/results?time=${finalTime}&explanation=${explanation}&quizId=${quizId}`);
    } else {
      setShowRound2FailureDialog(true);
    }
  };

  const round1Causes = useMemo(() => quizData?.rootCauses || [], [quizData]);
  const round2Causes = useMemo(() => round1Selection, [round1Selection]);

  if (loading || !quizData) {
    return (
        <div className="flex min-h-screen w-full items-center justify-center bg-background">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
        </div>
    );
  }

  return (
    <main className="flex min-h-screen w-full items-center justify-center bg-background p-4 sm:p-6 md:p-8">
      <Card className="w-full max-w-3xl shadow-2xl animate-in fade-in-50 duration-500">
        <CardHeader>
            <div className="flex justify-between items-start">
                <div>
                    <CardTitle className="text-2xl font-bold text-primary">Round {round}: {round === 1 ? 'Narrow it Down' : 'Find the Root Cause'}</CardTitle>
                    <CardDescription className="pt-1">{round === 1 ? 'Select 5 potential root causes.' : 'Select the single correct root cause.'}</CardDescription>
                </div>
                <Timer isRunning={isTimerRunning} onTimeUpdate={setFinalTime} className="font-mono text-4xl font-bold text-accent"/>
            </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {round === 1 && (
             <div className="prose max-w-none rounded-lg border bg-secondary/50 p-4 text-secondary-foreground">
                <p>{quizData.passage}</p>
             </div>
          )}

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
            {(round === 1 ? round1Causes : round2Causes).map((cause) => (
              <Button
                key={cause}
                variant="outline"
                className={cn(
                  "h-16 text-base justify-center p-2 transition-all duration-200",
                  selectedCauses.includes(cause)
                    ? 'bg-primary text-primary-foreground scale-105 shadow-lg'
                    : 'bg-card hover:bg-secondary/70'
                )}
                onClick={() => handleCauseSelect(cause)}
              >
                {cause}
              </Button>
            ))}
          </div>
        </CardContent>
        <CardFooter className="flex justify-end">
            {round === 1 ? (
                <Button onClick={handleSubmitRound1} disabled={selectedCauses.length !== 5} className="bg-accent hover:bg-accent/90 text-accent-foreground">
                    Confirm 5 Causes
                </Button>
            ) : (
                <Button onClick={handleSubmitRound2} disabled={selectedCauses.length !== 1} className="bg-accent hover:bg-accent/90 text-accent-foreground">
                    Submit Final Answer
                </Button>
            )}
        </CardFooter>
      </Card>
      
      <AlertDialog open={showFailureDialog} onOpenChange={setShowFailureDialog}>
        <AlertDialogContent>
            <AlertDialogHeader>
                <AlertDialogTitle>Incorrect Selection</AlertDialogTitle>
                <AlertDialogDescription>
                    The correct root cause is not among your selected options. The timer is still running. Please review the passage and your choices.
                </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
                <AlertDialogAction onClick={() => setShowFailureDialog(false)}>Close</AlertDialogAction>
            </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={showRound2FailureDialog} onOpenChange={setShowRound2FailureDialog}>
        <AlertDialogContent>
            <AlertDialogHeader>
                <AlertDialogTitle>Wrong Answer Selected</AlertDialogTitle>
                <AlertDialogDescription>
                    That's not the correct root cause. The timer is still running. Try again!
                </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
                <AlertDialogAction onClick={() => setShowRound2FailureDialog(false)}>Continue with quiz</AlertDialogAction>
            </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </main>
  );
}

export default function QuizClient() {
    return (
        <Suspense fallback={<div className="flex min-h-screen w-full items-center justify-center bg-background">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
        </div>}>
            <QuizCore />
        </Suspense>
    )
}
