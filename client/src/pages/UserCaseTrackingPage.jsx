import { 
  ArrowLeft, 
  Calendar, 
  Clock, 
  CheckCircle, 
  XCircle, 
  MessageSquare, 
  Send, 
  Shield,
  Lock,
  Unlock,
  Loader,
  MessageCircle,
  Phone,
  Mail,
  MapPin,
  UserCheck,
  FileText,
  AlertTriangle,
  Search,
  Copy,
  Key,
  Scale,
  Gavel,
  AlertCircle,
  User,
  Activity
} from 'lucide-react';

import React, { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import axios from "axios";
import { decryptWithPrivateKey, encryptWithPublicKey } from '@/utils/simpleCrypto';
import io from "socket.io-client";
import { rememberSentPlaintext,recallSentPlaintext } from '@/utils/cache';

const UserCaseTrackingPage = () => {
  const navigate = useNavigate();
  const location = useLocation();  
  const caseData = location.state?.caseData;
    const caseId = caseData._id;
  const [decryptedOriginalData, setDecryptedOriginalData] = useState(null);
  const [isDecrypting, setIsDecrypting] = useState(false);
  const [decryptionError, setDecryptionError] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [isSendingMessage, setIsSendingMessage] = useState(false);
  const [socket, setSocket] = useState(null);
  const [adminPublicKey, setAdminPublicKey] = useState(localStorage.getItem("publicKey"));
  const [adminPrivateKey, setadminPrivateKey] = useState(localStorage.getItem('privateKey'))
  const [caseDecision, setCaseDecision] = useState(null);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [trackingCode, setTrackingCode] = useState('');
  const [priority, setPriority] = useState('medium');
  const [status, setStatus] = useState('pending');
  const messagesEndRef = useRef(null);
  const [userPublicKey, setuserPublicKey] = useState(caseData?.userPublicKey);

  const [userPrivateKey, setUserPrivateKey] = useState(caseData?.userPrivateKey);
  
  // User's private key for decryption
  

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

  // Load case data and initialize keys
  useEffect(() => {
    if (caseData) {
      setPriority(caseData.priority || 'medium');
      setStatus(caseData.status || 'pending');
      autoDecryptOriginalData(caseData.encryptedData,adminPrivateKey);
    }
  }, [caseData, location.state]);

  


// 🔹 FIX 2: Update useEffect to depend on userPrivateKey
useEffect(() => {
  if (caseId && userPrivateKey) {
    console.log('🔑 User private key available, loading messages...', {
      caseId,
      hasUserPrivateKey: !!userPrivateKey,
      userPrivateKeyLength: userPrivateKey.length
    });
    loadExistingMessages();
  } else {
    console.warn('⚠️ Missing caseId or userPrivateKey:', {
      hasCaseId: !!caseId,
      hasUserPrivateKey: !!userPrivateKey
    });
  }
}, [caseId, userPrivateKey]); 

 

  // Load existing messages from database
 const loadExistingMessages = async () => {
  if (!caseId || !userPrivateKey) {
    console.error('❌ Missing caseId or userPrivateKey');
    return;
  }

  setIsLoadingMessages(true);
  try {
    console.log(`📩 Loading existing messages for case: ${caseId}`);
    console.log('🔑 User private key available:', !!userPrivateKey);
    
    const response = await axios.get(`http://localhost:5000/api/messages/getmessage`, {
      params: { caseId: caseId },
      headers: { "Content-Type": "application/json" }
    });
    
    if (response.data.success) {
      const existingMessages = response.data.messages || [];
      console.log(`📝 Found ${existingMessages.length} messages`);
      
      // 🔹 FIX 3: Correct message decryption logic
      const decryptedMessages = await Promise.all(
        existingMessages.map(async (msg, index) => {
          console.log(`🔓 Processing message ${index + 1}:`, {
            sender: msg.sender,
            hasEncryptedMessage: !!msg.encryptedMessage,
            hasOriginalText: !!msg.originalText,
            messageId: msg._id
          });

          try {
            if (msg.sender === "admin" && userPrivateKey) {
              // 🔹 Admin messages are encrypted with user's public key
              // So we decrypt with user's private key
              console.log(`🔑 Decrypting admin message ${index + 1} with user private key...`);
              msg.decryptedText = await decryptWithPrivateKey(
                msg.encryptedMessage,
                userPrivateKey
              );
              console.log(`✅ Admin message ${index + 1} decrypted successfully`);
            } else if (msg.sender === "user") {
              // 🔹 User's own messages - show original text if available
              const cached = recallSentPlaintext(msg.encryptedMessage);
        msg.decryptedText = cached || msg.originalText || msg.decryptedText || "[Your message]";
              console.log(`✅ User message ${index + 1} displayed`);
            } else {
              msg.decryptedText = "[Unable to decrypt - unknown sender]";
            }
            return msg;
          } catch (error) {
            console.error(`❌ Failed to decrypt message ${index + 1}:`, {
              error: error.message,
              sender: msg.sender,
              encryptedMessageSample: msg.encryptedMessage?.substring(0, 50)
            });
            msg.decryptedText = "[Decryption failed - please check keys]";
            return msg;
          }
        })
      );
      
      setMessages(decryptedMessages);
      console.log(`✅ Successfully loaded ${decryptedMessages.length} messages`);
    } else {
      console.warn('⚠️ API response not successful:', response.data);
    }
  } catch (error) {
    console.error("❌ Failed to load existing messages:", error);
  } finally {
    setIsLoadingMessages(false);
  }
};
  
  // Socket event handlers
// / 🔹 FIX 4: Update socket event handler
useEffect(() => {
  if (!socket || !caseId) return;
  
  socket.emit("join_case", caseId);


  
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
    console.log("🔔 Received new message via socket:", {
      sender: msg.sender,
      hasEncryptedMessage: !!msg.encryptedMessage,
      messageId: msg._id,
      hasUserPrivateKey: !!userPrivateKey
    });

    
    // Skip if we already have this message (avoid duplicates)
    if (messages.some(existingMsg => existingMsg._id === msg._id)) {
      console.log("⏭️ Skipping duplicate message");
      return;
    }

    try {
      if (msg.sender === "admin" && userPrivateKey) {
        console.log("🔓 Decrypting incoming admin message...");
        msg.decryptedText = await decryptWithPrivateKey(
          msg.encryptedMessage,
          userPrivateKey
        );
        console.log("✅ Incoming admin message decrypted successfully");
      } else if (msg.sender === "user") {
        // For user messages, show original text or mark as own message
        const cached = recallSentPlaintext(msg.encryptedMessage);
        msg.decryptedText = cached || msg.originalText || msg.decryptedText || "[Your message]";
      } else {
        msg.decryptedText = "[Unable to decrypt]";
      }

      setMessages(prev => [...prev, msg]);
    } catch (error) {
      console.error("❌ Failed to decrypt incoming message:", error);
      msg.decryptedText = "[Decryption failed]";
      setMessages(prev => [...prev, msg]);
    }
  });

  return () => {
    socket.off("case_status_update", onCaseStatus);
    socket.off("case_priority_update", onCasePriority);
    socket.off("receive_message");
    socket.emit("leave_case", caseId);
  };
}, [socket, caseId, userPrivateKey, messages]);


  // Auto-scroll to bottom of messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Send message as user
 const handleSend = async () => {
  // Get admin public key from localStorage
  const adminPublicKey = localStorage.getItem('publicKey');
  
  if (!newMessage.trim() || !caseData || !socket || !adminPublicKey) {
    console.error("❌ Missing required data for sending message:", {
      hasMessage: !!newMessage.trim(),
      hasCaseData: !!caseData,
      hasSocket: !!socket,
      hasAdminPublicKey: !!adminPublicKey
    });
    
    // 🔹 Better error handling
    if (!adminPublicKey) {
      alert("Admin public key not found. Cannot send encrypted message.");
    }
    return;
  }

  setIsSendingMessage(true);
  try {
    console.log("📤 Sending message to admin...");
    
    // Encrypt message using admin's public key
    const encryptedMessage = await encryptWithPublicKey(newMessage, adminPublicKey);

    const payload = {
      caseId,
      sender: "user",
      senderId: null,
      encryptedMessage,
      originalText: newMessage, // Store original for reference
      timestamp: new Date().toISOString()
    };

    console.log("📡 Emitting message via socket...");
    rememberSentPlaintext(encryptedMessage , newMessage)
    socket.emit("send_message", payload);
    setNewMessage("");
    console.log("✅ Message sent successfully");
  } catch (err) {
    console.error("❌ Send failed:", err);
    alert("Failed to send message. Please try again.");
  } finally {
    setIsSendingMessage(false);
  }
};

