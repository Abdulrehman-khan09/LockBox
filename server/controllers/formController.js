const FormModel = require('../models/form.model');
const formService = require('../services/form.service');
const adminModel = require('../models/admin.model');

// Admin creates a form blueprint
exports.createForm = async (req, res) => {
    try {
        const { 
            title, 
            description, 
            confirmationMessage, 
            accessCode, 
            enableEmailNotifications, 
            formFields 
        } = req.body;

        // Get admin ID from authenticated request
        const adminId = req.admin._id; // Assuming you have authentication middleware
        
        const admin = await adminModel.findById(adminId);



        // Validate required fields
        if (!title || !description || !accessCode || !formFields || formFields.length === 0) {
            return res.status(400).json({ 
                message: 'Title, description, access code, and at least one form field are required' 
            });
        }

        // Check if access code already exists
        const existingForm = await FormModel.findOne({ accessCode: accessCode.toUpperCase() });
        if (existingForm) {
            return res.status(400).json({ 
                message: 'Access code already exists. Please generate a new one.' 
            });
        }

        // Create form blueprint using service
        const formBlueprint = await formService.createForm({
            title,
            description,
            confirmationMessage,
            accessCode: accessCode.toUpperCase(),
            enableEmailNotifications: enableEmailNotifications || true,
            formFields,
            createdBy: adminId,
            organizationId: req.admin.organizationId,
            adminPublicKey:admin.publicKey 
        });

        res.status(201).json({ 
            message: 'Form blueprint created successfully', 
            form: formBlueprint,
            accessCode: formBlueprint.accessCode 
        });
    } catch (error) {
        console.error('Error creating form blueprint:', error);
        res.status(500).json({ 
            message: 'Error creating form blueprint', 
            error: error.message 
        });
    }
};

// Get form blueprint by access code (public endpoint - no auth required)
exports.getFormByAccessCode = async (req, res) => {
    try {
        const { accessCode } = req.query; // Changed from req.body to req.query for GET request

        if (!accessCode) {
            return res.status(400).json({ message: 'Access code is required' });
        }

        const form = await FormModel.findOne({ 
            accessCode: accessCode.toUpperCase()
        }); // Don't send admin info to public

        if (!form) {
            return res.status(404).json({ message: 'Form not found or inactive' });
        }

        res.status(200).json({
            success: true,
            form: {
                id: form._id,
                title: form.title,
                description: form.description,
                confirmationMessage: form.confirmationMessage,
                enableEmailNotifications: form.enableEmailNotifications,
                formFields: form.formFields,
                accessCode: form.accessCode,
                adminPublicKey: form.adminPublicKey, //  admin's public key for encryption,
                createdby: form.createdBy, 
                organizationId: form.organizationId, // Include organization ID
            }
        });
    } catch (error) {
        console.error('Error fetching form:', error);
        res.status(500).json({ 
            message: 'Error fetching form', 
            error: error.message 
        });
    }
};




// Delete form blueprint (protected route)
exports.deleteForm = async (req, res) => {
    try {
        const { formId } = req.params;
        const adminId = req.admin._id;

        const form = await FormModel.findOneAndDelete({ _id: formId, createdBy: adminId });
        if (!form) {
            return res.status(404).json({ message: 'Form not found or unauthorized' });
        }

        res.status(200).json({ message: 'Form deleted successfully' });
    } catch (error) {
        console.error('Error deleting form:', error);
        res.status(500).json({ 
            message: 'Error deleting form', 
            error: error.message 
        });
    }
};

