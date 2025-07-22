import AdminLogin from "@/components/admin/AdminLogin";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function AdminLoginPage() {
    return (
        <main className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
            <div className="w-full max-w-sm">
                <Card className="shadow-2xl">
                    <CardHeader className="text-center">
                        <h1 className="text-2xl font-bold text-primary">Admin Login</h1>
                        <CardDescription>
                            Enter your credentials to access the dashboard.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <AdminLogin />
                    </CardContent>
                </Card>
            </div>
        </main>
    );
}
