const statusEl = document.getElementById("status");
const magoCountEl = document.getElementById("magoCount");
const sanchezCountEl = document.getElementById("sanchezCount");
const totalCountEl = document.getElementById("totalCount");
const voteAvatars = document.querySelectorAll(".vote-avatar");
const magoTopBarEl = document.getElementById("magoTopBar");
const sanchezTopBarEl = document.getElementById("sanchezTopBar");
const magoTopPctEl = document.getElementById("magoTopPct");
const sanchezTopPctEl = document.getElementById("sanchezTopPct");
const cardEl = document.querySelector(".card");
const candidateCards = document.querySelectorAll(".candidate");
const avatarVideos = document.querySelectorAll(".avatar-video");
const yearNowEl = document.getElementById("yearNow");
const introOverlayEl = document.getElementById("introOverlay");
const API_BASE =
  location.protocol === "http:" || location.protocol === "https:"
    ? location.origin
    : null;
const REQUEST_TIMEOUT_MS = 12000;
let lockedChoice = "";
const MAGO_CANDIDATES = [
  "./assets/mago.png",
  "./assets/caricatura-mago.png",
  "./assets/caricatura mago.png"
];
const SANCHEZ_CANDIDATES = [
  "./assets/sanchez.png",
  "./assets/caricatura-sanchez.png",
  "./assets/caricatura sanchez.png"
];
const MAGO_VIDEO_CANDIDATES = [
  "./assets/mago.mp4",
  "./assets/animacion.mp4",
  "./animacion.mp4"
];
const SANCHEZ_VIDEO_CANDIDATES = [
  "./assets/sanchez.mp4",
  "./assets/animacion 2.mp4",
  "./animacion 2.mp4"
];

function setStatus(message, type = "") {
  statusEl.textContent = message;
  statusEl.className = `status ${type}`.trim();
}

function setLoading(loading) {
  voteAvatars.forEach((avatar) => {
    const choice = avatar.dataset.choice;
    const lockedByChoice = Boolean(lockedChoice) && choice !== lockedChoice;
    avatar.disabled = loading || lockedByChoice;
    avatar.setAttribute("aria-busy", loading ? "true" : "false");
  });
}

async function requestJson(path, options = {}) {
  if (!API_BASE) {
    throw new Error("NO_HTTP_CONTEXT");
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    const res = await fetch(`${API_BASE}${path}`, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...(options.headers || {})
      },
      signal: controller.signal,
      cache: "no-store"
    });

    let data = {};
    try {
      data = await res.json();
    } catch (error) {
      data = {};
    }

    if (!res.ok) {
      throw new Error(data?.error || `HTTP_${res.status}`);
    }
    return data;
  } finally {
    clearTimeout(timeout);
  }
}

function renderResults(summary) {
  magoCountEl.textContent = summary.mago;
  sanchezCountEl.textContent = summary.sanchez;
  totalCountEl.textContent = summary.total;
  const total = Number(summary.total) || 0;
  const magoPct = total ? (Number(summary.mago) / total) * 100 : 0;
  const sanchezPct = total ? (Number(summary.sanchez) / total) * 100 : 0;
  const magoPctText = `${magoPct.toFixed(1)}%`;
  const sanchezPctText = `${sanchezPct.toFixed(1)}%`;

  magoTopBarEl.style.width = magoPctText;
  sanchezTopBarEl.style.width = sanchezPctText;
  magoTopPctEl.textContent = magoPctText;
  sanchezTopPctEl.textContent = sanchezPctText;
}

function setVotedCandidate(choice) {
  candidateCards.forEach((card) => {
    const cardChoice = card.dataset.candidate;
    const isSelected = cardChoice === choice;
    card.classList.toggle("selected", isSelected);
    card.classList.toggle("locked-opponent", !isSelected);
  });
}

function playVoteVideo(choice) {
  avatarVideos.forEach((video) => {
    const isSelected = video.dataset.video === choice;
    if (!isSelected) {
      video.pause();
      video.currentTime = 0;
      return;
    }

    video.muted = true;
    video.defaultMuted = true;
    video.playsInline = true;
    video.setAttribute("playsinline", "");
    video.setAttribute("webkit-playsinline", "true");
    video.autoplay = true;
    video.loop = true;
    video.currentTime = 0;

    const tryPlay = () => {
      const playPromise = video.play();
      if (playPromise && typeof playPromise.catch === "function") {
        playPromise.catch(() => {
          // Retry once after explicit load for stricter mobile autoplay policies.
          video.load();
          const retryPromise = video.play();
          if (retryPromise && typeof retryPromise.catch === "function") {
            retryPromise.catch(() => {});
          }
        });
      }
    };

    if (video.readyState >= 2) {
      tryPlay();
    } else {
      video.addEventListener("canplay", tryPlay, { once: true });
      video.load();
    }
  });
}

function previewSelection(choice) {
  if (lockedChoice && lockedChoice !== choice) return;
  lockedChoice = choice;
  setVotedCandidate(choice);
  playVoteVideo(choice);
}

function pulseCard() {
  cardEl.classList.remove("flash");
  // Trigger reflow to replay animation.
  void cardEl.offsetWidth;
  cardEl.classList.add("flash");
}

