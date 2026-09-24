import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useParams, useSearchParams, useNavigate, Link } from "react-router-dom";
import axios from "axios";
import { GoogleLogin } from "@react-oauth/google";
import { API_BASE_URL } from "../../config";
import {
  FaVideo, FaUpload, FaPlay, FaPause, FaRedo, FaCheck,
  FaTimes, FaCamera, FaSyncAlt, FaSlidersH, FaBolt,
  FaLock, FaArrowLeft, FaEye, FaCopy, FaCheckCircle,
  FaLightbulb, FaInstagram, FaYoutube, FaShareAlt, FaMobileAlt,
  FaShieldAlt, FaStar, FaClock, FaCheckDouble,
  FaThumbsUp, FaMoneyBillWave, FaHeadset, FaVolumeUp,
  FaWhatsapp, FaFire, FaExternalLinkAlt, FaRobot
} from "react-icons/fa";

export default function CreatorStudioPage() {
  const { promptId } = useParams();
  const [searchParams] = useSearchParams();
  const referrerUserId = searchParams.get("ref") || "";
  const navigate = useNavigate();

  // Script Data State
  const [prompt, setPrompt] = useState(null);
  const [loadingPrompt, setLoadingPrompt] = useState(true);
  const [errorPrompt, setErrorPrompt] = useState("");

  // Flow View: "landing" (Task Brief Landing Page) | "camera" (Teleprompter Studio) | "upload" (File Picker)
  const [currentView, setCurrentView] = useState("landing");

  // Modal State for "View Script"
  const [showViewScriptModal, setShowViewScriptModal] = useState(false);

  // Copy Feedback
  const [copiedScript, setCopiedScript] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  // Camera & MediaRecorder State
  const videoRef = useRef(null);
  const mediaStreamRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const recordedChunksRef = useRef([]);

  const [cameraActive, setCameraActive] = useState(false);
  const [cameraFacing, setCameraFacing] = useState("user");
  const [recording, setRecording] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [recordSeconds, setRecordSeconds] = useState(0);
  const timerIntervalRef = useRef(null);

  // Recorded Preview State
  const [recordedBlob, setRecordedBlob] = useState(null);
  const [previewUrl, setPreviewUrl] = useState("");

  // Teleprompter Controls in Studio
  const [fontSize, setFontSize] = useState(20);
  const [scrollSpeed, setScrollSpeed] = useState(2);
  const [showPrompter, setShowPrompter] = useState(true);
  const [teleprompterPlaying, setTeleprompterPlaying] = useState(false);
  const prompterBoxRef = useRef(null);
  const scrollAnimRef = useRef(null);

  // File Upload State
  const [selectedFile, setSelectedFile] = useState(null);
  const fileInputRef = useRef(null);

  // Submission State
  const [note, setNote] = useState("");
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [submittedVideoId, setSubmittedVideoId] = useState(null);

  // Claim Modal State
  const [showClaimModal, setShowClaimModal] = useState(false);
  const [claimTab, setClaimTab] = useState("google");
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [authError, setAuthError] = useState("");
  const [authLoading, setAuthLoading] = useState(false);

  // Guest Session ID
  const [guestSessionId] = useState(() => {
    let sess = localStorage.getItem("ugc_guest_session_id");
    if (!sess) {
      sess = "sess_" + Math.random().toString(36).substring(2, 12) + "_" + Date.now();
      localStorage.setItem("ugc_guest_session_id", sess);
    }
    return sess;
  });

  // ── 1. Fetch Public Script Details ─────────────────────────────────────────
  useEffect(() => {
    let isMounted = true;
    const fetchPrompt = async () => {
      setLoadingPrompt(true);
      setErrorPrompt("");
      try {
        const { data } = await axios.get(
          `${API_BASE_URL}/api/ugc-prompter/public-view/${promptId}`
        );
        if (isMounted) {
          setPrompt(data.prompt);
        }
      } catch (err) {
        if (isMounted) {
          setErrorPrompt(
            err.response?.data?.message || "Failed to load script. It may be private or deleted."
          );
        }
      } finally {
        if (isMounted) setLoadingPrompt(false);
      }
    };
    if (promptId) fetchPrompt();
    return () => { isMounted = false; };
  }, [promptId]);

  // ── 2. Camera Management ───────────────────────────────────────────────────
  const startCamera = useCallback(async () => {
    try {
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      }
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: cameraFacing,
          width: { ideal: 1080 },
          height: { ideal: 1920 },
        },
        audio: true,
      });
      mediaStreamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play().catch(() => {});
      }
      setCameraActive(true);
    } catch (err) {
      console.error("Camera access failed:", err);
      alert("Please allow camera and microphone permissions to record your video.");
      setCameraActive(false);
    }
  }, [cameraFacing]);

  const stopCamera = useCallback(() => {
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      mediaStreamRef.current = null;
    }
    setCameraActive(false);
  }, []);

  useEffect(() => {
    if (currentView === "camera" && !previewUrl) {
      startCamera();
    } else {
      stopCamera();
    }
    return () => stopCamera();
  }, [currentView, previewUrl, startCamera, stopCamera]);

  const toggleCameraFacing = () => {
    setCameraFacing((prev) => (prev === "user" ? "environment" : "user"));
  };

  // ── 3. Teleprompter Auto-Scroll in Camera Studio ───────────────────────────
  useEffect(() => {
    if (!teleprompterPlaying || !prompterBoxRef.current) {
      if (scrollAnimRef.current) cancelAnimationFrame(scrollAnimRef.current);
      return;
    }
    const box = prompterBoxRef.current;
    let lastTime = performance.now();

    const scrollStep = (now) => {
      const delta = (now - lastTime) / 1000;
      lastTime = now;
      box.scrollTop += scrollSpeed * 28 * delta;
      if (box.scrollTop + box.clientHeight >= box.scrollHeight - 5) {
        setTeleprompterPlaying(false);
      } else {
        scrollAnimRef.current = requestAnimationFrame(scrollStep);
      }
    };

    scrollAnimRef.current = requestAnimationFrame(scrollStep);
    return () => {
      if (scrollAnimRef.current) cancelAnimationFrame(scrollAnimRef.current);
    };
  }, [teleprompterPlaying, scrollSpeed]);

  // ── 4. Recording Flow ──────────────────────────────────────────────────────
  const handleStartCountdown = () => {
    if (!cameraActive) {
      startCamera();
      return;
    }
    setCountdown(3);
    const countInterval = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(countInterval);
          startRecordingActual();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const startRecordingActual = () => {
    if (!mediaStreamRef.current) return;
    recordedChunksRef.current = [];
    try {
      const mimeTypes = [
        "video/webm;codecs=vp9,opus",
        "video/webm;codecs=vp8,opus",
        "video/webm",
        "video/mp4",
      ];
      let selectedMime = mimeTypes.find((m) => MediaRecorder.isTypeSupported(m)) || "";

      const options = selectedMime ? { mimeType: selectedMime } : {};
      const recorder = new MediaRecorder(mediaStreamRef.current, options);

      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          recordedChunksRef.current.push(e.data);
        }
      };

      recorder.onstop = () => {
        const blob = new Blob(recordedChunksRef.current, {
          type: selectedMime || "video/webm",
        });
        setRecordedBlob(blob);
        const url = URL.createObjectURL(blob);
        setPreviewUrl(url);
        stopCamera();
        setRecording(false);
        setTeleprompterPlaying(false);
      };

      mediaRecorderRef.current = recorder;
      recorder.start(500);
      setRecording(true);
      setRecordSeconds(0);
      setTeleprompterPlaying(true);

      timerIntervalRef.current = setInterval(() => {
        setRecordSeconds((sec) => {
          const nextSec = sec + 1;
          const maxDur = (prompt?.duration || 30) + 5;
          if (nextSec >= maxDur) {
            handleStopRecording();
          }
          return nextSec;
        });
      }, 1000);
    } catch (err) {
      console.error("Recording start error:", err);
      alert("Failed to start recorder: " + err.message);
    }
  };

  const handleStopRecording = () => {
    if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stop();
    }
    setRecording(false);
    setTeleprompterPlaying(false);
  };

  const handleRetake = () => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    setPreviewUrl("");
    setRecordedBlob(null);
    setRecordSeconds(0);
    if (prompterBoxRef.current) prompterBoxRef.current.scrollTop = 0;
    startCamera();
  };

  // ── 5. File Upload Select ──────────────────────────────────────────────────
  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith("video/")) {
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
      setRecordedBlob(file);
    } else {
      alert("Please choose a valid video file (MP4, WebM, MOV).");
    }
  };

  // ── 6. Guest Submission to Cloudflare R2 ───────────────────────────────────
  const handleFinalSubmit = async () => {
    const videoData = recordedBlob;
    if (!videoData) {
      alert("Please record or select a video first.");
      return;
    }

    setUploading(true);
    setUploadProgress(5);

    try {
      const fileName =
        selectedFile?.name ||
        `recorded_creator_${Date.now()}.${videoData.type?.includes("mp4") ? "mp4" : "webm"}`;
      const contentType = videoData.type || "video/mp4";

      // 1. Get Presigned Upload URL for guest
      const urlRes = await axios.post(`${API_BASE_URL}/api/ugc-video/guest-upload-url`, {
        promptId,
        fileName,
        contentType,
        guestSessionId,
      });

      const { uploadUrl, key } = urlRes.data;
      setUploadProgress(20);

      // 2. Upload video bytes to R2
      await axios.put(uploadUrl, videoData, {
        headers: { "Content-Type": contentType },
        onUploadProgress: (e) => {
          if (e.total) {
            const pct = 20 + Math.round((e.loaded / e.total) * 65);
            setUploadProgress(Math.min(pct, 85));
          }
        },
      });

      setUploadProgress(90);

      // 3. Submit video record in backend
      const submitRes = await axios.post(`${API_BASE_URL}/api/ugc-video/guest-submit`, {
        promptId,
        videoKey: key,
        note,
        guestSessionId,
        referrerUserId,
      });

      setUploadProgress(100);
      setSubmittedVideoId(submitRes.data?.video?._id);
      setShowClaimModal(true);
    } catch (err) {
      console.error("Submission failed:", err);
      alert(err.response?.data?.message || "Failed to submit video. Please try again.");
    } finally {
      setUploading(false);
    }
  };

  // ── 7. Claim Handshake on Login / Register ─────────────────────────────────
  const handleClaimSuccess = async (token) => {
    try {
      await axios.post(
        `${API_BASE_URL}/api/ugc-video/claim`,
        { guestSessionId, guestVideoId: submittedVideoId },
        { headers: { Authorization: `Bearer ${token}` } }
      );
    } catch (err) {
      console.warn("Claim notice:", err?.response?.data?.message || err.message);
    }
    localStorage.setItem("userDashboardActiveTab", "UGC Prompter");
    navigate("/user");
  };

  const handleGoogleSuccess = async (credentialResponse) => {
    setAuthLoading(true);
    setAuthError("");
    try {
      const res = await axios.post(`${API_BASE_URL}/api/mobile/user/google-auth`, {
        token: credentialResponse.credential,
      });
      const loginData = res.data;
      const user = loginData.user || {};
      const token = loginData.token;

      localStorage.setItem("mobileUserToken", token);
      localStorage.setItem("mobileUserData", JSON.stringify({
        role: "mobileuser",
        name: user.name,
        email: user.email,
        clientId: user.clientId || "",
        userId: user._id || user.id,
      }));

      await handleClaimSuccess(token);
    } catch (err) {
      setAuthError(err.response?.data?.message || "Google authentication failed.");
    } finally {
      setAuthLoading(false);
    }
  };

  const handleManualLogin = async (e) => {
    e.preventDefault();
    setAuthLoading(true);
    setAuthError("");
    try {
      const res = await axios.post(`${API_BASE_URL}/api/mobile/user/login`, {
        email: loginEmail,
        password: loginPassword,
      });
      const data = res.data;
      const token = data.token;
      const user = data.user || {};

      localStorage.setItem("mobileUserToken", token);
      localStorage.setItem("mobileUserData", JSON.stringify({
        role: "mobileuser",
        name: user.name,
        email: user.email,
        clientId: user.clientId || "",
        userId: user._id || user.id,
      }));

      await handleClaimSuccess(token);
    } catch (err) {
      setAuthError(err.response?.data?.message || "Login failed. Check email and password.");
    } finally {
      setAuthLoading(false);
    }
  };

  // Copy Handlers & WhatsApp Share
  const handleCopyScript = () => {
    const text = `${prompt?.title}\n\nCategory: ${prompt?.category}\nDuration: ${prompt?.duration}s\nTone: ${prompt?.tone}\n\n${prompt?.script || prompt?.prompt || ""}`;
    navigator.clipboard.writeText(text);
    setCopiedScript(true);
    setTimeout(() => setCopiedScript(false), 2000);
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleShareWhatsApp = () => {
    const shareUrl = window.location.href;
    const msg = `🔥 Shoot this quick 30s UGC Video & earn rewards!\n\n📌 Task: ${prompt?.title}\n⏱ Duration: ${prompt?.duration || 30}s\n🎬 Open in-browser teleprompter:\n${shareUrl}`;
    window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(msg)}`, "_blank");
  };

  // Script Processing Metrics
  const rawScript = prompt?.script || prompt?.prompt || "";
  const wordCount = useMemo(() => {
    return rawScript.trim().split(/\s+/).filter(Boolean).length;
  }, [rawScript]);

  // ── Render Loading & Error States ──────────────────────────────────────────
  if (loadingPrompt) {
    return (
      <div className="min-h-screen bg-[#07090e] flex flex-col items-center justify-center text-white p-6 font-sans">
        <div className="relative w-16 h-16 mb-5">
          <div className="absolute inset-0 rounded-full border-4 border-orange-500/20 border-t-orange-500 animate-spin" />
          <div className="absolute inset-2 rounded-full border-4 border-amber-400/20 border-b-amber-400 animate-spin" style={{ animationDirection: "reverse", animationDuration: "1.2s" }} />
        </div>
        <h2 className="text-xl font-black tracking-tight text-white">Loading Creator Opportunity...</h2>
        <p className="text-xs text-slate-400 mt-1">Preparing verified brief, script & teleprompter studio</p>
      </div>
    );
  }

  if (errorPrompt || !prompt) {
    return (
      <div className="min-h-screen bg-[#07090e] flex flex-col items-center justify-center text-white p-6 text-center font-sans">
        <div className="w-18 h-18 rounded-3xl bg-red-500/10 text-red-400 flex items-center justify-center text-3xl mb-4 border border-red-500/20 shadow-2xl">
          <FaLock />
        </div>
        <h2 className="text-3xl font-black text-white mb-2">Campaign Expired or Private</h2>
        <p className="text-slate-400 max-w-md text-sm mb-6 leading-relaxed">
          {errorPrompt || "This UGC task is not currently open for public submissions. Please contact the brand or administrator."}
        </p>
        <button
          onClick={() => navigate("/landingpage")}
          className="px-7 py-3.5 rounded-2xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 text-white font-black text-sm transition shadow-lg shadow-orange-500/25"
        >
          Explore YovoAI Platform
        </button>
      </div>
    );
  }

  const targetDuration = prompt.duration || 30;
  const progressRatio = Math.min(100, Math.round((recordSeconds / targetDuration) * 100));

  // ═══════════════════════════════════════════════════════════════════════════
  // VIEW 1: CREATOR CAMPAIGN LANDING PAGE
  // ═══════════════════════════════════════════════════════════════════════════
  if (currentView === "landing") {
    return (
      <div className="min-h-screen bg-[#07080d] text-slate-100 flex flex-col selection:bg-orange-500 selection:text-white font-sans antialiased overflow-x-hidden relative">

        {/* Ambient Gradient Glow Lights */}
        <div className="fixed top-0 left-1/4 w-[700px] h-[400px] bg-gradient-to-tr from-orange-600/15 via-amber-500/10 to-transparent blur-[160px] pointer-events-none z-0" />
        <div className="fixed bottom-1/3 right-1/4 w-[600px] h-[350px] bg-gradient-to-bl from-purple-600/12 to-transparent blur-[150px] pointer-events-none z-0" />

        {/* ══ STICKY HEADER (REAL YOVOAI LOGO + LOGIN / REGISTER) ══ */}
        <header className="h-20 shrink-0 bg-[#07080d]/90 backdrop-blur-2xl border-b border-white/[0.08] px-4 sm:px-10 flex items-center justify-between sticky top-0 z-40">
          
          {/* Real YovoAI Logo from /landingpage */}
          <Link to="/landingpage" className="flex items-center gap-3 group">
            <img
              src="/Yovoai-logo.jpg"
              alt="YovoAI Logo"
              className="w-9 h-9 rounded-xl object-contain shadow-md border border-white/10 group-hover:scale-105 transition-transform"
            />
            <div className="flex items-center gap-2">
              <span className="font-black text-xl text-white tracking-tight">
                Yovo<span className="text-orange-500">AI</span>
              </span>
              <span className="text-[10px] font-extrabold uppercase tracking-widest px-2.5 py-0.5 rounded-full bg-orange-500/15 text-orange-400 border border-orange-500/30 hidden sm:inline-block">
                Creator Portal
              </span>
            </div>
          </Link>

          {/* Header Action: Login & Registration Buttons */}
          <div className="flex items-center gap-2.5 sm:gap-3">
            <Link
              to="/user/login"
              className="px-4 py-2 rounded-xl text-xs sm:text-sm font-bold text-slate-300 hover:text-white hover:bg-white/[0.08] border border-transparent hover:border-white/10 transition"
            >
              Login
            </Link>

            <Link
              to="/user/login"
              className="px-4 py-2 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs sm:text-sm shadow-md shadow-orange-500/25 transition hover:scale-105"
            >
              Register
            </Link>

            <button
              onClick={() => setCurrentView("camera")}
              className="hidden md:flex items-center gap-2 px-4 py-2 rounded-xl bg-white/[0.08] hover:bg-white/[0.14] border border-white/15 text-white font-bold text-xs sm:text-sm transition"
            >
              <FaCamera size={12} className="text-orange-400" />
              <span>Record</span>
            </button>
          </div>
        </header>

        {/* ══ MAIN PAGE CONTENT ══ */}
        <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-8 py-6 sm:py-10 space-y-12 relative z-10">

          {/* ── 1. HERO SECTION (PITCH + SMARTPHONE PREVIEW) ─────────────── */}
          <section className="relative rounded-[36px] bg-gradient-to-b from-[#111420]/90 via-[#0c0f17]/90 to-[#080a10] border border-white/[0.1] p-6 sm:p-8 lg:p-10 shadow-2xl overflow-hidden backdrop-blur-xl">
            <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-gradient-to-bl from-orange-500/20 via-amber-500/10 to-transparent rounded-full blur-3xl pointer-events-none" />

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-center">

              {/* LEFT COLUMN: Pitch, Badges, CTAs */}
              <div className="lg:col-span-7 space-y-4 sm:space-y-5">
                <div className="flex flex-wrap items-center gap-2.5">
                  <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-orange-500/15 border border-orange-500/30 text-orange-400 text-xs font-black tracking-wide">
                    <span className="w-2 h-2 rounded-full bg-orange-500 animate-ping" />
                    SPONSORED UGC CAMPAIGN • OPEN FOR SUBMISSION
                  </div>
                  <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/[0.05] border border-white/10 text-xs font-bold text-slate-300">
                    <FaCheckCircle className="text-emerald-400" size={12} />
                    <span>{prompt.brandName || "Featured Brand Partner"}</span>
                  </div>
                </div>

                <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black text-white tracking-tight leading-[1.12]">
                  Shoot a 30s Video.{" "}
                  <span className="bg-gradient-to-r from-orange-400 via-amber-300 to-yellow-300 bg-clip-text text-transparent block sm:inline">
                    Get Rewarded on Approval.
                  </span>
                </h1>

                <p className="text-sm sm:text-base text-slate-300 leading-relaxed font-normal max-w-2xl">
                  {prompt.title} — No video editing or memorization needed! Our smart teleprompter scrolls directly over your phone's camera. Read naturally, submit in 1 click, and get credited fast.
                </p>

                {/* 4 Quick Spec Badges */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1">
                  <div className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/[0.08] backdrop-blur-md">
                    <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">Target Length</span>
                    <span className="text-sm font-extrabold text-amber-400 block mt-0.5 flex items-center gap-1.5">
                      <FaClock size={12} /> {targetDuration}s Max
                    </span>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/[0.08] backdrop-blur-md">
                    <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">Video Format</span>
                    <span className="text-sm font-extrabold text-white block mt-0.5 flex items-center gap-1.5">
                      <FaMobileAlt size={12} className="text-pink-400" /> 9:16 Portrait
                    </span>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/[0.08] backdrop-blur-md">
                    <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">Delivery Tone</span>
                    <span className="text-sm font-extrabold text-emerald-400 capitalize block mt-0.5 truncate">
                      {prompt.tone || "Casual"}
                    </span>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/[0.08] backdrop-blur-md">
                    <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">Reward Status</span>
                    <span className="text-sm font-extrabold text-yellow-400 block mt-0.5 flex items-center gap-1.5">
                      <FaMoneyBillWave size={12} /> On Approval
                    </span>
                  </div>
                </div>

                {/* Primary Action Buttons */}
                <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center gap-3.5">
                  <button
                    onClick={() => setCurrentView("camera")}
                    className="py-3.5 px-7 rounded-2xl bg-gradient-to-r from-orange-500 via-amber-500 to-orange-500 hover:from-orange-600 hover:to-amber-600 text-white font-black text-sm sm:text-base flex items-center justify-center gap-3 shadow-xl shadow-orange-500/30 transition-all hover:scale-[1.02] active:scale-[0.98] group"
                  >
                    <div className="w-7 h-7 rounded-xl bg-white/20 flex items-center justify-center group-hover:rotate-12 transition-transform">
                      <FaCamera size={13} />
                    </div>
                    <span>Start Teleprompter & Record Video</span>
                  </button>

                  <button
                    onClick={() => setCurrentView("upload")}
                    className="py-3.5 px-6 rounded-2xl bg-white/[0.06] hover:bg-white/[0.12] border border-white/10 text-slate-200 font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition hover:scale-[1.02] active:scale-[0.98]"
                  >
                    <FaUpload size={13} className="text-slate-400" />
                    <span>Upload Video File</span>
                  </button>
                </div>
              </div>

              {/* RIGHT COLUMN: Realistic 3D Smartphone Teleprompter Mockup */}
              <div className="lg:col-span-5 flex justify-center relative">
                <div className="absolute -top-3 -left-2 sm:-left-4 z-20 bg-[#161a26]/90 backdrop-blur-xl border border-white/15 px-3.5 py-2 rounded-2xl shadow-xl flex items-center gap-2">
                  <div className="w-7 h-7 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center font-black">
                    <FaStar size={12} />
                  </div>
                  <div>
                    <span className="text-[11px] font-black text-white block">4.9/5 Rating</span>
                    <span className="text-[9px] text-slate-400">1,200+ Creators</span>
                  </div>
                </div>

                {/* Smartphone Device Frame */}
                <div className="relative w-[260px] sm:w-[290px] aspect-[9/17.5] rounded-[44px] bg-black border-[6px] border-slate-700/80 shadow-[0_25px_70px_-15px_rgba(255,107,0,0.3)] overflow-hidden flex flex-col">
                  {/* Dynamic Island */}
                  <div className="absolute top-2.5 inset-x-0 flex justify-center z-30 pointer-events-none">
                    <div className="w-22 h-4.5 rounded-full bg-black flex items-center justify-end px-2 gap-1.5 border border-white/10">
                      <div className="w-1.5 h-1.5 rounded-full bg-blue-900/60" />
                      <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    </div>
                  </div>

                  <img
                    src="/creator_hero.jpg"
                    alt="Creator recording video"
                    className="absolute inset-0 w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/25 to-black/60 pointer-events-none" />

                  {/* Top HUD */}
                  <div className="relative z-20 pt-9 px-4 flex items-center justify-between text-[10px] font-bold">
                    <div className="flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-red-600/90 text-white shadow-md animate-pulse">
                      <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping" />
                      <span>REC 00:14</span>
                    </div>
                    <div className="px-2 py-0.5 rounded-full bg-black/60 backdrop-blur-md border border-white/20 text-amber-300">
                      ⏱ {targetDuration}s
                    </div>
                  </div>

                  {/* Floating Prompter on Phone */}
                  <div className="relative z-20 mx-3 mt-3 bg-black/75 backdrop-blur-xl border border-white/20 rounded-2xl p-2.5 shadow-2xl space-y-1 text-center">
                    <div className="flex items-center justify-between text-[8px] font-black uppercase tracking-wider text-amber-400">
                      <span>📜 Teleprompter Active</span>
                      <span className="text-[7px] bg-amber-400/20 px-1 py-0.5 rounded text-amber-300">Auto-Scroll</span>
                    </div>
                    <p className="text-[10px] font-bold text-white leading-relaxed line-clamp-3">
                      "{rawScript.replace(/\[(HOOK|MAIN CONTENT|CTA)\]/gi, '').trim() || "Agar aap bhi ek creator ho aur video banake earning start karna chahte ho toh ye video miss mat karna..."}"
                    </p>
                  </div>

                  <div className="flex-1" />

                  <div className="relative z-20 p-3 pb-5 flex items-center justify-between">
                    <span className="text-[9px] font-bold text-slate-300">● Audio: Clear</span>
                    <button
                      onClick={() => setCurrentView("camera")}
                      className="px-3 py-1 rounded-full bg-orange-500 hover:bg-orange-600 text-white font-extrabold text-[10px] shadow-md flex items-center gap-1 transition"
                    >
                      <span>Record</span> &rarr;
                    </button>
                  </div>
                </div>
              </div>

            </div>
          </section>

          {/* ── 2. SINGLE TASK SCRIPT CARD (EXACT USER SECTION REPLICA) ── */}
          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-2">
                <span>📋</span> Available Script & Task Card
              </h2>
              <span className="text-xs font-bold text-white bg-orange-500 px-3 py-1 rounded-full">
                Active Opportunity
              </span>
            </div>

            {/* The Dedicated Task Card (Matching Screenshot 4) */}
            <div className="bg-white text-gray-900 rounded-2xl border-2 border-gray-200 shadow-xl overflow-hidden group">
              {/* Top Gradient Accent Bar */}
              <div className="h-1.5 w-full bg-gradient-to-r from-orange-500 to-yellow-400" />

              <div className="p-6 sm:p-8 space-y-5">
                {/* Title & Category */}
                <div className="flex items-start justify-between gap-3">
                  <h3 className="text-xl sm:text-2xl font-bold text-gray-900 leading-snug">
                    {prompt.title}
                  </h3>
                  <span className="shrink-0 text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-full flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> Public
                  </span>
                </div>

                {/* Tags Row */}
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs font-bold text-white bg-orange-500 px-3.5 py-1 rounded-full">
                    {prompt.category || "testimonial"}
                  </span>
                  <span className="text-xs text-gray-600 font-semibold bg-gray-100 px-2.5 py-1 rounded-full">
                    {targetDuration}s
                  </span>
                  <span className="text-xs text-gray-600 font-semibold capitalize">
                    • {prompt.tone || "casual"}
                  </span>
                </div>

                {/* Script Preview Box */}
                {rawScript && (
                  <div className="bg-orange-50 rounded-2xl p-5 border border-orange-200">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-xs font-bold text-orange-600 uppercase tracking-wider">
                        Script Preview
                      </p>
                      <span className="text-xs text-gray-500">{wordCount} words · ~{targetDuration}s</span>
                    </div>
                    <p className="text-sm sm:text-base text-gray-800 leading-relaxed font-normal line-clamp-4">
                      {rawScript.slice(0, 220)}...
                    </p>
                  </div>
                )}

                {/* Primary Action Buttons (View Script & Upload Video) */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  <button
                    onClick={() => setShowViewScriptModal(true)}
                    className="flex items-center justify-center gap-2 py-3 rounded-xl bg-orange-50 text-orange-600 font-bold text-sm hover:bg-orange-100 transition border-2 border-orange-200 shadow-sm"
                  >
                    <FaEye size={15} /> View Script
                  </button>

                  <button
                    onClick={() => setCurrentView("upload")}
                    className="flex items-center justify-center gap-2 py-3 rounded-xl bg-green-50 text-green-600 font-bold text-sm hover:bg-green-100 transition border-2 border-green-200 shadow-sm"
                  >
                    <FaUpload size={14} /> Upload Video
                  </button>
                </div>

                {/* Secondary Action: WhatsApp & Copy Link (from Screenshot 4) */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-3 border-t border-gray-100">
                  <button
                    onClick={handleShareWhatsApp}
                    className="flex items-center justify-center gap-2 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition shadow-md shadow-emerald-600/20"
                    title="Share on WhatsApp"
                  >
                    <FaWhatsapp size={16} /> Share on WhatsApp
                  </button>

                  <button
                    onClick={handleCopyLink}
                    className="flex items-center justify-center gap-2 py-3 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-xs transition border border-gray-200"
                    title="Copy Link"
                  >
                    {copiedLink ? <FaCheck className="text-emerald-600" size={13} /> : <FaCopy size={13} />}
                    <span>{copiedLink ? "Link Copied!" : "Copy Link"}</span>
                  </button>
                </div>

              </div>
            </div>
          </section>

          {/* ── 3. COMPACT CREATOR QUALITY CHECKLIST ─────────────────────── */}
          <section className="p-6 sm:p-8 rounded-3xl bg-[#0c0f17] border border-white/[0.08] shadow-xl">
            <h3 className="text-base font-bold text-white mb-4 flex items-center gap-2">
              <FaCheckDouble className="text-emerald-400" />
              <span>Quick Filming Guidelines for Fast Approval</span>
            </h3>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs text-slate-300">
              <div className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/[0.06]">
                <span className="font-bold text-white block mb-1">📱 9:16 Portrait</span>
                <span>Hold phone upright for vertical format</span>
              </div>
              <div className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/[0.06]">
                <span className="font-bold text-white block mb-1">☀️ Natural Light</span>
                <span>Face a window or soft ring light</span>
              </div>
              <div className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/[0.06]">
                <span className="font-bold text-white block mb-1">🎙️ Clear Audio</span>
                <span>Quiet room, zero background noise</span>
              </div>
              <div className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/[0.06]">
                <span className="font-bold text-white block mb-1">⏱️ ~{targetDuration}s Pacing</span>
                <span>Energetic, smiling natural delivery</span>
              </div>
            </div>
          </section>

        </main>

        {/* Minimal Footer */}
        <footer className="border-t border-white/[0.06] py-8 text-center text-xs text-slate-500 mt-12 pb-24 sm:pb-8">
          <div className="flex items-center justify-center gap-2 mb-2 font-bold text-slate-400">
            <span>YovoAI Creator Network</span> • <span>Cloudflare R2 Storage</span>
          </div>
          <p>© 2026 YovoAI. All rights reserved.</p>
        </footer>

        {/* ══ STICKY FLOATING MOBILE BOTTOM BAR ══ */}
        <div className="sm:hidden fixed bottom-0 inset-x-0 z-40 bg-[#0c0f17]/95 backdrop-blur-xl border-t border-white/10 p-3.5 flex items-center justify-between shadow-2xl">
          <div className="truncate max-w-[180px]">
            <span className="text-xs font-black text-white block truncate">{prompt.title}</span>
            <span className="text-[10px] text-amber-400 font-bold">⏱ {targetDuration}s Target</span>
          </div>

          <button
            onClick={() => setCurrentView("camera")}
            className="py-2.5 px-5 rounded-full bg-gradient-to-r from-orange-500 to-amber-500 text-white font-black text-xs shadow-lg shadow-orange-500/30 flex items-center gap-2"
          >
            <FaCamera size={12} />
            <span>Record Now</span>
          </button>
        </div>

        {/* ══ VIEW SCRIPT MODAL (MATCHING USER DASHBOARD MODAL) ══ */}
        {showViewScriptModal && (
          <div
            className="fixed inset-0 z-50 overflow-y-auto flex justify-center p-4 bg-black/75 backdrop-blur-md"
            onClick={(e) => { if (e.target === e.currentTarget) setShowViewScriptModal(false); }}
          >
            <div className="bg-white text-gray-900 rounded-3xl shadow-2xl w-full max-w-2xl max-h-[85vh] flex flex-col overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-200">
              
              {/* Modal Top Banner */}
              <div className="bg-gradient-to-r from-orange-500 to-yellow-400 px-8 py-6 flex items-center justify-between text-white">
                <div>
                  <h2 className="text-white font-black text-xl">{prompt.title}</h2>
                  <p className="text-white/90 text-sm mt-1 capitalize font-medium">
                    {prompt.category || "Testimonial"} • {targetDuration}s • {prompt.tone || "Casual"}
                  </p>
                </div>
                <button
                  onClick={() => setShowViewScriptModal(false)}
                  className="w-10 h-10 flex items-center justify-center rounded-full bg-white/20 hover:bg-white/30 text-white transition"
                >
                  <FaTimes size={18} />
                </button>
              </div>

              {/* Modal Body */}
              <div className="overflow-y-auto flex-1 p-8 space-y-6">
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
                      <span className="text-xl">📝</span> Full Word-for-Word Script
                    </h3>
                    <button
                      onClick={handleCopyScript}
                      className="flex items-center gap-1.5 text-xs text-orange-600 hover:text-orange-700 font-bold px-3 py-1.5 rounded-lg border border-orange-200 hover:bg-orange-50 transition"
                    >
                      {copiedScript ? <FaCheck className="text-emerald-600" /> : <FaCopy />}
                      <span>{copiedScript ? "Copied!" : "Copy Script"}</span>
                    </button>
                  </div>
                  <div className="bg-orange-50/50 rounded-2xl p-6 border border-orange-200/80 font-mono text-sm leading-relaxed text-gray-800 whitespace-pre-wrap">
                    {rawScript}
                  </div>
                </div>

                {prompt.prompt && (
                  <div>
                    <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                      📋 Instructions & Talking Points
                    </h4>
                    <div className="bg-gray-50 rounded-xl p-4 border border-gray-200 text-xs text-gray-700 leading-relaxed whitespace-pre-wrap">
                      {prompt.prompt}
                    </div>
                  </div>
                )}
              </div>

              {/* Modal Footer */}
              <div className="bg-gray-50 border-t border-gray-200 px-8 py-4 flex flex-wrap items-center justify-between gap-3">
                <button
                  onClick={() => { setShowViewScriptModal(false); setCurrentView("camera"); }}
                  className="py-2.5 px-6 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 text-white font-black text-xs flex items-center gap-2 shadow-md transition"
                >
                  <FaCamera size={13} />
                  <span>Start Teleprompter & Record</span>
                </button>

                <button
                  onClick={() => setShowViewScriptModal(false)}
                  className="py-2.5 px-6 rounded-xl bg-gray-900 text-white font-bold text-xs hover:bg-gray-800 transition"
                >
                  Close
                </button>
              </div>

            </div>
          </div>
        )}

      </div>
    );
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // VIEW 2: LIVE IN-BROWSER TELEPROMPTER CAMERA STUDIO
  // ═══════════════════════════════════════════════════════════════════════════
  if (currentView === "camera") {
    return (
      <div className="h-screen w-screen bg-black text-white flex flex-col items-center justify-center overflow-hidden select-none font-sans relative">

        {/* Main Camera Viewport (Mobile 9:16 Canvas) */}
        <div className="relative w-full h-full sm:max-w-[440px] sm:max-h-[94vh] sm:rounded-3xl overflow-hidden bg-slate-950 flex items-center justify-center sm:border sm:border-slate-800 shadow-2xl">

          {/* Live Video Feed OR Preview Video */}
          {!previewUrl && (
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className={`w-full h-full object-cover ${cameraFacing === "user" ? "scale-x-[-1]" : ""}`}
            />
          )}

          {previewUrl && (
            <video
              src={previewUrl}
              controls
              autoPlay
              playsInline
              className="w-full h-full object-contain bg-black"
            />
          )}

          {/* Top Floating HUD: Back to Brief, Duration & Flip Camera */}
          <div className="absolute top-0 inset-x-0 p-4 pt-5 flex items-center justify-between z-30 bg-gradient-to-b from-black/80 via-black/40 to-transparent">
            <div className="flex items-center gap-2">
              <button
                onClick={() => { stopCamera(); setCurrentView("landing"); }}
                className="px-2.5 py-1.5 rounded-full bg-black/60 hover:bg-black/80 border border-white/20 text-white text-xs font-bold flex items-center gap-1 backdrop-blur-md transition"
                title="Back to Task Brief"
              >
                <FaArrowLeft size={10} /> Brief
              </button>
              <span className="text-[11px] font-bold text-slate-200 truncate max-w-[130px]">
                {prompt.title}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <div className="px-2.5 py-1 rounded-full bg-black/50 border border-white/20 text-[11px] font-bold text-amber-300 backdrop-blur-md">
                ⏱ {targetDuration}s
              </div>

              {!previewUrl && !recording && cameraActive && (
                <button
                  onClick={toggleCameraFacing}
                  title="Flip Camera"
                  className="w-8 h-8 rounded-full bg-black/50 hover:bg-black/80 border border-white/20 text-white flex items-center justify-center transition backdrop-blur-md"
                >
                  <FaSyncAlt size={12} />
                </button>
              )}
            </div>
          </div>

          {/* Target Progress Bar at Top */}
          {recording && (
            <div className="absolute top-0 inset-x-0 h-1 bg-white/20 z-40">
              <div
                className="h-full bg-gradient-to-r from-orange-500 to-red-500 transition-all duration-300"
                style={{ width: `${progressRatio}%` }}
              />
            </div>
          )}

          {/* FLOATING TELEPROMPTER OVERLAY (ON TOP OF CAMERA) */}
          {!previewUrl && showPrompter && (
            <div className="absolute top-16 inset-x-3 z-30 flex flex-col items-center">
              <div className="w-full max-w-[390px] bg-black/70 backdrop-blur-xl rounded-2xl border border-white/20 shadow-2xl p-3 flex flex-col">

                {/* Prompter Toolbar */}
                <div className="flex items-center justify-between pb-2 mb-2 border-b border-white/10 text-xs text-slate-300">
                  <span className="font-bold text-[11px] tracking-wide text-amber-300 flex items-center gap-1">
                    <span>📜</span> Teleprompter
                  </span>

                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => setFontSize((s) => Math.max(14, s - 2))}
                      className="w-6 h-6 rounded bg-white/10 hover:bg-white/20 flex items-center justify-center text-[10px] font-bold text-white transition"
                      title="Smaller Text"
                    >
                      A-
                    </button>
                    <button
                      onClick={() => setFontSize((s) => Math.min(28, s + 2))}
                      className="w-6 h-6 rounded bg-white/10 hover:bg-white/20 flex items-center justify-center text-[10px] font-bold text-white transition"
                      title="Larger Text"
                    >
                      A+
                    </button>
                    <div className="flex items-center gap-1 bg-white/10 px-2 py-0.5 rounded text-[10px]">
                      <FaSlidersH className="text-amber-400 text-[8px]" />
                      <span>{scrollSpeed}x</span>
                      <input
                        type="range"
                        min="1"
                        max="4"
                        step="0.5"
                        value={scrollSpeed}
                        onChange={(e) => setScrollSpeed(Number(e.target.value))}
                        className="w-10 accent-orange-500 h-1 cursor-pointer"
                      />
                    </div>
                    <button
                      onClick={() => setShowPrompter(false)}
                      className="text-white/60 hover:text-white p-1"
                      title="Minimize"
                    >
                      <FaTimes size={10} />
                    </button>
                  </div>
                </div>

                {/* Scrolling Text Window Over Camera */}
                <div
                  ref={prompterBoxRef}
                  className="overflow-y-auto max-h-[170px] sm:max-h-[190px] pr-1 space-y-2 scroll-smooth text-center"
                >
                  <p
                    className="text-white font-black leading-relaxed whitespace-pre-wrap transition-all drop-shadow-md tracking-wide"
                    style={{ fontSize: `${fontSize}px` }}
                  >
                    {rawScript.replace(/\[(HOOK|MAIN CONTENT|CTA)\]/gi, '').trim() || "No script provided."}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Minimized Prompter Opener */}
          {!previewUrl && !showPrompter && (
            <button
              onClick={() => setShowPrompter(true)}
              className="absolute top-16 left-4 z-30 px-3 py-1.5 rounded-full bg-black/60 backdrop-blur-md border border-white/20 text-xs font-bold text-amber-300 flex items-center gap-1.5 shadow-lg"
            >
              <span>📜</span> Show Prompter
            </button>
          )}

          {/* 3-2-1 Countdown Overlay */}
          {countdown > 0 && (
            <div className="absolute inset-0 bg-black/80 backdrop-blur-sm flex flex-col items-center justify-center z-40">
              <span className="text-9xl font-black text-amber-400 animate-ping">
                {countdown}
              </span>
              <span className="text-xs font-bold text-slate-300 mt-6 uppercase tracking-widest">
                Look into camera & smile...
              </span>
            </div>
          )}

          {/* Live REC Counter Pill */}
          {recording && (
            <div className="absolute top-4 inset-x-0 flex justify-center z-40 pointer-events-none">
              <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-red-600/90 text-white text-xs font-bold shadow-lg animate-pulse backdrop-blur-md">
                <span className="w-2 h-2 rounded-full bg-white animate-ping" />
                REC {String(Math.floor(recordSeconds / 60)).padStart(2, "0")}:{String(recordSeconds % 60).padStart(2, "0")} / {targetDuration}s
              </div>
            </div>
          )}

          {/* Enable Camera Prompt */}
          {!cameraActive && !previewUrl && (
            <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center z-20 bg-slate-950/90">
              <div className="w-14 h-14 rounded-2xl bg-orange-500/20 text-orange-400 flex items-center justify-center text-2xl mb-3 border border-orange-500/30">
                <FaCamera />
              </div>
              <h3 className="text-base font-bold text-white">Enable Camera to Begin</h3>
              <p className="text-xs text-slate-400 max-w-xs mt-1 mb-4">
                Tap to allow camera and microphone access to record directly.
              </p>
              <button
                onClick={startCamera}
                className="px-6 py-2.5 rounded-full bg-gradient-to-r from-orange-500 to-amber-500 text-white font-bold text-xs transition shadow-lg shadow-orange-500/25"
              >
                Turn On Camera
              </button>
            </div>
          )}

          {/* Bottom Controls HUD */}
          <div className="absolute bottom-0 inset-x-0 p-5 pb-6 flex flex-col items-center justify-center z-30 bg-gradient-to-t from-black/90 via-black/50 to-transparent">
            {!previewUrl && (
              <div className="flex items-center justify-center w-full">
                {!recording ? (
                  <button
                    onClick={handleStartCountdown}
                    disabled={countdown > 0}
                    className="w-18 h-18 sm:w-20 sm:h-20 rounded-full border-4 border-white flex items-center justify-center transition-all hover:scale-105 active:scale-95 shadow-2xl p-1.5"
                  >
                    <div className="w-full h-full rounded-full bg-red-600 hover:bg-red-500 transition shadow-inner" />
                  </button>
                ) : (
                  <button
                    onClick={handleStopRecording}
                    className="w-18 h-18 sm:w-20 sm:h-20 rounded-full border-4 border-white flex items-center justify-center transition-all hover:scale-105 active:scale-95 shadow-2xl p-1.5"
                  >
                    <div className="w-8 h-8 rounded-lg bg-red-600 transition shadow-inner animate-pulse" />
                  </button>
                )}
              </div>
            )}

            {/* Preview Actions */}
            {previewUrl && (
              <div className="w-full flex items-center gap-3">
                <button
                  onClick={handleRetake}
                  disabled={uploading}
                  className="flex-1 py-3.5 rounded-2xl bg-slate-800/90 hover:bg-slate-700 border border-white/20 text-white font-bold text-xs flex items-center justify-center gap-2 backdrop-blur-md transition disabled:opacity-50"
                >
                  <FaRedo size={12} /> Retake
                </button>
                <button
                  onClick={handleFinalSubmit}
                  disabled={uploading}
                  className="flex-1 py-3.5 rounded-2xl bg-gradient-to-r from-emerald-500 to-green-500 hover:from-emerald-400 hover:to-green-400 text-white font-extrabold text-xs flex items-center justify-center gap-2 shadow-xl shadow-green-500/30 transition disabled:opacity-50"
                >
                  <FaCheck size={14} /> Submit Video
                </button>
              </div>
            )}

            {/* Upload Progress */}
            {uploading && (
              <div className="w-full mt-3 bg-black/80 backdrop-blur-md p-3 rounded-xl border border-white/10 space-y-1.5">
                <div className="flex justify-between text-[11px] font-bold text-slate-300">
                  <span className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-orange-500 animate-ping" />
                    Uploading to Cloud...
                  </span>
                  <span>{uploadProgress}%</span>
                </div>
                <div className="w-full h-1.5 bg-white/20 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-orange-500 to-amber-400 transition-all duration-300"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Claim Modal Render */}
        {renderClaimModal()}
      </div>
    );
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // VIEW 3: UPLOAD EXISTING VIDEO FILE MODE
  // ═══════════════════════════════════════════════════════════════════════════
  if (currentView === "upload") {
    return (
      <div className="min-h-screen bg-[#07090e] text-slate-100 flex flex-col font-sans">
        <header className="h-18 shrink-0 bg-[#090b10] border-b border-white/[0.08] px-6 flex items-center justify-between">
          <button
            onClick={() => setCurrentView("landing")}
            className="flex items-center gap-2 text-xs font-bold text-slate-300 hover:text-white transition"
          >
            <FaArrowLeft /> Back to Task Brief
          </button>
          <span className="text-xs text-amber-400 font-bold">{prompt.title}</span>
        </header>

        <main className="flex-1 flex flex-col items-center justify-center p-6 max-w-xl mx-auto w-full">
          <div className="w-full bg-[#0d1017] rounded-3xl border border-white/[0.09] p-8 shadow-2xl space-y-6 text-center">
            <div>
              <h2 className="text-2xl font-black text-white">Upload Your UGC Video</h2>
              <p className="text-xs text-slate-400 mt-1">Select the pre-recorded vertical video you shot for this task</p>
            </div>

            {!previewUrl ? (
              <div
                onClick={() => fileInputRef.current?.click()}
                className="p-12 rounded-3xl border-2 border-dashed border-slate-700 hover:border-orange-500 cursor-pointer flex flex-col items-center justify-center transition bg-black/40 hover:bg-black/60 group"
              >
                <div className="w-16 h-16 rounded-2xl bg-orange-500/10 text-orange-400 flex items-center justify-center text-2xl mb-3 border border-orange-500/20 group-hover:scale-110 transition-transform">
                  <FaUpload />
                </div>
                <p className="text-sm font-bold text-white">Click to Select Video File</p>
                <p className="text-xs text-slate-500 mt-1">MP4, MOV, WebM up to 200MB</p>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="video/*"
                  onChange={handleFileChange}
                  className="hidden"
                />
              </div>
            ) : (
              <div className="space-y-4">
                <video src={previewUrl} controls className="w-full max-h-[340px] rounded-2xl bg-black object-contain" />
                <div className="flex gap-3">
                  <button
                    onClick={() => { setPreviewUrl(""); setSelectedFile(null); setRecordedBlob(null); }}
                    className="flex-1 py-3 rounded-xl border border-slate-700 bg-slate-800 text-xs font-bold text-slate-300 hover:bg-slate-700"
                  >
                    Change File
                  </button>
                  <button
                    onClick={handleFinalSubmit}
                    disabled={uploading}
                    className="flex-1 py-3.5 rounded-xl bg-gradient-to-r from-emerald-500 to-green-500 text-xs font-extrabold text-white shadow-lg shadow-green-500/25"
                  >
                    Confirm & Submit
                  </button>
                </div>
              </div>
            )}

            {uploading && (
              <div className="bg-black/50 p-4 rounded-xl border border-white/10 space-y-2 text-left">
                <div className="flex justify-between text-xs font-bold text-slate-300">
                  <span>Uploading to Cloud...</span>
                  <span>{uploadProgress}%</span>
                </div>
                <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-orange-500 to-amber-400 transition-all duration-300"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
              </div>
            )}
          </div>
        </main>

        {renderClaimModal()}
      </div>
    );
  }

  // ── Helper Function for Post-Upload Claim Modal ────────────────────────────
  function renderClaimModal() {
    if (!showClaimModal) return null;
    return (
      <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto font-sans">
        <div className="bg-[#0e1119] border border-white/10 rounded-3xl w-full max-w-sm p-6 sm:p-8 shadow-2xl relative text-center">
          <div className="w-16 h-16 rounded-3xl bg-gradient-to-tr from-emerald-500 to-green-400 text-white flex items-center justify-center text-3xl mx-auto mb-3 shadow-lg shadow-green-500/30">
            🎉
          </div>
          <h2 className="text-2xl font-black text-white">Video Submitted!</h2>
          <p className="text-xs text-slate-400 mt-1 max-w-xs mx-auto mb-5 leading-relaxed">
            Connect your account to claim ownership of this video, track AI edit status, and receive earnings.
          </p>

          {authError && (
            <div className="mb-4 p-2.5 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-medium">
              {authError}
            </div>
          )}

          {/* Auth Tabs */}
          <div className="flex p-1 bg-black/50 rounded-xl border border-white/10 mb-4">
            <button
              onClick={() => setClaimTab("google")}
              className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition ${
                claimTab === "google"
                  ? "bg-slate-800 text-white shadow-sm"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              1-Click Google
            </button>
            <button
              onClick={() => setClaimTab("login")}
              className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition ${
                claimTab === "login"
                  ? "bg-slate-800 text-white shadow-sm"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              Login / Password
            </button>
          </div>

          {/* Tab A: Google Login */}
          {claimTab === "google" && (
            <div className="space-y-3">
              <div className="flex justify-center">
                <GoogleLogin
                  onSuccess={handleGoogleSuccess}
                  onError={() => setAuthError("Google authentication failed. Please try login.")}
                  theme="filled_black"
                  shape="pill"
                  size="large"
                  text="continue_with"
                />
              </div>
              <p className="text-[10px] text-slate-500">
                Instantly links this video to your creator dashboard.
              </p>
            </div>
          )}

          {/* Tab B: Email / Password */}
          {claimTab === "login" && (
            <form onSubmit={handleManualLogin} className="space-y-2.5 text-left">
              <div>
                <label className="block text-[11px] font-semibold text-slate-400 mb-1">Email</label>
                <input
                  type="email"
                  required
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  placeholder="creator@example.com"
                  className="w-full bg-black/50 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-orange-500 transition"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-400 mb-1">Password</label>
                <input
                  type="password"
                  required
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-black/50 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-orange-500 transition"
                />
              </div>
              <button
                type="submit"
                disabled={authLoading}
                className="w-full py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs transition shadow-lg shadow-orange-500/25 disabled:opacity-50"
              >
                {authLoading ? "Connecting..." : "Login & Claim Video"}
              </button>
            </form>
          )}

          <div className="mt-5 pt-3 border-t border-white/10">
            <button
              onClick={() => navigate("/landingpage")}
              className="text-[11px] text-slate-500 hover:text-slate-400 transition"
            >
              I'll claim later • Return to home
            </button>
          </div>
        </div>
      </div>
    );
  }
}
