import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  Users, 
  FileText, 
  Plus, 
  Search, 
  Bell, 
  Settings, 
  LogOut, 
  Filter,
  Eye,
  Edit,
  Trash2,
  Calendar,
  Clock,
  User,
  Mail,
  Phone,
  MapPin,
  ChevronDown,
  MoreVertical,
  Download,
  Share2,
  Archive,
  Copy,
  Save,
  X,
  ArrowLeft,
  Check,
  Loader,
  AlertCircle,
  CheckCircle,
  Info
} from 'lucide-react';

// Beautiful Message Component
const Message = ({ type, title, message, onClose }) => {
  const getMessageStyles = () => {
    switch (type) {
      case 'success':
        return {
          container: 'bg-green-50 border-green-200 text-green-800',
          icon: <CheckCircle className="w-5 h-5 text-green-600" />,
          titleColor: 'text-green-800',
          messageColor: 'text-green-700'
        };
      case 'error':
        return {
          container: 'bg-red-50 border-red-200 text-red-800',
          icon: <AlertCircle className="w-5 h-5 text-red-600" />,
          titleColor: 'text-red-800',
          messageColor: 'text-red-700'
        };
      case 'info':
        return {
          container: 'bg-blue-50 border-blue-200 text-blue-800',
          icon: <Info className="w-5 h-5 text-blue-600" />,
          titleColor: 'text-blue-800',
          messageColor: 'text-blue-700'
        };
      default:
        return {
          container: 'bg-gray-50 border-gray-200 text-gray-800',
          icon: <Info className="w-5 h-5 text-gray-600" />,
          titleColor: 'text-gray-800',
          messageColor: 'text-gray-700'
        };
    }
  };

  const styles = getMessageStyles();

  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, 5000);

    return () => clearTimeout(timer)
    
    

  }, [onClose]);


  return (
    <div className={`fixed top-6 right-6 z-50 max-w-md w-full border rounded-lg shadow-lg ${styles.container} animate-slide-in`}>
      <div className="p-4">
        <div className="flex items-start">
          <div className="flex-shrink-0">
            {styles.icon}
          </div>
          <div className="ml-3 flex-1">
            <h3 className={`text-sm font-medium ${styles.titleColor}`}>
              {title}
            </h3>
            <p className={`mt-1 text-sm ${styles.messageColor}`}>
              {message}
            </p>
          </div>
          <div className="ml-4 flex-shrink-0">
            <button
              onClick={onClose}
              className={`inline-flex rounded-md p-1.5 focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                type === 'success' ? 'text-green-500 hover:bg-green-100 focus:ring-green-600' :
                type === 'error' ? 'text-red-500 hover:bg-red-100 focus:ring-red-600' :
                'text-blue-500 hover:bg-blue-100 focus:ring-blue-600'
              }`}
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Form Creator Component
const FormCreator = ({ showMessage }) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'Bullying (mobbing, bossing, staffing, gossip)',
    moreInformation: '',
    accessCode: ''
  });
  
  const [confirmationData, setConfirmationData] = useState({
    confirmationMessage: 'We received the case in order. We will investigate it as soon as possible and respond to you.',
    enableEmailNotifications: true
  });
  
  const [customFields, setCustomFields] = useState([]);
  const [newField, setNewField] = useState({ 
    label: '', 
    type: 'text', 
    required: false, 
    options: []
  });
  const [showAddField, setShowAddField] = useState(false);
  const [savedForms, setSavedForms] = useState([]);
  const [showConfirmationPage, setShowConfirmationPage] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  const [optionInput, setOptionInput] = useState('');

  const generateAccessCode = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < 8; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setFormData(prev => ({ ...prev, accessCode: result }));
  };

  useEffect(() => {
    if (!formData.accessCode) {
      generateAccessCode();
    }
  }, []);

  const addOption = () => {
    if (optionInput.trim() && !newField.options.includes(optionInput.trim())) {
      setNewField(prev => ({
        ...prev,
        options: [...prev.options, optionInput.trim()]
      }));
      setOptionInput('');
    }
  };

  const removeOption = (optionToRemove) => {
    setNewField(prev => ({
      ...prev,
      options: prev.options.filter(option => option !== optionToRemove)
    }));
  };

  const handleTypeChange = (newType) => {
    setNewField(prev => ({
      ...prev,
      type: newType,
      options: ['select', 'radio', 'checkbox'].includes(newType) ? [] : prev.options
    }));
    setOptionInput('');
  };

  const handleAddField = () => {
    if (!newField.label.trim()) {
      showMessage('error', 'Field Required', 'Please enter a field label before adding the field.');
      return;
    }

    if (['select', 'radio', 'checkbox'].includes(newField.type) && newField.options.length === 0) {
      showMessage('error', 'Options Required', 'Please add at least one option for this field type.');
      return;
    }

    const field = {
      id: Date.now(),
      label: newField.label.trim(),
      type: newField.type,
      required: newField.required,
      options: ['select', 'radio', 'checkbox'].includes(newField.type) ? newField.options : undefined
    };
    setCustomFields(prev => [...prev, field]);
    setNewField({ label: '', type: 'text', required: false, options: [] });
    setOptionInput('');
    setShowAddField(false);
    showMessage('success', 'Field Added', `Custom field "${field.label}" has been added to your form.`);
  };

  const handleRemoveField = (fieldId) => {
    const fieldToRemove = customFields.find(field => field.id === fieldId);
    setCustomFields(prev => prev.filter(field => field.id !== fieldId));
    showMessage('info', 'Field Removed', `Custom field "${fieldToRemove?.label}" has been removed from your form.`);
  };

  const handleSaveForm = async () => {
    if (!formData.title || !formData.description) {
      showMessage('error', 'Required Fields Missing', 'Please fill in the form title and description before saving.');
      return;
    }
    setIsLoading(true);
    try {
      const formBlueprint = {
        title: formData.title,
        description: formData.description,
        confirmationMessage: confirmationData.confirmationMessage,
        accessCode: formData.accessCode,
        enableEmailNotifications: confirmationData.enableEmailNotifications,
        formFields: [
          { 
            label: 'Category', 
            type: 'select', 
            required: true,
            options: [
              'Bullying (mobbing, bossing, staffing, gossip)',
              'Harassment (sexual, psychological)',
              'Discrimination (age, gender, race, etc.)',
              'Financial misconduct',
              'Safety violations',
              'Other ethical concerns'
            ],
            defaultValue: formData.category
          },
          { 
            label: 'More information', 
            type: 'textarea', 
            required: true,
            placeholder: 'Please provide as much detail as possible about the incident...'
          },
          ...customFields.map(field => ({
            label: field.label,
            type: field.type,
            required: field.required,
            options: field.options,
          }))
        ]
      };

      const token = localStorage.getItem('token');
      const backendURL = import.meta.env.BACKEND_URL || 'http://localhost:5000';
      
      const response = await axios.post(
        `${backendURL}/api/forms/createform`,
        formBlueprint,
        {
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`
          }
        }
      );
      
      if (response.status === 200 || response.status === 201) {
        const result = response.data;
        const newForm = {
          ...formBlueprint,
          id: result.form?._id || Date.now(),
          createdAt: new Date().toISOString(),
          accessCode: result.accessCode || formBlueprint.accessCode
        };
        
        setSavedForms(prev => [...prev, newForm]);
        
        setFormData({
          title: '',
          description: '',
          category: 'Bullying (mobbing, bossing, staffing, gossip)',
          moreInformation: '',
          accessCode: ''
        });
        setConfirmationData({
          confirmationMessage: 'We received the case in order. We will investigate it as soon as possible and respond to you.',
          enableEmailNotifications: true
        });
        setCustomFields([]);
        generateAccessCode();
        
        showMessage('success', 'Form Blueprint Created!', `Your form has been successfully created with access code: ${formBlueprint.accessCode}`);
      }
    } catch (error) {
      console.error('Error saving form:', error);
      if (error.response?.data?.message?.includes('Access code already exists')) {
        showMessage('error', 'Duplicate Access Code', 'This access code already exists. A new unique code has been generated for you.');
        generateAccessCode();
      } else {
        showMessage('error', 'Creation Failed', 'Unable to create the form blueprint. Please check your connection and try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const copyAccessCode = () => {
    navigator.clipboard.writeText(formData.accessCode);
    showMessage('success', 'Copied!', 'Access code has been copied to your clipboard.');
  };
  
  const renderPreviewField = (field) => {
    switch (field.type) {
      case 'text':
        return (
          <input
            type="text"
            placeholder={`Enter ${field.label.toLowerCase()}...`}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50"
            disabled
          />
        );
      case 'textarea':
        return (
          <textarea
            placeholder={`Please provide ${field.label.toLowerCase()}...`}
            rows={4}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 resize-none"
            disabled
          />
        );
      case 'select':
        return (
          <select className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50" disabled>
            <option>{`Select ${field.label.toLowerCase()}...`}</option>
            {field.options?.map((option, index) => (
              <option key={index} value={option}>{option}</option>
            ))}
          </select>
        );
      case 'radio':
        return (
          <div className="space-y-2">
            {field.options?.map((option, index) => (
              <label key={index} className="flex items-center">
                <input
                  type="radio"
                  name={`preview-${field.id}`}
                  value={option}
                  className="mr-2"
                  disabled
                />
                <span className="text-sm text-gray-700">{option}</span>
              </label>
            ))}
          </div>
        );
      case 'checkbox':
        return (
          <div className="space-y-2">
            {field.options?.map((option, index) => (
              <label key={index} className="flex items-center">
                <input
                  type="checkbox"
                  value={option}
                  className="mr-2"
                  disabled
                />
                <span className="text-sm text-gray-700">{option}</span>
              </label>
            ))}
          </div>
        );
      case 'number':
        return (
          <input
            type="number"
            placeholder={`Enter ${field.label.toLowerCase()}...`}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50"
            disabled
          />
        );
      case 'date':
        return (
          <input
            type="date"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50"
            disabled
          />
        );
      default:
        return (
          <input
            type="text"
            placeholder={`Enter ${field.label.toLowerCase()}...`}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50"
            disabled
          />
        );
    }
  };

  if (showConfirmationPage) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <button
            onClick={() => setShowConfirmationPage(false)}
            className="flex items-center text-blue-600 hover:text-blue-800 mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Form Configuration
          </button>
          <h3 className="text-xl font-semibold text-gray-900">Confirmation Page Settings</h3>
          <p className="text-gray-600 mt-1">Configure what users see after submitting the form</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="space-y-6">
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h4 className="font-medium text-gray-900 mb-4">Confirmation Settings</h4>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Confirmation Message
                  </label>
                  <textarea
                    value={confirmationData.confirmationMessage}
                    onChange={(e) => setConfirmationData(prev => ({ ...prev, confirmationMessage: e.target.value }))}
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                    placeholder="Enter the message users will see after submitting..."
                  />
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="emailNotifications"
                    checked={confirmationData.enableEmailNotifications}
                    onChange={(e) => setConfirmationData(prev => ({ ...prev, enableEmailNotifications: e.target.checked }))}
                    className="mr-3"
                  />
                  <label htmlFor="emailNotifications" className="text-sm text-gray-700">
                    Enable email notifications - Allow users to provide email for case updates
                  </label>
                </div>
              </div>
            </div>

            <button
              onClick={() => setShowConfirmationPage(false)}
              className="w-full flex items-center justify-center px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              <Save className="w-4 h-4 mr-2" />
              Save Confirmation Settings
            </button>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-8">
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Check className="w-8 h-8 text-green-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Case was sent</h2>
              <p className="text-gray-600">Your report has been submitted successfully</p>
            </div>

            <div className="space-y-6">
              <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                <p className="text-sm text-green-800">
                  {confirmationData.confirmationMessage}
                </p>
              </div>

              <div className="text-center p-6 bg-gray-50 border border-gray-200 rounded-lg">
                <p className="text-sm text-gray-600 mb-2">
                  Download or copy and safely store this key. Without it, you won't be able to check the case or communicate further with your organisation!
                </p>
                <div className="text-2xl font-mono font-bold text-gray-900 mb-4 tracking-wider">
                  e.g ABC123XYZ
                </div>
                <button
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg"
                  disabled
                >
                  Copy Tracking Code
                </button>
              </div>

              {confirmationData.enableEmailNotifications && (
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <label className="block text-sm font-medium text-blue-800 mb-2">
                    Email Address (Optional)
                  </label>
                  <input
                    type="email"
                    placeholder="Enter your email for updates..."
                    className="w-full px-3 py-2 border border-blue-300 rounded-lg bg-white"
                    disabled
                  />
                  <p className="text-xs text-blue-600 mt-2">
                    We'll send you updates about your case to this email address
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="space-y-6">
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Form Blueprint Configuration</h3>
            <p className="text-sm text-gray-600 mb-4">Create the structure and layout that users will see when they enter the access code</p>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Form Title *
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="e.g., Whistleblowing Channel"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description *
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Describe the purpose of this form..."
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Default Category
                </label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option>Bullying (mobbing, bossing, staffing, gossip)</option>
                  <option>Harassment (sexual, psychological)</option>
                  <option>Discrimination (age, gender, race, etc.)</option>
                  <option>Financial misconduct</option>
                  <option>Safety violations</option>
                  <option>Other ethical concerns</option>
                </select>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h4 className="font-medium text-gray-900 mb-4">Form Access Code</h4>
            <p className="text-sm text-gray-600 mb-4">Users will enter this code to access the form you're creating</p>
            <div className="flex items-center space-x-3">
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Access Code
                </label>
                <div className="flex items-center space-x-2">
                  <input
                    type="text"
                    value={formData.accessCode}
                    readOnly
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 font-mono text-lg font-bold"
                  />
                  <button
                    onClick={copyAccessCode}
                    className="p-2 text-gray-500 hover:text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
                  >
                    <Copy className="w-4 h-4" />
                  </button>
                  <button
                    onClick={generateAccessCode}
                    className="px-3 py-2 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
                  >
                    Generate New
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h4 className="font-medium text-gray-900">Additional Fields</h4>
                <p className="text-sm text-gray-500">Add custom fields that users will fill out</p>
              </div>
              <button
                onClick={() => setShowAddField(true)}
                className="flex cursor-pointer items-center px-3 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                <Plus className="w-4 h-4 mr-1" />
                Add Field
              </button>
            </div>

            {showAddField && (
              <div className="mb-4 p-4 border border-gray-200 rounded-lg bg-gray-50">
                <div className="space-y-3">
                  <div>
                    <input
                      type="text"
                      placeholder="Field label..."
                      value={newField.label}
                      onChange={(e) => setNewField(prev => ({ ...prev, label: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    />
                  </div>
                  <div className="flex items-center space-x-3">
                    <select
                      value={newField.type}
                      onChange={(e) => handleTypeChange(e.target.value)}
                      className="px-3 py-2 border border-gray-300 rounded-lg"
                    >
                      <option value="text">Text Input</option>
                      <option value="textarea">Text Area</option>
                      <option value="select">Dropdown</option>
                      <option value="radio">Radio Buttons</option>
                      <option value="checkbox">Checkbox</option>
                      <option value="number">Number Input</option>
                      <option value="date">Date</option>
                    </select>
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={newField.required}
                        onChange={(e) => setNewField(prev => ({ ...prev, required: e.target.checked }))}
                        className="mr-2"
                      />
                      <span className="text-sm">Required</span>
                    </label>
                  </div>
                  
                  {['select', 'radio', 'checkbox'].includes(newField.type) && (
                    <div className="space-y-3 p-3 bg-white border border-gray-200 rounded-lg">
                      <label className="block text-sm font-medium text-gray-700">
                        Options for {newField.type}:
                      </label>
                      <div className="flex items-center space-x-2">
                        <input
                          type="text"
                          placeholder="Enter option..."
                          value={optionInput}
                          onChange={(e) => setOptionInput(e.target.value)}
                          onKeyPress={(e) => e.key === 'Enter' && addOption()}
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm"
                        />
                        <button
                          onClick={addOption}
                          className="px-3 py-2 cursor-pointer text-sm bg-green-600 text-white rounded hover:bg-green-700"
                        >
                          Add
                        </button>
                      </div>
                      {newField.options.length > 0 && (
                        <div className="space-y-1">
                          <p className="text-xs text-gray-500">Current options:</p>
                          {newField.options.map((option, index) => (
                            <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded text-sm">
                              <span>{option}</span>
                              <button
                                onClick={() => removeOption(option)}
                                className="text-red-500 cursor-pointer hover:text-red-700"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                  
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={handleAddField}
                      className="px-3 cursor-pointer py-1.5 text-sm bg-green-600 text-white rounded hover:bg-green-700"
                    >
                      Add Field
                    </button>
                    <button
                      onClick={() => {
                        setShowAddField(false);
                        setNewField({ label: '', type: 'text', required: false, options: [] });
                        setOptionInput('');
                      }}
                      className="px-3 cursor-pointer py-1.5 text-sm text-gray-600 border border-gray-300 rounded hover:bg-gray-50"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            )}

            <div className="space-y-2">
              {customFields.map((field) => (
                <div key={field.id} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <span className="font-medium">{field.label}</span>
                    <span className="px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded">
                      {field.type}
                    </span>
                    {field.required && (
                      <span className="px-2 py-1 text-xs bg-red-100 text-red-600 rounded">
                        Required
                      </span>
                    )}
                    {field.options && field.options.length > 0 && (
                      <span className="px-2 py-1 text-xs bg-blue-100 text-blue-600 rounded">
                        {field.options.length} options
                      </span>
                    )}
                  </div>
                  <button
                    onClick={() => handleRemoveField(field.id)}
                    className="p-1 text-red-500 hover:text-red-700"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-3">
            <button
              onClick={() => setShowConfirmationPage(true)}
              className="w-full flex items-center justify-center px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700"
            >
              <Check className="w-4 h-4 mr-2" />
              Configure Confirmation Page
            </button>

            <button
              onClick={handleSaveForm}
              disabled={!formData.title || !formData.description || isLoading}
              className="w-full flex items-center justify-center px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <>
                  <Loader className="w-4 h-4 mr-2 animate-spin" />
                  Creating Blueprint...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Save Form Blueprint
                </>
              )}
            </button>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-center mb-6">
            <div>
              <h4 className="font-medium text-gray-900">Live Preview</h4>
              <p className="text-sm text-gray-500">How users will see the form</p>
            </div>
          </div>

          <div className="space-y-6">
            <div className="text-center border-b border-gray-200 pb-6">
              <h2 className="text-xl font-bold text-gray-900">
                {formData.title || 'Form Title'}
              </h2>
              <p className="text-gray-800 mt-2">
                {formData.description || 'Form description will appear here...'}
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Category *
                </label>
                <select className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50" disabled>
                  <option>{formData.category}</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  More information *
                </label>
                <textarea
                  placeholder="Please provide as much detail as possible..."
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 resize-none"
                  disabled
                />
              </div>

              {customFields.map((field) => (
                <div key={field.id}>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {field.label} {field.required && <span className="text-red-500">*</span>}
                  </label>
                  {renderPreviewField(field)}
                 </div>
              ))}

              <button
                className="w-full py-3 bg-blue-600 text-white rounded-lg font-medium"
                disabled
              >
                Submit Report
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const Dashboard = () => {
  const [activeSection, setActiveSection] = useState('cases');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [message, setMessage] = useState(null);
  const [cases, setCases] = useState([]);
  const [isLoadingCases, setIsLoadingCases] = useState(false);
  
  const showMessage = (type, title, messageText) => {
    setMessage({ type, title, message: messageText });
  };

  const closeMessage = () => {
    setMessage(null);
  };

  useEffect(() => {
    getCases();
  }, []);

  const getAdminData = () => {
    try {
      const data = localStorage.getItem('adminData');
      return data ? JSON.parse(data) : { fullname: { firstname: "Admin", lastname: "User" }, email: "admin@example.com" };
    } catch (error) {
      return { fullname: { firstname: "Admin", lastname: "User" }, email: "admin@example.com" };
    }
  };
  
  const adminData = getAdminData();

 const getCases = async () => {
  setIsLoadingCases(true)
  try {
    const response = await axios.get('/api/complaint/getcomplaint', {
      params: {
        adminId: adminData._id,
      },
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (response.status === 200 || response.status === 201) {
      const result = response.data;
      console.log("Response from getCases:", result);
      console.log("Cases fetched successfully:", result.cases);

      // Ensure result.cases is always an array
      const casesArray = Array.isArray(result.cases)
        ? result.cases
        : result.cases
        ? [result.cases]
        : [];

      const transformedCases = casesArray.map(apiCase => ({
        id: apiCase._id || apiCase.id,
        title: apiCase.category || "Case Report",
        client: apiCase.submittedBy || "Anonymous",
        createdAt:
          apiCase.createdAt ||
          apiCase.submissionDate ||
          new Date().toISOString(),
        lastActivity:
          apiCase.updatedAt ||
          apiCase.lastActivity ||
          apiCase.createdAt ||
          new Date().toISOString(),
       
        description:
          apiCase.moreInformation ||
          apiCase.description ||
          "",
        originalData: apiCase,
      }));

      setCases(transformedCases);

      setIsLoadingCases(false)
    }
  } catch (error) {
    console.error("No case found",);
  }
};



  // Helper function to map API status to UI status
  const mapApiStatusToUIStatus = (apiStatus) => {
    const statusMap = {
      'submitted': 'pending',
      'in-progress': 'active',
      'under-review': 'active',
      'resolved': 'completed',
      'closed': 'archived',
      'new': 'pending'
    };
    return statusMap[apiStatus?.toLowerCase()] || 'pending';
  };

  // Helper function to determine priority from case data
  const determinePriority = (caseData) => {
    // You can implement your own logic here based on the case data
    // For example, certain categories might have higher priority
    const highPriorityCategories = ['harassment', 'safety violations', 'bullying'];
    const category = caseData.category?.toLowerCase() || '';
    
    if (highPriorityCategories.some(cat => category.includes(cat))) {
      return 'high';
    }
    
    // Check if case is old (more than 30 days) - might be higher priority
    const createdDate = new Date(caseData.createdAt);
    const daysSinceCreation = (new Date() - createdDate) / (1000 * 60 * 60 * 24);
    
    if (daysSinceCreation > 30) {
      return 'high';
    } else if (daysSinceCreation > 7) {
      return 'medium';
    }
    
    return 'low';
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('adminData');
    localStorage.removeItem('publicKey');
    localStorage.removeItem('privateKey');
    window.location.href = '/login';
  };

  const getStatusColor = (status) => {
    const colors = {
      active: 'bg-blue-100 text-blue-800',
      pending: 'bg-yellow-100 text-yellow-800',
      completed: 'bg-green-100 text-green-800',
      archived: 'bg-gray-100 text-gray-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const getPriorityColor = (priority) => {
    const colors = {
      critical: 'bg-red-100 text-red-800 border-red-200',
      high: 'bg-orange-100 text-orange-800 border-orange-200',
      medium: 'bg-blue-100 text-blue-800 border-blue-200',
      low: 'bg-gray-100 text-gray-800 border-gray-200'
    };
    return colors[priority] || 'bg-gray-100 text-gray-800 border-gray-200';
  };

  const filteredCases = cases.filter(c => {
    const matchesSearch = c.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         c.client.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         c.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterStatus === 'all' || c.status === filterStatus;
    return matchesSearch && matchesFilter;
  });

  return (
    <div className="flex h-screen bg-gray-50">
      {message && (
        <Message
          type={message.type}
          title={message.title}
          message={message.message}
          onClose={closeMessage}
        />
      )}

      <div className="w-64 bg-white shadow-lg border-r border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <h1 className="text-2xl font-bold text-gray-900">LockBox</h1>
          <p className="text-sm text-gray-500 mt-1">Admin Portal</p>
        </div>

        <nav className="mt-6">
          <div className="px-4 space-y-2">
            <button
              onClick={() => {
                setActiveSection("cases");
                getCases();
              }}
              className={`w-full cursor-pointer flex items-center px-4 py-3 text-left rounded-lg transition-colors ${
                activeSection === 'cases' 
                  ? 'bg-blue-50 text-blue-700 border-r-2 border-blue-700' 
                  : 'text-gray-700 hover:bg-gray-50'
              }`}
            >
              <Users className="w-5 h-5 mr-3" />
              Cases Management
            </button>
            
            <button
              onClick={() => setActiveSection('forms')}
              className={`w-full flex cursor-pointer items-center px-4 py-3 text-left rounded-lg transition-colors ${
                activeSection === 'forms' 
                  ? 'bg-blue-50 text-blue-700 border-r-2 border-blue-700' 
                  : 'text-gray-700 hover:bg-gray-50'
              }`}
            >
              <FileText className="w-5 h-5 mr-3" />
              Form Creator
            </button>
          </div>
        </nav>

        <div className="absolute bottom-0 w-64 p-4 border-t border-gray-200">
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center">
              <User className="w-5 h-5 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">{adminData.fullname?.firstname || 'Admin'}</p>
              <p className="text-sm font-medium text-gray-900 truncate">{adminData.fullname?.lastname || ''}</p>
              <p className="text-xs text-gray-500 truncate">{adminData.email}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full cursor-pointer flex items-center px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors"
          >
            <LogOut className="w-4 h-4 mr-2" />
            Sign Out
          </button>
        </div>
      </div>

      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="bg-white shadow-sm border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-semibold text-gray-900">
                {activeSection === 'cases' ? 'Cases Management' : 'Form Blueprint Creator'}
              </h2>
              <p className="text-gray-600 mt-1">
                {activeSection === 'cases' 
                  ? 'Manage and track investigation cases' 
                  : 'Create form templates that users will access with access codes'
                }
              </p>
            </div>
          </div>
        </header>

        {activeSection === 'cases' && (
          <div className="flex-1 p-6 overflow-y-auto">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
              <div className="flex-1 flex items-center space-x-4">
                <div className="relative flex-1 max-w-md">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    type="text"
                    placeholder="Search cases..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent w-full"
                  />
                </div>
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="px-3 cursor-pointer py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="all">All Status</option>
                  <option value="active">Active</option>
                  <option value="pending">Pending</option>
                  <option value="completed">Completed</option>
                  <option value="archived">Archived</option>
                </select>
              </div>
              <div className="flex items-center space-x-3">
                <button 
                  onClick={getCases}
                  disabled={isLoadingCases}
                  className="flex cursor-pointer items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:bg-gray-300"
                >
                  {isLoadingCases ? (
                    <>
                      <Loader className="w-4 h-4 mr-2 animate-spin" />
                      Loading...
                    </>
                  ) : (
                    'Refresh Cases'
                  )}
                </button>
               
              </div>
            </div>

            <div className="grid gap-6">
              {isLoadingCases ? (
                <div className="text-center py-12">
                  <Loader className="w-12 h-12 text-gray-400 mx-auto mb-4 animate-spin" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Loading Cases</h3>
                  <p className="text-gray-500">Please wait while we fetch your cases...</p>
                </div>
              ) : filteredCases.length > 0 ? (
                filteredCases.map((caseItem) => (
                  <div key={caseItem.id}
                   className="bg-white rounded-lg border border-gray-200 hover:shadow-md transition-shadow">
                    <div 
                       onClick={() => {
                    window.location.href = `/admin/case/${caseItem.id}`;
                  }}
                    className="p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <h3 className="text-lg font-semibold text-gray-900 mb-2">{caseItem.title}</h3>
                          <p className="text-gray-600 mb-2">Submitted by: {caseItem.client}</p>
                          <p className="text-gray-500 text-sm mb-3 line-clamp-2">{caseItem.description}</p>
                          <div className="flex items-center space-x-4 text-sm text-gray-500">
                            <div className="flex items-center">
                              <Calendar className="w-4 h-4 mr-1" />
                              Created: {new Date(caseItem.createdAt).toLocaleDateString()}
                            </div>
                          </div>
                        </div>
                       
                      </div>
                      
                     
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-12">
                  <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No cases found</h3>
                  <p className="text-gray-500 mb-4">
                    {searchTerm || filterStatus !== 'all' 
                      ? 'Try adjusting your search or filter criteria.' 
                      : 'Get started by creating your first case or click "Refresh Cases" to load existing cases.'
                    }
                  </p>
                  <div className="flex items-center justify-center space-x-3">
                    <button 
                      onClick={getCases}
                      className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                    >
                      Refresh Cases
                    </button>
                  
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {activeSection === 'forms' && (
          <div className="flex-1 p-6 overflow-y-auto">
            <FormCreator showMessage={showMessage} />
          </div>
        )}
      </div>

      <style jsx>{`
        @keyframes slide-in {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
        
        .animate-slide-in {
          animation: slide-in 0.3s ease-out forwards;
        }

        .line-clamp-2 {
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
      `}</style>
    </div>
  );
};

export default Dashboard;