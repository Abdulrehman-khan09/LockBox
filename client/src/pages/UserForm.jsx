import React, { useState } from 'react';
import { Search, AlertCircle, CheckCircle, CloudCog, Eye } from 'lucide-react';
import axios from 'axios';
import { Navigate, useNavigate } from 'react-router-dom';
// Import the crypto functions - these should be in your crypto utils file
import { 
  generateKeyPair, 
  encryptPrivateKeyWithPassword, 
  decryptPrivateKeyWithPassword,
  encryptWithPublicKey,
  decryptWithPrivateKey,
  generateUserTrackingCode,
  decodeUserTrackingCode,
  trimKey
} from '../utils/simpleCrypto'; // Adjust path as needed

const UserForm = () => {
  const [accessCode, setAccessCode] = useState('');
  const [trackingCode, setTrackingCode] = useState('');
  const [form, setForm] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({});
  const [submissionStatus, setSubmissionStatus] = useState('');
  const [confirmationData, setConfirmationData] = useState(null);
  const [showStatusCheck, setShowStatusCheck] = useState(false);
  const [statusResponse, setStatusResponse] = useState(null);
  const navigate = useNavigate()

  // Function to fetch form by access code
  const fetchForm = async () => {
    if (!accessCode.trim()) {
      setError('Please enter an access code');
      return;
    }

    setLoading(true);
    setError('');
    try {
      const backendURL = import.meta.env.BACKEND_URL || 'http://localhost:5000';
      
      const response = await fetch(`${backendURL}/api/forms/getform?accessCode=${accessCode}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();
   
      if (!data.success) {
        throw new Error(data.message || 'Failed to fetch form');
      }
      
      setForm(data.form);
      // Initialize form data with empty values
      const initialFormData = {};
      data.form.formFields.forEach(field => {
        initialFormData[field.label] = field.type === 'checkbox' ? [] : '';
      });
      setFormData(initialFormData);
    } catch (err) {
      setError(err.message);
      setForm(null);
    } finally {
      setLoading(false);
    }
  };

  // Check status with tracking code - FIXED VERSION
  const checkStatus = async () => {
    if (!trackingCode) {
      alert("Enter tracking code first");
      return;
    }

    setLoading(true);
    setError("");

    console.log("Checking status with tracking code:", trackingCode);
    try{
      const { publicKey: userPublicKeyPem, privateKey: userPrivateKeyPem } = decodeUserTrackingCode(trackingCode);

      // DB stores public key without headers → use trimmed for query
      const userPublicKeyForQuery = trimKey(userPublicKeyPem);
      
      const backendURL = import.meta.env.BACKEND_URL || "http://localhost:5000";
      const statusResponse = await axios.get(
        `${backendURL}/api/complaint/status`,
        {
          params: { userPublicKey: userPublicKeyForQuery },
          headers: { "Content-Type": "application/json" },
        }
      );
      
      const caseItem = statusResponse.data.cases;
      
      navigate(`/userstatus/${caseItem._id}`, {
        state: {
          caseData: {
            ...caseItem,
            userPrivateKey: userPrivateKeyPem // pass full PEM to tracking page
          }
        }
      });

    }
    catch(error){
      console.log(error.message)
    }finally{
      setLoading(false)
    }
   
  };
  
  // Handle form field changes
  const handleFieldChange = (fieldLabel, value, fieldType) => {
    setFormData(prev => {
      if (fieldType === 'checkbox') {
        const currentValues = prev[fieldLabel] || [];
        if (currentValues.includes(value)) {
          return { ...prev, [fieldLabel]: currentValues.filter(v => v !== value) };
        } else {
          return { ...prev, [fieldLabel]: [...currentValues, value] };
        }
      }
      return { ...prev, [fieldLabel]: value };
    });
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log(form);
    try {
      // Generate keypair
      const userKeyPair = await generateKeyPair();

      console.log("Generated user key pair:", userKeyPair); 

      // Fetch admins public key
      const adminPublicKey = form.adminPublicKey
      
      // Prepare data for encryption (exclude category as mentioned)
      const dataToEncrypt = {};
      Object.keys(formData).forEach(key => {
        if (key.toLowerCase() !== 'category') {
          dataToEncrypt[key] = formData[key];
        }
      });

      const encryptedFormData = await encryptWithPublicKey(
        JSON.stringify(dataToEncrypt),
        adminPublicKey
      );

      const userPublicKey = trimKey(userKeyPair.publicKey);
      const userPrivateKey = trimKey(userKeyPair.privateKey);

    


      // ✅ Generate tracking code with both keys (frontend only)
      const userTrackingCode = generateUserTrackingCode(
       userPublicKey,
        userPrivateKey
      );
      console.warn(userPublicKey)
      console.warn(userPrivateKey)

      // Send encrypted complaint + user public key
      const response = await axios.post("/api/complaint/submit", {
        formId: form.id,
        category: formData.Category,
        encryptedData: encryptedFormData,
        userPublicKey: userPublicKey // User's public key
      });

      const confirmationData = response.data.ComplaintData;

      setSubmissionStatus('success');
      setConfirmationData({
        message: 'Your complaint has been submitted successfully!',
        trackingCode: userTrackingCode,
      });
      setTrackingCode(userTrackingCode);
      alert("Complaint submitted successfully!");
    } catch (err) {
      console.error("Submission failed:", err);
      alert("Error submitting complaint");
    }
  };

  const copyTrackingCode = () => {
    navigator.clipboard.writeText(confirmationData.trackingCode);
    alert('Tracking code copied to clipboard!');
  };

  // Render individual form field
  const renderField = (field, index) => {
    const { label, type, required, options } = field;
    const fieldValue = formData[label] || '';

    switch (type) {
      case 'text':
        return (
          <div key={index} className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {label} {required && <span className="text-red-500">*</span>}
            </label>
            <input
              type="text"
              value={fieldValue}
              onChange={(e) => handleFieldChange(label, e.target.value, type)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors"
              placeholder={`Enter ${label.toLowerCase()}...`}
            />
          </div>
        );

      case 'textarea':
        return (
          <div key={index} className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {label} {required && <span className="text-red-500">*</span>}
            </label>
            <textarea
              value={fieldValue}
              onChange={(e) => handleFieldChange(label, e.target.value, type)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors min-h-[100px] resize-vertical"
              placeholder={`Please provide ${label.toLowerCase()}...`}
            />
          </div>
        );

      case 'date':
        return (
          <div key={index} className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {label} {required && <span className="text-red-500">*</span>}
            </label>
            <input
              type="date"
              value={fieldValue}
              onChange={(e) => handleFieldChange(label, e.target.value, type)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors"
            />
          </div>
        );

      case 'select':
        return (
          <div key={index} className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {label} {required && <span className="text-red-500">*</span>}
            </label>
            <select
              value={fieldValue}
              onChange={(e) => handleFieldChange(label, e.target.value, type)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors bg-white"
            >
              <option value="">Select an option...</option>
              {options.map((option, optIndex) => (
                <option key={optIndex} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </div>
        );

      case 'radio':
        return (
          <div key={index} className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {label} {required && <span className="text-red-500">*</span>}
            </label>
            <div className="space-y-2">
              {options.map((option, optIndex) => (
                <label key={optIndex} className="flex items-center cursor-pointer">
                  <input
                    type="radio"
                    name={`${label}-${index}`}
                    value={option}
                    checked={fieldValue === option}
                    onChange={(e) => handleFieldChange(label, e.target.value, type)}
                    className="w-4 h-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                  />
                  <span className="ml-2 text-sm text-gray-700">{option}</span>
                </label>
              ))}
            </div>
          </div>
        );

      case 'checkbox':
        return (
          <div key={index} className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {label} {required && <span className="text-red-500">*</span>}
            </label>
            <div className="space-y-2">
              {options.map((option, optIndex) => (
                <label key={optIndex} className="flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    value={option}
                    checked={(fieldValue || []).includes(option)}
                    onChange={(e) => handleFieldChange(label, e.target.value, type)}
                    className="w-4 h-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <span className="ml-2 text-sm text-gray-700">{option}</span>
                </label>
              ))}
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  // Show success message after submission
  if (submissionStatus === 'success' && confirmationData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-white rounded-lg shadow-md p-8">
          <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-4 text-center">
            Thank You!
          </h2>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <p className="text-gray-700 mb-4">{confirmationData.message}</p>

            {/* Tracking Code Section */}
            {confirmationData.trackingCode && (
              <div className="bg-white rounded border p-3">
                <h3 className="font-semibold text-gray-900 mb-2">
                  Your Tracking Code:
                </h3>

                {/* Scrollable Textarea */}
                <textarea
                  readOnly
                  value={confirmationData.trackingCode}
                  className="w-full h-32 p-2 border rounded bg-gray-100 font-mono text-sm resize-none overflow-x-auto"
                />

                {/* Copy + Download Buttons */}
                <div className="flex flex-col sm:flex-row gap-2 mt-3">
                  {/* Copy Button */}
                  <button
                    className="flex-1 px-4 py-2 cursor-pointer bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                    onClick={copyTrackingCode}
                  >
                    Copy Tracking Code
                  </button>

                  {/* Download Button */}
                  <button
                    className="flex-1 px-4 py-2 cursor-pointer bg-green-600 text-white rounded-lg hover:bg-green-700"
                    onClick={() => {
                      const blob = new Blob(
                        [`Tracking Code:\n${confirmationData.trackingCode}`],
                        { type: "text/plain;charset=utf-8" }
                      );
                      const url = URL.createObjectURL(blob);
                      const a = document.createElement("a");
                      a.href = url;
                      a.download = "tracking-code.txt";
                      a.click();
                      URL.revokeObjectURL(url);
                    }}
                  >
                    Download .txt
                  </button>
                </div>

                <p className="text-sm text-gray-600 mt-2">
                  Save this code to check your submission status later.
                </p>
              </div>
            )}
          </div>

          <div className="space-y-3">
            <button
              onClick={() => {
                setSubmissionStatus('');
                setForm(null);
                setAccessCode('');
                setFormData({});
                setConfirmationData(null);
                setError('');
              }}
              className="w-full cursor-pointer bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Submit Another Form
            </button>

            <button
              onClick={() => {
                setShowStatusCheck(true);
                setSubmissionStatus('');
                setForm(null);
                setAccessCode('');
                setFormData({});
                setConfirmationData(null);
                setTrackingCode(confirmationData.trackingCode);
                setError('');
              }}
              className="w-full cursor-pointer bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 transition-colors"
            >
              Check This Submission Status
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Show status check section
  if (showStatusCheck) {
    return (
      <div className="min-h-screen bg-gray-50 py-8 px-4">
        <div className="max-w-2xl mx-auto">
          <div className="bg-white rounded-lg shadow-md p-8">
            <h1 className="text-3xl font-bold text-gray-900 text-center mb-2">
              Check Status
            </h1>
            <p className="text-gray-600 text-center mb-8">
              Enter your tracking code to check your submission status
            </p>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tracking Code
                </label>
                <input
                  type="text"
                  value={trackingCode}
                  onChange={(e) => setTrackingCode(e.target.value)} // REMOVED .toUpperCase()
                  onKeyPress={(e) => e.key === 'Enter' && checkStatus()}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors text-center text-lg font-mono"
                  placeholder="Enter tracking code..."
                  style={{ letterSpacing: '1px' }} // Reduced letter spacing
                />
              </div>
              
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center">
                  <AlertCircle className="w-5 h-5 text-red-500 mr-2" />
                  <span className="text-red-700">{error}</span>
                </div>
              )}

              {statusResponse && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <h3 className="font-semibold text-green-900 mb-2">Status Update</h3>
                  <p className="text-green-800 mb-2">{statusResponse.message}</p>
                  {statusResponse.timestamp && (
                    <p className="text-sm text-green-600">
                      Response Time: {new Date(statusResponse.timestamp).toLocaleString()}
                    </p>
                  )}
                </div>
              )}
              
              <div className="flex gap-4">
                <button
                  onClick={() => {
                    setShowStatusCheck(false);
                    setTrackingCode('');
                    setStatusResponse(null);
                    setError('');
                  }}
                  className="flex-1 cursor-pointer bg-gray-300 text-gray-700 py-3 px-4 rounded-lg hover:bg-gray-400 transition-colors"
                >
                  Back
                </button>
                <button
                  onClick={checkStatus}
                  disabled={loading}
                  className="flex-1 cursor-pointer bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
                >
                  {loading ? (
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  ) : (
                    <>
                      <Eye className="w-5 h-5 mr-2" />
                      Check Status
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        {!form ? (
          // Access Code Input Section
          <div className="bg-white rounded-lg shadow-md p-8">
            <h1 className="text-3xl font-bold text-gray-900 text-center mb-2">
              Access Form
            </h1>
            <p className="text-gray-600 text-center mb-8">
              Enter your access code to view and submit the form
            </p>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Access Code
                </label>
                <input
                  type="text"
                  value={accessCode}
                  onChange={(e) => setAccessCode(e.target.value.toUpperCase())}
                  onKeyPress={(e) => e.key === 'Enter' && fetchForm()}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors text-center text-lg font-mono"
                  placeholder="Enter access code..."
                  style={{ letterSpacing: '2px' }}
                />
              </div>
              
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center">
                  <AlertCircle className="w-5 h-5 text-red-500 mr-2" />
                  <span className="text-red-700">{error}</span>
                </div>
              )}
              
              <div className="flex gap-4">
                <button
                  onClick={fetchForm}
                  disabled={loading}
                  className="flex-1 cursor-pointer bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
                >
                  {loading ? (
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  ) : (
                    <>
                      <Search className="w-5 h-5 mr-2" />
                      Access Form
                    </>
                  )}
                </button>
                
                <button
                  onClick={() => setShowStatusCheck(true)}
                  className="flex-1 cursor-pointer bg-green-600 text-white py-3 px-4 rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center"
                >
                  <Eye className="w-5 h-5 mr-2" />
                  Check Status
                </button>
              </div>
            </div>
          </div>
        ) : (
          // Dynamic Form Section
          <div className="bg-white rounded-lg shadow-md p-8">
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                {form.title}
              </h1>
              {form.description && (
                <p className="text-gray-600">
                  {form.description}
                </p>
              )}
            </div>
            
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center mb-6">
                <AlertCircle className="w-5 h-5 text-red-500 mr-2" />
                <span className="text-red-700">{error}</span>
              </div>
            )}
            
            <div className="space-y-6">
              {form.formFields.map((field, index) => renderField(field, index))}
              
              <div className="flex gap-4 pt-6">
                <button
                  onClick={() => {
                    setForm(null);
                    setAccessCode('');
                    setFormData({});
                    setError('');
                  }}
                  className="flex-1 cursor-pointer bg-gray-300 text-gray-700 py-3 px-4 rounded-lg hover:bg-gray-400 transition-colors"
                >
                  Back to Access Code
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={loading}
                  className="flex-1 cursor-pointer bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {loading ? (
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mx-auto"></div>
                  ) : (
                    'Submit Form'
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default UserForm;