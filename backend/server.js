
const express = require("express");
const cors = require("cors");
const multer = require("multer");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 3000;

// Configuración general
app.use(cors());
app.use(express.json());

// Configuración para recibir imágenes
const storage = multer.memoryStorage();

const upload = multer({
    storage: storage,
    limits: {
        fileSize: 5 * 1024 * 1024
    },
    fileFilter: (req, file, cb) => {
        if (file.mimetype.startsWith("image/")) {
            cb(null, true);
        } else {
            cb(new Error("Solo se permiten imágenes"));
        }
    }
});

// Ruta de comprobación
app.get("/api/health", (req, res) => {
    res.json({
        estado: "correcto",
        proyecto: "Grass on Bugs",
        mensaje: "El backend está funcionando"
    });
});

// Ruta para recibir fotografías
app.post("/api/identify", upload.single("image"), (req, res) => {

    if (!req.file) {
        return res.status(400).json({
            error: "No se recibió ninguna imagen"
        });
    }

    res.json({
        estado: "correcto",
        mensaje: "Fotografía recibida correctamente",
        archivo: req.file.originalname,
        tipo: req.file.mimetype,
        tamanio: req.file.size
    });
});

// Iniciar servidor
app.listen(PORT, () => {
    console.log(
        `Grass on Bugs funcionando en http://localhost:${PORT}`
    );
});
