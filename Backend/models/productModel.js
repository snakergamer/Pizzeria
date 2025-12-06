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

module.exports = Product;
