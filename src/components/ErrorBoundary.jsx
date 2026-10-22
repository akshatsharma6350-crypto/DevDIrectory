import { Component } from 'react';

/** Last-resort safety net so a crash in one view never white-screens the app. */
export default class ErrorBoundary extends Component {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, info) {
    console.error('UI crash:', error, info);
  }

  render() {
    if (!this.state.hasError) return this.props.children;
    return (
      <div className="container page center-text">
        <h1>Something went sideways</h1>
        <p className="muted">An unexpected error occurred. Your data is safe.</p>
        <button className="btn btn-primary" onClick={() => window.location.assign('/')}>Reload DevDirectory</button>
      </div>
    );
  }
}
