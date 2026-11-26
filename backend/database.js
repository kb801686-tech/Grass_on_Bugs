const mysql = require("mysql2/promise");
require("dotenv").config();

const db = mysql.createPool({
    uri: process.env.DATABASE_URL,
    ssl: {}
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