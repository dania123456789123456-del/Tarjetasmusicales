// Reproductor + tarjetitas sincronizadas con el tiempo REAL del audio (audio.currentTime).
// Un solo <audio> compartido por los dos modos: cambiar de vista nunca reinicia ni duplica la canción.
(async () => {
  const $ = (id) => document.getElementById(id);
  const audio = $("audio");
  const body = document.body;
  const SVG = (d) => '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="' + d + '"/></svg>';
  const ICON_PLAY = SVG("M8 5v14l11-7z");
  const ICON_PAUSE = SVG("M6 5h4v14H6zM14 5h4v14h-4z");
  const ICON_VOL = SVG("M3 9v6h4l5 5V4L7 9H3zm13.5 3A4.5 4.5 0 0 0 14 7.97v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z");
  const ICON_MUTE = SVG("M16.5 12A4.5 4.5 0 0 0 14 7.97v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51A8.8 8.8 0 0 0 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3 3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06a8.99 8.99 0 0 0 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4 9.91 6.09 12 8.18V4z");

  Comun.avisoRotar();

  // ---------------------------------------------------------------- Datos
  let data, cancion;
  try {
    data = await Comun.cargarCanciones();
    const id = new URLSearchParams(location.search).get("id");
    cancion = data.canciones.find((c) => c.id === id) || (id ? null : data.canciones[0]);
    if (!cancion) throw new Error(id ? "No encontramos esa canción en canciones.json." : "No hay canciones configuradas.");
  } catch (e) {
    $("titulo").textContent = "No disponible";
    $("estado").textContent = "Sin conexión con la biblioteca";
    $("error").textContent = e.message + " Vuelve a la biblioteca e inténtalo de nuevo.";
    $("coverWrap").classList.add("sin-portada");
    $("verTarjetas").hidden = true;
    return;
  }
  Comun.guardar("biblio-ultima", cancion.id);
  document.title = cancion.titulo + " ❤️";
  $("titulo").textContent = cancion.titulo;
  $("artista").textContent = cancion.artista || "";
  $("finalMsg").textContent = (data.estadoFinal && data.estadoFinal.mensaje) || "❤️";
  const tarjetas = cancion.tarjetas;
  if (!tarjetas.length) $("verTarjetas").hidden = true;

  // Portada: se muestra completa (object-fit: contain) sobre un fondo desenfocado de sí misma.
  const root = document.documentElement;
  if (cancion.portada) {
    const u = Comun.cssUrl(cancion.portada);
    $("coverWrap").style.setProperty("--cover", u);
    $("fondoPortada").style.setProperty("--cover", u);
    $("cover").src = cancion.portada;
    $("cover").alt = "Portada de " + cancion.titulo;
    $("cover").onerror = () => $("coverWrap").classList.add("sin-portada");
    Comun.colorDominante(cancion.portada).then((rgb) => { if (rgb) root.style.setProperty("--glow", rgb.join(",")); });
  } else {
    $("coverWrap").classList.add("sin-portada");
  }

  // ---------------------------------------------------------------- Audio (sin autoplay)
  const err = (m) => { $("error").textContent = m; };
  if (cancion.audio) audio.src = cancion.audio; else err("Esta canción no tiene un archivo de audio configurado.");
  audio.volume = 0.9;
  audio.addEventListener("error", () => err("No se pudo cargar el audio de esta canción. Revisa la ruta en canciones.json."));
  audio.addEventListener("playing", () => err(""));

  const pps = [$("pp"), $("pp2")];
  const textoEstado = () => {
    if (audio.ended) return "Terminó nuestra canción";
    if (!audio.paused) return "Sonando ahora";
    return audio.currentTime > 0.1 ? "En pausa" : "Lista para sonar";
  };
  const pintarPP = () => {
    body.classList.toggle("sonando", !audio.paused && !audio.ended);
    pps.forEach((b) => {
      b.innerHTML = audio.paused ? ICON_PLAY : ICON_PAUSE;
      b.setAttribute("aria-label", audio.paused ? "Reproducir" : "Pausar");
    });
    $("estado").textContent = textoEstado();
    pedirPantallaEncendida();
  };
  const toggle = () => {
    if (audio.paused) audio.play().catch(() => err("No se pudo reproducir. Toca de nuevo el botón de reproducir."));
    else audio.pause();
  };
  pps.forEach((b) => (b.onclick = toggle));
  ["play", "pause", "ended", "playing"].forEach((ev) => audio.addEventListener(ev, pintarPP));

  const dur = () => (Number.isFinite(audio.duration) && audio.duration > 0 ? audio.duration : 0);
  const mover = (delta) => {
    const d = dur();
    const t = audio.currentTime + delta;
    audio.currentTime = Math.max(0, d ? Math.min(d, t) : t);
  };
  $("atras").onclick = () => mover(-10);
  $("adelante").onclick = () => mover(10);
  $("reiniciar").onclick = () => { audio.currentTime = 0; };
  $("repetir").onclick = (e) => {
    audio.loop = !audio.loop;
    e.currentTarget.setAttribute("aria-pressed", String(audio.loop));
  };
  $("otraVez").onclick = () => { audio.currentTime = 0; audio.play().catch(() => {}); };

  // Volumen (iOS no permite cambiarlo por código: se oculta el deslizador y queda el silencio)
  const vol = $("vol"), mute = $("mute");
  const pintarVol = () => {
    mute.innerHTML = audio.muted || audio.volume === 0 ? ICON_MUTE : ICON_VOL;
    mute.setAttribute("aria-label", audio.muted ? "Activar sonido" : "Silenciar");
  };
  audio.volume = 0.5;
  if (audio.volume !== 0.5) vol.hidden = true;
  audio.volume = 0.9;
  vol.style.setProperty("--p", "90%");
  vol.oninput = () => { audio.muted = false; audio.volume = vol.value / 100; vol.style.setProperty("--p", vol.value + "%"); pintarVol(); };
  mute.onclick = () => { audio.muted = !audio.muted; pintarVol(); };
  pintarVol();

  // ---------------------------------------------------------------- Progreso
  const barras = [$("barra"), $("barra2")];
  let arrastrando = false;
  barras.forEach((b) => {
    b.addEventListener("input", () => {
      arrastrando = true;
      b.style.setProperty("--p", b.value / 10 + "%");
      if (dur()) audio.currentTime = (b.value / 1000) * dur();
    });
    ["change", "pointerup", "pointercancel", "blur"].forEach((ev) => b.addEventListener(ev, () => (arrastrando = false)));
  });
  let uT = "", uD = "", uV = -1;
  const pintarTiempo = () => {
    const d = dur(), t = audio.currentTime || 0;
    const v = d ? Math.min(1000, Math.round((t / d) * 1000)) : 0;
    if (!arrastrando && v !== uV) {
      uV = v;
      barras.forEach((b) => { b.value = v; b.style.setProperty("--p", v / 10 + "%"); });
    }
    const ts = Comun.formato(t), ds = d ? Comun.formato(d) : "–:––";
    if (ts !== uT) {
      uT = ts;
      $("actual").textContent = $("actual2").textContent = ts;
      barras.forEach((b) => b.setAttribute("aria-valuetext", ts + " de " + ds));
    }
    if (ds !== uD) { uD = ds; $("total").textContent = $("total2").textContent = ds; }
  };
  audio.addEventListener("loadedmetadata", pintarTiempo);
  audio.addEventListener("durationchange", pintarTiempo);

  // ---------------------------------------------------------------- Fondo animado (iframe) con alternativa
  const capa = $("capaFondo");
  let fondoIniciado = false;
  const usarAlterno = () => { capa.innerHTML = ""; capa.classList.add("alterno"); };
  const cargarFondo = () => {
    if (fondoIniciado) return;
    fondoIniciado = true;
    if (!cancion.fondo) return usarAlterno();
    fetch(cancion.fondo, { method: "HEAD" })
      .then((r) => {
        if (!r.ok) return usarAlterno();
        const f = document.createElement("iframe");
        f.src = cancion.fondo;
        f.title = "Fondo animado";
        f.setAttribute("aria-hidden", "true");
        f.tabIndex = -1;
        f.onerror = usarAlterno;
        capa.appendChild(f);
      })
      .catch(usarAlterno);
  };

  // ---------------------------------------------------------------- Tarjetitas
  const imgs = [$("imgA"), $("imgB")];
  let visible = 0, indiceActual = -2, finalMostrado = false, tokenMostrar = 0;
  const precargadas = new Set();
  const precargar = (i) => {
    const t = tarjetas[i];
    if (!t || precargadas.has(t.imagen)) return;
    precargadas.add(t.imagen);
    const im = new Image();
    im.src = t.imagen;
  };
  const ENTRADA = {
    fade: [{ opacity: 0 }, { opacity: 1 }],
    zoom: [{ opacity: 0, transform: "scale(.92)" }, { opacity: 1, transform: "scale(1)" }],
    rise: [{ opacity: 0, transform: "translateY(24px)" }, { opacity: 1, transform: "translateY(0)" }],
  };
  const SALIDA = {
    fade: [{ opacity: 1 }, { opacity: 0 }],
    zoom: [{ opacity: 1, transform: "scale(1)" }, { opacity: 0, transform: "scale(1.06)" }],
    rise: [{ opacity: 1, transform: "translateY(0)" }, { opacity: 0, transform: "translateY(-24px)" }],
  };
  const ms = (v, def) => (Number.isFinite(Number(v)) && Number(v) >= 0 ? Number(v) : def);

  // Muestra la tarjeta i: la anterior sale mientras la nueva entra (nunca se apilan).
  const mostrar = (i, animar) => {
    const token = ++tokenMostrar;
    const saliente = imgs[visible], entrante = imgs[1 - visible];
    const prev = tarjetas[indiceActual];
    saliente.getAnimations().forEach((a) => a.cancel());
    if (prev && saliente.dataset.on === "1") {
      saliente.animate(SALIDA[prev.transicionSalida] || SALIDA.fade, { duration: animar ? ms(prev.duracionSalida, 800) : 0, fill: "forwards", easing: "ease" });
    }
    saliente.dataset.on = "0";
    saliente.style.opacity = "0";
    indiceActual = i;
    const t = tarjetas[i];
    if (!t) return; // antes de la primera tarjeta: solo el fondo
    entrante.getAnimations().forEach((a) => a.cancel());
    entrante.dataset.on = "0";
    entrante.style.opacity = "0";
    let hecho = false;
    const entrar = () => {
      if (hecho || token !== tokenMostrar) return;
      hecho = true;
      entrante.dataset.on = "1";
      entrante.style.opacity = "1";
      entrante.animate(ENTRADA[t.transicionEntrada] || ENTRADA.fade, { duration: animar ? ms(t.duracionEntrada, 800) : 0, fill: "forwards", easing: "cubic-bezier(.2,.8,.2,1)" });
    };
    entrante.onload = entrar;
    entrante.onerror = () => { entrante.dataset.on = "0"; entrante.style.opacity = "0"; }; // la música sigue
    if (entrante.dataset.src !== t.imagen) { entrante.dataset.src = t.imagen; entrante.src = t.imagen; }
    if (entrante.complete && entrante.naturalWidth) entrar();
    visible = 1 - visible;
    precargar(i + 1);
  };
  const indicePara = (seg) => {
    let r = -1;
    for (let i = 0; i < tarjetas.length; i++) { if (tarjetas[i].tiempo <= seg) r = i; else break; }
    return r;
  };
  const sincronizar = (animar = true) => {
    const ended = audio.ended;
    if (ended !== finalMostrado) {
      finalMostrado = ended;
      $("final").classList.toggle("visible", ended);
      if (ended) {
        imgs.forEach((im) => { im.getAnimations().forEach((a) => a.cancel()); im.style.opacity = "0"; im.dataset.on = "0"; });
        indiceActual = -2;
        return;
      }
    }
    if (ended) return;
    const i = indicePara(audio.currentTime);
    if (i !== indiceActual) mostrar(i, animar);
  };
  precargar(0); precargar(1);

  // Un único bucle, ligado al tiempo real del audio (no hay temporizadores independientes).
  let saltando = false;
  audio.addEventListener("seeking", () => (saltando = true));
  audio.addEventListener("seeked", () => { saltando = false; sincronizar(true); pintarTiempo(); pintarPP(); });
  audio.addEventListener("ended", () => { sincronizar(); pintarTiempo(); });
  const bucle = () => { pintarTiempo(); if (!saltando) sincronizar(true); requestAnimationFrame(bucle); };
  requestAnimationFrame(bucle);

  // ---------------------------------------------------------------- Modos
  let wl = null;
  async function pedirPantallaEncendida() {
    try {
      const quiere = body.classList.contains("modo-tarjetas") && !audio.paused;
      if (quiere && !wl && "wakeLock" in navigator) {
        wl = await navigator.wakeLock.request("screen");
        wl.addEventListener("release", () => (wl = null));
      } else if (!quiere && wl) { wl.release(); wl = null; }
    } catch (_) { wl = null; }
  }
  document.addEventListener("visibilitychange", () => { if (!document.hidden) pedirPantallaEncendida(); });

  let timerOcultar, timerFondo;
  const actividad = () => {
    body.classList.remove("inactivo");
    clearTimeout(timerOcultar);
    if (body.classList.contains("modo-tarjetas")) timerOcultar = setTimeout(() => { if (!audio.paused) body.classList.add("inactivo"); }, 3000);
  };
  const setModo = (tarjetasOn) => {
    clearTimeout(timerFondo);
    if (tarjetasOn) {
      cargarFondo();
      capa.hidden = false;
      void capa.offsetWidth; // permite que el fundido de entrada se anime
    } else {
      // Detiene la animación del fondo cuando no se ve (ahorra batería); el audio no se toca.
      timerFondo = setTimeout(() => { if (!body.classList.contains("modo-tarjetas")) capa.hidden = true; }, 1100);
    }
    body.classList.toggle("modo-tarjetas", tarjetasOn);
    sincronizar(false); // si la canción va avanzada, aparece al instante la tarjeta que toca
    actividad();
    pedirPantallaEncendida();
  };
  $("verTarjetas").onclick = () => setModo(true);
  $("volver").onclick = () => setModo(false);
  ["pointermove", "pointerdown", "keydown", "touchstart"].forEach((e) => window.addEventListener(e, actividad, { passive: true }));
  audio.addEventListener("pause", actividad);

  // ---------------------------------------------------------------- Pantalla completa
  const el = document.documentElement;
  const pedirFS = el.requestFullscreen || el.webkitRequestFullscreen;
  const fsBtns = [...document.querySelectorAll("[data-fs]")];
  if (!pedirFS) fsBtns.forEach((b) => (b.hidden = true));
  const enFS = () => document.fullscreenElement || document.webkitFullscreenElement;
  fsBtns.forEach((b) => (b.onclick = async () => {
    try {
      if (enFS()) (document.exitFullscreen || document.webkitExitFullscreen).call(document);
      else {
        await pedirFS.call(el);
        // Solo si el navegador lo permite; si no, se ignora sin errores.
        if (screen.orientation && screen.orientation.lock) screen.orientation.lock("landscape").catch(() => {});
      }
    } catch (_) {}
  }));

  // ---------------------------------------------------------------- Controles del sistema y teclado
  if ("mediaSession" in navigator && window.MediaMetadata) {
    try {
      navigator.mediaSession.metadata = new MediaMetadata({
        title: cancion.titulo, artist: cancion.artista || "",
        artwork: cancion.portada ? [{ src: new URL(cancion.portada, location.href).href, sizes: "640x640" }] : [],
      });
      navigator.mediaSession.setActionHandler("play", toggle);
      navigator.mediaSession.setActionHandler("pause", toggle);
      navigator.mediaSession.setActionHandler("seekbackward", () => mover(-10));
      navigator.mediaSession.setActionHandler("seekforward", () => mover(10));
    } catch (_) {}
  }
  window.addEventListener("keydown", (e) => {
    if (e.target.tagName === "INPUT" || e.target.tagName === "BUTTON" || e.target.tagName === "A") {
      if (e.key !== "Escape") return;
    }
    if (e.code === "Space") { e.preventDefault(); toggle(); }
    else if (e.code === "ArrowRight") mover(5);
    else if (e.code === "ArrowLeft") mover(-5);
    else if (e.key === "Escape" && body.classList.contains("modo-tarjetas")) setModo(false);
  });
  pintarPP();
})();
