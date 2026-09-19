import { Component } from "react";

/** Error boundary so a malformed AI chart spec can never crash the chat. */
export default class ChartBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { failed: false };
  }

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidCatch(error) {
    console.error("Chart render failed:", error);
  }

  render() {
    if (this.state.failed) {
      return (
        <p className="muted small">
          The chart could not be rendered for this data — see the table instead.
        </p>
      );
    }
    return this.props.children;
  }
}
