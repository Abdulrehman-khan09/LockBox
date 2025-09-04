const express = require("express");
const router = express.Router();
const adminController = require("../controllers/adminController");
const { body } = require('express-validator');

// Registration route
router.post('/register', [
    body('email').isEmail().trim().withMessage('Please provide a valid email'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
    body('fullname.firstname').notEmpty().trim().withMessage('First name is required'),
    body('organizationName').notEmpty().trim().withMessage('Organization name is required'),
    body('publicKey').notEmpty().withMessage('Public key is required'),
    body('encryptedPrivateKey').notEmpty().withMessage('Encrypted private key is required'),
], adminController.adminRegister);

// Login route
router.post('/login', [
    body('email').isEmail().trim().withMessage('Please provide a valid email'),
    body('password').notEmpty().withMessage('Password is required'),
], adminController.adminLogin);

// Email verification route
router.get('/verify-email', adminController.verifyEmail);

// Resend verification route
router.post('/resend-verification', [
    body('email').isEmail().trim().withMessage('Please provide a valid email'),
], adminController.resendVerification);

module.exports = router;