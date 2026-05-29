import React from 'react';
import { Translation } from 'react-i18next';
import { AlertOctagon } from 'lucide-react';

interface Props {
  children: React.ReactNode;
}

interface State {
  hasError: boolean;
}

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo): void {
    console.error('Uncaught render error:', error, info.componentStack);
  }

  render() {
    if (this.state.hasError) {
      return (
        <Translation>
          {(t) => (
            <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 p-8 text-center">
              <div className="max-w-md">
                <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
                  <AlertOctagon className="h-8 w-8 text-red-600" />
                </div>
                <h1 className="text-xl font-bold text-gray-900">
                  {t('errorBoundary.title')}
                </h1>
                <p className="mt-3 text-sm text-gray-600">
                  {t('errorBoundary.message')}
                </p>
                <button
                  onClick={() => window.location.reload()}
                  className="mt-6 rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                >
                  {t('errorBoundary.reloadButton')}
                </button>
              </div>
            </div>
          )}
        </Translation>
      );
    }

    return this.props.children;
  }
}
