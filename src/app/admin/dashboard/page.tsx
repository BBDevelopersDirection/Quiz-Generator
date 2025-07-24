import { Button } from '@/components/ui/button';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { Loader2 } from 'lucide-react';

const DashboardClient = dynamic(() => import('@/components/admin/DashboardClient'), {
    loading: () => <div className="flex justify-center items-center h-64"><Loader2 className="h-8 w-8 animate-spin" /></div>,
});


export default function AdminDashboardPage() {
    return (
        <div className="min-h-screen bg-secondary/50">
            <header className="bg-primary text-primary-foreground shadow-md">
                <div className="container mx-auto flex justify-between items-center p-4">
                    <h1 className="text-2xl font-bold">Admin Dashboard</h1>
                    <Button variant="ghost" asChild>
                        <Link href="/">Exit to Main Site</Link>
                    </Button>
                </div>
            </header>
            <main className="container mx-auto p-4 sm:p-6 md:p-8">
                <DashboardClient />
            </main>
        </div>
    );
}
