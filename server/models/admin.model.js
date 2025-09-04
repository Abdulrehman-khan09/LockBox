const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const adminSchema = new mongoose.Schema({
  organizationId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Organization' ,
    required:true
  },
  organizationName: { 
    type: String, 
    trim: true, 
    lowercase: true, 
    required: true 
  },
  fullname: {
    firstname: { 
      type: String, 
      required: true, 
      minlength: 3, 
      trim: true 
    },
    lastname: { 
      type: String, 
      trim: true, 
      default: '' 
    },
  },
  email: { 
    type: String, 
    required: true, 
    unique: true, 
    lowercase: true, 
    trim: true 
  },
  password: { 
    type: String, 
    required: true 
  }, // bcrypt hash
  publicKey: { 
    type: String, 
    required: true 
  }, // base64 encoded public key (RSA or X25519)
  encryptedPrivateKey: { 
    type: Object, 
    required: true 
  }, // {ciphertext, nonce/iv, salt, version, kdf, ...}
  keyType: {
    type: String,
    enum: ['rsa', 'x25519'],
    default: 'rsa'
  },
  isVerified: { 
    type: Boolean, 
    default: false 
  },
  emailVerificationToken: { 
    type: String 
  },
  emailVerificationExpires: { 
    type: Date 
  },
}, { timestamps: true });

adminSchema.methods.generateAuthToken = function () {
  return jwt.sign({ _id: this._id }, process.env.JWT_SECRET, { expiresIn: '24h' });
};

adminSchema.statics.hashPassword = async function (password) {
  return bcrypt.hash(password, 10);
};

adminSchema.methods.comparePassword = function (password) {
  return bcrypt.compare(password, this.password);
};

module.exports = mongoose.model('admin', adminSchema);