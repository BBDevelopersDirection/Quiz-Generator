import QuizEditor from '@/components/admin/QuizEditor';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

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
