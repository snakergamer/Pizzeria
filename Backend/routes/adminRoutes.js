const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');

router.get('/admin', adminController.adminDashboard);
router.post('/admin/add', adminController.addProduct);
router.post('/admin/restock/:id', adminController.restockProduct);
router.get('/admin/delete/:id', adminController.deleteProduct);

module.exports = router;
