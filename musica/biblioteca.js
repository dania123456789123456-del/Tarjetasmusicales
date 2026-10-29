// Biblioteca: genera las tarjetas a partir de canciones.json (sin límite de canciones).
// No hay controles de edición: la biblioteca pública solo lee la configuración.
(() => {
  const $ = (id) => document.getElementById(id);
  const grid = $("grid");
  const conteo = $("conteo");
  const capas = [...document.querySelectorAll(".ambiente .amb")];
  let capaActiva = 0;
  let ambienteActual = "";

  Comun.avisoRotar();

  // Luz ambiental: la portada seleccionada tiñe el fondo de toda la pantalla.
  const ambiente = (url) => {
    if (!url || url === ambienteActual || !capas.length) return;
    ambienteActual = url;
    const siguiente = 1 - capaActiva;
    capas[siguiente].style.backgroundImage = Comun.cssUrl(url);
    capas[siguiente].classList.add("activo");
    capas[capaActiva].classList.remove("activo");
    capaActiva = siguiente;
  };

  const esqueletos = () => {
    grid.innerHTML = "";
    for (let i = 0; i < 4; i++) {
      const s = document.createElement("div");
      s.className = "card esqueleto";
      s.innerHTML = '<div class="art"></div><div class="linea"></div><div class="linea corta"></div>';
      grid.appendChild(s);
    }
  };

  const mensaje = (texto, reintentar) => {
    grid.innerHTML = "";
    grid.setAttribute("aria-busy", "false");
    const p = document.createElement("div");
    p.className = "mensaje";
    p.setAttribute("role", "status");
    p.textContent = texto;
    if (reintentar) {
      const b = document.createElement("button");
      b.type = "button";
      b.className = "btn";
      b.textContent = "Intentar de nuevo";
      b.onclick = cargar;
      p.appendChild(document.createElement("br"));
      p.appendChild(b);
    }
    grid.appendChild(p);
  };

  const crearTarjeta = (c, i, ultima) => {
    const a = document.createElement("a");
    a.className = "card";
    a.href = "reproductor.html?id=" + encodeURIComponent(c.id);
    a.style.setProperty("--d", Math.min(i, 12) * 70 + "ms");
    if (c.portada) a.style.setProperty("--cover", Comun.cssUrl(c.portada));

    const art = document.createElement("div");
    art.className = "art";
    if (c.portada) {
      const img = document.createElement("img");
      img.src = c.portada;
      img.alt = "";
      img.loading = "lazy";
      img.decoding = "async";
      img.onerror = () => img.remove(); // sin portada: queda el degradado
      art.appendChild(img);
    }
    if (ultima === c.id) {
      const chip = document.createElement("div");
      chip.className = "chip";
      chip.innerHTML = '<span class="eq" aria-hidden="true"><i></i><i></i><i></i><i></i></span><span>Última</span>';
      chip.title = "La última que escuchaste";
      art.appendChild(chip);
    }
    const play = document.createElement("span");
    play.className = "play";
    play.innerHTML = '<svg class="i" viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5v14l11-7z"/></svg>';
    art.appendChild(play);

    const info = document.createElement("div");
    info.className = "info";
    const h = document.createElement("h2");
    h.textContent = c.titulo;
    info.appendChild(h);
    if (c.artista) {
      const p = document.createElement("p");
      p.className = "artist";
      p.textContent = c.artista;
      info.appendChild(p);
    }
    a.append(art, info);

    const activar = () => { ambiente(c.portada); };
    a.addEventListener("pointerenter", activar);
    a.addEventListener("focus", activar);
    a.addEventListener("pointerdown", () => a.classList.add("seleccion")); // efecto de selección al tocar
    return a;
  };

  async function cargar() {
    grid.setAttribute("aria-busy", "true");
    conteo.textContent = "";
    esqueletos();
    try {
      const { canciones } = await Comun.cargarCanciones();
      grid.setAttribute("aria-busy", "false");
      if (!canciones.length) {
        mensaje("Aún no hay canciones. Agrégalas en canciones.json y aparecerán aquí.");
        return;
      }
      const ultima = Comun.leer("biblio-ultima");
      grid.innerHTML = "";
      const frag = document.createDocumentFragment();
      canciones.forEach((c, i) => frag.appendChild(crearTarjeta(c, i, ultima)));
      grid.appendChild(frag);
      conteo.innerHTML = '<span class="eq" aria-hidden="true"><i></i><i></i><i></i><i></i></span>' +
        canciones.length + (canciones.length === 1 ? " canción" : " canciones");
      const inicial = canciones.find((c) => c.id === ultima) || canciones[0];
      ambiente(inicial.portada);
    } catch (e) {
      mensaje("No se pudo cargar la biblioteca. " + e.message + " Si abriste el archivo con doble clic, usa un servidor local o GitHub Pages.", true);
    }
  }
  cargar();

  // Al volver con el botón «atrás» del navegador, quita el efecto de selección pegado.
  window.addEventListener("pageshow", () => grid.querySelectorAll(".seleccion").forEach((e) => e.classList.remove("seleccion")));
})();
