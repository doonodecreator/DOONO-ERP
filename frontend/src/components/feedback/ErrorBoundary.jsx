import React from "react";

export default class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true, error };
    }

    componentDidCatch(error, info) {
        if (typeof window !== "undefined") {
            window.dispatchEvent(new CustomEvent("dono:ui-error", {
                detail: { message: error?.message || "Unexpected page error", componentStack: info?.componentStack || "" },
            }));
        }
    }

    handleRetry = () => {
        this.setState({ hasError: false, error: null });
    };

    render() {
        if (!this.state.hasError) {
            return this.props.children;
        }

        return (
            <section className="mx-auto my-8 max-w-3xl rounded-2xl border border-rose-200 bg-rose-50 p-6 text-rose-900 shadow-sm" role="alert">
                <p className="text-xs font-bold uppercase tracking-wide text-rose-700">Page error</p>
                <h2 className="mt-2 text-xl font-bold">This page could not be displayed</h2>
                <p className="mt-2 text-sm text-rose-800">Your session is still open. Retry the page, or use the navigation menu to continue working. If this keeps happening, send the error time to your platform administrator.</p>
                {this.state.error?.message && <p className="mt-3 rounded-lg bg-white/70 p-3 text-xs text-rose-700">{this.state.error.message}</p>}
                <button type="button" onClick={this.handleRetry} className="mt-5 min-h-11 rounded-lg bg-rose-700 px-4 py-2 text-sm font-semibold text-white hover:bg-rose-800">Retry page</button>
            </section>
        );
    }
}
