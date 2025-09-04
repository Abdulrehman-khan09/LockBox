const crypto = require('crypto');
const { validationResult } = require('express-validator');
const adminService = require('../services/adminService'); // Fixed import path
const OrgService = require('../services/organization.service'); // Import organization model
const Admin = require('../models/admin.model');
const Org = require('../models/organization.model');
const nodemailer = require('nodemailer');
const OrganizationModel = require('../models/organization.model');

const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:5000';
const FRONTEND_BASE_URL = process.env.FRONTEND_BASE_URL || 'http://localhost:5173';
const EMAIL_FROM = process.env.EMAIL_FROM;
const VERIFICATION_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

// Create transporter
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

module.exports.adminRegister = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty())
    return res.status(400).json({ errors: errors.array() });

  try {
    const {
      fullname,
      email,
      password,
      publicKey,
      encryptedPrivateKey,
      organizationName,
    } = req.body;
   
    
    const organizationExists = await OrganizationModel.findOne({name:organizationName.toLowerCase().trim()});
        
    if (organizationExists) {
      return res.status(400).json({ message: 'Organization already exists' });  
    }
          
     const org = await OrgService.RegisterOrg({
      name: organizationName.toLowerCase().trim(),
    });

    // Check duplicates
    const exists = await Admin.findOne({ email: email.toLowerCase().trim() });
    if (exists) return res.status(400).json({ message: 'Admin already exists' });

    // Hash password
    const passwordHash = await Admin.hashPassword(password);

    // Create admin in DB
    const admin = await adminService.Register({
      firstname: fullname.firstname,
      lastname: fullname.lastname,
      email,
      passwordHash,
      publicKey,
      encryptedPrivateKey,
      organizationName: organizationName.toLowerCase().trim(),
      organizationId:org._id
    });

    // Generate email verification token
    admin.emailVerificationToken = crypto.randomBytes(32).toString('hex');
    admin.emailVerificationExpires = new Date(Date.now() + VERIFICATION_TTL_MS);
    await admin.save();

    // Create verification URL that points to frontend
    const verifyUrl = `${FRONTEND_BASE_URL}/verify-email?token=${admin.emailVerificationToken}`;
    
    // Send verification email
    try {
      await transporter.sendMail({
        from: EMAIL_FROM,
        to: admin.email,
        subject: 'Verify your email — LockBox',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #333;">Welcome to LockBox!</h2>
            <p>Hi ${admin.fullname.firstname},</p>
            <p>Thanks for registering with <strong>LockBox</strong>. Please verify your email address to complete your registration:</p>
            <div style="text-align: center; margin: 30px 0;">
              <a href="${verifyUrl}" 
                 style="background-color: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">
                Verify Email Address
              </a>
            </div>
            <p style="color: #666; font-size: 14px;">
              This link will expire in 24 hours. If you didn't create an account with LockBox, please ignore this email.
            </p>
            <p style="color: #666; font-size: 12px;">
              If the button doesn't work, copy and paste this link into your browser:<br>
              <span style="word-break: break-all;">${verifyUrl}</span>
            </p>
          </div>
        `,
      });
  
      console.log('Verification email sent successfully to:', admin.email);
    } catch (emailError) {
      console.error('Failed to send verification email:', emailError);
      // Don't fail registration if email fails, but log it
    }

    res.status(201).json({
      message: 'Registration successful! Please check your email for verification link.',
      emailSent: true,
    });

  } catch (err) {
    console.error('Registration error:', err);
    return res.status(500).json({ message: err.message });
  }
};

module.exports.verifyEmail = async (req, res) => {
  try {
    const { token } = req.query;
    console.log('Verification attempt with token:', token);
    
    if (!token) return res.status(400).json({ message: 'Token is required' });

    const admin = await Admin.findOne({
      emailVerificationToken: token,
      emailVerificationExpires: { $gt: new Date() },
    });


    if (!admin) {
      console.log('Invalid or expired token:', token);
      return res.status(400).json({ 
        message: 'Invalid or expired verification token. Please register again.' 
      });
    }

    // Mark as verified
    admin.isVerified = true;
    admin.emailVerificationToken = undefined;
    admin.emailVerificationExpires = undefined;
    await admin.save();

    console.log('Email verified successfully for:', admin.email);

    return res.status(200).json({ 
      message: 'Email verified successfully! You can now log in to your account.',
      success: true,
      adminEmail: admin.email
    });

  } catch (err) {
    console.error('Email verification error:', err);
    return res.status(500).json({ message: 'Verification failed. Please try again.' });
  }
};

module.exports.adminLogin = async (req, res) => {
  try {
    const { email, password } = req.body;

    const admin = await Admin.findOne({ email: email.toLowerCase().trim() });
    if (!admin) {
      console.log('Login failed: Admin not found for email:', email);
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    const ok = await admin.comparePassword(password);
    if (!ok) {
      console.log('Login failed: Invalid password for email:', email);
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    if (!admin.isVerified) {
      console.log('Login failed: Email not verified for:', email);
      return res.status(403).json({ 
        message: 'Please verify your email first. Check your inbox for verification link.' 
      });
    }

    const token = admin.generateAuthToken();
    console.log('Login successful for:', email);

    return res.status(200).json({
      message: 'Login successful',
      token,
      admin: {
        _id: admin._id,
        email: admin.email,
        fullname: admin.fullname,
        organizationName: admin.organizationName,
      },
      publicKey: admin.publicKey,
      encryptedPrivateKey: admin.encryptedPrivateKey,
    });
  } catch (err) {
    console.error('Login error:', err);
    return res.status(500).json({ message: 'Login failed. Please try again.' });
  }
};

module.exports.resendVerification = async (req, res) => {
  try {
    const { email } = req.body;
    
    if (!email) {
      return res.status(400).json({ message: 'Email is required' });
    }

    const admin = await Admin.findOne({ email: email.toLowerCase().trim() });
    if (!admin) {
      return res.status(404).json({ message: 'Admin not found' });
    }

    if (admin.isVerified) {
      return res.status(400).json({ message: 'Email is already verified' });
    }

    // Generate new verification token
    admin.emailVerificationToken = crypto.randomBytes(32).toString('hex');
    admin.emailVerificationExpires = new Date(Date.now() + VERIFICATION_TTL_MS);
    await admin.save();

    // Create verification URL
    const verifyUrl = `${FRONTEND_BASE_URL}/verify-email?token=${admin.emailVerificationToken}`;
    
    // Send verification email
    await transporter.sendMail({
      from: EMAIL_FROM,
      to: admin.email,
      subject: 'Verify your email — LockBox (Resent)',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">Email Verification - LockBox</h2>
          <p>Hi ${admin.fullname.firstname},</p>
          <p>Here's your new verification link. Please verify your email address:</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${verifyUrl}" 
               style="background-color: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">
              Verify Email Address
            </a>
          </div>
          <p style="color: #666; font-size: 14px;">
            This link will expire in 24 hours.
          </p>
        </div>
      `,
    });

    res.status(200).json({
      message: 'Verification email resent successfully. Please check your inbox.',
    });

  } catch (err) {
    console.error('Resend verification error:', err);
    return res.status(500).json({ message: 'Failed to resend verification email' });
  }
};