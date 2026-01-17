const Product = require('../models/productModel.js');

exports.adminDashboard = (req, res) => {
    // Just return products for the dashboard
    Product.getAll((err, data) => {
        if (err) {
            res.status(500).json({ message: "Error retrieving products." });
        } else {
            res.json({ products: data });
        }
    });
};

exports.addProduct = (req, res) => {
    // Basic Validation
    if (!req.body.name || !req.body.price || !req.body.stock) {
        return res.status(400).json({ status: 'error', message: 'Todos los campos son obligatorios' });
    }

    if (req.body.stock > 10000) {
        return res.status(400).json({ status: 'error', message: 'La cantidad de stock es demasiado alta (máx 10,000)' });
    }

    const product = new Product({
        name: req.body.name,
        price: req.body.price,
        stock: req.body.stock,
        categoryid: 1
    });

    Product.create(product, (err, data) => {
        if (err) {
            res.status(500).json({ status: 'error', message: "Error al crear el producto." });
        } else {
            res.json({ status: 'success', message: "Producto creado exitosamente", product: data });
        }
    });
};

exports.deleteProduct = (req, res) => {
    Product.delete(req.params.id, (err, data) => {
        if (err) {
            res.status(500).json({ status: 'error', message: "No se pudo eliminar el producto." });
        } else {
            res.json({ status: 'success', message: "Producto eliminado exitosamente" });
        }
    });
};

exports.restockProduct = (req, res) => {
    const amount = parseInt(req.body.amount);
    if (!amount || amount <= 0) {
        return res.status(400).json({ status: 'error', message: "Cantidad inválida" });
    }

    Product.addStock(req.params.id, amount, (err, data) => {
        if (err) {
            res.status(500).json({ status: 'error', message: "Error al reponer stock." });
        } else {
            res.json({ status: 'success', message: "Stock repuesto exitosamente", data: data });
        }
    });
};
