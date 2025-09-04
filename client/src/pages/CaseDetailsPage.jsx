import { 
  ArrowLeft, 
  User, 
  Calendar, 
  Clock, 
  CheckCircle, 
  XCircle, 
  MessageSquare, 
  Send, 
  Download, 
  FileText, 
  AlertTriangle,
  Shield,
  Lock,
  Unlock,
  Eye,
  EyeOff,
  Loader,
  Save,
  Check,
  X,
  Gavel,
  Scale,
  FileCheck,
  MessageCircle,
  Phone,
  Mail,
  MapPin,
  UserCheck,
  Activity,
  AlertCircle,
  Star,
  TrendingUp,
  Flag
} from 'lucide-react';

import React, { useState, useEffect, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import { decryptWithPrivateKey, encryptWithPublicKey } from '@/utils/simpleCrypto';
import io from "socket.io-client";
import {rememberSentPlaintext , recallSentPlaintext} from "../utils/cache"

const CaseDetailsPage = () => {
  const navigate = useNavigate();
  const { caseId } = useParams();
  const [cases, setCases] = useState([]);
  const [selectedCase, setSelectedCase] = useState(null);
  const [decryptedData, setDecryptedData] = useState(null);
  const [isDecrypting, setIsDecrypting] = useState(false);
  const [decryptionError, setDecryptionError] = useState(null);
  const [adminPrivateKey, setAdminPrivateKey] = useState(localStorage.getItem("privateKey"));
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [isSendingMessage, setIsSendingMessage] = useState(false);
  const [caseDecision, setCaseDecision] = useState(null);
  const [socket, setSocket] = useState(null);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [priority, setPriority] = useState('medium');
  const [status, setStatus] = useState('pending');
  const messagesEndRef = useRef(null);
  
  const admin = localStorage.getItem("adminData");
  const adminData = JSON.parse(admin);
  

  // Initialize socket connection
  useEffect(() => {
    const socketInstance = io("http://localhost:5000");
    setSocket(socketInstance);

    return () => {
      if (socketInstance) {
        socketInstance.disconnect();
      }
    };
  }, []);

  // Socket event handlers
  useEffect(() => {
    if (!socket || !caseId) return;

    // Load admin private key from localStorage
    const privateKey = localStorage.getItem("privateKey");
    if (privateKey) setAdminPrivateKey(privateKey);

    // Join socket room
    socket.emit("join_case", caseId);

    // Listen for new messages

    const onCaseStatus = (evt) => {
      if (evt?.caseId === caseId) {
        setStatus(evt.status || 'pending');
        setCaseDecision(evt.decision || null);
      }
    };
    const onCasePriority = (evt) => {
      if (evt?.caseId === caseId) {
        setPriority(evt.priority || 'medium');
      }
    };

    socket.on("case_status_update", onCaseStatus);
  socket.on("case_priority_update", onCasePriority);
    

    socket.on("receive_message", async (msg) => {
      console.log("Received message:", msg);

     
      // Skip if we already have this message (avoid duplicates)
      if (messages.some(existingMsg => existingMsg._id === msg._id)) {
        return;
      }
      
      // If it's a user message and we have admin private key, decrypt it
      if (msg.sender === "user" && privateKey) {
        try {
          msg.decryptedText = await decryptWithPrivateKey(
            msg.encryptedMessage,
            privateKey
          );
        } catch (e) {
          console.error("Decryption failed:", e);
          msg.decryptedText = "[Decryption failed]";
        }
      } else if (msg.sender === "admin" ) {
        // For admin messages, we can show them directly since we sent them
        const cached = recallSentPlaintext(msg.encryptedMessage);
        msg.decryptedText = cached || msg.originalText || msg.decryptedText || "[Your message]";
      }
      setMessages(prev => [...prev, msg]);
    });

    return () => {
      socket.off("case_status_update", onCaseStatus);
    socket.off("case_priority_update", onCasePriority);
      socket.off("receive_message");
      socket.emit("leave_case", caseId);
    };
  }, [socket, caseId, messages, newMessage]);
  // Auto-scroll to bottom of messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);
  
  console.log("selected case", selectedCase)
  // Send message as admin
  const handleSend = async () => {
    if (!newMessage.trim() || !selectedCase || !socket) return;

    setIsSendingMessage(true);
    try {
      // Get user's public key from case data
      const userPublicKey = selectedCase.userPublicKey;
  
      const encryptedMessage = await encryptWithPublicKey(newMessage, userPublicKey);

      console.log( "hiiiii" ,userPublicKey, newMessage, encryptedMessage);
    
      const payload = {
        caseId,
        sender: "admin",
        senderId: adminData._id,
        encryptedMessage,
        originalText: newMessage,
        timestamp: new Date().toISOString()
      };

      // Emit to socket (this will save to DB and broadcast)
      rememberSentPlaintext(encryptedMessage , newMessage)
      socket.emit("send_message", payload);

      // Add message to local state immediately for better UX
      
      // Clear input
      setNewMessage("");
    } catch (err) {
      console.error("Send failed:", err);
      alert("Failed to send message. Please try again.");
    } finally {
      setIsSendingMessage(false);
    }
  };

  // Handle case decision and status update
  const handleCaseDecision = async (decision) => {
    try {
      setCaseDecision(decision);
      
      // Update status based on decision
      const newStatus = decision === 'justified' ? 'ongoing' : 'closed';
      setStatus(newStatus);
      
      // Emit status update via socket for real-time updates
      if (socket) {
        socket.emit("case_status_update", {
          caseId,
          status: newStatus,
          decision,
          adminId: adminData._id
        });
      }
      
      alert(`Case marked as ${decision === 'justified' ? 'Justified (Status: Ongoing)' : 'Not Justified (Status: Closed)'}`);
    } catch (err) {
      console.error("Failed to update case decision:", err);
      alert("Failed to update case decision");
    }
  };

  // Handle priority change
  const handlePriorityChange = (newPriority) => {
    setPriority(newPriority);
    // Emit priority update via socket
    if (socket) {
      socket.emit("case_priority_update", {
        caseId,
        priority: newPriority,
        adminId: adminData._id
      });
    }
  };

  // Handle manual status change
  const handleStatusChange = (newStatus) => {
    setStatus(newStatus);
    // Emit status update via socket
    if (socket) {
      socket.emit("case_status_update", {
        caseId,
        status: newStatus,
        adminId: adminData._id
      });
    }
  };

  const autoDecrypt = async (encryptedData, privateKey) => {
    try {
      setIsDecrypting(true);
      setDecryptionError(null);
      
      const decrypted = await decryptWithPrivateKey(encryptedData, privateKey);
      
      // Try to parse as JSON first
      let parsedData;
      try {
        parsedData = JSON.parse(decrypted);
        console.log("Successfully parsed as JSON:", parsedData);
      } catch (e) {
        // If not JSON, treat as plain text and try to structure it
        console.log("Not JSON, treating as plain text:", decrypted);
        parsedData = { description: decrypted };
      }
      
      setDecryptedData(parsedData);
    } catch (error) {
      console.error("Decryption failed:", error);
      setDecryptionError(error.message);
    } finally {
      setIsDecrypting(false);
    }
  };

  const getCases = async () => {
    try {
    
      
      const response = await axios.get("http://localhost:5000/api/complaint/getcomplaint", {
        params: {
          adminId: adminData._id,
        },
        headers: { "Content-Type": "application/json" },
      });
      
      let fetched = response.data.cases || response.data.case || [];

      if (!Array.isArray(fetched)) {
        fetched = [fetched];
      }

      setCases(fetched);
      

      const currentCase = fetched.find(c => String(c._id) === String(caseId));
      
      setSelectedCase(currentCase);

      if (currentCase) {
        setPriority(currentCase.priority || 'medium');
        setStatus(currentCase.status || 'pending');
      }

      const privateKeyBase64 = localStorage.getItem("privateKey");

      // Auto-decrypt with admin's private key
      if (currentCase && currentCase.encryptedData && privateKeyBase64) {
        await autoDecrypt(currentCase.encryptedData, privateKeyBase64);
      } else {
        console.log("No encrypted data or private key found", {
          hasCase: !!currentCase,
          hasEncryptedData: !!(currentCase && currentCase.encryptedData),
          hasPrivateKey: !!privateKeyBase64
        });
      }

    } catch (error) {
      console.error("Error fetching cases:", error);
      alert("Failed to fetch cases.");
    }
  };

  useEffect(() => {
    getCases();
  }, [caseId]);

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'resolved': 
      case 'closed':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'pending': 
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'ongoing':
      case 'in_progress': 
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'rejected': 
        return 'bg-red-100 text-red-800 border-red-200';
      default: 
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority?.toLowerCase()) {
      case 'high': 
        return 'text-red-600 bg-red-50 border-red-200';
      case 'medium': 
        return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'low': 
        return 'text-green-600 bg-green-50 border-green-200';
      default: 
        return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const renderDecryptedField = (key, value) => {
    // Handle different field types
    const getFieldIcon = (fieldKey) => {
      const lowerKey = fieldKey.toLowerCase();
      if (lowerKey.includes('email')) return <Mail className="w-4 h-4 text-gray-400 mt-1" />;
      if (lowerKey.includes('phone')) return <Phone className="w-4 h-4 text-gray-400 mt-1" />;
      if (lowerKey.includes('address')) return <MapPin className="w-4 h-4 text-gray-400 mt-1" />;
      if (lowerKey.includes('name')) return <UserCheck className="w-4 h-4 text-gray-400 mt-1" />;
      return <FileText className="w-4 h-4 text-gray-400 mt-1" />;
    };

    const formatFieldName = (fieldKey) => {
      return fieldKey
        .replace(/([A-Z])/g, ' $1')
        .replace(/^./, str => str.toUpperCase())
        .replace(/_/g, ' ')
        .trim();
    };

    const formatFieldValue = (fieldValue) => {
      if (fieldValue === null || fieldValue === undefined) return 'N/A';
      if (typeof fieldValue === 'boolean') return fieldValue ? 'Yes' : 'No';
      if (typeof fieldValue === 'object') return JSON.stringify(fieldValue, null, 2);
      return String(fieldValue);
    };

    return (
      <div key={key} className="bg-gray-50 p-4 rounded-lg border border-gray-200 hover:bg-gray-100 transition-colors duration-200">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <span className="block text-sm font-semibold text-gray-700 uppercase tracking-wide mb-2">
              {formatFieldName(key)}
            </span>
            <div className="text-gray-900 font-medium break-words">
              {key.toLowerCase().includes('description') || key.toLowerCase().includes('details') ? (
                <div className="whitespace-pre-wrap text-sm leading-relaxed p-3 bg-white rounded border">
                  {formatFieldValue(value)}
                </div>
              ) : (
                formatFieldValue(value)
              )}
            </div>
          </div>
          {getFieldIcon(key)}
        </div>
      </div>
    );
  };

  const formatMessageTime = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  // Load existing messages when case is loaded
  useEffect(() => {
    if (caseId && adminPrivateKey) {
      loadExistingMessages();
    }
  }, [caseId, adminPrivateKey]);

  // Load existing messages from database
  const loadExistingMessages = async () => {
    if (!caseId) return;
    
    setIsLoadingMessages(true);
    try {
      console.log(`📩 Loading existing messages for case: ${caseId}`);
      
      const response = await axios.get(`http://localhost:5000/api/messages/getmessage`, {
        params:{
          caseId: caseId
        },
        headers: { "Content-Type": "application/json"
      }
    }
      );
      
      if (response.data.success) {
        const existingMessages = response.data.messages || [];
        console.log(response.data);
        
        // Decrypt messages for display
        const decryptedMessages = await Promise.all(
          existingMessages.map(async (msg) => {
            try {
              if (msg.sender === "user" && adminPrivateKey) {
                // Decrypt user messages with admin's private key
                msg.decryptedText = await decryptWithPrivateKey(
                  msg.encryptedMessage,
                  adminPrivateKey
                );
              } else if (msg.sender === "admin") {
             const cached = recallSentPlaintext(msg.encryptedMessage);
             msg.decryptedText = cached || msg.originalText || msg.decryptedText || "[Your message]";
              }
              return msg;
            } catch (error) {
              console.error("Failed to decrypt message:", error);
              msg.decryptedText = "[Decryption failed]";
              return msg;
            }
          })
        );
        
        setMessages(decryptedMessages);
      }
    } catch (error) {
      console.error("❌ Failed to load existing messages:", error);
    } finally {
      setIsLoadingMessages(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <button 
              onClick={() => navigate(-1)} 
              className="flex items-center text-gray-600 hover:text-blue-600 transition-colors duration-200 group"
            >
              <ArrowLeft className="w-5 h-5 mr-2 group-hover:-translate-x-1 transition-transform duration-200" />
              Back to Cases
            </button>
            <div className="flex items-center space-x-4">
              <Shield className="w-6 h-6 text-blue-600" />
              <h1 className="text-xl font-bold text-gray-900">
                Case Management System
              </h1>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {selectedCase ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Case Details */}
            <div className="lg:col-span-2 space-y-6">
              {/* Case Header */}
              <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
                <div className="bg-blue-600 px-6 py-8 text-white">
                  <div className="flex justify-between items-start">
                    <div>
                      <h2 className="text-2xl font-bold mb-2">Case #{selectedCase._id?.slice(-8)}</h2>
                      <p className="text-blue-100 flex items-start text-lg">{selectedCase.category || 'General'}</p>
                      <div className="flex items-center mt-3 space-x-4 text-blue-100">
                        <div className="flex items-center">
                          <Calendar className="w-4 h-4 mr-1" />
                          <span className="text-sm">{selectedCase.createdAt ? new Date(selectedCase.createdAt).toLocaleDateString() : 'N/A'}</span>
                        </div>
                        <div className="flex items-center">
                          <Activity className="w-4 h-4 mr-1" />
                          <span className="text-sm capitalize">{priority} Priority</span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right space-y-3">
                      {/* Status Badge */}
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border bg-white ${getStatusColor(status)}`}>
                        {status === "resolved" || status === "closed" ? <CheckCircle className="w-4 h-4 mr-1" /> : <Clock className="w-4 h-4 mr-1" />}
                        {status?.replace('_', ' ') || "Unknown"}
                      </span>
                      
                      {/* Priority Controls */}
                      <div className="flex items-center space-x-2">
                        <select
                          value={priority}
                          onChange={(e) => handlePriorityChange(e.target.value)}
                          className={`px-3 py-1 rounded-full text-xs font-medium border cursor-pointer ${getPriorityColor(priority)}`}
                        >
                          <option value="low">Low Priority</option>
                          <option value="medium">Medium Priority</option>
                          <option value="high">High Priority</option>
                        </select>
                      </div>

                      {/* Status Controls */}
                      <div className="flex items-center space-x-2">
                        <select
                          value={status}
                          onChange={(e) => handleStatusChange(e.target.value)}
                          className="px-3 py-1 rounded-full text-xs font-medium border bg-white text-gray-700 cursor-pointer"
                          disabled={caseDecision && status === 'closed'} // Disable if case is decided and closed
                        >
                          <option value="pending">Pending</option>
                          <option value="ongoing">Ongoing</option>
                          <option value="resolved">Resolved</option>
                          <option value="closed">Closed</option>
                        </select>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Case Data */}
                <div className="p-6">
                  {isDecrypting ? (
                    <div className="flex items-center justify-center py-12">
                      <div className="text-center">
                        <Loader className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-4" />
                        <p className="text-gray-600">Decrypting case data...</p>
                      </div>
                    </div>
                  ) : decryptionError ? (
                    <div className="text-center py-12">
                      <XCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-red-900 mb-2">Decryption Failed</h3>
                      <p className="text-red-600 mb-4">{decryptionError}</p>
                      <p className="text-gray-600 text-sm">Please check if you have the correct private key for this case.</p>
                    </div>
                  ) : decryptedData ? (
                    <div className="space-y-6">
                      <div className="flex items-center space-x-2 text-green-600 mb-6">
                        <Unlock className="w-5 h-5" />
                        <span className="font-medium">Case Data Decrypted Successfully</span>
                      </div>
                      
                      <div className="grid grid-cols-1 gap-4">
                        {Object.entries(decryptedData).map(([key, value]) => 
                          renderDecryptedField(key, value)
                        )}
                      </div>
                    </div>
                  ) : selectedCase.encryptedData ? (
                    <div className="text-center py-12">
                      <Lock className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">Encrypted Case Data</h3>
                      <p className="text-gray-600 mb-4">Attempting to decrypt case data...</p>
                      <button
                        onClick={() => {
                          const privateKey = localStorage.getItem("privateKey");
                          if (privateKey) {
                            autoDecrypt(selectedCase.encryptedData, privateKey);
                          }
                        }}
                        className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200"
                      >
                        Retry Decryption
                      </button>
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <AlertTriangle className="w-12 h-12 text-yellow-400 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">No Encrypted Data</h3>
                      <p className="text-gray-600">This case does not contain encrypted data.</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Case Decision Panel */}
              {decryptedData && (
                <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
                  <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
                    <Scale className="w-6 h-6 mr-2 text-blue-600" />
                    Case Decision
                  </h3>
                  
                  {caseDecision ? (
                    <div className={`p-4 rounded-lg border-2 ${caseDecision === 'justified' ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
                      <div className="flex items-center">
                        {caseDecision === 'justified' ? 
                          <CheckCircle className="w-6 h-6 text-green-600 mr-3" /> : 
                          <XCircle className="w-6 h-6 text-red-600 mr-3" />
                        }
                        <div>
                          <p className={`font-semibold ${caseDecision === 'justified' ? 'text-green-800' : 'text-red-800'}`}>
                            Case marked as {caseDecision === 'justified' ? 'Justified' : 'Not Justified'}
                          </p>
                          <p className="text-sm text-gray-600">
                            Decision recorded on {new Date().toLocaleDateString()} - 
                            Status automatically set to {caseDecision === 'justified' ? 'Ongoing' : 'Closed'}
                          </p>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <button
                        onClick={() => handleCaseDecision('justified')}
                        className="flex items-center justify-center px-6 py-4 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors duration-200 shadow-md hover:shadow-lg transform hover:-translate-y-1"
                      >
                        <CheckCircle className="w-5 h-5 mr-2" />
                        Mark as Justified
                      </button>
                      <button
                        onClick={() => handleCaseDecision('not_justified')}
                        className="flex items-center justify-center px-6 py-4 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors duration-200 shadow-md hover:shadow-lg transform hover:-translate-y-1"
                      >
                        <XCircle className="w-5 h-5 mr-2" />
                        Mark as Not Justified
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Messaging Panel */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-xl shadow-lg border border-gray-200 h-[600px] flex flex-col">
                <div className="bg-blue-600 text-white px-6 py-4 rounded-t-xl">
                  <h3 className="text-lg font-semibold flex items-center">
                    <MessageCircle className="w-5 h-5 mr-2" />
                    Case Communication
                  </h3>
                  <p className="text-blue-100 text-sm mt-1">Encrypted chat with complainant</p>
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
                  {isLoadingMessages ? (
                    <div className="text-center text-gray-500 py-8">
                      <Loader className="w-8 h-8 mx-auto mb-2 text-blue-400 animate-spin" />
                      <p>Loading conversation...</p>
                    </div>
                  ) : messages.length === 0 ? (
                    <div className="text-center text-gray-500 py-8">
                      <MessageSquare className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                      <p className="font-medium">No messages yet</p>
                      <p className="text-sm">Start the conversation!</p>
                    </div>
                  ) : (
                    messages.map((msg, index) => (
                      <div
                        key={msg._id || index}
                        className={`flex ${msg.sender === 'admin' ? 'justify-end' : 'justify-start'}`}
                      >
                        <div className={`max-w-xs lg:max-w-md px-4 py-3 rounded-lg shadow-sm ${
                          msg.sender === 'admin'
                            ? 'bg-blue-600 text-white'
                            : 'bg-white text-gray-900 border border-gray-200'
                        }`}>
                          <div className="text-sm">
                            <div className="flex items-center justify-between mb-2">
                              <p className={`font-medium text-xs uppercase tracking-wide ${
                                msg.sender === 'admin' ? 'text-blue-100' : 'text-gray-600'
                              }`}>
                                {msg.sender === 'admin' ? 'You (Admin)' : 'User'}
                              </p>
                              <p className={`text-xs ${
                                msg.sender === 'admin' ? 'text-blue-200' : 'text-gray-500'
                              }`}>
                                {formatMessageTime(msg.timestamp)}
                              </p>
                            </div>
                            <p className="break-words">
                              {msg.decryptedText || msg.encryptedMessage || 'Message content unavailable'}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                  <div ref={messagesEndRef} />
                </div>

                {/* Message Input */}
                <div className="border-t border-gray-200 p-4 bg-white">
                  {status === 'closed' ? (
                    <div className="text-center text-gray-500 py-4">
                      <AlertCircle className="w-6 h-6 mx-auto mb-2" />
                      <p className="text-sm">Case is closed. No further messages can be sent.</p>
                    </div>
                  ) : (
                    <div className="flex items-center space-x-3">
                      <input
                        type="text"
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && !isSendingMessage && handleSend()}
                        placeholder="Type your message..."
                        disabled={isSendingMessage}
                        className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50"
                      />
                      <button
                        onClick={handleSend}
                        disabled={isSendingMessage || !newMessage.trim()}
                        className={`px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed`}
                      >
                        {isSendingMessage ? <Loader className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-12">
            <AlertTriangle className="w-12 h-12 text-yellow-400 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Case Not Found</h2>
            <p className="text-gray-600">The case you are looking for does not exist or has been removed.</p>
          </div>
        )}  
      </main>
    </div>
  );
}
export default CaseDetailsPage;
