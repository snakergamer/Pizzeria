const sql = require('../config/dbconfig.js');

const Cart = function (cart) {
    this.user_id = cart.user_id;
    this.product_id = cart.product_id;
    this.quantity = cart.quantity;
};

Cart.addToCart = (newCartItem, result) => {
    sql.query("SELECT * FROM carrito WHERE user_id = ? AND product_id = ?",
        [newCartItem.user_id, newCartItem.product_id], (err, res) => {
            if (err) {
                console.log("error: ", err);
                result(err, null);
                return;
            }

            if (res.length > 0) {
                const cartId = res[0].id;
                const newQuantity = res[0].quantity + newCartItem.quantity;
                console.log('📦 Actualizando cantidad en carrito ID:', cartId, 'Nueva cantidad:', newQuantity);
                sql.query("UPDATE carrito SET quantity = ? WHERE id = ?",
                    [newQuantity, cartId], (err, updateRes) => {
                        if (err) {
                            console.log("❌ error en UPDATE: ", err);
                            result(err, null);
                            return;
                        }
                        console.log('✅ Cantidad actualizada en carrito');
                        result(null, { id: cartId, ...newCartItem, quantity: newQuantity });
                    });
            } else {
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

            sql.query("UPDATE usuarios SET purchase_count = purchase_count + 1 WHERE id = ?", [userId], (err, res) => {
                if (err) {
                    console.log("error updating purchase count: ", err);
                }
            });

            result(null, { id: res.insertId, user_id: userId, total_amount: totalAmount });
        });
};

module.exports = Cart;
