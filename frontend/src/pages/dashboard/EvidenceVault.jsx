
import { useCallback, useEffect, useRef, useState } from "react";
import {
  CheckCircle2,
  FileAudio,
  FileText,
  FileVideo,
  FolderLock,
  Lock,
  MoreVertical,
  Upload,
  X,
  RefreshCw,
  AlertCircle,
} from "lucide-react";

import Header from "../../components/layout/Header";
import Sidebar from "../../components/layout/Sidebar";
import Card from "../../components/common/Card";

const API_URL = (
  import.meta.env.VITE_API_URL ||
  "https://safeops-backend.onrender.com/api"
).replace(/\/+$/, "");

function EvidenceIcon({ type }) {
  if (type === "video") return <FileVideo size={22} />;
  if (type === "audio") return <FileAudio size={22} />;
  return <FileText size={22} />;
}

function getFileType(item) {
  const value = `${item.title || ""} ${item.fileUrl || ""}`.toLowerCase();

  if (/\.(mp4|webm|mov|avi|mkv)(\?|$)/i.test(value)) {
    return "video";
  }

  if (/\.(mp3|wav|ogg|m4a)(\?|$)/i.test(value)) {
    return "audio";
  }

  if (/\.(png|jpe?g|gif|webp)(\?|$)/i.test(value)) {
    return "image";
  }

  return "document";
}

