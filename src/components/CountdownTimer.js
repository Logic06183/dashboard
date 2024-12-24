import React, { useState, useEffect } from 'react';

const CountdownTimer = ({ dueTime }) => {
  const calculateTimeLeft = () => {
    const difference = new Date(dueTime) - new Date();
    let timeLeft = {};

    if (difference > 0) {
      timeLeft = {
        hours: Math.floor(difference / (1000 * 60 * 60)),
        minutes: Math.floor((difference / (1000 * 60)) % 60),
        seconds: Math.floor((difference / 1000) % 60)
      };
    } else {
      timeLeft = null;
    }

    return timeLeft;
  };

  const getTimerColor = () => {
    const now = new Date();
    const due = new Date(dueTime);
    const diffMinutes = (due - now) / (1000 * 60);

    if (diffMinutes < 0) return 'text-red-500 font-bold animate-pulse';
    if (diffMinutes < 5) return 'text-red-500 font-bold';
    if (diffMinutes < 10) return 'text-primary-dark font-bold';
    return 'text-primary';
  };

  const [timeLeft, setTimeLeft] = useState(calculateTimeLeft());

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft());
    }, 1000);

    return () => clearInterval(timer);
  }, [dueTime]);

  if (!timeLeft) {
    return <span className="text-red-500 font-bold animate-pulse">Time's up!</span>;
  }

  return (
    <div className={`${getTimerColor()} font-mono text-sm`}>
      Time Remaining: {timeLeft.hours}h {timeLeft.minutes}m {timeLeft.seconds}s
    </div>
  );
};

export default CountdownTimer;