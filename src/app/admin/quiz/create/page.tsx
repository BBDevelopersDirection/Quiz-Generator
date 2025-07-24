import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import dynamic from 'next/dynamic';
import Link from 'next/link';

const QuizEditor = dynamic(() => import('@/components/admin/QuizEditor'), {
    loading: () => <div className="flex justify-center items-center h-64"><Loader2 className="h-8 w-8 animate-spin" /></div>,
});

export default function CreateQuizPage() {
    return (
        <div className="min-h-screen bg-secondary/50">
            <header className="bg-primary text-primary-foreground shadow-md">
                <div className="container mx-auto flex justify-between items-center p-4">
                    <h1 className="text-2xl font-bold">Create New Quiz</h1>
                    <Button variant="ghost" asChild>
                        <Link href="/admin/dashboard">Back to Dashboard</Link>
                    </Button>
                </div>
            </header>
            <main className="container mx-auto p-4 sm:p-6 md:p-8">
                <QuizEditor />
            </main>
        </div>
    )
}
