const sql = require('../config/dbconfig.js');

const Cart = function (cart) {
    this.user_id = cart.user_id;
    this.product_id = cart.product_id;
    this.quantity = cart.quantity;
};

Cart.addToCart = (newCartItem, result) => {
    // Check if item already exists in cart
    sql.query("SELECT * FROM carrito WHERE user_id = ? AND product_id = ?",
        [newCartItem.user_id, newCartItem.product_id], (err, res) => {
            if (err) {
                console.log("error: ", err);
                result(err, null);
                return;
            }

            if (res.length > 0) {
                // Update quantity
                const newQuantity = res[0].quantity + newCartItem.quantity;
                sql.query("UPDATE carrito SET quantity = ? WHERE id = ?",
                    [newQuantity, res[0].id], (err, res) => {
                        if (err) {
                            console.log("error: ", err);
                            result(err, null);
                            return;
                        }
                        result(null, { id: res[0].id, ...newCartItem, quantity: newQuantity });
                    });
            } else {
                // Insert new item
                sql.query("INSERT INTO carrito SET ?", newCartItem, (err, res) => {
                    if (err) {
                        console.log("error: ", err);
                        result(err, null);
                        return;
                    }
                    result(null, { id: res.insertId, ...newCartItem });
                });
            }
        });
};

Cart.getCartByUserId = (userId, result) => {
    sql.query(`SELECT c.id, c.quantity, p.name, p.price, (c.quantity * p.price) as total 
               FROM carrito c 
               JOIN productos p ON c.product_id = p.id 
               WHERE c.user_id = ?`, [userId], (err, res) => {
        if (err) {
            console.log("error: ", err);
            result(null, err);
            return;
        }
        result(null, res);
    });
};

Cart.removeFromCart = (cartId, result) => {
    sql.query("DELETE FROM carrito WHERE id = ?", [cartId], (err, res) => {
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

Cart.clearCart = (userId, result) => {
    sql.query("DELETE FROM carrito WHERE user_id = ?", [userId], (err, res) => {
        if (err) {
            console.log("error: ", err);
            result(null, err);
            return;
        }
        result(null, res);
    });
};

Cart.createSale = (userId, totalAmount, items, result) => {
    sql.query("INSERT INTO ventas (user_id, total_amount, items) VALUES (?, ?, ?)",
        [userId, totalAmount, items], (err, res) => {
            if (err) {
                console.log("error: ", err);
                result(err, null);
                return;
            }

            // Update user purchase count
            sql.query("UPDATE usuarios SET purchase_count = purchase_count + 1 WHERE id = ?", [userId], (err, res) => {
                if (err) {
                    console.log("error updating purchase count: ", err);
                    // Don't fail the whole request just for this, but log it
                }
            });

            result(null, { id: res.insertId, user_id: userId, total_amount: totalAmount });
        });
};

module.exports = Cart;
