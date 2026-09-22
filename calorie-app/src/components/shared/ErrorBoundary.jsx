import React from 'react';
import PropTypes from 'prop-types';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error("Critical Application Failure:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-surface p-12 text-center">
          <div className="card-island p-12 max-w-md space-y-6">
            <div className="text-6xl">🛠️</div>
            <h1 className="title-lg">System Recovery</h1>
            <p className="text-on-surface/50 font-medium">
              We encountered a biological logic error. The system is recalibrating your nutritional blueprint.
            </p>
            <button 
              onClick={() => window.location.href = '/'}
              className="bg-primary text-white font-black uppercase tracking-widest px-8 py-4 rounded-full shadow-xl"
            >
              Restart Blueprint
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

ErrorBoundary.propTypes = {
  children: PropTypes.node.isRequired,
};

export default ErrorBoundary;
