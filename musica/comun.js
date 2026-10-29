// Utilidades compartidas. Todas las rutas son relativas para funcionar en GitHub Pages
// (usuario.github.io/repositorio/...) y también dentro de un iframe en tu página principal.
window.Comun = {
  async cargarCanciones() {
    const r = await fetch("canciones.json", { cache: "no-cache" });
    if (!r.ok) throw new Error("No se pudo cargar canciones.json (código " + r.status + ").");
    let data;
    try { data = await r.json(); } catch (_) { throw new Error("canciones.json no tiene un formato válido."); }
    const lista = Array.isArray(data) ? data : data && data.canciones;
    if (!Array.isArray(lista)) throw new Error("canciones.json debe contener una lista «canciones».");
    const canciones = lista
      .filter((c) => c && c.id && c.titulo)
      .map((c) => ({
        ...c,
        tarjetas: (Array.isArray(c.tarjetas) ? c.tarjetas : [])
          .filter((t) => t && t.imagen && Number.isFinite(Number(t.tiempo)))
          .map((t) => ({ ...t, tiempo: Number(t.tiempo) }))
          .sort((a, b) => a.tiempo - b.tiempo),
      }));
    return { ...(Array.isArray(data) ? {} : data), canciones };
  },
  formato(s) {
    if (!isFinite(s) || s < 0) s = 0;
    const m = Math.floor(s / 60), x = Math.floor(s % 60);
    return m + ":" + String(x).padStart(2, "0");
  },
  // localStorage puede fallar (iframes con almacenamiento bloqueado): nunca debe romper la app.
  leer(k) { try { return localStorage.getItem(k); } catch (_) { return null; } },
  guardar(k, v) { try { localStorage.setItem(k, v); } catch (_) {} },
  cssUrl(ruta) { return 'url("' + String(ruta).replace(/["\\\n]/g, encodeURIComponent) + '")'; },
  // Color dominante de la portada (misma procedencia → sin problemas de CORS). Devuelve [r,g,b] o null.
  colorDominante(url) {
    return new Promise((res) => {
      const im = new Image();
      im.onload = () => {
        try {
          const c = document.createElement("canvas");
          c.width = c.height = 16;
          const x = c.getContext("2d", { willReadFrequently: true });
          x.drawImage(im, 0, 0, 16, 16);
          const d = x.getImageData(0, 0, 16, 16).data;
          let r = 0, g = 0, b = 0, n = 0;
          for (let i = 0; i < d.length; i += 4) {
            const mx = Math.max(d[i], d[i + 1], d[i + 2]), mn = Math.min(d[i], d[i + 1], d[i + 2]);
            const w = 0.15 + (mx - mn) / 255 + mx / 600; // favorece píxeles vivos y luminosos
            r += d[i] * w; g += d[i + 1] * w; b += d[i + 2] * w; n += w;
          }
          r /= n; g /= n; b /= n;
          const f = Math.min(2.4, 210 / (Math.max(r, g, b) || 1));
          res([r, g, b].map((v) => Math.min(255, Math.round(v * f))));
        } catch (_) { res(null); }
      };
      im.onerror = () => res(null);
      im.src = url;
    });
  },
  avisoRotar() {
    const d = document.createElement("div");
    d.className = "rotar glass";
    d.setAttribute("role", "status");
    d.innerHTML =
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true"><rect x="7" y="2" width="10" height="20" rx="2.5"/><circle cx="12" cy="18.5" r=".6" fill="currentColor"/></svg>' +
      "<span>Gira tu dispositivo para disfrutar la experiencia ❤️</span>" +
      '<button type="button" aria-label="Cerrar aviso">×</button>';
    d.querySelector("button").onclick = () => d.classList.add("cerrado");
    document.body.appendChild(d);
  },
};
