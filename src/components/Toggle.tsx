import { useState } from 'react';

type Props = {
  defaultOn?: boolean;
  'aria-label'?: string;
};

export function Toggle({ defaultOn = false, 'aria-label': ariaLabel }: Props) {
  const [on, setOn] = useState(defaultOn);
  return (
    <div
      className={`toggle ${on ? 'on' : ''}`}
      onClick={() => setOn(!on)}
      role="switch"
      aria-checked={on}
      aria-label={ariaLabel}
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && setOn((v) => !v)}
    />
  );
}
