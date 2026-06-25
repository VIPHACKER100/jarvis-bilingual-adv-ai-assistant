/**
 * Shared test utilities for JARVIS component tests
 * 
 * NOTE: Do NOT put vi.mock() calls here — they get hoisted and can conflict
 * with per-file mocks. Put mocks directly in each test file.
 */
import { FC, ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

export const mockAddNotification = () => {}; // placeholder

export const testQueryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: false, gcTime: 0 },
    mutations: { retry: false },
  },
});

export const TestWrapper: FC<{ children: ReactNode }> = ({ children }) => {
  return (
    <QueryClientProvider client={testQueryClient}>
      {children}
    </QueryClientProvider>
  );
};

/** Common framer-motion mock factory for test files */
export function createFramerMotionMock() {
  const Div: FC<any> = ({ children, ...props }: any) => {
    const { initial, animate, exit, transition, whileHover, whileTap, layout, layoutId, ...rest } = props;
    return <div {...rest}>{children}</div>;
  };
  const Btn: FC<any> = ({ children, ...props }: any) => {
    const { initial, animate, exit, transition, whileHover, whileTap, layout, layoutId, ...rest } = props;
    return <button {...rest}>{children}</button>;
  };
  const Span: FC<any> = ({ children, ...props }: any) => {
    const { initial, animate, exit, transition, ...rest } = props;
    return <span {...rest}>{children}</span>;
  };
  return {
    motion: { div: Div, button: Btn, span: Span },
    AnimatePresence: ({ children }: { children: ReactNode }) => <>{children}</>,
    LayoutGroup: ({ children }: { children: ReactNode }) => <>{children}</>,
  };
}
