const mysql = require("mysql2/promise");
require("dotenv").config();

const db = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT,
    waitForConnections: true,
    connectionLimit: 10
});

async function probarConexion() {
    try {
        const conexion = await db.getConnection();
        console.log("MySQL conectado correctamente a Grass on Bugs");
        conexion.release();
    } catch (error) {
        console.error("Error al conectar con MySQL:", error.message);
    }
}

probarConexion();

module.exports = db;