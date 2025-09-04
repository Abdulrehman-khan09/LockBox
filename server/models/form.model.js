const mongoose = require('mongoose');

// Schema for each field inside the form blueprint
const formFieldSchema = new mongoose.Schema({
  label: {
    type: String,
    required: true, // Field label is mandatory
  },
  type: {
    type: String,
    required: true, // e.g., 'text', 'textarea', 'date', 'select'
    enum: ['text', 'textarea', 'date', 'select', 'checkbox', 'radio']
  },
  required: {
    type: Boolean,
    default: false, // Whether the field is required for submission
  },
    options: {
    type: [String], // For select/radio fields - array of options
    default: []
  },
});

// Main form blueprint schema
const formSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true, // Form title is mandatory
    },
    description: {
      type: String,
      required: true,
    },
    confirmationMessage: {
      type: String,
      default: 'Thank you for your submission! We have received your report and will investigate it as soon as possible.',
    },
    accessCode: {
      type: String,
      required: true,
      unique: true, // Unique code to access this form
      uppercase: true,
      trim: true
    },
    enableEmailNotifications: {
      type: Boolean,
      default: true // Whether to allow users to provide email for updates
    },
    formFields: {
      type: [formFieldSchema], // Array of field objects
      validate: (v) => Array.isArray(v) && v.length > 0, // Ensure at least one field
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Admin', // Reference to admin who created this form
      required: true
    },
    adminPublicKey: {
      type: String,
    },
    organizationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Organization', // Reference to the organization this form belongs to
      required: true
    },
  },
  {
    timestamps: true, // Auto-generate createdAt & updatedAt fields
  }
);



module.exports = mongoose.model('Form', formSchema);