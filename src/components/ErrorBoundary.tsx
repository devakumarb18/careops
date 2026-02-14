import React from "react";

export class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error?: Error; info?: any }
> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: any, info: any) {
    console.error("App crashed:", error, info);
    this.setState({ info });
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: 40, textAlign: "center" }}>
          <h1
            style={{ fontSize: "24px", fontWeight: "bold", color: "#ef4444" }}
          >
            ❌ App crashed
          </h1>
          <p style={{ marginBottom: "20px" }}>
            The application encountered a critical error.
          </p>

          <div
            style={{
              marginTop: 20,
              padding: 20,
              background: "#f1f5f9",
              borderRadius: 8,
              textAlign: "left",
              fontFamily: "monospace",
              overflow: "auto",
              maxHeight: "400px",
              maxWidth: "800px",
              margin: "0 auto",
            }}
          >
            <p style={{ color: "#dc2626", fontWeight: "bold" }}>
              {/* @ts-ignore */}
              {this.state.error?.toString() || "Unknown Error"}
            </p>
            <pre style={{ fontSize: "12px", marginTop: "10px" }}>
              {/* @ts-ignore */}
              {this.state.info?.componentStack}
            </pre>
          </div>

          <button
            onClick={() => window.location.reload()}
            style={{
              marginTop: 20,
              padding: "10px 20px",
              background: "#0f172a",
              color: "white",
              borderRadius: 6,
              border: "none",
              cursor: "pointer",
            }}
          >
            Reload Page
          </button>
          <button
            onClick={() => {
              localStorage.clear();
              window.location.href = "/";
            }}
            style={{
              marginTop: 20,
              marginLeft: 10,
              padding: "10px 20px",
              background: "#ef4444",
              color: "white",
              borderRadius: 6,
              border: "none",
              cursor: "pointer",
            }}
          >
            Clear Cache & Restart
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
