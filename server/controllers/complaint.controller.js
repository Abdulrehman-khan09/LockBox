


const ComplaintService = require('../services/complaint.service')



const {validationResult} = require('express-validator')


const formModel = require('../models/form.model')

const ComplaintModel = require('../models/complaint.model')
 

module.exports.SubmitComplaint = async (req,res) =>{

    const errors = validationResult(req)
     
    if(!errors.isEmpty()){
        return res.status(400).json({ errors: errors.array() })
       }
  
       const {
         formId,
          category, // Category is not encrypted
          encryptedData,// encrypted by admins key
          userPublicKey,
        } = req.body

    
    // Validate required fields
    if (!formId||  !category || !encryptedData || !userPublicKey ) {
        return res.status(400).json({   
            message: 'All fields are required'
        });
     // encrypting message using admins public key 

    }  
    // get admin details

    const form = await formModel.findById({ _id:formId });

    if (!form) {
        return res.status(404).json({ message: 'Form not found' });
    }

 
      
    const ComplaintData = await ComplaintService.RegisterComplaint({
        category,
        encryptedData,
        userPublicKey, //  users public key 
        adminId: form.createdBy// adminId from form's createdBy field
    })

     return res.status(201).json({
           ComplaintData,
        
    })

}


module.exports.GetComplaintStatus = async (req, res) => {
    const { userPublicKey } = req.query;

   

    if (!userPublicKey) {
        return res.status(400).json({ message: 'userPublic key is required' });
    }

    try {
        const cases = await ComplaintModel.findOne({ userPublicKey });

        if (!cases) {
            return res.status(404).json({ message: 'Complaint not found' });
        }

        return res.status(200).json({
            status: 'success',
            cases
        });
    } catch (error) {
        console.error('Error fetching complaint status:', error);
        return res.status(500).json({ message: 'Internal server error' });
    }
}


module.exports.GetComplaint = async (req, res) => {

  const {adminId} = req.query;
   console.log(req.query);
    if (!adminId) {
        return res.status(400).json({ message: 'Admin ID is required' });
    }

    try {
        const cases = await ComplaintModel.find({  adminId:adminId  } );
      
       
        if (!cases) {
            return res.status(404).json({ message: 'Complaint not found' });
        }

        return res.status(200).json({
            status: 'success',
            cases
        });
    } catch (error) {
        console.error('Error fetching complaint:', error);
        return res.status(500).json({ message: 'Internal server error' });
    }
}