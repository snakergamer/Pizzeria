const sql = require('../config/dbconfig.js');

const Product = function (product) {
    this.name = product.name;
    this.price = product.price;
    this.stock = product.stock;
    this.categoryid = product.categoryid;
};

Product.getAll = result => {
    sql.query("SELECT * FROM productos", (err, res) => {
        if (err) {
            console.log("error: ", err);
            result(null, err);
            return;
        }
        result(null, res);
    });
};

Product.create = (newProduct, result) => {
    sql.query("INSERT INTO productos SET ?", newProduct, (err, res) => {
        if (err) {
            console.log("error: ", err);
            result(err, null);
            return;
        }
        result(null, { id: res.insertId, ...newProduct });
    });
};

Product.delete = (id, result) => {
    sql.query("DELETE FROM productos WHERE id = ?", [id], (err, res) => {
        if (err) {
            console.log("error: ", err);
            result(null, err);
            return;
        }
        if (res.affectedRows == 0) {
            result({ kind: "not_found" }, null);
            return;
        }
        result(null, res);
    });
};

Product.decreaseStock = (id, quantity, result) => {
    sql.query("UPDATE productos SET stock = stock - ? WHERE id = ? AND stock >= ?", [quantity, id, quantity], (err, res) => {
        if (err) {
            console.log("error: ", err);
            result(err, null);
            return;
        }
        if (res.affectedRows == 0) {
            result({ kind: "not_found_or_insufficient_stock" }, null);
            return;
        }
        result(null, res);
    });
};

Product.addStock = (id, quantity, result) => {
    sql.query("UPDATE productos SET stock = stock + ? WHERE id = ?", [quantity, id], (err, res) => {
        if (err) {
            console.log("error: ", err);
            result(err, null);
            return;
        }
        if (res.affectedRows == 0) {
            result({ kind: "not_found" }, null);
            return;
        }
        result(null, res);
    });
};

module.exports = Product;
