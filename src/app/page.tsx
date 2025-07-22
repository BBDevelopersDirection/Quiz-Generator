'use client';

import { PlayerRegistration } from '@/components/PlayerRegistration';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function Home() {

  return (
    <main className="flex min-h-screen w-full flex-col items-center justify-center bg-background p-4">
      <div className="w-full max-w-md">
        <Card className="shadow-2xl animate-in fade-in-50 duration-500">
          <CardHeader className="text-center space-y-2">
            <h1 className="text-3xl font-bold text-primary">Root Cause Navigator</h1>
            <CardDescription className="text-muted-foreground">
              Enter your details to join the challenge.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <PlayerRegistration />
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
