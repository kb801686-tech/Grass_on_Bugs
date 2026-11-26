const API_URL = "https://grass-on-bugs.onrender.com";

// ELEMENTOS PRINCIPALES
const input = document.getElementById("imageInput");
const preview = document.getElementById("preview");
const previewImage = document.getElementById("previewImage");
const fileName = document.getElementById("fileName");
const dropArea = document.getElementById("dropArea");

const loadingMessage = document.getElementById("loadingMessage");
const errorMessage = document.getElementById("errorMessage");

const identificationResult = document.getElementById("identificationResult");
const resultContent = document.getElementById("resultContent");

const historyList = document.getElementById("historyList");
const historyCount = document.getElementById("historyCount");

const questionForm = document.getElementById("questionForm");
const questionInput = document.getElementById("questionInput");
const chatMessages = document.getElementById("chatMessages");
const questionStatus = document.getElementById("questionStatus");
const sendQuestion = document.getElementById("sendQuestion");

let currentInsectInfo = "";
let analyzing = false;

// ======================================
// MOSTRAR IMAGEN
// ======================================

function showImage(file) {
    if (!file || !file.type.startsWith("image/")) return;

    const reader = new FileReader();

    reader.onload = (e) => {
        previewImage.src = e.target.result;
        fileName.textContent = file.name;
        preview.hidden = false;
    };

    reader.readAsDataURL(file);
}

// ======================================
// MENSAJES DE ESTADO
// ======================================

function showError(message) {
    errorMessage.textContent = message;
    errorMessage.hidden = false;
}

function hideError() {
    errorMessage.textContent = "";
    errorMessage.hidden = true;
}

// ======================================
// IDENTIFICAR INSECTO
// ======================================

async function identifyImage(file) {
    if (analyzing) return;

    if (!file || !file.type.startsWith("image/")) {
        showError("Selecciona una imagen válida.");
        return;
    }

    if (file.size > 5 * 1024 * 1024) {
        showError("La imagen supera el límite de 5 MB.");
        return;
    }

    analyzing = true;

    hideError();
    identificationResult.hidden = true;
    loadingMessage.hidden = false;

    currentInsectInfo = "";

    try {
        const formData = new FormData();
        formData.append("image", file);

        const response = await fetch(`${API_URL}/api/identify`, {
            method: "POST",
            body: formData
        });

        const result = await response.json();

        if (!response.ok || result.estado !== "correcto") {
            throw new Error(
                result.mensaje || result.error || "No se pudo analizar la imagen."
            );
        }

        currentInsectInfo = result.resultado;

        renderResult(result.resultado);

        identificationResult.hidden = false;

        // Reiniciar conversación
        resetChat();

        // Actualizar historial
        await loadHistory();

        // Mostrar resultados
        identificationResult.scrollIntoView({
            behavior: "smooth",
            block: "start"
        });

    } catch (error) {
        console.error("Error al identificar:", error);
        showError(error.message || "No se pudo conectar con el servidor.");
    } finally {
        analyzing = false;
        loadingMessage.hidden = true;
    }
}

// ======================================
// MOSTRAR RESULTADO DE GEMINI
// ======================================

function renderResult(text) {
    resultContent.replaceChildren();

    const container = document.createElement("div");
    container.className = "result-text";

    const lines = String(text).split("\n");

    const labels = [
        "Nombre común:",
        "Nombre cientifico:",
        "Nombre científico:",
        "Descripción:",
        "Relacion con las plantas:",
        "Relación con las plantas:",
        "¿Es beneficioso o perjudicial?",
        "Nivel de riesgo:",
        "Recomendaciones:"
    ];

    lines.forEach((line) => {
        const paragraph = document.createElement("p");
        const cleanLine = line.trim();

        if (!cleanLine) {
            paragraph.className = "result-space";
            paragraph.textContent = " ";
        } else {
            const label = labels.find((item) =>
                cleanLine.toLowerCase().startsWith(item.toLowerCase())
            );

            if (label) {
                const strong = document.createElement("strong");
                strong.textContent = label + " ";

                paragraph.appendChild(strong);
                paragraph.appendChild(
                    document.createTextNode(cleanLine.slice(label.length).trim())
                );
            } else {
                paragraph.textContent = cleanLine;
            }
        }

        container.appendChild(paragraph);
    });

    resultContent.appendChild(container);
}

// ======================================
// CONSEJOS PARA FOTOGRAFIAR
// ======================================

document.getElementById("tipsButton").addEventListener("click", () => {
    const tips = document.getElementById("tips");

    tips.hidden = !tips.hidden;

    document.getElementById("tipsButton").textContent =
        tips.hidden ? "Consejos para la foto" : "Ocultar consejos";
});

// ======================================
// SELECCIONAR IMAGEN
// ======================================

input.addEventListener("change", (e) => {
    const file = e.target.files[0];

    if (!file) return;

    showImage(file);
    identifyImage(file);
});

// ======================================
// ELIMINAR IMAGEN
// ======================================

document.getElementById("removeImage").addEventListener("click", () => {
    if (analyzing) return;

    input.value = "";
    previewImage.removeAttribute("src");
    preview.hidden = true;
    fileName.textContent = "";
    hideError();
});

// ======================================
// ARRASTRAR Y SOLTAR IMÁGENES
// ======================================

