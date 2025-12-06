const Cart = require('../models/cartModel.js');

exports.addToCart = (req, res) => {
    if (!req.session.loggedin) {
        return res.redirect('/login');
    }

    const cartItem = new Cart({
        user_id: req.session.userId,
        product_id: req.body.product_id,
        quantity: parseInt(req.body.quantity)
    });

    Cart.addToCart(cartItem, (err, data) => {
        if (err) {
            res.status(500).send({ message: err.message || "Ocurrió algún error al agregar al carrito." });
        } else {
            res.redirect('/tienda');
        }
    });
};

exports.viewCart = (req, res) => {
    if (req.session.loggedin) {
        Cart.getCartByUserId(req.session.userId, (err, data) => {
            if (err) {
                res.status(500).send({ message: err.message || "Ocurrió algún error al recuperar el carrito." });
            } else {
                let total = 0;
                data.forEach(item => {
                    total += item.total;
                });
                res.render('carrito', { cartItems: data, total: total });
            }
        });
    } else {
        res.redirect('/login');
    }
};

exports.removeFromCart = (req, res) => {
    if (!req.session.loggedin) {
        return res.redirect('/login');
    }
    Cart.removeFromCart(req.params.id, (err, data) => {
        if (err) {
            res.status(500).send({ message: "No se pudo eliminar el artículo del carrito con id " + req.params.id });
        } else {
            res.redirect('/carrito');
        }
    });
};

exports.checkout = (req, res) => {
    if (!req.session.loggedin) {
        return res.redirect('/login');
    }

    Cart.getCartByUserId(req.session.userId, (err, cartItems) => {
        if (err || cartItems.length === 0) {
            return res.redirect('/carrito');
        }

        let totalAmount = 0;
        let itemsDescription = "";
        cartItems.forEach(item => {
            totalAmount += item.total;
            itemsDescription += `${item.name} (x${item.quantity}), `;
        });

        Cart.createSale(req.session.userId, totalAmount, itemsDescription, (err, data) => {
            if (err) {
                return res.status(500).send({ message: "Error al procesar la venta." });
            }

            // Clear cart after successful sale
            Cart.clearCart(req.session.userId, (err, result) => {
                // Redirect to home with success message (handled in frontend via query param or similar, 
                // but for now just redirecting to home as requested)
                res.redirect('/tienda?status=success');
            });
        });
    });
};
