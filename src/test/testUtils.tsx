import { render, type RenderOptions } from '@testing-library/react';
import type { ReactElement, ReactNode } from 'react';
import { AppProvider } from '../store';
import { ConfirmProvider } from '../hooks';

interface WrapperProps {
  children: ReactNode;
}

function TestWrapper({ children }: WrapperProps) {
  return (
    <AppProvider>
      <ConfirmProvider>{children}</ConfirmProvider>
    </AppProvider>
  );
}

function customRender(
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
) {
  return render(ui, { wrapper: TestWrapper, ...options });
}

// Re-export everything from testing library
export * from '@testing-library/react';
export { customRender as render };
