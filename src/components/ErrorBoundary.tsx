'use client';

import React from 'react';

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
}

export default class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('[ErrorBoundary]', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <div className="min-h-screen bg-gradient-to-b from-amber-50 to-amber-100 flex flex-col items-center justify-center p-4 gap-4">
          <h2 className="text-2xl font-bold text-red-700">Đã xảy ra lỗi</h2>
          <p className="text-amber-700">Vui lòng tải lại trang để tiếp tục.</p>
          <button
            onClick={() => this.setState({ hasError: false })}
            className="px-6 py-2 bg-amber-700 text-white rounded-lg hover:bg-amber-800 transition-colors font-medium shadow-md"
          >
            Thử lại
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
