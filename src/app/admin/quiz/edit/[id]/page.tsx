import { Button } from '@/components/ui/button';
import { db } from '@/lib/firebase';
import type { QuizData } from '@/lib/types';
import { doc, getDoc } from 'firebase/firestore';
import { Loader2 } from 'lucide-react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { notFound } from 'next/navigation';

const QuizEditor = dynamic(() => import('@/components/admin/QuizEditor'), {
    ssr: false,
    loading: () => <div className="flex justify-center items-center h-64"><Loader2 className="h-8 w-8 animate-spin" /></div>,
});

async function getQuiz(id: string): Promise<QuizData | null> {
    const quizRef = doc(db, 'quizzes', decodeURIComponent(id));
    const docSnap = await getDoc(quizRef);

    if (docSnap.exists()) {
        return { id: docSnap.id, ...docSnap.data() } as QuizData;
    }
    return null;
}

export default async function EditQuizPage({ params }: { params: { id: string } }) {
    const quiz = await getQuiz(params.id);

    if (!quiz) {
        notFound();
    }

    return (
        <div className="min-h-screen bg-secondary/50">
            <header className="bg-primary text-primary-foreground shadow-md">
                <div className="container mx-auto flex justify-between items-center p-4">
                    <h1 className="text-2xl font-bold">Edit Quiz: {quiz.id}</h1>
                    <Button variant="ghost" asChild>
                        <Link href="/admin/dashboard">Back to Dashboard</Link>
                    </Button>
                </div>
            </header>
            <main className="container mx-auto p-4 sm:p-6 md:p-8">
                <QuizEditor initialData={quiz} />
            </main>
        </div>
    )
}
