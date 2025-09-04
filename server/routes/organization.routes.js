const express = require('express')
const router = express.Router()
const {body} = require("express-validator")
const OrgCOntroller = require('../controllers/organization.controller')

router.post('/register',[
    body('name')
    .isLength({ min: 3 })
    .withMessage('Organization name must be at least 3 characters long')
    .trim(),

  body('ownerName')
    .isLength({ min: 3 })
    .withMessage('Owner name must be at least 3 characters long')
    .trim(),

  body('contactEmail')
    .isEmail()
    .withMessage('Enter a valid email')
    .normalizeEmail(),

  body('contactPhone')
    .matches(/^\+?\d{10,15}$/)
    .withMessage('Enter a valid phone number')
    .trim(),
],OrgCOntroller.OrgRegister
)

module.exports = router