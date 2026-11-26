import { jsx as _jsx } from "react/jsx-runtime";
import { Component } from 'react';
import { ErrorBanner } from './ErrorBanner';
export class ErrorBoundary extends Component {
    state = { error: null };
    static getDerivedStateFromError(error) {
        return { error };
    }
    componentDidUpdate(prevProps) {
        if (this.state.error && prevProps.resetKey !== this.props.resetKey) {
            this.setState({ error: null });
        }
    }
    render() {
        if (this.state.error) {
            return (_jsx("div", { className: "py-8", children: _jsx(ErrorBanner, { message: `Ocurrió un error al mostrar esta página: ${this.state.error.message}` }) }));
        }
        return this.props.children;
    }
}
