const express= require('express')

const router = express.Router()

const {body} = require('express-validator')

const ComplaintController = require('../controllers/complaint.controller')

router.post('/submit',[
  
  body('category')
    .notEmpty().withMessage('Category is required')
    .isString().withMessage('Category must be a string'),

  body('encryptedData')
    .notEmpty().withMessage(' Data is required')
    .isString().withMessage('Data message must be a string'),


  body('response')
    .optional()
    .isString().withMessage('Response must be a string if provided'),
],ComplaintController.SubmitComplaint)

router.get('/status', [
  body('userPublicKey')      
    .notEmpty().withMessage('key is required')
    .isString().withMessage('key must be a string'),
], ComplaintController.GetComplaintStatus)


router.get('/getcomplaint', ComplaintController.GetComplaint)

module.exports = router