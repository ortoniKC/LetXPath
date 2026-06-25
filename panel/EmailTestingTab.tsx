import React, { useState, useEffect, useRef } from "react";

interface EmailMessage {
  id: string;
  sender: string;
  subject: string;
  date: string;
  rawObject: any; // original response object
}

const generateRandomInboxName = (): string => {
  return "ortoni-" + Math.random().toString(36).substring(2, 10);
};

export const EmailTestingTab: React.FC = () => {
  const [provider, setProvider] = useState<"inboxkitten" | "maildrop" | "mailosaur">("inboxkitten");
  const [mailosaurKey, setMailosaurKey] = useState<string>("");
  const [mailosaurServer, setMailosaurServer] = useState<string>("");

  const [inboxName, setInboxName] = useState<string>("");
  const [messages, setMessages] = useState<EmailMessage[]>([]);
  const [selectedMessage, setSelectedMessage] = useState<EmailMessage | null>(null);
  const [emailHtml, setEmailHtml] = useState<string | null>(null);

  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isLoadingBody, setIsLoadingBody] = useState<boolean>(false);
  const [autoRefresh, setAutoRefresh] = useState<boolean>(true);
  const [toast, setToast] = useState<string | null>(null);

  const autoRefreshIntervalRef = useRef<any>(null);
  const activeMessageIdRef = useRef<string | null>(null);

  // Compute emailAddress dynamically as a derived state
  const emailAddress = provider === "inboxkitten"
    ? `${inboxName}@inboxkitten.com`
    : provider === "maildrop"
    ? `${inboxName}@maildrop.cc`
    : `${inboxName}.${mailosaurServer || "server"}@mailosaur.net`;

  // Load provider configurations from storage on mount
  const loadConfig = () => {
    if (typeof chrome !== "undefined" && chrome.storage && chrome.storage.local) {
      chrome.storage.local.get(
        ["emailProvider", "mailosaurApiKey", "mailosaurServerId", "emailInboxName"],
        (result) => {
          const prov = (result.emailProvider as any) || "inboxkitten";
          setProvider(prov);
          setMailosaurKey(result.mailosaurApiKey || "");
          setMailosaurServer(result.mailosaurServerId || "");

          let name = result.emailInboxName || "";
          if (!name) {
            name = generateRandomInboxName();
            chrome.storage.local.set({ emailInboxName: name });
          }
          setInboxName(name);
        }
      );
    } else {
      const prov = (localStorage.getItem("emailProvider") as any) || "inboxkitten";
      setProvider(prov);
      setMailosaurKey(localStorage.getItem("mailosaurApiKey") || "");
      setMailosaurServer(localStorage.getItem("mailosaurServerId") || "");

      let name = localStorage.getItem("emailInboxName") || "";
      if (!name) {
        name = generateRandomInboxName();
        localStorage.setItem("emailInboxName", name);
      }
      setInboxName(name);
    }
  };

  const handleGenerateNew = () => {
    const newName = generateRandomInboxName();
    setInboxName(newName);
    setMessages([]);
    setSelectedMessage(null);
    setEmailHtml(null);

    if (typeof chrome !== "undefined" && chrome.storage && chrome.storage.local) {
      chrome.storage.local.set({ emailInboxName: newName });
    } else {
      localStorage.setItem("emailInboxName", newName);
    }
    showToastMessage("Generated new email address!");
  };

  const handleCopyToClipboard = () => {
    if (!emailAddress) return;
    navigator.clipboard.writeText(emailAddress);
    showToastMessage("Copied to clipboard!");
  };

  const showToastMessage = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2500);
  };

  // Helper to post-process raw HTML body so that all links securely open in new tabs
  const postProcessHtml = (html: string): string => {
    if (!html) return "";
    const helperScript = `
      <script>
        document.addEventListener('DOMContentLoaded', () => {
          const links = document.getElementsByTagName('a');
          for (let i = 0; i < links.length; i++) {
            links[i].setAttribute('target', '_blank');
          }
        });
      </script>
    `;
    return html + helperScript;
  };

  // Fetch email list
  const fetchEmails = async (silent = false) => {
    if (!inboxName) return;
    const currentInbox = inboxName;
    const currentProvider = provider;
    if (!silent) setIsLoading(true);

    try {
      if (provider === "inboxkitten") {
        const res = await fetch(`https://inboxkitten.com/api/v1/mail/list?recipient=${inboxName}`);
        if (!res.ok) throw new Error("Failed to fetch InboxKitten emails");
        const data = await res.json();
        
        if (inboxName === currentInbox && provider === currentProvider) {
          const formatted: EmailMessage[] = (data || []).map((item: any) => ({
            id: item.id,
            sender: item.message?.headers?.from || "Unknown Sender",
            subject: item.message?.headers?.subject || "(No Subject)",
            date: item.timestamp ? new Date(item.timestamp * 1000).toLocaleString() : "Unknown Time",
            rawObject: item,
          }));
          setMessages(formatted);
        }
      } else if (provider === "maildrop") {
        const res = await fetch("https://api.maildrop.cc/graphql", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            query: `query { inbox(mailbox: "${inboxName}") { id headerfrom subject date } }`,
          }),
        });
        if (!res.ok) throw new Error("Failed to fetch Maildrop emails");
        const json = await res.json();
        if (json.errors && json.errors.length > 0) {
          throw new Error(json.errors[0].message || "Maildrop GraphQL Error");
        }
        
        if (inboxName === currentInbox && provider === currentProvider) {
          const list = json.data?.inbox || [];
          const formatted: EmailMessage[] = list.map((item: any) => ({
            id: item.id,
            sender: item.headerfrom || "Unknown Sender",
            subject: item.subject || "(No Subject)",
            date: item.date ? new Date(item.date).toLocaleString() : "Unknown Time",
            rawObject: item,
          }));
          setMessages(formatted);
        }
      } else if (provider === "mailosaur") {
        if (!mailosaurKey || !mailosaurServer) {
          throw new Error("Mailosaur API Key and Server ID are required in Settings!");
        }
        const auth = btoa(`${mailosaurKey}:`);
        const res = await fetch(`https://mailosaur.com/api/messages?server=${mailosaurServer}`, {
          headers: {
            Authorization: `Basic ${auth}`,
          },
        });
        if (!res.ok) throw new Error("Failed to fetch Mailosaur emails");
        const json = await res.json();
        const list = json.items || [];
        
        if (inboxName === currentInbox && provider === currentProvider) {
          const formatted: EmailMessage[] = list
            .filter((item: any) => {
              const toEmail = item.to?.[0]?.email || "";
              return toEmail.startsWith(inboxName);
            })
            .map((item: any) => ({
              id: item.id,
              sender: item.from?.[0]?.name ? `${item.from[0].name} <${item.from[0].email}>` : item.from?.[0]?.email || "Unknown Sender",
              subject: item.subject || "(No Subject)",
              date: item.received ? new Date(item.received).toLocaleString() : "Unknown Time",
              rawObject: item,
            }));
          setMessages(formatted);
        }
      }
    } catch (err: any) {
      console.error(err);
      if (!silent) showToastMessage(err.message || "Failed to fetch emails");
    } finally {
      if (inboxName === currentInbox && provider === currentProvider && !silent) {
        setIsLoading(false);
      }
    }
  };

  // Fetch selected email HTML body
  const selectMessage = async (msg: EmailMessage) => {
    setSelectedMessage(msg);
    setIsLoadingBody(true);
    setEmailHtml(null);
    const currentMessageId = msg.id;
    activeMessageIdRef.current = msg.id;

    try {
      if (provider === "inboxkitten") {
        const storageKey = msg.rawObject.storage?.key;
        const storageRegion = msg.rawObject.storage?.region;
        if (!storageKey) throw new Error("Missing storage key for InboxKitten email");

        const res = await fetch(
          `https://inboxkitten.com/api/v1/mail/getHtml?key=${storageKey}&region=${storageRegion || "us-east4"}`
        );
        if (!res.ok) throw new Error("Failed to fetch InboxKitten body");
        const html = await res.text();
        
        if (activeMessageIdRef.current === currentMessageId) {
          setEmailHtml(postProcessHtml(html));
        }
      } else if (provider === "maildrop") {
        const res = await fetch("https://api.maildrop.cc/graphql", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            query: `query { message(mailbox: "${inboxName}", id: "${msg.id}") { html } }`,
          }),
        });
        if (!res.ok) throw new Error("Failed to fetch Maildrop body");
        const json = await res.json();
        if (json.errors && json.errors.length > 0) {
          throw new Error(json.errors[0].message || "Maildrop GraphQL Error");
        }
        const html = json.data?.message?.html || "<p>No body returned.</p>";
        
        if (activeMessageIdRef.current === currentMessageId) {
          setEmailHtml(postProcessHtml(html));
        }
      } else if (provider === "mailosaur") {
        if (!mailosaurKey) throw new Error("Mailosaur API Key is required to view email body!");
        const auth = btoa(`${mailosaurKey}:`);
        const res = await fetch(`https://mailosaur.com/api/messages/${msg.id}`, {
          headers: {
            Authorization: `Basic ${auth}`,
          },
        });
        if (!res.ok) throw new Error("Failed to fetch Mailosaur body");
        const json = await res.json();
        const html = json.html?.body || `<pre>${json.text?.body || "No content"}</pre>`;
        
        if (activeMessageIdRef.current === currentMessageId) {
          setEmailHtml(postProcessHtml(html));
        }
      }
    } catch (err: any) {
      console.error(err);
      if (activeMessageIdRef.current === currentMessageId) {
        showToastMessage(err.message || "Failed to load email body");
      }
    } finally {
      if (activeMessageIdRef.current === currentMessageId) {
        setIsLoadingBody(false);
      }
    }
  };

  // On mount: load configurations
  useEffect(() => {
    loadConfig();
  }, []);

  // Listen to local storage settings changes to dynamically synchronize credentials/settings
  useEffect(() => {
    const handleStorageChange = (changes: any, areaName: string) => {
      if (areaName === "local") {
        if (changes.emailProvider) {
          setProvider(changes.emailProvider.newValue);
        }
        if (changes.mailosaurApiKey) {
          setMailosaurKey(changes.mailosaurApiKey.newValue);
        }
        if (changes.mailosaurServerId) {
          setMailosaurServer(changes.mailosaurServerId.newValue);
        }
        if (changes.emailInboxName) {
          setInboxName(changes.emailInboxName.newValue);
        }
      }
    };

    if (typeof chrome !== "undefined" && chrome.storage && chrome.storage.onChanged) {
      chrome.storage.onChanged.addListener(handleStorageChange);
      return () => {
        chrome.storage.onChanged.removeListener(handleStorageChange);
      };
    }
  }, []);

  // On config loaded & inboxName populated: fetch email list
  useEffect(() => {
    if (inboxName) {
      fetchEmails();
    }
  }, [inboxName, provider]);

  // Set up auto-refresh polling
  useEffect(() => {
    if (autoRefresh && inboxName) {
      autoRefreshIntervalRef.current = setInterval(() => {
        fetchEmails(true);
      }, 10000); // refresh every 10 seconds
    } else {
      if (autoRefreshIntervalRef.current) {
        clearInterval(autoRefreshIntervalRef.current);
      }
    }

    return () => {
      if (autoRefreshIntervalRef.current) {
        clearInterval(autoRefreshIntervalRef.current);
      }
    };
  }, [autoRefresh, inboxName, provider]);

  // Open settings helper
  const handleOpenSettingsPage = () => {
    if (typeof chrome !== "undefined" && chrome.runtime && chrome.runtime.openOptionsPage) {
      chrome.runtime.openOptionsPage();
    } else {
      window.open(chrome.runtime.getURL("option/option.html"));
    }
  };

  return (
    <div style={styles.tabContainer}>
      {toast && (
        <div style={styles.toast}>
          <span>{toast}</span>
        </div>
      )}

      {/* Top Header dashboard */}
      <div style={styles.topDashboard}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <span style={styles.providerBadge}>
            {provider === "inboxkitten" && "🐱 Inbox Kitten"}
            {provider === "maildrop" && "💧 Maildrop"}
            {provider === "mailosaur" && "🦖 Mailosaur"}
          </span>
          <button style={styles.btnSec} onClick={handleOpenSettingsPage}>
            Change Provider
          </button>
        </div>

        <div style={styles.emailGeneratorRow}>
          <input
            type="text"
            readOnly
            value={emailAddress}
            onClick={handleCopyToClipboard}
            style={styles.emailInput}
            title="Click to copy"
          />
          <button style={styles.btnIcon} onClick={handleCopyToClipboard} title="Copy Address">
            📋
          </button>
          <button style={styles.btnPrimary} onClick={handleGenerateNew} title="Generate New Address">
            🔄 New Address
          </button>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <label style={styles.checkboxLabel}>
            <input
              type="checkbox"
              checked={autoRefresh}
              onChange={(e) => setAutoRefresh(e.target.checked)}
              style={{ marginRight: "4px" }}
            />
            Auto-Refresh (10s)
          </label>
          <button
            style={styles.btnPrimary}
            onClick={() => fetchEmails(false)}
            disabled={isLoading}
          >
            {isLoading ? "Fetching..." : "Refresh Inbox"}
          </button>
        </div>
      </div>

      {/* Main split-pane panel layout */}
      <div style={styles.splitPane}>
        {/* Left Side: Message List */}
        <div style={styles.leftList}>
          {isLoading && messages.length === 0 ? (
            <div style={styles.loaderCenter}>
              <div style={styles.spinner}></div>
              <p style={{ fontSize: "11px", color: "#8b949e", marginTop: "10px" }}>Loading inbox...</p>
            </div>
          ) : messages.length === 0 ? (
            <div style={styles.emptyInbox}>
              <div style={styles.pulseDot}></div>
              <p style={{ fontWeight: 600, fontSize: "12px", color: "#ffffff" }}>Waiting for incoming emails...</p>
              <p style={{ fontSize: "10px", color: "#8b949e", textAlign: "center", marginTop: "4px" }}>
                Send a message to <code>{emailAddress}</code> to see it appear here.
              </p>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              {messages.map((msg) => {
                const isSelected = selectedMessage?.id === msg.id;
                return (
                  <div
                    key={msg.id}
                    onClick={() => selectMessage(msg)}
                    style={{
                      ...styles.messageCard,
                      border: isSelected ? "1px solid #4f46e5" : "1px solid #21262d",
                      backgroundColor: isSelected ? "rgba(79, 70, 229, 0.1)" : "#0d1117",
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
                      <span style={styles.senderText} title={msg.sender}>
                        {msg.sender.replace(/<.*>/, "").trim() || msg.sender}
                      </span>
                      <span style={styles.dateText}>{msg.date.split(",")[1]?.trim() || msg.date}</span>
                    </div>
                    <div style={styles.subjectText}>{msg.subject}</div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right Side: Message Details Viewer */}
        <div style={styles.rightViewer}>
          {!selectedMessage ? (
            <div style={styles.emptyViewer}>
              <div style={{ fontSize: "32px", marginBottom: "8px" }}>✉️</div>
              <p style={{ fontSize: "12px", color: "#8b949e" }}>Select an email from the list to preview</p>
            </div>
          ) : isLoadingBody ? (
            <div style={styles.loaderCenter}>
              <div style={styles.spinner}></div>
              <p style={{ fontSize: "11px", color: "#8b949e", marginTop: "10px" }}>Loading message body...</p>
            </div>
          ) : (
            <div style={styles.viewerContainer}>
              <div style={styles.viewerHeader}>
                <h2 style={styles.viewerSubject}>{selectedMessage.subject}</h2>
                <div style={styles.viewerSender}>
                  <strong>From:</strong> {selectedMessage.sender}
                </div>
                <div style={styles.viewerSender}>
                  <strong>Received:</strong> {selectedMessage.date}
                </div>
              </div>

              <div style={styles.bodyWrapper}>
                {emailHtml ? (
                  <iframe
                    title="Email Content"
                    srcDoc={emailHtml}
                    sandbox="allow-popups allow-popups-to-escape-sandbox"
                    style={styles.bodyIframe}
                  />
                ) : (
                  <div style={{ padding: "20px", textAlign: "center", color: "#8b949e" }}>
                    Failed to render email content.
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const styles = {
  tabContainer: {
    display: "flex",
    flexDirection: "column" as const,
    height: "calc(100vh - 44px)",
    backgroundColor: "#080b10",
    color: "#c9d1d9",
    boxSizing: "border-box" as const,
    position: "relative" as const,
  },
  toast: {
    position: "absolute" as const,
    top: "12px",
    left: "50%",
    transform: "translateX(-50%)",
    backgroundColor: "#4f46e5",
    color: "#ffffff",
    padding: "6px 14px",
    borderRadius: "20px",
    fontSize: "11px",
    fontWeight: "bold",
    boxShadow: "0 4px 10px rgba(0,0,0,0.3)",
    zIndex: 1000,
  },
  topDashboard: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#0d1117",
    borderBottom: "1px solid #21262d",
    padding: "8px 12px",
    gap: "12px",
  },
  providerBadge: {
    backgroundColor: "#21262d",
    border: "1px solid #30363d",
    borderRadius: "12px",
    padding: "3px 10px",
    fontSize: "10px",
    fontWeight: "bold",
    color: "#e2e8f0",
  },
  emailGeneratorRow: {
    display: "flex",
    alignItems: "center",
    backgroundColor: "#080b10",
    border: "1px solid #21262d",
    borderRadius: "6px",
    padding: "2px",
    flex: 1,
    maxWidth: "480px",
  },
  emailInput: {
    flex: 1,
    background: "none",
    border: "none",
    color: "#38bdf8",
    fontSize: "11px",
    fontFamily: "monospace",
    fontWeight: "bold",
    padding: "4px 8px",
    cursor: "pointer",
    outline: "none",
  },
  btnIcon: {
    background: "none",
    border: "none",
    cursor: "pointer",
    padding: "4px 8px",
    fontSize: "12px",
    borderRadius: "4px",
    transition: "background 0.2s",
  },
  btnPrimary: {
    backgroundColor: "#4f46e5",
    color: "#ffffff",
    border: "none",
    borderRadius: "4px",
    padding: "4px 10px",
    fontSize: "10px",
    fontWeight: 600,
    cursor: "pointer",
    boxShadow: "0 2px 4px rgba(79, 229, 229, 0.2)",
    outline: "none",
  },
  btnSec: {
    backgroundColor: "#21262d",
    border: "1px solid #30363d",
    color: "#c9d1d9",
    borderRadius: "4px",
    padding: "3px 8px",
    fontSize: "9px",
    cursor: "pointer",
    outline: "none",
  },
  checkboxLabel: {
    display: "flex",
    alignItems: "center",
    fontSize: "10px",
    color: "#8b949e",
    cursor: "pointer",
    userSelect: "none" as const,
  },
  splitPane: {
    display: "flex",
    flex: 1,
    overflow: "hidden",
  },
  leftList: {
    width: "35%",
    borderRight: "1px solid #21262d",
    overflowY: "auto" as const,
    padding: "8px",
    boxSizing: "border-box" as const,
    backgroundColor: "#080b10",
  },
  rightViewer: {
    width: "65%",
    height: "100%",
    backgroundColor: "#0d1117",
    overflow: "hidden",
  },
  loaderCenter: {
    display: "flex",
    flexDirection: "column" as const,
    alignItems: "center",
    justifyContent: "center",
    height: "100%",
    padding: "40px 0",
  },
  spinner: {
    width: "20px",
    height: "20px",
    border: "2px solid rgba(79, 70, 229, 0.1)",
    borderTop: "2px solid #4f46e5",
    borderRadius: "50%",
    animation: "spin 1s linear infinite",
  },
  emptyInbox: {
    display: "flex",
    flexDirection: "column" as const,
    alignItems: "center",
    justifyContent: "center",
    height: "100%",
    padding: "20px",
    boxSizing: "border-box" as const,
  },
  pulseDot: {
    width: "8px",
    height: "8px",
    borderRadius: "50%",
    backgroundColor: "#10b981",
    boxShadow: "0 0 8px #10b981",
    animation: "pulse 1.8s infinite",
    marginBottom: "12px",
  },
  messageCard: {
    borderRadius: "6px",
    padding: "10px 12px",
    cursor: "pointer",
    transition: "all 0.2s",
    boxSizing: "border-box" as const,
  },
  senderText: {
    color: "#ffffff",
    fontWeight: "bold",
    fontSize: "11px",
    whiteSpace: "nowrap" as const,
    overflow: "hidden",
    textOverflow: "ellipsis",
    maxWidth: "140px",
  },
  dateText: {
    color: "#8b949e",
    fontSize: "9px",
  },
  subjectText: {
    color: "#e2e8f0",
    fontSize: "10px",
    marginTop: "4px",
    whiteSpace: "nowrap" as const,
    overflow: "hidden",
    textOverflow: "ellipsis",
  },
  emptyViewer: {
    display: "flex",
    flexDirection: "column" as const,
    alignItems: "center",
    justifyContent: "center",
    height: "100%",
  },
  viewerContainer: {
    display: "flex",
    flexDirection: "column" as const,
    height: "100%",
    boxSizing: "border-box" as const,
  },
  viewerHeader: {
    backgroundColor: "#161b22",
    borderBottom: "1px solid #21262d",
    padding: "12px 16px",
  },
  viewerSubject: {
    margin: "0 0 6px 0",
    fontSize: "14px",
    fontWeight: "bold",
    color: "#ffffff",
  },
  viewerSender: {
    fontSize: "10px",
    color: "#8b949e",
    marginTop: "2px",
  },
  bodyWrapper: {
    flex: 1,
    backgroundColor: "#ffffff",
    overflow: "hidden",
    position: "relative" as const,
  },
  bodyIframe: {
    width: "100%",
    height: "100%",
    border: "none",
  },
};
