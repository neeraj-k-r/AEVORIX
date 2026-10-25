import { Component } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { Button } from '../components';

export class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
    this.setState({
      error,
      errorInfo,
    });
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback({ error: this.state.error, reset: this.handleRetry });
      }

      return (
        <div className="min-h-screen bg-background flex items-center justify-center px-4">
          <div className="max-w-md w-full text-center p-8">
            <div className="mx-auto mb-4 w-16 h-16 bg-alert-bg rounded-full flex items-center justify-center">
              <AlertTriangle className="w-8 h-8 text-alert-text" />
            </div>
            <h1 className="text-xl font-bold text-slate-900 mb-2">Something went wrong</h1>
            <p className="text-slate-600 mb-6">
              An unexpected error occurred. Please try again or contact support if the problem persists.
            </p>
            {this.state.error && (
              <details className="text-left mb-4 p-4 bg-slate-100 rounded-lg text-sm">
                <summary className="font-medium cursor-pointer">Error Details</summary>
                <pre className="mt-2 overflow-auto max-h-40">{this.state.error.toString()}</pre>
                {this.state.errorInfo?.componentStack && (
                  <pre className="mt-2 overflow-auto max-h-40">{this.state.errorInfo.componentStack}</pre>
                )}
              </details>
            )}
            <Button onClick={this.handleRetry} leftIcon={<RefreshCw className="w-4 h-4" />}>
              Try Again
            </Button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;