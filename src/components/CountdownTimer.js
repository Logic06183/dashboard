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

    if (diffMinutes < 0) return 'text-red-600 font-bold';
    if (diffMinutes < 15) return 'text-orange-600 font-bold';
    if (diffMinutes < 30) return 'text-yellow-600';
    return 'text-green-600';
  };

  const [timeLeft, setTimeLeft] = useState(calculateTimeLeft());
  
  useEffect(() => {
    const timer = setTimeout(() => {
      setTimeLeft(calculateTimeLeft());
    }, 1000);
    
    return () => clearTimeout(timer);
  });

  if (!timeLeft) {
    return <p className="text-red-600 font-bold">OVERDUE!</p>;
  }

  return (
    <p className={getTimerColor()}>
      Time Remaining: {timeLeft.hours}h {timeLeft.minutes}m {timeLeft.seconds}s
    </p>
  );
};

export default CountdownTimer;