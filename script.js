const API = "https://api.spaceflightnewsapi.net/v4/articles/";
const LIMITE = 9;

const lista = document.getElementById("noticias");
const mensaje = document.getElementById("mensaje");
const info = document.getElementById("info");
const buscador = document.getElementById("buscador");
const campoBusqueda = document.getElementById("busqueda");
const botonActualizar = document.getElementById("btn-actualizar");

// pide las noticias a la API y regresa la lista ya convertida de JSON
async function pedirNoticias(texto) {
  const url = new URL(API);
  url.searchParams.set("limit", LIMITE);
  url.searchParams.set("ordering", "-published_at");
  if (texto) url.searchParams.set("search", texto);

  // si la API no responde en 8 segundos se cancela la petición
  const control = new AbortController();
  const temporizador = setTimeout(() => control.abort(), 8000);

  try {
    const respuesta = await fetch(url, { signal: control.signal });
    if (!respuesta.ok) {
      const error = new Error("La API respondió con error");
      error.estado = respuesta.status;
      throw error;
    }
    const datos = await respuesta.json();
    return datos.results;
  } finally {
    clearTimeout(temporizador);
  }
}

function textoDeError(error) {
  if (error.name === "AbortError") {
    return "La API tardó demasiado en responder. Inténtalo de nuevo.";
  }
  if (error.estado) {
    return `La API no está disponible en este momento (error ${error.estado}).`;
  }
  if (error instanceof SyntaxError) {
    return "La API devolvió datos que no se pueden leer.";
  }
  return "No se pudo conectar con la API. Revisa tu conexión a internet.";
}

function mostrarMensaje(texto, tipo, cargando = false) {
  mensaje.className = `alert alert-${tipo}`;
  mensaje.textContent = "";
  if (cargando) {
    const giro = document.createElement("span");
    giro.className = "spinner";
    mensaje.appendChild(giro);
  }
  mensaje.append(texto);
  mensaje.hidden = false;
}

async function cargarNoticias() {
  botonActualizar.disabled = true;
  lista.textContent = "";
  info.textContent = "";
  mostrarMensaje("Cargando noticias…", "info", true);

  try {
    const noticias = await pedirNoticias(campoBusqueda.value.trim());

    if (!noticias || noticias.length === 0) {
      mostrarMensaje("No hay noticias disponibles para esta búsqueda.", "warning");
      return;
    }

    mensaje.hidden = true;
    noticias.forEach(function (noticia) {
      lista.appendChild(crearTarjeta(noticia));
    });

    const hora = new Date().toLocaleTimeString("es-MX");
    info.textContent = `${noticias.length} noticias · actualizado a las ${hora}`;
  } catch (error) {
    mostrarMensaje(textoDeError(error), "danger");
  } finally {
    botonActualizar.disabled = false;
  }
}

function elemento(etiqueta, clase, texto) {
  const el = document.createElement(etiqueta);
  if (clase) el.className = clase;
  if (texto) el.textContent = texto;
  return el;
}

// arma la tarjeta de una noticia con los datos del JSON
function crearTarjeta(noticia) {
  const tarjeta = elemento("article", "noticia card");
  const cuerpo = elemento("div", "card-body");

  const fecha = new Date(noticia.published_at).toLocaleString("es-MX", {
    dateStyle: "medium",
    timeStyle: "short",
  });
  const meta = elemento("div", "meta");
  meta.appendChild(elemento("span", "badge", noticia.news_site || "Fuente"));
  meta.appendChild(elemento("span", "fecha", fecha));

  const titulo = elemento("h2", "titulo");
  const boton = elemento("button", "titulo-btn", noticia.title);
  boton.type = "button";
  boton.setAttribute("aria-expanded", "false");
  titulo.appendChild(boton);

  const detalle = elemento("div", "detalle");
  detalle.hidden = true;
  detalle.appendChild(elemento("p", "resumen", noticia.summary));

  const autores = (noticia.authors || []).map((a) => a.name).join(", ");
  if (autores) detalle.appendChild(elemento("p", "autor", `Por ${autores}`));

  const enlace = elemento("a", "btn btn-primary btn-sm", "Leer nota completa");
  if (/^https?:\/\//.test(noticia.url)) enlace.href = noticia.url;
  enlace.target = "_blank";
  enlace.rel = "noopener noreferrer";
  detalle.appendChild(enlace);

  // al hacer clic en el título se muestra u oculta el resumen
  boton.addEventListener("click", function () {
    const abrir = detalle.hidden;
    detalle.hidden = !abrir;
    boton.setAttribute("aria-expanded", abrir);
    tarjeta.classList.toggle("abierta", abrir);
  });

  cuerpo.append(meta, titulo, detalle);
  tarjeta.appendChild(cuerpo);
  return tarjeta;
}

buscador.addEventListener("submit", function (e) {
  e.preventDefault();
  cargarNoticias();
});
botonActualizar.addEventListener("click", cargarNoticias);

cargarNoticias();
