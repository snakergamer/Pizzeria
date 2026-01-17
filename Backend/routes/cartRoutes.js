const express = require('express');
const router = express.Router();
const cartController = require('../controllers/cartController');

router.get('/cart/:userId', cartController.viewCart);
router.post('/cart', cartController.addToCart);
router.delete('/cart/:cartId/user/:userId', cartController.removeFromCart); // Param structure to match frontend expectation
router.post('/checkout', cartController.checkout);

module.exports = router;
