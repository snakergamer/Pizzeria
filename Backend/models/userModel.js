const sql = require('../config/dbconfig.js');

const User = function (user) {
    this.username = user.username;
    this.email = user.email;
    this.password = user.password;
};

User.create = (newUser, result) => {
    console.log('💾 User.create llamado con:', { username: newUser.username, email: newUser.email });
    sql.query("INSERT INTO usuarios SET ?", newUser, (err, res) => {
        if (err) {
            console.error("❌ Error en INSERT usuarios: ", err);
            console.error("   Código:", err.code);
            console.error("   Mensaje:", err.message);
            result(err, null);
            return;
        }
        console.log('✅ Usuario insertado en BD, ID:', res.insertId);
        result(null, { id: res.insertId, ...newUser });
    });
};

User.findByEmail = (email, result) => {
    console.log('🔍 Buscando usuario por email:', email);
    sql.query("SELECT * FROM usuarios WHERE email = ?", [email], (err, res) => {
        if (err) {
            console.log("❌ Error en query findByEmail: ", err);
            result(err, null);
            return;
        }
        console.log('📊 Resultados de búsqueda:', res ? res.length : 0, 'usuarios encontrados');
        if (res.length) {
            console.log('✅ Usuario encontrado:', res[0].username);
            result(null, res[0]);
            return;
        }
        console.log('⚠️ Usuario NO encontrado con email:', email);
        result({ kind: "not_found" }, null);
    });
};

User.findById = (id, result) => {
    sql.query("SELECT * FROM usuarios WHERE id = ?", [id], (err, res) => {
        if (err) {
            console.log("error: ", err);
            result(err, null);
            return;
        }
        if (res.length) {
            result(null, res[0]);
            return;
        }
        result({ kind: "not_found" }, null);
    });
};

User.update = (id, user, result) => {
    sql.query(
        "UPDATE usuarios SET username = ?, email = ?, password = ? WHERE id = ?",
        [user.username, user.email, user.password, id],
        (err, res) => {
            if (err) {
                console.log("error: ", err);
                result(err, null);
                return;
            }
            if (res.affectedRows == 0) {
                result({ kind: "not_found" }, null);
                return;
            }
            result(null, { id: id, ...user });
        }
    );
};

module.exports = User;
