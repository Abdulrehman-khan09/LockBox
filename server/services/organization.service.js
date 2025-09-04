
const OrgModel = require('../models/organization.model')

module.exports.RegisterOrg = async (
    {
        name 
})=>{
    if(!name ){
        throw new Error('All fields are required')
    }
     
    const Organization = OrgModel.create({
        name , 
    })

    return Organization
}

