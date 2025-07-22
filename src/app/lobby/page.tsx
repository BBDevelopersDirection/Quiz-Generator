'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { Lobby, Player } from '@/lib/types';

export default function LobbyPage() {
  const router = useRouter();
  const [player, setPlayer] = useState<Player | null>(null);

  useEffect(() => {
    const playerInfoStr = sessionStorage.getItem('playerInfo');
    if (playerInfoStr) {
      const playerInfo = JSON.parse(playerInfoStr);
      setPlayer(playerInfo);
    } else {
      router.push('/'); // Redirect if no player info
      return;
    }
  }, [router]);

  useEffect(() => {
    if (!player) return;

    // Listener for participant document
    const participantRef = doc(db, 'lobby', 'main_lobby', 'participants', player.email);
    const unsubscribeParticipant = onSnapshot(participantRef, (docSnap) => {
        if (!docSnap.exists()) {
            // Player was removed from lobby, likely by a reset
            sessionStorage.removeItem('playerInfo');
            sessionStorage.removeItem('quizStatus');
            router.push('/');
        }
    });

    // Listener for lobby status
    const lobbyRef = doc(db, 'lobby', 'main_lobby');
    const unsubscribeLobby = onSnapshot(lobbyRef, (docSnap) => {
        if (docSnap.exists()) {
            const lobbyData = docSnap.data() as Lobby;
            if (lobbyData.status === 'started' && lobbyData.activeQuizId) {
                sessionStorage.setItem('quizStatus', 'started');
                router.push(`/quiz?id=${lobbyData.activeQuizId}`);
            }
        }
    });

    return () => {
        unsubscribeParticipant();
        unsubscribeLobby();
    };
  }, [player, router]);

  if (!player) {
    return (
        <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
             <Loader2 className="h-8 w-8 animate-spin" />
        </div>
    )
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
      <Card className="w-full max-w-lg text-center shadow-2xl animate-in fade-in-50 duration-500">
        <CardHeader>
          <CardTitle className="text-3xl font-bold text-primary">Welcome, {player.name || 'Player'}!</CardTitle>
          <CardDescription className="pt-2 text-muted-foreground">You have joined the lobby.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center gap-6">
          <p className="text-lg">Please wait until the host starts the quiz.</p>
          <div className="flex items-center gap-2 text-muted-foreground">
            <Loader2 className="h-6 w-6 animate-spin" />
            <span>Waiting for all participants...</span>
          </div>
        </CardContent>
      </Card>
    </main>
  );
}
