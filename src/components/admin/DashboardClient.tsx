
'use client';

import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableCaption } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { PlusCircle, Users, Edit, Trash2, Play, RefreshCw, CheckCircle, Clock, BarChart3, Trophy } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { db } from '@/lib/firebase';
import { collection, onSnapshot, getDocs, doc, deleteDoc, query, orderBy } from 'firebase/firestore';
import type { QuizData, Player, Lobby, QuizResult } from '@/lib/types';
import { startQuizForLobby, resetLobby } from '@/lib/actions';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '../ui/alert-dialog';
import { Badge } from '../ui/badge';

export default function DashboardClient() {
  const router = useRouter();
  const { toast } = useToast();
  const [participants, setParticipants] = useState<Player[]>([]);
  const [quizzes, setQuizzes] = useState<QuizData[]>([]);
  const [results, setResults] = useState<QuizResult[]>([]);
  const [selectedQuizId, setSelectedQuizId] = useState<string | null>(null);
  const [lobbyStatus, setLobbyStatus] = useState<Lobby['status']>('waiting');

  useEffect(() => {
    const isAdmin = sessionStorage.getItem('adminAuthenticated');
    if (isAdmin !== 'true') {
      router.push('/admin');
      return;
    }

    // Listen for lobby status and participant updates
    const lobbyRef = doc(db, 'lobby', 'main_lobby');
    const unsubscribeLobby = onSnapshot(lobbyRef, (docSnap) => {
        if (docSnap.exists()) {
            setLobbyStatus(docSnap.data().status);
        }
    });

    const participantsRef = collection(db, 'lobby', 'main_lobby', 'participants');
    const unsubscribeParticipants = onSnapshot(participantsRef, (snapshot) => {
      const newParticipants = snapshot.docs.map(doc => doc.data() as Player);
      setParticipants(newParticipants);
    });

    // Listen for quiz updates
    const quizzesCollection = collection(db, 'quizzes');
    const unsubscribeQuizzes = onSnapshot(quizzesCollection, (snapshot) => {
        const quizList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as QuizData));
        setQuizzes(quizList);
        if (quizList.length > 0 && !selectedQuizId) {
            setSelectedQuizId(quizList[0].id)
        }
    });

    // Fetch all results, sorted by time
    const resultsQuery = query(collection(db, 'results'), orderBy('time', 'asc'));
    const unsubscribeResults = onSnapshot(resultsQuery, (snapshot) => {
      const resultsList = snapshot.docs.map(doc => doc.data() as QuizResult);
      setResults(resultsList);
    });

    return () => {
      unsubscribeLobby();
      unsubscribeParticipants();
      unsubscribeQuizzes();
      unsubscribeResults();
    };
  }, [router, selectedQuizId]);

  const handleStartQuiz = async () => {
    if (!selectedQuizId) {
        toast({
            variant: 'destructive',
            title: 'No Quiz Selected',
            description: 'Please select a quiz to start.',
        });
        return;
    }
    const result = await startQuizForLobby(selectedQuizId);
    if (result.success) {
        toast({
          title: 'Quiz Started!',
          description: 'All players in the lobby have been moved to the quiz.',
        });
    } else {
        toast({
            variant: 'destructive',
            title: 'Error',
            description: result.error,
        });
    }
  };

  const handleResetLobby = async () => {
    const result = await resetLobby();
    if (result.success) {
        toast({
            title: 'Lobby Reset',
            description: 'The lobby has been cleared and is ready for a new game.',
        });
    } else {
        toast({
            variant: 'destructive',
            title: 'Error',
            description: result.error,
        });
    }
  }

  const handleDeleteQuiz = async (quizId: string) => {
    try {
        await deleteDoc(doc(db, 'quizzes', quizId));
        toast({
            title: "Quiz Deleted",
            description: "The quiz has been successfully deleted."
        })
    } catch (error) {
        toast({
            variant: 'destructive',
            title: "Error",
            description: "Failed to delete the quiz."
        })
    }
  }
  
  const formatTime = (timeInSeconds: number) => {
    const minutes = Math.floor(timeInSeconds / 60).toString().padStart(2, '0');
    const seconds = (timeInSeconds % 60).toString().padStart(2, '0');
    return `${minutes}:${seconds}`;
  };

  const groupedResults = useMemo(() => {
    return results.reduce((acc, result) => {
        const quizId = result.quizId;
        if(!acc[quizId]) {
            acc[quizId] = [];
        }
        acc[quizId].push(result);
        return acc;
    }, {} as Record<string, QuizResult[]>);
  }, [results]);

  const isQuizActive = lobbyStatus === 'started';
  const allPlayersFinished = useMemo(() => {
    if (!isQuizActive || participants.length === 0) return false;
    return participants.every(p => p.status === 'Completed');
  }, [isQuizActive, participants]);


  return (
    <Tabs defaultValue="lobby" className="w-full">
      <TabsList className="grid w-full grid-cols-3">
        <TabsTrigger value="lobby">Lobby Control</TabsTrigger>
        <TabsTrigger value="quizzes">Quiz Management</TabsTrigger>
        <TabsTrigger value="results">Quiz Results</TabsTrigger>
      </TabsList>
      <TabsContent value="lobby">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
                <Users />
                Lobby Control
            </CardTitle>
            <CardDescription>View participants in real-time and start the quiz when ready.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-col sm:flex-row justify-between items-center p-4 bg-secondary rounded-lg gap-4">
                <div className='flex items-center gap-4 flex-wrap'>
                    <div className="text-lg font-bold">Participants: {participants.length}</div>
                    <Select onValueChange={setSelectedQuizId} value={selectedQuizId ?? undefined} disabled={isQuizActive}>
                        <SelectTrigger className="w-full sm:w-[280px]">
                            <SelectValue placeholder="Select a quiz to start" />
                        </SelectTrigger>
                        <SelectContent>
                            {quizzes.map((quiz) => (
                                <SelectItem key={quiz.id} value={quiz.id}>
                                    {quiz.id}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
                <div className='flex gap-2'>
                    {allPlayersFinished ? (
                         <Button variant="destructive" onClick={handleResetLobby}>
                            <CheckCircle className="mr-2 h-4 w-4" />
                            End Quiz
                        </Button>
                    ) : (
                        <Button className="bg-accent hover:bg-accent/90 text-accent-foreground" onClick={handleStartQuiz} disabled={!selectedQuizId || participants.length === 0 || isQuizActive}>
                            <Play className="mr-2 h-4 w-4" />
                            Start Quiz
                        </Button>
                    )}

                     <AlertDialog>
                        <AlertDialogTrigger asChild>
                            <Button variant="destructive" disabled={isQuizActive && !allPlayersFinished}>
                                <RefreshCw className="mr-2 h-4 w-4" />
                                Reset Lobby
                            </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                            <AlertDialogHeader>
                                <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                                <AlertDialogDescription>
                                    This action will remove all participants from the lobby and end any active quiz. This cannot be undone.
                                </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction onClick={handleResetLobby} className='bg-destructive hover:bg-destructive/90'>Reset</AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>
                </div>
            </div>
            {isQuizActive && !allPlayersFinished && (
                <div className='text-center p-2 rounded-md bg-yellow-100 border border-yellow-300 text-yellow-800'>
                    A quiz is currently in progress. Reset the lobby to end it prematurely.
                </div>
            )}
            {allPlayersFinished && (
                 <div className='text-center p-2 rounded-md bg-green-100 border border-green-300 text-green-800'>
                    All participants have completed the quiz. You can now end the quiz.
                </div>
            )}
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Participant Name</TableHead>
                  <TableHead>Email</TableHead>
                  {isQuizActive && <TableHead>Status</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {participants.length > 0 ? participants.map((p) => (
                    <TableRow key={p.email}>
                        <TableCell>{p.name}</TableCell>
                        <TableCell>{p.email}</TableCell>
                        {isQuizActive && (
                            <TableCell>
                                <Badge variant={p.status === 'Completed' ? 'default' : 'secondary'} className={p.status === 'Completed' ? 'bg-green-600' : ''}>
                                    {p.status === 'Completed' ? <CheckCircle className="mr-1 h-3 w-3" /> : <Clock className="mr-1 h-3 w-3" />}
                                    {p.status}
                                </Badge>
                            </TableCell>
                        )}
                    </TableRow>
                )) : (
                    <TableRow>
                        <TableCell colSpan={isQuizActive ? 3 : 2} className='text-center'>No participants in the lobby yet.</TableCell>
                    </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </TabsContent>
      <TabsContent value="quizzes">
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
                <div>
                    <CardTitle>Quiz Management</CardTitle>
                    <CardDescription>Create, edit, or delete quizzes.</CardDescription>
                </div>
                <Button asChild className="bg-accent hover:bg-accent/90 text-accent-foreground">
                    <Link href="/admin/quiz/create"><PlusCircle className="mr-2 h-4 w-4" /> Create New Quiz</Link>
                </Button>
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableCaption>A list of your available quizzes.</TableCaption>
              <TableHeader>
                <TableRow>
                  <TableHead>Quiz ID</TableHead>
                  <TableHead>Passage Snippet</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {quizzes.length > 0 ? quizzes.map(quiz => (
                <TableRow key={quiz.id}>
                  <TableCell className="font-medium">{quiz.id}</TableCell>
                  <TableCell>{quiz.passage.substring(0, 50)}...</TableCell>
                  <TableCell className="text-right space-x-2">
                      <Button variant="outline" size="icon" asChild>
                        <Link href={`/admin/quiz/edit/${encodeURIComponent(quiz.id)}`}>
                            <Edit className="h-4 w-4" />
                        </Link>
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                            <Button variant="destructive" size="icon"><Trash2 className="h-4 w-4" /></Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                            <AlertDialogHeader>
                                <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                                <AlertDialogDescription>
                                    This action will permanently delete this quiz and cannot be undone.
                                </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction onClick={() => handleDeleteQuiz(quiz.id)} className='bg-destructive hover:bg-destructive/90'>Delete</AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>
                  </TableCell>
                </TableRow>
                )) : (
                    <TableRow>
                        <TableCell colSpan={3} className='text-center'>No quizzes found. Create one to get started.</TableCell>
                    </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </TabsContent>
       <TabsContent value="results">
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Trophy />
                    Quiz Results & Leaderboards
                </CardTitle>
                <CardDescription>View results for all completed quizzes, sorted by the fastest time.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                {Object.keys(groupedResults).length > 0 ? (
                    Object.entries(groupedResults).map(([quizId, quizResults]) => (
                        <Card key={quizId} className="w-full">
                            <CardHeader>
                                <CardTitle className="text-lg">Quiz: {quizId}</CardTitle>
                                <CardDescription>
                                    {quizzes.find(q => q.id === quizId)?.passage.substring(0, 100) ?? 'Passage not found'}...
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Rank</TableHead>
                                            <TableHead>Participant</TableHead>
                                            <TableHead>Email</TableHead>
                                            <TableHead className="text-right">Completion Time</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {quizResults.map((result, index) => (
                                            <TableRow key={result.email}>
                                                <TableCell className="font-bold">{index + 1}</TableCell>
                                                <TableCell>{result.name}</TableCell>
                                                <TableCell>{result.email}</TableCell>
                                                <TableCell className="text-right font-mono">{formatTime(result.time)}</TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </CardContent>
                        </Card>
                    ))
                ) : (
                    <div className="text-center text-muted-foreground py-8">
                        <BarChart3 className="mx-auto h-12 w-12" />
                        <p className="mt-4">No quiz results have been recorded yet.</p>
                    </div>
                )}
            </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  );
}

    
