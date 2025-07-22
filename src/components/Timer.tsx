'use client';

import { useState, useEffect } from 'react';

interface TimerProps {
  isRunning: boolean;
  onTimeUpdate: (time: number) => void;
  className?: string;
}

export default function Timer({ isRunning, onTimeUpdate, className }: TimerProps) {
  const [seconds, setSeconds] = useState(0);

  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (isRunning) {
      interval = setInterval(() => {
        setSeconds((prevSeconds) => {
          const newTime = prevSeconds + 1;
          onTimeUpdate(newTime);
          return newTime;
        });
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isRunning, onTimeUpdate]);

  const formatTime = (timeInSeconds: number) => {
    const minutes = Math.floor(timeInSeconds / 60).toString().padStart(2, '0');
    const secondsValue = (timeInSeconds % 60).toString().padStart(2, '0');
    return `${minutes}:${secondsValue}`;
  };

  return <div className={className}>{formatTime(seconds)}</div>;
}
