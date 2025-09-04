
const adminModel = require('../../models/admin.model')

const jwt = require('jsonwebtoken')

module.exports.AuthMiddleware = async (req,res,next)=>{
    
    // Get token from request
    const token = req.headers.authorization?.split(" ")[1];
      // if no token is there we will return unauthorized
    if(!token){
        return res.status(401).json({message:"Unauthorized"})
    }

     try{
    const decoded = jwt.verify(token,process.env.JWT_SECRET)
    const admin = await adminModel.findById(decoded._id)

    if (!admin) {
      return res.status(401).json({ message: "Unauthorized - Admin not found" });
    }
     
   req.admin = admin 
   // calling next to pass the control 
    return next()

} catch(error){
   return res.status(401).json({message:"Unauthorized"})
}
}

