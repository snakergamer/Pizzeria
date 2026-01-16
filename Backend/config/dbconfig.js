const mysql = require('mysql2');

const connection = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'obed2008',
    database: 'pizzeria_db'
});

connection.connect(error => {
    if (error) {
        console.error('❌ ERROR GRAVE: No se puede conectar a la Base de Datos');
        console.error('Detalles:', error);
        console.error('Por favor verifica:');
        console.error('  1. MySQL está ejecutándose');
        console.error('  2. Usuario: root');
        console.error('  3. Contraseña: obed2008');
        console.error('  4. Database: pizzeria_db existe');
        throw error;
    }
    console.log("✅ Conexión a BD exitosa");
    
    // Verificar tabla usuarios
    connection.query("DESCRIBE usuarios", (err, results) => {
        if (err) {
            console.error('❌ Tabla usuarios no existe o hay error:', err.message);
        } else {
            console.log('✅ Tabla usuarios existe');
        }
    });
    
    // Verificar tabla productos
    connection.query("DESCRIBE productos", (err, results) => {
        if (err) {
            console.error('❌ Tabla productos no existe o hay error:', err.message);
        } else {
            console.log('✅ Tabla productos existe');
        }
    });
    
    // Verificar tabla carrito
    connection.query("DESCRIBE carrito", (err, results) => {
        if (err) {
            console.error('❌ Tabla carrito no existe o hay error:', err.message);
        } else {
            console.log('✅ Tabla carrito existe');
        }
    });
    
    // Verificar tabla ventas
    connection.query("DESCRIBE ventas", (err, results) => {
        if (err) {
            console.error('❌ Tabla ventas no existe o hay error:', err.message);
        } else {
            console.log('✅ Tabla ventas existe');
        }
    });
});

module.exports = connection;
