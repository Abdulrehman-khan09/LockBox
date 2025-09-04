const FormModel = require('../models/form.model');

// Create a new form blueprint
module.exports.createForm = async ({
    title,
    description,
    confirmationMessage,
    accessCode,
    enableEmailNotifications,
    formFields,
     createdBy,
    organizationId,
    adminPublicKey
}) => {
    // Validate required fields
    if (!title || !description || !accessCode || !formFields ) {
        throw new Error('All required fields must be provided');
    }
    
    if (!Array.isArray(formFields) || formFields.length === 0) {
        throw new Error('At least one form field is required');
    }
    
    // Validate form fields structure
    for (const field of formFields) {
        if (!field.label || !field.type) {
            throw new Error('Each form field must have a label and type');
        }
       
        // Validate field types
        const validTypes = ['text', 'textarea', 'date', 'select', 'checkbox', 'radio'];
        if (!validTypes.includes(field.type)) {
            throw new Error(`Invalid field type: ${field.type}`);
        }
        
        // Validate select/radio fields have options
        if (['select', 'radio'].includes(field.type) && (!field.options || field.options.length === 0)) {
            throw new Error(`${field.type} fields must have at least one option`);
        }
    }
    
    try {
        const form = await FormModel.create({
            title: title.trim(),
            description: description.trim(),
            confirmationMessage: confirmationMessage || 'Thank you for your submission! We have received your report and will investigate it as soon as possible.',
            accessCode: accessCode.toUpperCase().trim(),
            enableEmailNotifications: enableEmailNotifications !== false, // Default to true
            formFields,
            createdBy,
            organizationId, 
            adminPublicKey
        });
        
        return form;
    } catch (error) {
        if (error.code === 11000) { // MongoDB duplicate key error
            throw new Error('Access code already exists');
        }
        throw error;
    }
};

// Get form by access code
module.exports.getFormByAccessCode = async (accessCode) => {
    if (!accessCode) {
        throw new Error('Access code is required');
    }
    
    const form = await FormModel.findOne({
        accessCode: accessCode.toUpperCase().trim(),
        // Remove isActive check since it's not in your schema
    }).select('-createdBy -__v');
    
    if (!form) {
        throw new Error('Form not found or inactive');
    }
    
    return form;
};

// Delete form
module.exports.deleteForm = async (formId, adminId) => {
    if (!formId || !adminId) {
        throw new Error('Form ID and Admin ID are required');
    }
    
    const form = await FormModel.findOneAndDelete({ _id: formId, createdBy: adminId });
    
    if (!form) {
        throw new Error('Form not found or unauthorized');
    }
    
    return form;
};