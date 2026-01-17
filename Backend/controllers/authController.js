const User = require('../models/userModel.js');
const Cart = require('../models/cartModel.js');

exports.register = (req, res) => {
    if (!req.body.username || !req.body.email || !req.body.password) {
        return res.status(400).json({ message: "¡El contenido no puede estar vacío!" });
    }

    // Default role 'user' if not specified
    const user = new User({
        username: req.body.username,
        email: req.body.email,
        password: req.body.password,
        role: 'user'
    });

    User.create(user, (err, data) => {
        if (err) {
            if (err.code === 'ER_DUP_ENTRY') {
                return res.status(400).json({ message: "El nombre de usuario o correo ya existe." });
            }
            return res.status(500).json({ message: err.message || "Error al crear usuario." });
        }
        res.json({ user: data });
    });
};

exports.login = (req, res) => {
    const { email, password } = req.body;

    if (email && password) {
        User.findByEmail(email, (err, user) => {
            if (err) {
                if (err.kind === "not_found") {
                    return res.status(404).json({ message: "Usuario no encontrado." });
                }
                return res.status(500).json({ message: "Error al recuperar usuario." });
            }

            if (user.password === password) {
                res.json({ user: user });
            } else {
                res.status(401).json({ message: "¡Contraseña incorrecta!" });
            }
        });
    } else {
        res.status(400).json({ message: "¡Por favor, proporcione correo y contraseña!" });
    }
};

exports.getProfile = (req, res) => {
    // Expecting userId in params
    const userId = req.params.userId;

    User.findById(userId, (err, userData) => {
        if (err) {
            return res.status(500).json({ message: "Error al recuperar usuario." });
        }

        Cart.getSalesByUserId(userId, (err, salesData) => {
            if (err) {
                res.json({ user: userData, history: [] });
            } else {
                userData.purchase_count = salesData.length;
                res.json({ user: userData, history: salesData });
            }
        });
    });
};

exports.updateProfile = (req, res) => {
    const userId = req.params.userId;
    const updatedUser = new User({
        username: req.body.username,
        email: req.body.email,
        password: req.body.password
    });

    User.update(userId, updatedUser, (err, data) => {
        if (err) {
            res.status(500).json({ message: "Error al actualizar usuario." });
        } else {
            res.json({ user: data });
        }
    });
};
