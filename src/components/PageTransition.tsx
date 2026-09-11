import { useEffect, useState, useRef } from 'react';

interface PageTransitionProps {
  children: React.ReactNode;
  routeKey: string;
}

export function PageTransition({ children, routeKey }: PageTransitionProps) {
  const [visible, setVisible] = useState(false);
  const [displayChildren, setDisplayChildren] = useState(children);
  const prevKey = useRef(routeKey);

  useEffect(() => {
    if (routeKey !== prevKey.current) {
      setVisible(false);
      const timer = setTimeout(() => {
        setDisplayChildren(children);
        setVisible(true);
        prevKey.current = routeKey;
      }, 200);
      return () => clearTimeout(timer);
    } else {
      setDisplayChildren(children);
      const t = requestAnimationFrame(() => setVisible(true));
      return () => cancelAnimationFrame(t);
    }
  }, [routeKey, children]);

  return (
    <div
      className={`transition-all duration-300 ease-out ${
        visible
          ? 'opacity-100 translate-y-0'
          : 'opacity-0 translate-y-4'
      }`}
    >
      {displayChildren}
    </div>
  );
}
