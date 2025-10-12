document.addEventListener("DOMContentLoaded", () => {
  const estudiantes = [
    { nombre: "YHORDY ALEXANDER BAUTISTA FLORES", grado: "QUINTO" },
    { nombre: "ARMIN DENIS QUISPE MAMANI", grado: "SEXTO" },
    { nombre: "NELVIN EZEQUIEL ESPEJO QUISPE", grado: "SEXTO" },
    { nombre: "ALEJANDRO MATIAS CASTILLO FLORES", grado: "SEXTO" },
    { nombre: "ASBEL JESUS QUISPE MAMANI", grado: "SEXTO" },
    { nombre: "ARACELI BRIANCA QUISPE CARRILLO", grado: "PRIMERO" },
    { nombre: "LIZETH LUNA QUISPE AMARU", grado: "PRIMERO" },
    { nombre: "LEONEL ALEXANDER LUNA MERLO", grado: "PRIMERO" },
    { nombre: "DAVID SACARIAS YUJRA", grado: "PRIMERO" },
    { nombre: "SEBASTIAN DAVIDE CEREZO ADUVIRI", grado: "PRIMERO" }
  ];

  const urlSheetBest = "https://api.sheetbest.com/sheets/a3821c85-4ed7-4cb8-907d-511764a94fb9";
  const tbody = document.querySelector("#tablaAsistencia tbody");
  const thead = document.querySelector("#tablaAsistencia thead tr");
  const fechaInput = document.getElementById("fecha");
  const agregarFechaBtn = document.getElementById("agregarFecha");
  const form = document.getElementById("asistenciaForm");
  const modalExito = document.getElementById("modalExito");
  const btnCerrar = document.getElementById("btnCerrar");
  const btnDescargar = document.getElementById("btnDescargar");
  const loadingDiv = document.getElementById("loading");
  const btnRegistrar = document.querySelector(".btn-registrar");

  // --- CREAR FILAS CON NUMERACIÓN ---
  estudiantes.forEach((est, idx) => {
    const tr = document.createElement("tr");
    tr.innerHTML = `<td>${idx + 1}</td><td>${est.nombre}</td><td>${est.grado}</td>`;
    tbody.appendChild(tr);
  });

  // --- AGREGAR NUEVA COLUMNA DE FECHA ---
  agregarFechaBtn.addEventListener("click", () => {
    const fechaISO = fechaInput.value;
    if (!fechaISO) return alert("Selecciona una fecha primero.");

    const [anio, mes, dia] = fechaISO.split("-");
    const fechaFormateada = `${dia}-${mes}-${anio}`;

    const columnasExistentes = Array.from(thead.querySelectorAll("th")).map(th => th.textContent);
    if (columnasExistentes.includes(fechaFormateada))
      return alert("Esta fecha ya fue agregada.");

    // Agregar encabezado
    const th = document.createElement("th");
    th.textContent = fechaFormateada;
    thead.appendChild(th);

    // Agregar select de asistencia a cada fila
    tbody.querySelectorAll("tr").forEach(tr => {
      const td = document.createElement("td");
      td.innerHTML = `
        <select required>
          <option value="">--</option>
          <option value="P">🟢 Presente</option>
          <option value="A">🟡 Atraso</option>
          <option value="F">🔴 Falta</option>
          <option value="L">🔵 Licencia</option>
        </select>
      `;
      tr.appendChild(td);
    });
  });

  // --- ENVÍO DEL FORMULARIO ---
  form.addEventListener("submit", async e => {
    e.preventDefault();

    const fechaColumna = Array.from(thead.querySelectorAll("th"))
      .slice(3) // N°, Nombre, Grado = columnas fijas
      .map(th => th.textContent);

    if (fechaColumna.length === 0) return alert("Agrega al menos una fecha.");

    // Validar selects
    for (const tr of tbody.querySelectorAll("tr")) {
      for (let i = 3; i < tr.cells.length; i++) {
        if (!tr.cells[i].querySelector("select").value) {
          return alert("Debes llenar toda la asistencia antes de enviar.");
        }
      }
    }

    loadingDiv.style.display = "block";
    btnRegistrar.disabled = true;

    try {
      const filas = tbody.querySelectorAll("tr");
      const filaInicio = 2; // D2 = fila 2 en SheetBest

      for (let i = 0; i < fechaColumna.length; i++) {
        const fecha = fechaColumna[i];

        for (let index = 0; index < filas.length; index++) {
          const tr = filas[index];
          const asistencia = tr.cells[i + 3].querySelector("select").value; // +3 por N°, Nombre, Grado

          await fetch(`${urlSheetBest}/${index + filaInicio}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ [fecha]: asistencia })
          });
        }
      }

      modalExito.style.display = "flex";
    } catch (error) {
      console.error("Error al enviar:", error);
      alert("Ocurrió un error al enviar la asistencia. Revisa la conexión o la hoja.");
    } finally {
      loadingDiv.style.display = "none";
      btnRegistrar.disabled = false;
    }
  });

  // --- CERRAR MODAL ---
  btnCerrar.addEventListener("click", () => (modalExito.style.display = "none"));

  // --- DESCARGAR PDF ---
// --- DESCARGAR PDF ---
btnDescargar.addEventListener("click", () => {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();

  // --- Fecha y hora actual ---
const ahora = new Date();
const opcionesFecha = { day: '2-digit', month: '2-digit', year: 'numeric' };
const opcionesHora = { hour: '2-digit', minute: '2-digit', second: '2-digit' };
const fechaActual = ahora.toLocaleDateString('es-BO', opcionesFecha);
const horaActual = ahora.toLocaleTimeString('es-BO', opcionesHora);

// --- Encabezado del PDF ---
doc.setFontSize(14);
doc.text("REGISTRO DE ASISTENCIA", 14, 15);
doc.text("BANDA DE MÚSICA UE JUPAPINA", 14, 22);
doc.text("Prof. Humberto Yupanqui C.", 14, 29);

// --- Fecha y hora en una sola línea ---
doc.setFontSize(10);
doc.text(`Fecha y hora de descarga: ${fechaActual} ${horaActual}`, 14, 36);


  // --- Datos de tabla ---
  const columnas = Array.from(thead.querySelectorAll("th")).map(th => th.textContent);
  const filasPDF = Array.from(tbody.querySelectorAll("tr")).map(tr =>
    Array.from(tr.querySelectorAll("td")).map(td =>
      td.querySelector("select") ? td.querySelector("select").value : td.textContent
    )
  );

  doc.autoTable({
    head: [columnas],
    body: filasPDF,
    startY: 48, // bajamos el inicio para no chocar con la fecha/hora
    styles: { fontSize: 10 },
    headStyles: { fillColor: [41, 128, 185], textColor: 255 },
    theme: "grid"
  });

  // --- Guardar PDF ---
  const nombreArchivo = `Asistencia_UE_Jupapina_${fechaActual.replace(/\//g, '-')}.pdf`;
  doc.save(nombreArchivo);
  modalExito.style.display = "none";
});


  window.addEventListener("click", event => {
    if (event.target === modalExito) modalExito.style.display = "none";
  });
});
