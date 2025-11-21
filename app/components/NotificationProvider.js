'use client';

import {
  createContext,
  useContext,
  useRef,
  useEffect,
  useState,
} from 'react';

const NotificationContext = createContext(null);

let globalNotify = () => {};

// Define preset styles
const PRESET_STYLES = {
  info: {
    background: 'var(--sky-info-g1)',
    titleColor: 'var(--sky-info-primary-dark)',
    messageColor: 'var(--sky-info-primary)',
  },
  success: {
    background: 'var(--sky-success-g1)',
    titleColor: 'var(--sky-success-primary-dark)',
    messageColor: 'var(--sky-success-primary)',
  },
  warn: {
    background: 'var(--sky-warning-g1)',
    titleColor: 'var(--sky-warning-primary-dark)',
    messageColor: 'var(--sky-warning-primary)',
  },
  alert: {
    background: 'var(--sky-danger-g1)',
    titleColor: 'var(--sky-danger-primary-dark)',
    messageColor: 'var(--sky-danger-primary)',
  },
  active: {
    background: 'var(--sky-active-g1)',
    titleColor: 'var(--sky-active-primary-dark)',
    messageColor: 'var(--sky-active-primary)',
  },
};

export function NotificationProvider({ children }) {
  const ref = useRef(null);
  const [SkyNotification, setSkyNotification] = useState(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      import('@sky-ui/react').then((mod) => {
        setSkyNotification(() => mod.SkyNotification);
      });
    }
  }, []);

  useEffect(() => {
    globalNotify = ({ type, title, message, ...rest }) => {
      const preset = PRESET_STYLES[type] || {};
      ref.current?.addNotification?.({
        title,
        message,
        duration: 5000,
        align: 'left',
        ...preset,
        ...rest,
      });
    };
  }, []);

  if (!SkyNotification) return null;

  return (
    <NotificationContext.Provider value={{ notify: globalNotify }}>
      {children}
      <SkyNotification ref={ref} position="top-center" mergeDuplicates  
        closeButton={false}/>
    </NotificationContext.Provider>
  );
}

export function notifyGlobal({ type, title, message, ...rest }) {
  globalNotify?.({ type, title, message, ...rest });
}

export function useNotify() {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotify must be used within NotificationProvider');
  }
  return context.notify;
}
