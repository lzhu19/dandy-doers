import { useEffect, useRef, useState } from 'react';

function formatRemaining(deadlineTime, currentTime) {
  const totalMinutes = Math.max(
    0,
    Math.ceil((deadlineTime - currentTime) / 60000)
  );
  const days = Math.floor(totalMinutes / 1440);
  const hours = Math.floor((totalMinutes % 1440) / 60);
  const minutes = totalMinutes % 60;

  const unit = (value, singular) =>
    `${value} ${singular}${value === 1 ? '' : 's'}`;

  return `Due in ${unit(days, 'day')}, ${unit(hours, 'hour')}, and ${unit(minutes, 'minute')}`;
}

function DeadlineCountdown({ deadline, onExpire, className }) {
  const deadlineTime = new Date(deadline).getTime();
  const [currentTime, setCurrentTime] = useState(null);
  const onExpireRef = useRef(onExpire);
  const nextExpiryAttemptRef = useRef(0);

  useEffect(() => {
    onExpireRef.current = onExpire;
  }, [onExpire]);

  useEffect(() => {
    if (!deadline || Number.isNaN(deadlineTime)) return undefined;

    nextExpiryAttemptRef.current = 0;
    const updateCountdown = () => {
      const now = Date.now();
      setCurrentTime(now);
      if (deadlineTime <= now && now >= nextExpiryAttemptRef.current) {
        nextExpiryAttemptRef.current = now + 5000;
        onExpireRef.current?.(deadline);
      }
    };

    updateCountdown();
    const intervalId = setInterval(updateCountdown, 1000);
    return () => clearInterval(intervalId);
  }, [deadline, deadlineTime]);

  if (!deadline || Number.isNaN(deadlineTime)) return null;

  return (
    <time
      className={className}
      dateTime={new Date(deadlineTime).toISOString()}
      onClick={(event) => event.stopPropagation()}
    >
      {formatRemaining(deadlineTime, currentTime ?? deadlineTime)}
    </time>
  );
}

export default DeadlineCountdown;
