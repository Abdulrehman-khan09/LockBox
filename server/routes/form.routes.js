const express = require('express');
const router = express.Router();
const formController = require('../controllers/formController')
const authMiddleware = require('../middlewares/Auth/Auth');


// Admin creates a form
router.post('/createform', authMiddleware.AuthMiddleware , formController.createForm );

// Get form by access code (public)
router.get('/getform',  formController.getFormByAccessCode);


module.exports = router;


