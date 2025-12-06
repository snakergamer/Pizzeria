const User = require('../models/userModel.js');

exports.register = (req, res) => {
    // Validation is also done on frontend, but good to have basic check here
    if (!req.body.username || !req.body.email || !req.body.password) {
        return res.status(400).send({ message: "¡El contenido no puede estar vacío!" });
    }

    const user = new User({
        username: req.body.username,
        email: req.body.email,
        password: req.body.password
    });

    User.create(user, (err, data) => {
        if (err) {
            if (err.code === 'ER_DUP_ENTRY') {
                return res.status(400).send({ message: "El nombre de usuario o el correo electrónico ya existen." });
            }
            return res.status(500).send({ message: err.message || "Ocurrió algún error al crear el usuario." });
        }
        // Auto login after register
        req.session.loggedin = true;
        req.session.userId = data.id;
        req.session.username = data.username;
        res.redirect('/tienda');
    });
};

exports.login = (req, res) => {
    const email = req.body.email;
    const password = req.body.password;

    if (email && password) {
        User.findByEmail(email, (err, user) => {
            if (err) {
                if (err.kind === "not_found") {
                    return res.status(404).send({ message: "Usuario no encontrado." }); // Or redirect with error
                }
                return res.status(500).send({ message: "Error al recuperar el usuario." });
            }

            // Simple password check (In production use bcrypt!)
            if (user.password === password) {
                req.session.loggedin = true;
                req.session.userId = user.id;
                req.session.username = user.username;
                res.redirect('/tienda');
            } else {
                res.send('¡Nombre de usuario y/o contraseña incorrectos!');
            }
        });
    } else {
        res.send('¡Por favor ingrese nombre de usuario y contraseña!');
    }
};

exports.logout = (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            return console.log(err);
        }
        res.redirect('/login');
    });
};

exports.getProfile = (req, res) => {
    if (req.session.loggedin) {
        User.findById(req.session.userId, (err, data) => {
            if (err) {
                res.status(500).send({ message: "Error al recuperar el usuario." });
            } else {
                res.render('perfil', { user: data });
            }
        });
    } else {
        res.redirect('/login');
    }
};

exports.updateProfile = (req, res) => {
    if (req.session.loggedin) {
        const userId = req.session.userId;
        const updatedUser = new User({
            username: req.body.username,
            email: req.body.email,
            password: req.body.password // Note: In a real app, handle password change separately and securely
        });

        User.update(userId, updatedUser, (err, data) => {
            if (err) {
                res.status(500).send({ message: "Error al actualizar el usuario." });
            } else {
                req.session.username = data.username; // Update session username
                res.redirect('/perfil');
            }
        });
    } else {
        res.redirect('/login');
    }
};
