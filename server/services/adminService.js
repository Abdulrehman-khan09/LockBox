const Admin = require('../models/admin.model');

module.exports.Register = async ({
  firstname, lastname, email, passwordHash, publicKey, encryptedPrivateKey, organizationName, organizationId
}) => {
  if (!firstname || !email || !passwordHash || !publicKey || !encryptedPrivateKey) {
    throw new Error('Missing required fields');
  }
  
  const admin = await Admin.create({
    fullname: { firstname, lastname },
    email,
    password: passwordHash,
    publicKey,
    encryptedPrivateKey,
    organizationName,
    organizationId,
  });
  
  return admin;
};