["dragenter", "dragover"].forEach((eventName) => {
    dropArea.addEventListener(eventName, (e) => {
        e.preventDefault();
        dropArea.classList.add("dragover");
    });
});

["dragleave", "drop"].forEach((eventName) => {
    dropArea.addEventListener(eventName, (e) => {
        e.preventDefault();
        dropArea.classList.remove("dragover");
    });
});

dropArea.addEventListener("drop", (e) => {
    const file = e.dataTransfer.files[0];

    if (!file) return;

    input.value = "";
    showImage(file);
    identifyImage(file);
});

// ======================================
// HISTORIAL
// ======================================

async function loadHistory() {
    historyList.innerHTML =
        '<p class="history-loading">Cargando historial...</p>';

    try {
        const response = await fetch(`${API_URL}/api/history`);
        const data = await response.json();

        if (!response.ok || data.estado !== "correcto") {
            throw new Error("No se pudo cargar el historial.");
        }

        historyList.replaceChildren();

        historyCount.textContent =
            `${data.total} ${data.total === 1 ? "registro" : "registros"}`;

        if (!data.historial || data.historial.length === 0) {
            historyList.innerHTML =
                '<p class="history-loading">Todavía no tienes identificaciones.</p>';
            return;
        }

        data.historial.forEach((item) => {
            const button = document.createElement("button");
            button.type = "button";
            button.className = "history-item";

            const info = document.createElement("div");
            info.className = "history-info";

            const name = document.createElement("strong");
            name.textContent = item.nombre_archivo;

            const date = document.createElement("small");

            date.textContent = new Date(item.fecha).toLocaleString("es-CO", {
                dateStyle: "medium",
                timeStyle: "short"
            });

            info.appendChild(name);
            info.appendChild(date);

            const arrow = document.createElement("span");
            arrow.textContent = "↗";

            button.appendChild(info);
            button.appendChild(arrow);

            button.addEventListener("click", () => {
                loadHistoryDetail(item.id_identificacion);
            });

            historyList.appendChild(button);
        });

    } catch (error) {
        console.error("Error al cargar historial:", error);

        historyList.innerHTML =
            '<p class="history-loading">No se pudo cargar el historial. Intenta nuevamente.</p>';
    }
}

// ======================================
// RECUPERAR IDENTIFICACIÓN ANTERIOR
// ======================================

async function loadHistoryDetail(id) {
    try {
        identificationResult.hidden = true;
        loadingMessage.hidden = false;
        hideError();

        const response = await fetch(`${API_URL}/api/history/${id}`);
        const data = await response.json();

        if (!response.ok || data.estado !== "correcto") {
            throw new Error(
                data.mensaje || "No se pudo recuperar esta identificación."
            );
        }

        const identificacion = data.identificacion;

        currentInsectInfo = identificacion.resultado;

        renderResult(currentInsectInfo);

        identificationResult.hidden = false;

        resetChat();

        identificationResult.scrollIntoView({
            behavior: "smooth",
            block: "start"
        });

    } catch (error) {
        console.error("Error al recuperar historial:", error);
        showError(error.message);
    } finally {
        loadingMessage.hidden = true;
    }
}

// ======================================
// CHAT
// ======================================

function addChatMessage(message, sender) {
    const bubble = document.createElement("div");

    bubble.className = `chat-bubble ${sender}`;
    bubble.textContent = message;

    chatMessages.appendChild(bubble);

    chatMessages.scrollTop = chatMessages.scrollHeight;
}

function resetChat() {
    chatMessages.replaceChildren();

    addChatMessage(
        "¡Hola! 🐛 Ya conozco la información de este insecto. ¿Qué te gustaría saber?",
        "assistant"
    );

    questionInput.value = "";
    questionStatus.textContent = "";
}

// ======================================
// HACER PREGUNTAS A GEMINI
// ======================================

questionForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const question = questionInput.value.trim();

    if (!question || !currentInsectInfo) return;

    addChatMessage(question, "user");

    questionInput.value = "";
    questionInput.disabled = true;
    sendQuestion.disabled = true;

    questionStatus.textContent = "Gemini está preparando una respuesta...";

    try {
        const response = await fetch(`${API_URL}/api/ask`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                question,
                insectInfo: currentInsectInfo
            })
        });

        const data = await response.json();

        if (!response.ok || data.estado !== "correcto") {
            throw new Error(
                data.mensaje || "No se pudo obtener una respuesta."
            );
        }

        addChatMessage(data.respuesta, "assistant");

        questionStatus.textContent = "";

    } catch (error) {
        console.error("Error en el chat:", error);

        questionStatus.textContent = error.message;

    } finally {
        questionInput.disabled = false;
        sendQuestion.disabled = false;
        questionInput.focus();
    }
});

// ======================================
// NUEVO ANÁLISIS
// ======================================

document.getElementById("newAnalysis").addEventListener("click", () => {
    input.value = "";
    previewImage.removeAttribute("src");

    preview.hidden = true;
    identificationResult.hidden = true;
    loadingMessage.hidden = true;

    fileName.textContent = "";
    currentInsectInfo = "";

    hideError();

    document.getElementById("escanear").scrollIntoView({
        behavior: "smooth"
    });
});

// ======================================
// INICIAR HISTORIAL
// ======================================

loadHistory();