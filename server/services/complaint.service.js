
const ComplaintModel = require('../models/complaint.model')
module.exports.RegisterComplaint = async (
    {
        category,
        encryptedData,
        userPublicKey, //  users public key 
        adminId
})=>{
    if(!category,!encryptedData,!userPublicKey,!adminId){
        throw new Error('All fields are required')
    }
     
    const Complaint = ComplaintModel.create({
        
        category,
        encryptedData,
        userPublicKey, //  users public key 
        adminId
    })

    return Complaint
}
