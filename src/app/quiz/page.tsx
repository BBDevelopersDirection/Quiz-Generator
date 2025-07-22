import { Suspense } from 'react';
import QuizClient from '@/components/QuizClient';
import { Loader2 } from 'lucide-react';

function Loading() {
    return (
        <div className="flex min-h-screen w-full items-center justify-center bg-background">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
        </div>
    )
}

export default function QuizPage() {
  return (
    <Suspense fallback={<Loading />}>
      <QuizClient />
    </Suspense>
  );
}