export default function EvidenceVault() {
  const fileInputRef = useRef(null);

  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [showUpload, setShowUpload] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const [uploadMessage, setUploadMessage] = useState("");

  const getToken = () => localStorage.getItem("safeops_token");

  const loadEvidence = useCallback(async () => {
    setLoading(true);
    setLoadError("");

    try {
      const token = getToken();

      if (!token) {
        throw new Error("Please log in to view your evidence.");
      }

      const response = await fetch(`${API_URL}/evidence`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Failed to load evidence.");
      }

      setFiles(
        (data.evidence || []).map((item) => ({
          id: item.id,
          name: item.title || "Emergency evidence",
          description: item.description || "",
          fileUrl: item.fileUrl,
          type: getFileType(item),
          date: item.createdAt
            ? new Date(item.createdAt).toLocaleString()
            : "Date unavailable",
          // Do not claim encryption until the backend performs it.
          encrypted: item.encrypted === true,
        }))
      );
    } catch (error) {
      setLoadError(error.message || "Unable to load evidence.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadEvidence();
  }, [loadEvidence]);

  const handleFiles = async (event) => {
    const selectedFiles = Array.from(event.target.files || []);
    event.target.value = "";

    if (!selectedFiles.length) return;

    setUploading(true);
    setUploadError("");
    setUploadMessage("");

    try {
      const token = getToken();

      if (!token) {
        throw new Error("Please log in before uploading evidence.");
      }

      for (const file of selectedFiles) {
        const formData = new FormData();
        formData.append("video", file);
        formData.append("title", file.name);
        formData.append("description", "Uploaded to Evidence Vault");

        const response = await fetch(`${API_URL}/evidence`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: formData,
        });

        const data = await response.json();

        if (!response.ok || !data.success) {
          throw new Error(data.message || `Upload failed for ${file.name}.`);
        }
      }

      setUploadMessage("Evidence uploaded successfully.");
      setShowUpload(false);
      await loadEvidence();
    } catch (error) {
      setUploadError(error.message || "Evidence upload failed.");
    } finally {
      setUploading(false);
    }
  };

  const openEvidence = (file) => {
    if (!file.fileUrl) {
      setLoadError("This evidence does not have a file URL.");
      return;
    }

    // Use the configured API origin to resolve the stored upload path.
    const apiOrigin = API_URL.replace(/\/api\/?$/, "");
    const url = file.fileUrl.startsWith("http")
      ? file.fileUrl
      : `${apiOrigin}${file.fileUrl.startsWith("/") ? "" : "/"}${file.fileUrl}`;

    window.open(url, "_blank", "noopener,noreferrer");
  };

  return (
    <div className="dashboard-layout">
      <Header />
      <Sidebar />

      <main className="dashboard-main">
        <div className="dashboard-content">
          <div className="page-title-row">
            <div>
              <span className="eyebrow">SECURE STORAGE</span>
              <h1>Evidence Vault</h1>
              <p>Securely store emergency evidence and important incident files.</p>
            </div>

            <button
              type="button"
              className="btn btn-primary"
              onClick={() => {
                setUploadError("");
                setUploadMessage("");
                setShowUpload(true);
              }}
            >
              <Upload size={18} />
              Upload Evidence
            </button>
          </div>

          <Card className="vault-security">
            <div className="vault-lock">
              <Lock size={22} />
            </div>

            <div>
              <strong>Your evidence is stored in your account</strong>
              <span>
                Only evidence returned by your authenticated account is displayed.
              </span>
            </div>

            <div className="vault-encrypted">
              <CheckCircle2 size={15} />
              ACCOUNT PROTECTED
            </div>
          </Card>

          <Card className="storage-card">
            <div className="storage-header">
              <div>
                <span>RECORDS SAVED</span>
                <strong>{files.length} files</strong>
              </div>

              <button
                type="button"
                className="evidence-menu"
                onClick={loadEvidence}
                disabled={loading}
                aria-label="Refresh evidence"
              >
                <RefreshCw size={16} />
              </button>
            </div>

            <div className="storage-bar">
              <div
                style={{
                  width: `${Math.min((files.length / 100) * 100, 100)}%`,
                }}
              />
            </div>
            <span>Showing your saved evidence, newest first.</span>
          </Card>

          {uploadMessage && (
            <p role="status">{uploadMessage}</p>
          )}

          {loadError && (
            <div role="alert" className="upload-note">
              <AlertCircle size={16} />
              <span>{loadError}</span>
              <button type="button" onClick={loadEvidence}>
                Retry
              </button>
            </div>
          )}

          <div className="evidence-list">
            {loading && <p>Loading your evidence...</p>}

            {!loading && !loadError && files.length === 0 && (
              <Card className="evidence-row">
                <div className="evidence-info">
                  <strong>No evidence saved yet</strong>
                  <span>Your SOS recordings will appear here after they are successfully uploaded.</span>
                </div>
              </Card>
            )}

            {!loading && files.map((file) => (
              <Card className="evidence-row" key={file.id}>
                <div className={`evidence-icon ${file.type}`}>
                  <EvidenceIcon type={file.type} />
                </div>

                <div className="evidence-info">
                  <strong>{file.name}</strong>
                  <span>{file.date}</span>
                  {file.description && <span>{file.description}</span>}
                </div>

                <div className="evidence-secure">
                  <Lock size={13} />
                  {file.encrypted ? "Encrypted" : "Encryption not verified"}
                </div>

                <button
                  type="button"
                  className="evidence-menu"
                  onClick={() => openEvidence(file)}
                  aria-label={`Open ${file.name}`}
                  title="Open evidence"
                >
                  <MoreVertical size={18} />
                </button>
              </Card>
            ))}
          </div>

          <button
            type="button"
            className="vault-upload-area"
            onClick={() => {
              setUploadError("");
              setUploadMessage("");
              setShowUpload(true);
            }}
          >
            <div><FolderLock size={28} /></div>
            <strong>Add secure evidence</strong>
            <span>Upload photos, videos, audio or documents</span>
          </button>
        </div>
      </main>

      {showUpload && (
        <div
          className="modal-backdrop"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget && !uploading) {
              setShowUpload(false);
            }
          }}
        >
          <div className="modal-card upload-modal">
            <div className="modal-header">
              <div>
                <span className="eyebrow">EVIDENCE VAULT</span>
                <h2>Upload evidence</h2>
              </div>

              <button
                type="button"
                className="modal-close"
                disabled={uploading}
                onClick={() => setShowUpload(false)}
              >
                <X size={19} />
              </button>
            </div>

            <button
              type="button"
              className="file-drop-zone"
              disabled={uploading}
              onClick={() => fileInputRef.current?.click()}
            >
              <div><Upload size={25} /></div>
              <strong>{uploading ? "Uploading..." : "Choose files"}</strong>
              <span>Photos, videos, audio and documents</span>
            </button>

            <input
              ref={fileInputRef}
              type="file"
              multiple
              hidden
              accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.txt"
              disabled={uploading}
              onChange={handleFiles}
            />

            {uploadError && (
              <p role="alert" className="upload-note">
                <AlertCircle size={16} />
                {uploadError}
              </p>
            )}

            <div className="upload-note">
              <Lock size={14} />
              <span>
                Files are uploaded to your account. Actual encryption must be implemented and verified on the backend before files can be labelled encrypted.
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
