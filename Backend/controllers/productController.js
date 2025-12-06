const Product = require('../models/productModel.js');

exports.getAllProducts = (req, res) => {
    if (req.session.loggedin) {
        Product.getAll((err, data) => {
            if (err) {
                res.status(500).send({ message: err.message || "Ocurrió algún error al recuperar los productos." });
            } else {
                res.render('index', { products: data, user: req.session.username });
            }
        });
    } else {
        res.redirect('/login');
    }
};
