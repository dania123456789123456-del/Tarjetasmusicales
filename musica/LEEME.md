# Nuestra música ❤️

Biblioteca musical romántica con reproductor y tarjetitas sincronizadas con la canción.
Es HTML, CSS y JavaScript puros: **no hay que compilar nada, no hay servidor propio y no depende de Lovable.**

## Qué contiene

```
index.html          ← redirige a biblioteca.html (cómodo si publicas la carpeta sola)
biblioteca.html     ← pantalla «Nuestra música ❤️»
biblioteca.js       ← genera las tarjetas desde canciones.json
reproductor.html    ← reproductor + vista de tarjetitas (se abre con ?id=<id-de-la-canción>)
reproductor.js      ← audio, progreso, volumen, sincronización y transiciones
comun.js            ← utilidades compartidas
estilos.css         ← todo el diseño
canciones.json      ← aquí agregas canciones y tarjetitas
canciones/          ← archivos .mp3
imagenes/           ← portadas y tarjetitas (tus imágenes originales)
fondos/             ← fondos animados, un HTML independiente por fondo
.nojekyll           ← evita que GitHub Pages procese la carpeta
```

## Publicar en GitHub Pages

1. Crea un repositorio (o usa el que ya tienes) y sube **todo el contenido de esta carpeta**. Puede ir en la raíz o dentro de una subcarpeta, por ejemplo `musica/`.
2. En GitHub: **Settings → Pages → Build and deployment**. En *Source* elige **Deploy from a branch**, selecciona la rama `main` y la carpeta `/ (root)`. Guarda.
3. Espera uno o dos minutos. Tu biblioteca quedará en
   `https://TU-USUARIO.github.io/TU-REPOSITORIO/` (o `.../musica/` si la pusiste en una subcarpeta).

Todas las rutas son **relativas**, así que funciona dentro de un repositorio y no solo en un dominio raíz.
No hay llamadas a servicios de Lovable. Lo único externo son las tipografías de Google Fonts; si no cargan, se usan tipografías del sistema y todo sigue funcionando.

### Integrarla en tu página principal
- Con un enlace: `<a href="musica/biblioteca.html">Nuestra música ❤️</a>`
- O incrustada: `<iframe src="musica/biblioteca.html" allow="autoplay; fullscreen" allowfullscreen style="border:0;width:100%;height:100dvh"></iframe>`
  (el atributo `allowfullscreen` es necesario para que funcione la pantalla completa dentro del iframe).

## Agregar una canción

1. Sube el `.mp3` a `canciones/`, la portada y las tarjetitas a `imagenes/`.
2. En `canciones.json`, copia uno de los bloques de `"canciones"` y cambia sus datos. La biblioteca mostrará la nueva tarjeta sin tocar el código; no hay límite de canciones.

```jsonc
{
  "id": "mi-cancion",                      // único, sin espacios ni tildes
  "titulo": "Mi canción",
  "artista": "Nombre (opcional)",
  "portada": "imagenes/portada-mi-cancion.jpg",
  "audio": "canciones/mi-cancion.mp3",
  "fondo": "fondos/estrellas.html",       // opcional
  "tarjetas": [
    {
      "id": "t-01",
      "tiempo": 0,                         // segundo en el que aparece
      "imagen": "imagenes/tarjeta-01.jpg",
      "transicionEntrada": "fade",         // fade | zoom | rise
      "transicionSalida": "fade",
      "duracionEntrada": 800,              // milisegundos
      "duracionSalida": 800
    }
  ]
}
```

(Los comentarios `//` son solo explicativos: no los copies, porque el JSON no los admite.)

- Las tarjetitas se muestran **completas** y sin deformar (`object-fit: contain`), sean verticales, cuadradas u horizontales. No se reconstruyen con HTML: se usan tus imágenes tal cual.
- `tiempo` se expresa en segundos y se compara con el tiempo real del audio.
- Fondos incluidos: `estrellas`, `flores`, `corazones`, `galaxia`. Para uno nuevo, crea un HTML en `fondos/` y apúntalo en `"fondo"`. Si falta o no carga, se usa un degradado y el audio sigue sonando.
- Si cambias `canciones.json`, recarga la página (el navegador puede tardar en refrescar archivos en GitHub Pages).

## Cómo funciona la pantalla
- Pensada para **teléfono en horizontal**, sin proporción fija: el panel del reproductor se calcula con el alto y ancho reales disponibles y respeta las áreas seguras (notch, barras).
- En vertical aparece un aviso discreto («Gira tu dispositivo…») que se puede cerrar; no bloquea nada y la app sigue siendo usable.
- Modo tarjetitas: los controles se ocultan a los 3 segundos si suena la música y reaparecen al tocar la pantalla.
- Teclado (en computadora): `Espacio` reproduce/pausa, `←`/`→` ±5 s, `Esc` vuelve al reproductor.

## Probar en tu computadora
Los navegadores bloquean `fetch` al abrir con doble clic (`file://`). Usa un servidor local:
`python3 -m http.server` dentro de la carpeta y abre `http://localhost:8000/`.

---

## Qué se probó y qué no

**Probado en un Chromium automatizado, con el audio real de demostración:**
sin reproducción automática; reproducir y pausar; barra de progreso (clic al 50 %); saltos hacia delante y atrás con la tarjeta correcta en cada instante; la pausa mantiene la tarjeta; cambiar de vista no reinicia ni duplica el audio; entrar a las tarjetitas con la canción avanzada muestra al instante la que corresponde; fin de la canción y «Escuchar otra vez»; una sola imagen visible a la vez; proporción original de una tarjeta vertical; orden de capas (fondo < tarjetas < controles); ocultar y mostrar controles; biblioteca con 40 canciones, vacía, con error de JSON y con estado de carga; audio, imagen, fondo o portada que faltan sin interrumpir lo demás. Sin desbordes en 932×430, 844×390, 667×375, 1180×820, 1920×1080, 2400×900 y vertical 390×844. 

**No pude probarlo; compruébalo en tu teléfono:**
- Pantalla completa y bloqueo de orientación (dependen del navegador; si no están permitidos, se ignoran).
- Que la pantalla no se apague en la vista de tarjetitas (usa *Wake Lock*, no disponible en todos los navegadores).
- Controles en la pantalla de bloqueo (*Media Session*).
- Volumen en iPhone: iOS no permite cambiarlo por código; ahí solo funciona el botón de silencio.
- Aspecto con las tipografías de Google Fonts (en mi entorno no tuve internet y se vieron las tipografías de respaldo).
- Publicación real en GitHub Pages: las rutas son relativas y la lógica es estándar, pero no pude desplegarla.
