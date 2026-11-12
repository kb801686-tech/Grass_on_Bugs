
const express = require("express");
const cors = require("cors");
const multer = require("multer");
require("dotenv").config();

const db = require("./database");
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

app.get("/api/db-test", async (req, res) => {
    try {
        const [filas] = await db.query(
            "SELECT COUNT(*) AS total FROM insectos"
        );

        res.json({
            estado: "correcto",
            mensaje: "Conexión con MySQL exitosa",
            insectos_registrados: filas[0].total
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({
            estado: "error",
            mensaje: error.message
        });
    }
});

// Prueba de conexión con Gemini
app.get("/api/gemini-test", async (req, res) => {
    try {
        const { GoogleGenAI } = await import("@google/genai");

        const ai = new GoogleGenAI({
            apiKey: process.env.GEMINI_API_KEY
        });

        const response = await ai.models.generateContent({
            model: "gemini-3.5-flash-lite",
            contents: "Responde únicamente: Grass on Bugs conectado con Gemini."
        });

        res.json({
            estado: "correcto",
            mensaje: response.text
        });

    } catch (error) {
        console.error("Error de Gemini:", error.message);

        res.status(500).json({
            estado: "error",
            mensaje: error.message
        });
    }
});

// Ruta para recibir fotografías

app.post("/api/identify", upload.single("image"), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({
                error: "No se recibió ninguna imagen"
            });
        }

        // Conectar con Gemini
        const { GoogleGenAI } = await import("@google/genai");

        const ai = new GoogleGenAI({
            apiKey: process.env.GEMINI_API_KEY
        });

        // Convertir la fotografía a Base64
        const imagenBase64 = req.file.buffer.toString("base64");

        // Instrucciones para analizar el insecto
        const prompt = `
        Analiza cuidadosamente esta fotografía para Grass on Bugs,
        un proyecto educativo sobre insectos y plantas de Colombia.

        Responde en español utilizando esta estructura:

        Nombre común:
        Nombre científico (si es posible):
        Descripción:
        Relación con las plantas:
        ¿Es beneficioso o perjudicial?
        Nivel de riesgo: Bajo, medio, alto o desconocido.
        Recomendaciones:

        IMPORTANTE:
        - No inventes identificaciones.
        - Si no puedes reconocer el insecto, indícalo.
        - Si no puedes determinar la especie, acláralo.
        - No recomiendes pesticidas peligrosos.
        - Distingue entre información confirmada y estimaciones.
        `;

        // Analizar la fotografía
        const response = await ai.models.generateContent({
            model: "gemini-3.5-flash-lite",
            contents: [
                {
                    inlineData: {
                        mimeType: req.file.mimetype,
                        data: imagenBase64
                    }
                },
                prompt
            ]
        });

        const resultadoIA = response.text;

        if (!resultadoIA) {
            throw new Error("Gemini no devolvió un resultado");
        }

        // Guardar el resultado en MySQL
        const [registro] = await db.query(
            `INSERT INTO identificaciones
            (nombre_archivo, resultado)
            VALUES (?, ?)`,
            [req.file.originalname, resultadoIA]
        );

        // Responder al frontend
        res.json({
            estado: "correcto",
            mensaje: "Insecto analizado y registrado correctamente",
            id_identificacion: registro.insertId,
            archivo: req.file.originalname,
            resultado: resultadoIA
        });

    } catch (error) {
        console.error("Error al identificar:", error);

        res.status(500).json({
            estado: "error",
            mensaje: "No se pudo analizar la fotografía"
        });
    }
});

// Iniciar servidor
app.listen(PORT, () => {
    console.log(
        `Grass on Bugs funcionando en http://localhost:${PORT}`
    );
});
