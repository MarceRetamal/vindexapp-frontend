import { Component, type ReactNode } from 'react';
import { ErrorBanner } from './ErrorBanner';

interface Props {
  children: ReactNode;
  resetKey?: string;
}

interface State {
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidUpdate(prevProps: Props) {
    if (this.state.error && prevProps.resetKey !== this.props.resetKey) {
      this.setState({ error: null });
    }
  }

  render() {
    if (this.state.error) {
      return (
        <div className="py-8">
          <ErrorBanner message={`Ocurrió un error al mostrar esta página: ${this.state.error.message}`} />
        </div>
      );
    }
    return this.props.children;
  }
}
