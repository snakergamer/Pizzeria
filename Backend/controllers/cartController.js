const Cart = require('../models/cartModel.js');

exports.addToCart = (req, res) => {
    const cartItem = new Cart({
        user_id: req.body.user_id,
        product_id: req.body.product_id,
        quantity: req.body.quantity
    });

    Cart.addToCart(cartItem, (err, data) => {
        if (err) {
            res.status(500).json({ message: err.message || "Error al agregar al carrito." });
        } else {
            res.json(data);
        }
    });
};

exports.viewCart = (req, res) => {
    const userId = req.params.userId;
    Cart.getCartByUserId(userId, (err, data) => {
        if (err) {
            res.status(500).json({ message: err.message || "Error al recuperar carrito." });
        } else {
            let total = 0;
            data.forEach(item => {
                total += item.total;
            });
            res.json({ items: data, total: total });
        }
    });
};

exports.removeFromCart = (req, res) => {
    const cartId = req.params.cartId;
    Cart.removeFromCart(cartId, (err, data) => {
        if (err) {
            res.status(500).json({ message: "No se pudo eliminar el artículo del carrito." });
        } else {
            res.json({ message: "Artículo eliminado." });
        }
    });
};

exports.checkout = (req, res) => {
    const userId = req.body.user_id;

    Cart.getCartByUserId(userId, (err, cartItems) => {
        if (err || cartItems.length === 0) {
            return res.status(400).json({ message: "El carrito está vacío o hubo un error." });
        }

        let totalAmount = 0;
        let itemsDescription = "";
        cartItems.forEach(item => {
            totalAmount += item.total;
            itemsDescription += `${item.name} (x${item.quantity}), `;
        });

        Cart.createSale(userId, totalAmount, itemsDescription, cartItems, (err, data) => {
            if (err) {
                return res.status(500).json({ message: "Error al procesar la venta." });
            }

            Cart.clearCart(userId, (err, result) => {
                res.json({ message: "Venta exitosa", saleId: data.id });
            });
        });
    });
};