const debugKeys = () => {
  const adminPublicKey = localStorage.getItem('adminPublicKey');
  
  console.log('🔍 Key Debug Information:', {
    userPrivateKey: {
      available: !!userPrivateKey,
      length: userPrivateKey?.length,
      startsWithMII: userPrivateKey?.startsWith('MII'),
      first50: userPrivateKey?.substring(0, 50)
    },
    adminPublicKey: {
      available: !!adminPublicKey,
      length: adminPublicKey?.length,
      startsWithMII: adminPublicKey?.startsWith('MII'),
      first50: adminPublicKey?.substring(0, 50)
    },
    caseData: {
      available: !!caseData,
      hasCleanPrivateKey: !!(caseData?.privateKey),
      hasUserPublicKey: !!(caseData?.userPublicKey),
      adminId: caseData?.adminId
    }
  });
};

// Call this function to debug - you can remove this later
useEffect(() => {
  debugKeys();
}, [userPrivateKey, caseData]);

  const autoDecryptOriginalData = async (encryptedData, privateKey) => {
    try {
      setIsDecrypting(true);
      setDecryptionError(null);
    
      const decrypted = await decryptWithPrivateKey(encryptedData, privateKey);
     
      // Try to parse as JSON first
      let parsedData;
      try {
        parsedData = JSON.parse(decrypted);
      } catch (e) {
        parsedData = { description: decrypted };
      }
      
      setDecryptedOriginalData(parsedData);
    } catch (error) {
      console.error("Decryption failed:", error);
      setDecryptionError(error.message);
    } finally {
      setIsDecrypting(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'resolved': 
      case 'closed':
        return 'bg-green-50 text-green-700 border-green-200';
      case 'pending': 
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'ongoing':
      case 'in_progress': 
        return 'bg-yellow-50 text-yellow-700 border-yellow-200';
      case 'rejected': 
        return 'bg-red-50 text-red-700 border-red-200';
      default: 
        return 'bg-gray-50 text-gray-700 border-gray-200';
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority?.toLowerCase()) {
      case 'high': 
        return 'text-red-600 bg-red-50 border-red-200';
      case 'medium': 
        return 'text-blue-600 bg-blue-50 border-blue-200';
      case 'low': 
        return 'text-green-600 bg-green-50 border-green-200';
      default: 
        return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const formatMessageTime = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const copyTrackingCode = () => {
    navigator.clipboard.writeText(trackingCode);
    alert("Tracking code copied to clipboard!");
  };

  const renderDecryptedField = (key, value) => {
    const getFieldIcon = (fieldKey) => {
      const lowerKey = fieldKey.toLowerCase();
      if (lowerKey.includes('email')) return <Mail className="w-4 h-4 text-blue-500 mt-1" />;
      if (lowerKey.includes('phone')) return <Phone className="w-4 h-4 text-blue-500 mt-1" />;
      if (lowerKey.includes('address')) return <MapPin className="w-4 h-4 text-blue-500 mt-1" />;
      if (lowerKey.includes('name')) return <UserCheck className="w-4 h-4 text-blue-500 mt-1" />;
      return <FileText className="w-4 h-4 text-blue-500 mt-1" />;
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
      <div key={key} className="bg-white p-4 rounded-lg border border-blue-100 hover:border-blue-300 transition-all duration-200 shadow-sm hover:shadow-md">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <span className="block text-sm font-semibold text-blue-700 uppercase tracking-wide mb-2">
              {formatFieldName(key)}
            </span>
            <div className="text-gray-900 font-medium break-words">
              {key.toLowerCase().includes('description') || key.toLowerCase().includes('details') ? (
                <div className="whitespace-pre-wrap text-sm leading-relaxed p-3 bg-blue-50 rounded border border-blue-100">
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

  // Main Case Tracking Interface
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-blue-100 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <button 
              onClick={() => navigate(-1)} 
              className="flex items-center text-gray-600 hover:text-blue-600 transition-colors duration-200 group"
            >
              <ArrowLeft className="w-5 h-5 mr-2 group-hover:-translate-x-1 transition-transform duration-200" />
              Back
            </button>
            <div className="flex items-center space-x-4">
              <Shield className="w-6 h-6 text-blue-600" />
              <h1 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent">
                Case Tracking System
              </h1>
            </div>
          </div>
        </div>
      </header>
     
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {caseData ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Case Details */}
            <div className="lg:col-span-2 space-y-6">
              {/* Case Header */}
              <div className="bg-white rounded-xl shadow-lg border border-blue-100 overflow-hidden">
                <div className="bg-gradient-to-r from-blue-600 via-blue-700 to-blue-800 px-6 py-8 text-white">
                  <div className="flex justify-between items-start">
                    <div>
                      <h2 className="text-2xl font-bold mb-2">Your Case #{caseData._id?.slice(-8)}</h2>
                      <p className="text-blue-100 flex items-start text-lg">{caseData.category || 'General Complaint'}</p>
                      <div className="flex items-center mt-4 space-x-6 text-blue-100">
                        <div className="flex items-center bg-blue-700/30 px-3 py-1 rounded-full">
                          <Calendar className="w-4 h-4 mr-2" />
                          <span className="text-sm">Submitted {caseData.createdAt ? new Date(caseData.createdAt).toLocaleDateString() : 'N/A'}</span>
                        </div>
                        <div className="flex items-center bg-blue-700/30 px-3 py-1 rounded-full">
                          <Activity className="w-4 h-4 mr-2" />
                          <span className="text-sm capitalize">{priority} Priority</span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right space-y-2">
                      <span className={`inline-flex items-center px-4 py-2 rounded-full text-sm font-semibold border bg-white ${getStatusColor(status)}`}>
                        {status === "resolved" || status === "closed" ? <CheckCircle className="w-4 h-4 mr-2" /> : <Clock className="w-4 h-4 mr-2" />}
                        {status?.replace('_', ' ') || "Pending"}
                      </span>
                      {trackingCode && (
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={copyTrackingCode}
                            className="flex items-center text-xs text-blue-100 hover:text-white transition-colors duration-200 bg-blue-700/30 px-2 py-1 rounded"
                          >
                            <Copy className="w-3 h-3 mr-1" />
                            Copy Tracking Code
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Case Data */}
                <div className="p-6">
                  {isDecrypting ? (
                    <div className="flex items-center justify-center py-12">
                      <div className="text-center">
                        <Loader className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-4" />
                        <p className="text-gray-600">Decrypting your case data...</p>
                      </div>
                    </div>
                  ) : decryptionError ? (
                    <div className="text-center py-12">
                      <XCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-red-900 mb-2">Unable to Decrypt Case Data</h3>
                      <p className="text-red-600 mb-4">{decryptionError}</p>
                      <p className="text-gray-600 text-sm">Please verify your tracking code is correct.</p>
                    </div>
                  ) : decryptedOriginalData ? (
                    <div className="space-y-6">
                      <div className="flex items-center space-x-2 text-green-600 mb-6">
                        <Unlock className="w-5 h-5" />
                        <span className="font-semibold">Your Submitted Information</span>
                      </div>
                      
                      <div className="grid grid-cols-1 gap-4">
                        {Object.entries(decryptedOriginalData).map(([key, value]) => 
                          renderDecryptedField(key, value)
                        )}
                      </div>
                    </div>
                  ) : caseData.encryptedData ? (
                    <div className="text-center py-12">
                      <Lock className="w-12 h-12 text-blue-400 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">Encrypted Case Data</h3>
                      <p className="text-gray-600 mb-4">Decrypting your submission data...</p>
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <AlertTriangle className="w-12 h-12 text-yellow-400 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">No Data Available</h3>
                      <p className="text-gray-600">Unable to load case data.</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Case Decision Display */}
              {caseDecision && (
                <div className="bg-white rounded-xl shadow-lg border border-blue-100 p-6">
                  <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
                    <Scale className="w-6 h-6 mr-2 text-blue-600" />
                    Official Decision
                  </h3>
                  
                  <div className={`p-4 rounded-lg border-2 ${caseDecision === 'justified' ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
                    <div className="flex items-center">
                      {caseDecision === 'justified' ? 
                        <CheckCircle className="w-6 h-6 text-green-600 mr-3" /> : 
                        <XCircle className="w-6 h-6 text-red-600 mr-3" />
                      }
                      <div>
                        <p className={`font-semibold ${caseDecision === 'justified' ? 'text-green-800' : 'text-red-800'}`}>
                          Your case has been marked as {caseDecision === 'justified' ? 'Justified' : 'Not Justified'}
                        </p>
                        <p className="text-sm text-gray-600">Official decision from the administrative team</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Messaging Panel */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-xl shadow-lg border border-blue-100 h-[600px] flex flex-col">
                <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-6 py-4 rounded-t-xl">
                  <h3 className="text-lg font-semibold flex items-center">
                    <MessageCircle className="w-5 h-5 mr-2" />
                    Communication
                  </h3>
                  <p className="text-blue-100 text-sm mt-1">Secure chat with admin team</p>
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
                      <MessageSquare className="w-8 h-8 mx-auto mb-2 text-blue-400" />
                      <p className="font-medium">No messages yet</p>
                      <p className="text-sm">Start a conversation with the admin team!</p>
                    </div>
                  ) : (
                    messages.map((msg, index) => (
                      <div
                        key={msg._id || index}
                        className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                      >
                        <div className={`max-w-xs lg:max-w-md px-4 py-3 rounded-lg shadow-sm ${
                          msg.sender === 'user'
                            ? 'bg-blue-600 text-white'
                            : 'bg-white text-gray-900 border border-blue-100'
                        }`}>
                          <div className="text-sm">
                            <div className="flex items-center justify-between mb-2">
                              <p className={`font-medium text-xs uppercase tracking-wide ${
                                msg.sender === 'user' ? 'text-blue-100' : 'text-blue-600'
                              }`}>
                                {msg.sender === 'user' ? 'You' : 'Admin'}
                              </p>
                              <p className={`text-xs ${
                                msg.sender === 'user' ? 'text-blue-200' : 'text-gray-500'
                              }`}>
                                {formatMessageTime(msg.timestamp)}
                              </p>
                            </div>
                            <p className="break-words">
                              {msg.decryptedText || 'Message content unavailable'}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                  <div ref={messagesEndRef} />
                </div>

                {/* Message Input */}
                <div className="border-t border-blue-100 p-4 bg-white">
                  {(status === 'closed' || status === 'resolved') ? (
                    <div className="text-center text-gray-500 py-4">
                      <AlertCircle className="w-6 h-6 mx-auto mb-2" />
                      <p className="text-sm">This case has been closed. No further messages can be sent.</p>
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
                        className="flex-1 px-4 py-3 border border-blue-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50 bg-blue-50/30"
                      />
                      <button
                        onClick={handleSend}
                        disabled={isSendingMessage || !newMessage.trim()}
                        className="px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-lg"
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
            <p className="text-gray-600">Unable to load case data. Please check your tracking code.</p>
          </div>
        )}  
      </main>
    </div>
  );
}

export default UserCaseTrackingPage;