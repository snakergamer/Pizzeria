const express = require('express');
const router = express.Router();
const cartController = require('../controllers/cartController');

router.get('/carrito', cartController.viewCart);
router.post('/carrito/add', cartController.addToCart);
router.get('/carrito/remove/:id', cartController.removeFromCart);
router.post('/comprar', cartController.checkout);

module.exports = router;