function celebrateVote() {
  pulseCard();
  for (let i = 0; i < 14; i += 1) {
    const dot = document.createElement("span");
    dot.style.position = "fixed";
    dot.style.left = `${Math.random() * 100}vw`;
    dot.style.top = "-20px";
    dot.style.width = "8px";
    dot.style.height = "14px";
    dot.style.borderRadius = "999px";
    dot.style.background =
      Math.random() > 0.5
        ? "linear-gradient(160deg,#ffd14a,#ffb100)"
        : "linear-gradient(160deg,#ff6a83,#ef2f56)";
    dot.style.zIndex = "30";
    dot.style.transform = `rotate(${Math.random() * 120}deg)`;
    dot.style.transition = `transform 900ms cubic-bezier(.17,.67,.44,1), top 900ms cubic-bezier(.17,.67,.44,1), opacity 900ms`;
    document.body.appendChild(dot);

    requestAnimationFrame(() => {
      dot.style.top = `${60 + Math.random() * 35}vh`;
      dot.style.transform = `translateX(${(Math.random() - 0.5) * 160}px) rotate(${Math.random() * 360}deg)`;
      dot.style.opacity = "0";
    });

    setTimeout(() => dot.remove(), 1000);
  }
}

function tryImageSource(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(src);
    img.onerror = reject;
    img.src = src;
  });
}

function tryVideoSource(videoEl, src) {
  return new Promise((resolve, reject) => {
    videoEl.src = src;
    videoEl.onloadedmetadata = () => resolve(src);
    videoEl.onerror = reject;
    videoEl.load();
  });
}

async function tryEnableHeroImage() {
  let magoSrc = "";
  let sanchezSrc = "";

  for (const src of MAGO_CANDIDATES) {
    try {
      magoSrc = await tryImageSource(src);
      break;
    } catch (error) {
      // Keep trying.
    }
  }

  if (magoSrc) {
    document.documentElement.style.setProperty("--mago-image", `url("${magoSrc}")`);
  }
  for (const src of SANCHEZ_CANDIDATES) {
    try {
      sanchezSrc = await tryImageSource(src);
      break;
    } catch (error) {
      // Keep trying.
    }
  }
  if (sanchezSrc) {
    document.documentElement.style.setProperty(
      "--sanchez-image",
      `url("${sanchezSrc}")`
    );
  }
  if (magoSrc || sanchezSrc) {
    document.documentElement.style.setProperty(
      "--hero-image",
      `url("${sanchezSrc || magoSrc}")`
    );
  }
}

async function tryEnableVideos() {
  const magoVideo = document.querySelector('.avatar-video[data-video="mago"]');
  const sanchezVideo = document.querySelector('.avatar-video[data-video="sanchez"]');
  if (!magoVideo || !sanchezVideo) return;

  for (const src of MAGO_VIDEO_CANDIDATES) {
    try {
      await tryVideoSource(magoVideo, src);
      magoVideo.preload = "auto";
      magoVideo.defaultMuted = true;
      magoVideo.muted = true;
      magoVideo.setAttribute("webkit-playsinline", "true");
      break;
    } catch (error) {
      // Keep trying.
    }
  }

  for (const src of SANCHEZ_VIDEO_CANDIDATES) {
    try {
      await tryVideoSource(sanchezVideo, src);
      sanchezVideo.preload = "auto";
      sanchezVideo.defaultMuted = true;
      sanchezVideo.muted = true;
      sanchezVideo.setAttribute("webkit-playsinline", "true");
      break;
    } catch (error) {
      // Keep trying.
    }
  }
}

async function loadResults() {
  if (!API_BASE) {
    setStatus("Abre la pagina desde http://localhost:3000 para poder votar.", "error");
    return;
  }

  try {
    const data = await requestJson("/api/results", { method: "GET" });
    if (data?.ok) renderResults(data.summary);
    if (statusEl.classList.contains("error")) setStatus("");
  } catch (error) {
    setStatus("No se pudo conectar la votacion. Revisa el servidor.", "error");
  }
}

async function vote(choice) {
  if (!API_BASE) {
    setStatus("No se puede votar sin servidor activo.", "error");
    return;
  }

  const previousLockedChoice = lockedChoice;
  lockedChoice = choice;
  setVotedCandidate(choice);
  playVoteVideo(choice);
  setLoading(true);
  setStatus("Registrando tu voto...");
  try {
    const data = await requestJson("/api/vote", {
      method: "POST",
      body: JSON.stringify({ choice })
    });
    if (!data?.ok) {
      throw new Error(data?.error || "No se pudo registrar el voto.");
    }
    renderResults(data.summary);
    celebrateVote();
    setStatus(`Votaste por ${choice === "mago" ? "El Mago" : "Camilo Sanchez"}.`, "ok");
  } catch (error) {
    lockedChoice = previousLockedChoice || choice;
    setVotedCandidate(lockedChoice);
    playVoteVideo(lockedChoice);
    const friendly =
      error?.message === "NO_HTTP_CONTEXT"
        ? "Abre esta pagina desde una URL http/https valida."
        : "No se pudo enviar el voto. Verifica servidor y conexion.";
    setStatus(friendly, "error");
  } finally {
    setLoading(false);
  }
}

voteAvatars.forEach((avatar) => {
  avatar.addEventListener("pointerdown", () => previewSelection(avatar.dataset.choice), {
    passive: true
  });
  avatar.addEventListener("touchstart", () => previewSelection(avatar.dataset.choice), {
    passive: true
  });
  avatar.addEventListener("click", () => vote(avatar.dataset.choice));
});

if (yearNowEl) {
  yearNowEl.textContent = String(new Date().getFullYear());
}

if (introOverlayEl) {
  setTimeout(() => {
    introOverlayEl.remove();
  }, 2100);
}

loadResults();
tryEnableHeroImage();
tryEnableVideos();
setInterval(loadResults, 10000);
