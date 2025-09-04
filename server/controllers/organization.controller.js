
const { validationResult } = require('express-validator');
const OrgModel = require("../models/organization.model");
const OrgService = require('../services/organization.service')


module.exports.OrgRegister = async (req,res) => {
    

    const errors = validationResult(req)
    
    if(!errors.isEmpty()){
        return res.status(400).json({ errors: errors.array() })
       }
       
       const {name , ownerName , industryType ,  contactEmail ,contactPhone , address} = req.body
      
       // check if admin already exists
 
       const OrgExists =  await OrgModel.findOne({contactEmail});

       if(OrgExists){
           return res.status(400).json({message:"Org already exists"})
       }

          // Now create the user
   try {
       const Organization = await OrgService.RegisterOrg({
           name,
           ownerName,
           industryType,
           contactEmail,
           contactPhone,
           address
       });
       
      return res.status(201).json({
         Organization
       })
   }
    catch(error){
       return res.status(500).json({ message: error.message });
   }

}