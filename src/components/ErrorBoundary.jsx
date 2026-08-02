import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("React Boundary Caught Error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-8 glass m-4 border-red-500/50 bg-red-500/5">
          <h2 className="text-xl font-black text-red-500 uppercase tracking-tighter mb-4">Module Malfunction</h2>
          <p className="text-xs text-slate-400 mb-6 font-mono break-all opacity-80">
            {this.state.error?.toString()}
          </p>
          <button 
            onClick={() => window.location.reload()}
            className="px-6 py-3 bg-red-500 text-white font-bold uppercase text-[14px] tracking-widest hover:bg-red-600 transition-colors"
          >
            Reboot Module
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
