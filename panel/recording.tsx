import React, { useState, useEffect, useRef } from "react";
import ReactDOM from "react-dom/client";

export const RecordingApp: React.FC = () => {
  const [status, setStatus] = useState<"idle" | "requesting" | "recording">("idle");
  const [duration, setDuration] = useState<number>(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);
  const durationIntervalRef = useRef<any>(null);

  const startRecording = async () => {
    setStatus("requesting");
    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
        audio: true,
      });

      recordedChunksRef.current = [];
      const options = { mimeType: "video/webm; codecs=vp9" };
      const mediaRecorder = new MediaRecorder(stream, options);

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          recordedChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        if (durationIntervalRef.current) {
          clearInterval(durationIntervalRef.current);
          durationIntervalRef.current = null;
        }

        stream.getTracks().forEach((track) => track.stop());

        const blob = new Blob(recordedChunksRef.current, {
          type: "video/webm",
        });

        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        const now = new Date();
        const timestamp = now.toISOString().replace(/[:.]/g, "-");
        a.download = `ortoni-studio-recording-${timestamp}.webm`;
        a.click();
        URL.revokeObjectURL(url);

        setStatus("idle");
        setDuration(0);

        if (typeof chrome !== "undefined" && chrome.runtime && chrome.runtime.sendMessage) {
          chrome.runtime.sendMessage({ action: "RECORDING_STOPPED" });
        }

        // Close window shortly after download starts
        setTimeout(() => {
          window.close();
        }, 1000);
      };

      mediaRecorderRef.current = mediaRecorder;
      mediaRecorder.start(1000); // chunk every 1 sec

      setStatus("recording");
      setDuration(0);

      if (typeof chrome !== "undefined" && chrome.runtime && chrome.runtime.sendMessage) {
        chrome.runtime.sendMessage({ action: "RECORDING_STARTED" });
      }

      durationIntervalRef.current = setInterval(() => {
        setDuration((prev) => prev + 1);
      }, 1000);

      // Trigger stop when track ends (browser share bar Stop sharing click)
      stream.getVideoTracks()[0].onended = () => {
        stopRecording();
      };
    } catch (err: any) {
      console.error("Screen recording permission denied or failed:", err);
      // Revert status to idle so user can click again, or close if cancelled
      setStatus("idle");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stop();
    }
  };

  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  // Listen for stop requests and clean up interval on unmount
  useEffect(() => {
    const handleRuntimeMessage = (message: any) => {
      if (message.action === "STOP_RECORDING") {
        stopRecording();
      }
    };

    if (typeof chrome !== "undefined" && chrome.runtime && chrome.runtime.onMessage) {
      chrome.runtime.onMessage.addListener(handleRuntimeMessage);
    }

    return () => {
      if (durationIntervalRef.current) {
        clearInterval(durationIntervalRef.current);
      }
      if (typeof chrome !== "undefined" && chrome.runtime && chrome.runtime.onMessage) {
        chrome.runtime.onMessage.removeListener(handleRuntimeMessage);
      }
    };
  }, []);

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <div style={styles.header}>
          <div style={styles.brandIcon}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2ZM12 20C7.59 20 4 16.41 4 12C4 7.59 7.59 4 12 4C16.41 4 20 7.59 20 12C20 16.41 16.41 20 12 20ZM12 8C9.79 8 8 9.79 8 12C8 14.21 9.79 16 12 16C14.21 16 16 14.21 16 12C16 9.79 14.21 8 12 8Z" fill="url(#brandGrad)"/>
              <defs>
                <linearGradient id="brandGrad" x1="2" y1="2" x2="22" y2="22" gradientUnits="userSpaceOnUse">
                  <stop offset="0%" stopColor="#818cf8" />
                  <stop offset="100%" stopColor="#c084fc" />
                </linearGradient>
              </defs>
            </svg>
          </div>
          <h3 style={styles.title}>Ortoni Studio</h3>
        </div>

        {status === "idle" && (
          <div>
            <p style={styles.desc}>
              Capture your browser interaction to create high-fidelity walkthrough recordings automatically.
            </p>
            <button style={styles.btnStart} onClick={startRecording}>
              Start Screen Recording
            </button>
          </div>
        )}

        {status === "requesting" && (
          <div>
            <p style={styles.descLoading}>
              Please select the window, screen, or tab you want to record from the browser prompt...
            </p>
            <div style={styles.spinnerContainer}>
              <div style={styles.spinner}></div>
            </div>
          </div>
        )}

        {status === "recording" && (
          <div style={styles.recordingContainer}>
            <p style={styles.descRecording}>
              Recording active! Minimize this window and run your manual tests.
            </p>
            <div style={styles.timerBox}>
              <span style={styles.redDot}></span>
              <span style={styles.timer}>{formatDuration(duration)}</span>
            </div>
            <button style={styles.btnStop} onClick={stopRecording}>
              Stop & Save Recording
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

const styles = {
  container: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    height: "100vh",
    width: "100vw",
    background: "radial-gradient(circle at 50% 50%, #111827 0%, #030712 100%)",
  },
  card: {
    backgroundColor: "rgba(17, 24, 39, 0.75)",
    backdropFilter: "blur(12px)",
    WebkitBackdropFilter: "blur(12px)",
    border: "1px solid rgba(255, 255, 255, 0.08)",
    borderRadius: "12px",
    padding: "16px 20px",
    textAlign: "center" as const,
    boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.5), 0 10px 10px -5px rgba(0, 0, 0, 0.4)",
    width: "290px",
    boxSizing: "border-box" as const,
  },
  header: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "8px",
    marginBottom: "12px",
  },
  brandIcon: {
    display: "flex",
    alignItems: "center",
  },
  title: {
    margin: 0,
    fontSize: "15px",
    fontWeight: 700,
    background: "linear-gradient(135deg, #a5b4fc 0%, #e9d5ff 100%)",
    WebkitBackgroundClip: "text",
    WebkitTextFillColor: "transparent",
    letterSpacing: "-0.025em",
  },
  desc: {
    color: "#9ca3af",
    fontSize: "11px",
    lineHeight: "1.4",
    margin: "0 0 16px 0",
  },
  descLoading: {
    color: "#6366f1",
    fontSize: "11px",
    lineHeight: "1.4",
    margin: "0 0 16px 0",
    fontWeight: 500,
  },
  descRecording: {
    color: "#10b981",
    fontSize: "11px",
    lineHeight: "1.4",
    margin: "0 0 12px 0",
    fontWeight: 500,
  },
  btnStart: {
    background: "linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)",
    color: "#ffffff",
    border: "none",
    borderRadius: "6px",
    padding: "8px 16px",
    fontSize: "12px",
    fontWeight: 600,
    cursor: "pointer",
    boxShadow: "0 4px 12px rgba(99, 102, 241, 0.3)",
    transition: "transform 0.2s, box-shadow 0.2s",
    width: "100%",
    boxSizing: "border-box" as const,
    outline: "none",
  },
  spinnerContainer: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    padding: "8px 0",
  },
  spinner: {
    width: "24px",
    height: "24px",
    border: "2px solid rgba(99, 102, 241, 0.1)",
    borderTop: "2px solid #818cf8",
    borderRadius: "50%",
    animation: "pulse 1s linear infinite",
  },
  recordingContainer: {
    display: "flex",
    flexDirection: "column" as const,
    alignItems: "center",
    gap: "10px",
  },
  timerBox: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    backgroundColor: "rgba(0, 0, 0, 0.4)",
    border: "1px solid rgba(255, 255, 255, 0.05)",
    padding: "6px 14px",
    borderRadius: "20px",
  },
  redDot: {
    display: "inline-block",
    width: "8px",
    height: "8px",
    borderRadius: "50%",
    backgroundColor: "#ef4444",
    boxShadow: "0 0 8px #ef4444",
    animation: "pulse 1.5s infinite",
  },
  timer: {
    color: "#ffffff",
    fontSize: "13px",
    fontWeight: 700,
    fontFamily: 'Consolas, Monaco, "Courier New", monospace',
    letterSpacing: "0.05em",
  },
  btnStop: {
    background: "linear-gradient(135deg, #ef4444 0%, #dc2626 100%)",
    color: "#ffffff",
    border: "none",
    borderRadius: "6px",
    padding: "8px 16px",
    fontSize: "11px",
    fontWeight: 700,
    cursor: "pointer",
    boxShadow: "0 4px 12px rgba(239, 68, 68, 0.3)",
    transition: "transform 0.2s",
    width: "100%",
    boxSizing: "border-box" as const,
    outline: "none",
  },
};

const root = ReactDOM.createRoot(document.getElementById("root")!);
root.render(<RecordingApp />);
