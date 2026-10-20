import {
  Activity,
  ArrowUpRight,
  Battery,
  CheckCircle2,
  Clock3,
  MapPin,
  Shield,
  ShieldAlert,
  Users,
  Video,
  Mic,
  Square,
  Loader2,
} from "lucide-react";

import {
  useEffect,
  useRef,
  useState,
} from "react";

import { useNavigate } from "react-router-dom";

import {
  startEmergencyRecording,
} from "../../utils/emergencyRecorder";

import Header from "../../components/layout/Header";
import Sidebar from "../../components/layout/Sidebar";
import SOSButton from "../../components/common/SOSButton";
import Card from "../../components/common/Card";
import EmergencyStatus from "../../components/dashboard/EmergencyStatus";

import { useAuth } from "../../context/AuthContext";

const API_URL = (
  import.meta.env.VITE_API_URL ||
  "https://safeops-backend.onrender.com/api"
).replace(/\/+$/, "");

export default function Dashboard() {
  const { user } = useAuth();

  const [sosActive, setSosActive] =
    useState(false);

  const [recording, setRecording] =
    useState(false);

  const [saving, setSaving] =
    useState(false);
  const [currentLocation, setCurrentLocation] = useState(null);
  const [recordingTime, setRecordingTime] =
    useState(0);
  
  const [sosStatus, setSosStatus] = useState("");
  const [recordingStatus, setRecordingStatus] = useState("");
  const [telegramError, setTelegramError] = useState("");

  const [recordingError, setRecordingError] = useState("");

  const navigate = useNavigate();

  // =========================================================
  // DEVICE BATTERY
  // =========================================================

  const [battery, setBattery] =
    useState(null);

  const [charging, setCharging] =
    useState(false);

  // =========================================================
  // EMERGENCY CONTACTS
  // =========================================================

  const [emergencyContacts, setEmergencyContacts] =
    useState([]);

  const [contactsLoading, setContactsLoading] =
    useState(true);

  const recorderRef = useRef(null);

  // =========================================================
  // FORMAT TIME
  // =========================================================

  const formatTime = (seconds) => {
    const minutes =
      Math.floor(seconds / 60);

    const remainingSeconds =
      seconds % 60;

    return `${String(minutes).padStart(
      2,
      "0"
    )}:${String(
      remainingSeconds
    ).padStart(2, "0")}`;
  };

  const sendTelegramLocation = async () => {
    setTelegramError("");
    setSosStatus("Getting your current location...");

    // Step 1: Get GPS independently of Telegram.
    let position;

    try {
      if (!navigator.geolocation) {
        throw new Error("GPS location is not supported on this device.");
      }

      position = await new Promise((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 20000,
          maximumAge: 10000,
        });
      });
    } catch (error) {
      const messages = {
        1: "Location permission denied. Please allow location access.",
        2: "GPS location is unavailable. Check your device settings.",
        3: "GPS timed out. Please try again with location enabled.",
      };

      setSosStatus(
        messages[error.code] ||
          error.message ||
          "Unable to get your GPS location."
      );
      return false;
    }

    const latitude = position.coords.latitude;
    const longitude = position.coords.longitude;
    const mapsUrl = `https://www.google.com/maps?q=${latitude},${longitude}`;

    // Show the coordinates immediately, before contacting Telegram.
    setCurrentLocation({ latitude, longitude, mapsUrl });
    setSosStatus("Location found. Attempting to send the SOS alert...");

    const token = localStorage.getItem("safeops_token");

    if (!token) {
      setSosStatus(
        "Your location is shown below, but you need to log in again to send the alert."
      );
      return false;
    }

    // Step 2: Try Telegram separately.
    try {
      const response = await fetch(`${API_URL}/telegram/sos-location`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ latitude, longitude }),
      });

      const data = await response.json().catch(() => ({}));

      if (response.ok && data.success) {
        setSosStatus(
          data.locationPinSent === false
            ? "SOS text alert status reported by the server; the separate location pin could not be sent. Your coordinates are shown below."
            : data.message || "SOS alert sent successfully."
        );
        return true;
      }

      setSosStatus(
        "Your location is shown below, but the server could not confirm delivery of the SOS alert."
      );
      return false;
    } catch {
      // Never show raw network errors such as "fetch failed".
      setSosStatus(
        "Your location is shown below, but Telegram could not be reached. Please use the Maps link and contact your emergency contacts."
      );
      return false;
    }
  };

  // =========================================================
  // SOS ACTIVATION
  // =========================================================

  const handleSOS = async () => {
    console.log("SOS emergency activated");

    setSosActive(true);
    setSosStatus("Getting your location and starting recording...");
    setTelegramError("");
    setRecordingError("");
    setRecording(false);
    setSaving(false);
    setRecordingTime(0);

    // Get GPS location and send Telegram alert independently.
    void sendTelegramLocation();

    try {
      const recorder = await startEmergencyRecording({
        onStarted: () => {
          console.log("Emergency recording started");
          setRecording(true);
          setSaving(false);
          setRecordingTime(0);
          setRecordingStatus("Emergency recording active.");
        },

        onTimeUpdate: (seconds) => {
          setRecordingTime(seconds);
        },

        onSaving: () => {
          setRecording(false);
          setSaving(true);
          setRecordingStatus("Saving emergency recording...");
        },

        onSaved: (data) => {
          console.log("Emergency recording saved:", data);
          setRecording(false);
          setSaving(false);
          setRecordingStatus("Emergency recording saved successfully.");
        },

        onError: (message) => {
          console.error("Recording error:", message);
          setRecording(false);
          setSaving(false);
          setRecordingStatus("");
          setRecordingError(message);
        },
      });

      recorderRef.current = recorder;
    } catch (error) {
      console.error("Unable to start recording:", error);
      setRecording(false);
      setSaving(false);
      setRecordingError(
        error instanceof Error
          ? error.message
          : "Unable to start emergency recording."
      );
    }
  };

  // =========================================================
  // STOP RECORDING
  // =========================================================

  const stopEmergencyRecording = () => {
    console.log(
      "⏹ STOPPING DASHBOARD RECORDING"
    );

    if (recorderRef.current) {
      recorderRef.current.stop();

      recorderRef.current = null;

      setRecording(false);
      setSaving(true);
    }
  };

  // =========================================================
  // CLEANUP RECORDING
  // =========================================================

  useEffect(() => {
    return () => {
      if (recorderRef.current) {
        recorderRef.current.stop();

        recorderRef.current = null;
      }
    };
  }, []);

  // =========================================================
  // DEVICE BATTERY
  // =========================================================

  useEffect(() => {
    let batteryManager = null;

    const updateBattery = () => {
      if (!batteryManager) return;

      setBattery(
        Math.round(
          batteryManager.level * 100
        )
      );

      setCharging(
        batteryManager.charging
      );
    };

    const getBattery = async () => {
      try {
        if (!navigator.getBattery) {
          console.log(
            "Battery Status API is not supported."
          );

          return;
        }

        batteryManager =
          await navigator.getBattery();

        updateBattery();

        batteryManager.addEventListener(
          "levelchange",
          updateBattery
        );

        batteryManager.addEventListener(
          "chargingchange",
          updateBattery
        );
      } catch (error) {
        console.error(
          "Battery status error:",
          error
        );
      }
    };

    getBattery();

    return () => {
      if (!batteryManager) return;

      batteryManager.removeEventListener(
        "levelchange",
        updateBattery
      );

      batteryManager.removeEventListener(
        "chargingchange",
        updateBattery
      );
    };
  }, []);

  // =========================================================
  // EMERGENCY CONTACTS
  // =========================================================

  useEffect(() => {
    const loadEmergencyContacts =
      async () => {
        try {
          const token =
            localStorage.getItem(
              "safeops_token"
            );

          if (!token) {
            console.warn(
              "⚠️ No authentication token found."
            );

            setContactsLoading(false);

            return;
          }

          const API_URL = (
            import.meta.env.VITE_API_URL ||
            "https://safeops-backend.onrender.com/api"
          ).replace(/\/+$/, "");

          const response = await fetch(
            `${API_URL}/emergency-contacts`,
            {
              method: "GET",
              headers: {
                Authorization: `Bearer ${token}`,
              },
            }
          );

          if (!response.ok) {
            throw new Error(
              `Failed to load emergency contacts: ${response.status}`
            );
          }

          const data =
            await response.json();

          console.log(
            "📱 Emergency contacts:",
            data
          );

          const contacts =
            Array.isArray(data)
              ? data
              : Array.isArray(
                  data.contacts
                )
                ? data.contacts
                : [];

          setEmergencyContacts(
            contacts
          );
        } catch (error) {
          console.error(
            "❌ Failed to load emergency contacts:",
            error
          );

          setEmergencyContacts([]);
        } finally {
          setContactsLoading(false);
        }
      };

    loadEmergencyContacts();
  }, []);

  // =========================================================
  // RENDER
  // =========================================================

  return (
    <div className="dashboard-layout">

      <Header />

      <Sidebar />

      <main className="dashboard-main">
        <div className="dashboard-content">

          {/* =================================================
              WELCOME
          ================================================= */}

          <section className="dashboard-welcome">

            <div>

              <span className="eyebrow">
                PERSONAL SAFETY COMMAND CENTER
              </span>

              <h1>
                Good to see you,{" "}
                {user?.name?.split(" ")[0] ||
                  "there"}.
              </h1>

              <p>
                Your protection network is active.
                Everything is ready if you need help.
              </p>

            </div>

            <div className="dashboard-live">

              <span className="live-dot" />

              SYSTEM OPERATIONAL

            </div>

          </section>

          {/* =================================================
              EMERGENCY STATUS
          ================================================= */}

          <EmergencyStatus />

          {/* =================================================
              RECORDING ERROR
          ================================================= */}

          {recordingError && (
            <div className="auth-error" role="alert">
              <ShieldAlert size={18} />
              <span>{recordingError}</span>
            </div>
          )}

          {/* =================================================
              MAIN GRID
          ================================================= */}

          <section className="dashboard-grid">

            {/* =================================================
                SOS CARD
            ================================================= */}

            <Card className="dashboard-sos-card">
              <div className="card-header">
                <div>
                  <span className="eyebrow">
                    EMERGENCY RESPONSE
                  </span>
                  <h2>
                    {sosActive
                      ? "Emergency recording active"
                      : "Need immediate help?"}
                  </h2>
                </div>

                <div className="card-icon danger-icon">
                  <ShieldAlert size={21} />
                </div>

              </div>

              {/* SOS BUTTON */}
              {!sosActive && (
                <div className="dashboard-sos-area">
                  <SOSButton
                    onTriggered={handleSOS}
                  />

                </div>
              )}

              
              {/* TELEGRAM LOCATION STATUS */}
              {sosActive && sosStatus && (
                <div className="recording-saving" role="status">
                  {(sosStatus.includes("Getting") ||
                    sosStatus.includes("Sending")) && (
                    <Loader2 size={20} className="spin" />
                  )}

                  {sosStatus.includes("sent successfully") && (
                    <CheckCircle2 size={20} />
                  )}

                  {sosStatus.includes("failed") && (
                    <MapPin size={20} />
                  )}

                  <span>{sosStatus}</span>
                </div>
              )}

              {currentLocation && (
                <div className="recording-saving" role="status">
                  <MapPin size={20} />
                    <div>
                      <strong>Your current location</strong>
                      <p>
                        Latitude: {currentLocation.latitude.toFixed(6)}
                      </p>
                      <p>
                        Longitude: {currentLocation.longitude.toFixed(6)}
                      </p>
                      <a
                        href={currentLocation.mapsUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        Open location in Google Maps
                      </a>
                    </div>
                  </div>
                )
              }

              {/* RECORDING STATUS */}
              {sosActive && recordingStatus && (
                <div className="recording-saving" role="status">
                  {(saving ||
                    recordingStatus.includes("Starting")) && (
                    <Loader2 size={20} className="spin" />
                  )}

                  {recordingStatus.includes("saved successfully") && (
                    <CheckCircle2 size={20} />
                  )}

                  <span>{recordingStatus}</span>
                </div>
              )}

              {/* RECORDING PANEL */}

              {recording && (
                <div className="recording-panel">
                  <div className="recording-status">
                    <span className="recording-dot" />
                    <strong>
                      RECORDING
                    </strong>
                  </div>

                  <div className="recording-time">
                    {formatTime(
                      recordingTime
                    )}
                  </div>

                  <div className="recording-limit">
                    Maximum recording: 30:00
                  </div>

                  <div className="recording-features">
                    <span>
                      <Video size={16} />
                      Video
                    </span>

                    <span>
                      <Mic size={16} />
                      Audio
                    </span>

                  </div>

                  <button
                    className="cancel-sos-button"
                    onClick={
                      stopEmergencyRecording
                    }
                  >

                    <Square size={17} />

                    Stop & Save

                  </button>

                </div>
              )}

              {/* SOS INFORMATION */}

              <div className="sos-info">

                <div>

                  <CheckCircle2 size={16} />

                  <span>Emergency alerts attempted when available</span>

                </div>

                <div>

                  <MapPin size={16} />

                  <span>
                    GPS location sent to Telegram when available
                  </span>

                </div>

                <div>

                  <Clock3 size={16} />

                  <span>
                    Target dispatch time: under 5 sec
                  </span>

                </div>

              </div>

            </Card>

            {/* =================================================
                SECURITY NETWORK
            ================================================= */}

            <Card className="network-card">

              <div className="card-header">

                <div>

                  <span className="eyebrow">
                    SAFETY NETWORK
                  </span>

                  <h2>
                    Your protection network
                  </h2>

                </div>

                <div className="card-icon">

                  <Users size={21} />

                </div>

              </div>

              {/* CONTACT COUNT */}

              <div className="network-stat">

                <div className="network-number">

                  {contactsLoading
                    ? "..."
                    : emergencyContacts.length}

                </div>

                <div>

                  <strong>
                    Verified emergency contacts
                  </strong>

                  <span>
                    Ready to receive alerts
                  </span>

                </div>

                <ArrowUpRight size={18} />

              </div>

              {/* CONTACT LIST */}

              <div className="contact-list">

                {contactsLoading && (
                  <div className="contact-row">

                    <div>

                      <strong>
                        Loading contacts...
                      </strong>

                      <span>
                        Fetching your emergency network
                      </span>

                    </div>

                  </div>
                )}

                {!contactsLoading &&
                  emergencyContacts.length ===
                    0 && (
                    <div className="contact-row">

                      <div>

                        <strong>
                          No emergency contacts
                        </strong>

                        <span>
                          Add a trusted contact to your network.
                        </span>

                      </div>

                    </div>
                  )}

                {!contactsLoading &&
                  emergencyContacts
                    .slice(0, 3)
                    .map((contact) => {

                      const name =
                        contact.name ||
                        "Emergency Contact";

                      const initial =
                        name
                          .charAt(0)
                          .toUpperCase();

                      return (
                        <div
                          className="contact-row"
                          key={contact.id}
                        >

                          <div className="contact-avatar">

                            {initial}

                          </div>

                          <div>

                            <strong>
                              {name}
                            </strong>

                            <span>
                              {contact.relation ||
                                "Emergency contact"}
                            </span>

                          </div>

                          <span className="online-status">

                            Ready

                          </span>

                        </div>
                      );
                    })}

              </div>

              {/* MANAGE CONTACTS */}

              <button
                className="outline-action"
                onClick={() => navigate("/dashboard/contacts")}
              >
                Manage Emergency Contacts
                <ArrowUpRight size={16} />
              </button>

            </Card>

          </section>

          {/* =================================================
              LIVE SYSTEM METRICS
          ================================================= */}

          <section className="metrics-grid">

            {/* NETWORK */}

            <Card className="metric-card">

              <div className="metric-icon blue">

                <Activity size={20} />

              </div>

              <div className="metric-content">

                <span>
                  NETWORK STATUS
                </span>

                <strong>
                  Connected
                </strong>

                <small>
                  All systems operational
                </small>

              </div>

              <CheckCircle2
                size={18}
                className="metric-success"
              />

            </Card>

            {/* LOCATION */}

            <Card className="metric-card">

              <div className="metric-icon green">

                <MapPin size={20} />

              </div>

              <div className="metric-content">

                <span>
                  LOCATION
                </span>

                <strong>
                  Protected
                </strong>

                <small>
                  Location ready for emergency
                </small>

              </div>

              <CheckCircle2
                size={18}
                className="metric-success"
              />

            </Card>

            {/* SECURITY */}

            <Card className="metric-card">

              <div className="metric-icon purple">

                <Shield size={20} />

              </div>

              <div className="metric-content">

                <span>
                  SECURITY
                </span>

                <strong>
                  Encrypted
                </strong>

                <small>
                  End-to-end protection enabled
                </small>

              </div>

              <CheckCircle2
                size={18}
                className="metric-success"
              />

            </Card>

            {/* BATTERY */}

            <Card className="metric-card">

              <div className="metric-icon orange">

                <Battery size={20} />

              </div>

              <div className="metric-content">

                <span>
                  DEVICE
                </span>

                <strong>
                  {battery !== null
                    ? `${battery}%`
                    : "Unavailable"}
                </strong>

                <small>
                  {charging
                    ? "Charging"
                    : "Battery level"}
                </small>

              </div>

            </Card>

          </section>

          {/* =================================================
              RECENT ACTIVITY
          ================================================= */}

          <Card className="activity-card">

            <div className="card-header">

              <div>

                <span className="eyebrow">
                  SECURITY ACTIVITY
                </span>

                <h2>
                  Recent activity
                </h2>

              </div>

              <span className="activity-live">
                LIVE
              </span>

            </div>

            <div className="activity-list">

              {/* ACTIVITY 1 */}

              <div className="activity-row">

                <div className="activity-icon success">

                  <CheckCircle2 size={17} />

                </div>

                <div className="activity-text">

                  <strong>
                    Protection network connected
                  </strong>

                  <span>
                    All emergency services are ready
                  </span>

                </div>

                <time>
                  Just now
                </time>

              </div>

              {/* ACTIVITY 2 */}

              <div className="activity-row">

                <div className="activity-icon blue">

                  <MapPin size={17} />

                </div>

                <div className="activity-text">

                  <strong>
                    Location protection enabled
                  </strong>

                  <span>
                    GPS location sharing is available for SOS alerts
                  </span>

                </div>

                <time>
                  2 min ago
                </time>

              </div>

              {/* ACTIVITY 3 */}

              <div className="activity-row">

                <div className="activity-icon purple">
                  <Shield size={17} />
                </div>

                <div className="activity-text">
                  <strong>
                    Security check completed
                  </strong>

                  <span>
                    Account and device protection verified
                  </span>
                </div>

                <time>
                  5 min ago
                </time>
              </div>
            </div>
          </Card>
        </div>
      </main>

    </div>
  );
}