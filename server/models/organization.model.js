const mongoose = require('mongoose');

const organizationSchema = new mongoose.Schema(
  {
    name: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        lowercase: true 
      },
  },

);

const OrganizationModel = mongoose.model('Organization', organizationSchema);

module.exports = OrganizationModel;
