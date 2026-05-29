import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ErrorBoundary } from './ErrorBoundary';

vi.mock('react-i18next', () => ({
  Translation: ({
    children,
  }: {
    children: (t: (key: string) => string) => React.ReactNode;
  }) => children((key: string) => key),
}));

vi.mock('lucide-react', () => ({
  AlertOctagon: () => <svg data-testid="alert-icon" />,
}));

const ThrowingComponent = ({ shouldThrow }: { shouldThrow?: boolean }) => {
  if (shouldThrow) {
    throw new Error('Test render error');
  }
  return <p>Normal content</p>;
};

describe('ErrorBoundary', () => {
  let consoleErrorSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
  });

  it('renders children when no error occurs', () => {
    render(
      <ErrorBoundary>
        <ThrowingComponent />
      </ErrorBoundary>,
    );

    expect(screen.getByText('Normal content')).toBeInTheDocument();
  });

  it('renders the fallback title when a child throws', () => {
    render(
      <ErrorBoundary>
        <ThrowingComponent shouldThrow />
      </ErrorBoundary>,
    );

    expect(screen.getByText('errorBoundary.title')).toBeInTheDocument();
  });

  it('renders the fallback message when a child throws', () => {
    render(
      <ErrorBoundary>
        <ThrowingComponent shouldThrow />
      </ErrorBoundary>,
    );

    expect(screen.getByText('errorBoundary.message')).toBeInTheDocument();
  });

  it('renders a reload button in the fallback UI', () => {
    render(
      <ErrorBoundary>
        <ThrowingComponent shouldThrow />
      </ErrorBoundary>,
    );

    expect(
      screen.getByRole('button', { name: 'errorBoundary.reloadButton' }),
    ).toBeInTheDocument();
  });

  it('calls window.location.reload when the reload button is clicked', () => {
    const reloadMock = vi.fn();
    Object.defineProperty(window, 'location', {
      value: { reload: reloadMock },
      configurable: true,
    });

    render(
      <ErrorBoundary>
        <ThrowingComponent shouldThrow />
      </ErrorBoundary>,
    );

    fireEvent.click(
      screen.getByRole('button', { name: 'errorBoundary.reloadButton' }),
    );

    expect(reloadMock).toHaveBeenCalledTimes(1);
  });

  it('does not render the fallback when no error is thrown', () => {
    render(
      <ErrorBoundary>
        <ThrowingComponent />
      </ErrorBoundary>,
    );

    expect(
      screen.queryByText('errorBoundary.title'),
    ).not.toBeInTheDocument();
  });
});
