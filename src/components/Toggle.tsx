import { useEffect, useState } from 'react';

type Props = {
  defaultOn?: boolean;
  onChange?: (on: boolean) => void;
  'aria-label'?: string;
};

export function Toggle({ defaultOn = false, onChange, 'aria-label': ariaLabel }: Props) {
  const [on, setOn] = useState(defaultOn);

  useEffect(() => {
    setOn(defaultOn);
  }, [defaultOn]);

  const flip = () => {
    setOn((prev) => {
      const next = !prev;
      onChange?.(next);
      return next;
    });
  };

  return (
    <div
      className={`toggle ${on ? 'on' : ''}`}
      onClick={flip}
      role="switch"
      aria-checked={on}
      aria-label={ariaLabel}
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && flip()}
    />
  );
}
