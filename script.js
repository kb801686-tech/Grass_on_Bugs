
// Dirección pública del backend
const API_URL = "https://grass-on-bugs.onrender.com";

// Elementos principales
const input = document.getElementById("imageInput");
const preview = document.getElementById("preview");
const previewImage = document.getElementById("previewImage");
const fileName = document.getElementById("fileName");
const dropArea = document.getElementById("dropArea");

// Mostrar imagen seleccionada
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

// Enviar fotografía al backend
async function uploadImage(file) {
    if (!file || !file.type.startsWith("image/")) return;

    const formData = new FormData();
    formData.append("image", file);

    try {
        const response = await fetch(`${API_URL}/api/identify`, {
            method: "POST",
            body: formData
        });

        const result = await response.json();

        if (!response.ok) {
            throw new Error(result.error || "Error al enviar la imagen");
        }

        console.log("Respuesta del backend:", result);
        alert("¡Fotografía enviada correctamente!");

    } catch (error) {
        console.error("Error al identificar:", error);
        alert("No se pudo enviar la fotografía: " + error.message);
    }
}

// Procesar fotografía
function processImage(file) {
    if (!file || !file.type.startsWith("image/")) {
        alert("Selecciona una imagen válida.");
        return;
    }

    showImage(file);
    uploadImage(file);
}

// Seleccionar fotografía
input.addEventListener("change", (e) => {
    processImage(e.target.files[0]);
});

// Eliminar fotografía
document.getElementById("removeImage").addEventListener("click", () => {
    input.value = "";
    previewImage.removeAttribute("src");
    preview.hidden = true;
    fileName.textContent = "";
});

// Mostrar u ocultar consejos
document.getElementById("tipsButton").addEventListener("click", () => {
    const tips = document.getElementById("tips");

    tips.hidden = !tips.hidden;

    document.getElementById("tipsButton").textContent =
        tips.hidden ? "Consejos para la foto" : "Ocultar consejos";
});

// Arrastrar fotografías
["dragenter", "dragover"].forEach((name) => {
    dropArea.addEventListener(name, (e) => {
        e.preventDefault();
        dropArea.classList.add("dragover");
    });
});

["dragleave", "drop"].forEach((name) => {
    dropArea.addEventListener(name, (e) => {
        e.preventDefault();
        dropArea.classList.remove("dragover");
    });
});

// Soltar fotografía
dropArea.addEventListener("drop", (e) => {
    const file = e.dataTransfer.files[0];
    processImage(file);
});
