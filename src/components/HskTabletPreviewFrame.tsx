import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';

const TABLET_WIDTH = 1024;
const TABLET_HEIGHT = 768;

type Props = {
  children: ReactNode;
  className?: string;
};

export function HskTabletPreviewFrame({ children, className = '' }: Props) {
  const outerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  const [tabletMode, setTabletMode] = useState(true);
  const [currentTime, setCurrentTime] = useState('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(
        `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`,
      );
    };
    updateTime();
    const timer = window.setInterval(updateTime, 30000);
    return () => window.clearInterval(timer);
  }, []);

  const handleResize = useCallback(() => {
    if (!outerRef.current) return;
    const outerWidth = outerRef.current.clientWidth;
    setScale(Math.min(outerWidth / TABLET_WIDTH, 1));
  }, []);

  useEffect(() => {
    if (!tabletMode || !outerRef.current) return;
    const observer = new ResizeObserver(handleResize);
    observer.observe(outerRef.current);
    handleResize();
    return () => observer.disconnect();
  }, [tabletMode, handleResize]);

  const outerHeight = tabletMode ? TABLET_HEIGHT * scale : 'auto';

  return (
    <div className={`hsk-tablet-preview-wrap ${className}`.trim()}>
      <label className="hsk-tablet-preview-toggle">
        <input
          type="checkbox"
          checked={tabletMode}
          onChange={(e) => setTabletMode(e.target.checked)}
        />
        <span>平板预览模式</span>
      </label>

      <div
        ref={outerRef}
        className="hsk-tablet-preview-outer"
        style={{ height: typeof outerHeight === 'number' ? `${outerHeight}px` : outerHeight }}
      >
        <div
          className={`hsk-tablet-preview-device${tabletMode ? '' : ' is-fullwidth'}`}
          style={
            tabletMode
              ? {
                  width: TABLET_WIDTH,
                  height: TABLET_HEIGHT,
                  transform: `scale(${scale})`,
                }
              : undefined
          }
        >
          <div className="hsk-tablet-preview-statusbar">
            <span>{currentTime}</span>
            <span className="hsk-tablet-preview-statusbar-title">HSK 考试系统</span>
            <span aria-hidden>🔋</span>
          </div>
          <div className="hsk-tablet-preview-content">{children}</div>
        </div>
      </div>
    </div>
  );
}
