const Product = require('../models/productModel.js');

exports.getAllProducts = (req, res) => {
    Product.getAll((err, data) => {
        if (err) {
            res.status(500).json({ message: err.message || "Error retrieving products." });
        } else {
            res.json({ products: data });
        }
    });
};
