import React from "react";
import { styles } from "../styles";

interface EmailsTabProps {
  emailProvider: "inboxkitten" | "maildrop" | "mailosaur";
  setEmailProvider: (provider: "inboxkitten" | "maildrop" | "mailosaur") => void;
  mailosaurApiKey: string;
  setMailosaurApiKey: (key: string) => void;
  mailosaurServerId: string;
  setMailosaurServerId: (id: string) => void;
  handleSaveEmails: (e: React.FormEvent) => void;
}

export const EmailsTab: React.FC<EmailsTabProps> = ({
  emailProvider,
  setEmailProvider,
  mailosaurApiKey,
  setMailosaurApiKey,
  mailosaurServerId,
  setMailosaurServerId,
  handleSaveEmails,
}) => {
  return (
    <div style={styles.tabContent}>
      <div style={styles.sectionHeader}>
        <h1 style={styles.mainTitle}>Email Opt Testing Settings</h1>
        <p style={styles.mainSubtitle}>
          Choose your disposable email service provider and configure API access keys.
        </p>
      </div>

      <div style={styles.card}>
        <h3 style={styles.cardTitle}>Choose Email Provider</h3>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr 1fr",
            gap: "16px",
            marginBottom: "24px",
          }}
        >
          <div
            onClick={() => setEmailProvider("inboxkitten")}
            style={{
              border:
                emailProvider === "inboxkitten"
                  ? "2px solid var(--color-primary)"
                  : "1px solid var(--border-color)",
              borderRadius: "8px",
              padding: "16px",
              cursor: "pointer",
              backgroundColor:
                emailProvider === "inboxkitten"
                  ? "var(--color-primary-tint)"
                  : "var(--bg-secondary)",
              transition: "all 0.2s",
              boxShadow:
                emailProvider === "inboxkitten"
                  ? "0 4px 12px var(--color-primary-tint)"
                  : "none",
            }}
          >
            <div style={{ fontSize: "24px", marginBottom: "8px" }}>🐱</div>
            <div
              style={{
                fontWeight: "bold",
                fontSize: "14px",
                color:
                  emailProvider === "inboxkitten"
                    ? "var(--color-primary)"
                    : "var(--text-primary)",
                marginBottom: "4px",
              }}
            >
              Inbox Kitten
            </div>
            <div style={{ fontSize: "11px", color: "var(--text-secondary)", lineHeight: "1.4" }}>
              Public boxes at @inboxkitten.com. Completely free, requires no setup.
            </div>
          </div>

          <div
            onClick={() => setEmailProvider("maildrop")}
            style={{
              border:
                emailProvider === "maildrop"
                  ? "2px solid var(--color-primary)"
                  : "1px solid var(--border-color)",
              borderRadius: "8px",
              padding: "16px",
              cursor: "pointer",
              backgroundColor:
                emailProvider === "maildrop"
                  ? "var(--color-primary-tint)"
                  : "var(--bg-secondary)",
              transition: "all 0.2s",
              boxShadow:
                emailProvider === "maildrop"
                  ? "0 4px 12px var(--color-primary-tint)"
                  : "none",
            }}
          >
            <div style={{ fontSize: "24px", marginBottom: "8px" }}>💧</div>
            <div
              style={{
                fontWeight: "bold",
                fontSize: "14px",
                color:
                  emailProvider === "maildrop"
                    ? "var(--color-primary)"
                    : "var(--text-primary)",
                marginBottom: "4px",
              }}
            >
              Maildrop
            </div>
            <div style={{ fontSize: "11px", color: "var(--text-secondary)", lineHeight: "1.4" }}>
              Public boxes at @maildrop.cc. High performance, supports GraphQL.
            </div>
          </div>

          <div
            onClick={() => setEmailProvider("mailosaur")}
            style={{
              border:
                emailProvider === "mailosaur"
                  ? "2px solid var(--color-primary)"
                  : "1px solid var(--border-color)",
              borderRadius: "8px",
              padding: "16px",
              cursor: "pointer",
              backgroundColor:
                emailProvider === "mailosaur"
                  ? "var(--color-primary-tint)"
                  : "var(--bg-secondary)",
              transition: "all 0.2s",
              boxShadow:
                emailProvider === "mailosaur"
                  ? "0 4px 12px var(--color-primary-tint)"
                  : "none",
            }}
          >
            <div style={{ fontSize: "24px", marginBottom: "8px" }}>🦖</div>
            <div
              style={{
                fontWeight: "bold",
                fontSize: "14px",
                color:
                  emailProvider === "mailosaur"
                    ? "var(--color-primary)"
                    : "var(--text-primary)",
                marginBottom: "4px",
              }}
            >
              Mailosaur
            </div>
            <div style={{ fontSize: "11px", color: "var(--text-secondary)", lineHeight: "1.4" }}>
              Secure testing server at @mailosaur.net. Requires API key & Server ID.
            </div>
          </div>
        </div>

        {emailProvider === "mailosaur" && (
          <div style={{ borderTop: "1px solid var(--border-color)", paddingTop: "20px" }}>
            <h4 style={{ color: "var(--text-primary)", fontSize: "13px", margin: "0 0 12px 0" }}>
              Mailosaur Credentials
            </h4>
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "12px",
                marginBottom: "20px",
              }}
            >
              <div>
                <label
                  style={{
                    display: "block",
                    color: "var(--text-secondary)",
                    fontSize: "11px",
                    marginBottom: "6px",
                  }}
                >
                  Mailosaur API Key
                </label>
                <input
                  type="password"
                  value={mailosaurApiKey}
                  onChange={(e) => setMailosaurApiKey(e.target.value)}
                  placeholder="Your Mailosaur API Key..."
                  style={{
                    width: "100%",
                    padding: "8px 12px",
                    backgroundColor: "var(--bg-card)",
                    border: "1px solid var(--border-color)",
                    borderRadius: "6px",
                    color: "var(--text-primary)",
                    fontSize: "12px",
                    boxSizing: "border-box" as const,
                  }}
                />
              </div>
              <div>
                <label
                  style={{
                    display: "block",
                    color: "var(--text-secondary)",
                    fontSize: "11px",
                    marginBottom: "6px",
                  }}
                >
                  Mailosaur Server ID
                </label>
                <input
                  type="text"
                  value={mailosaurServerId}
                  onChange={(e) => setMailosaurServerId(e.target.value)}
                  placeholder="Your Mailosaur Server ID..."
                  style={{
                    width: "100%",
                    padding: "8px 12px",
                    backgroundColor: "var(--bg-card)",
                    border: "1px solid var(--border-color)",
                    borderRadius: "6px",
                    color: "var(--text-primary)",
                    fontSize: "12px",
                    boxSizing: "border-box" as const,
                  }}
                />
              </div>
            </div>
          </div>
        )}

        <button
          className="btn-gradient"
          onClick={handleSaveEmails}
          style={{
            fontSize: "12px",
            padding: "8px 16px",
          }}
        >
          Save Configuration
        </button>
      </div>
    </div>
  );
};
