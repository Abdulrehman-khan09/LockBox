import React from "react";
import { ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";
export default function LearnMore() {
  return (
    <div className="min-h-screen bg-blue-50 flex flex-col items-center px-6 py-12">
      {/* Header */}
      <h1 className="text-4xl font-bold text-gray-900 mb-6">Learn More about LockBox</h1>
          <Link to={'/'}
                   className="flex items-center text-blue-600 hover:text-blue-800 mb-4"
                 >
                   <ArrowLeft className="w-4 h-4 mr-2" />
                   Back to Home Page
                 </Link>
      {/* Intro Text */}
      <p className="text-lg text-gray-700 max-w-3xl text-center mb-10">
        LockBox is a secure <span className="font-semibold text-blue-700">report portal </span> 
         that allows employees and users to <span className="font-semibold">anonymously </span> 
        report concerns or issues within their organization.  
        All communication between the reporter and the admin is 
        <span className="font-semibold"> end-to-end encrypted</span>, ensuring complete privacy.
      </p>

      {/* Features Section */}
      <div className="grid md:grid-cols-3 gap-8 max-w-5xl">
        <div className="p-6 bg-white rounded-xl shadow-md text-center">
          <h3 className="text-xl font-bold text-blue-700 mb-2">Anonymous Reporting</h3>
          <p className="text-gray-600">
            Users can safely submit reports without revealing their identity.
          </p>
        </div>

        <div className="p-6 bg-white rounded-xl shadow-md text-center">
          <h3 className="text-xl font-bold text-blue-700 mb-2">End-to-End Encryption</h3>
          <p className="text-gray-600">
            Every message between user and admin is encrypted for maximum security.
          </p>
        </div>

        <div className="p-6 bg-white rounded-xl shadow-md text-center">
          <h3 className="text-xl font-bold text-blue-700 mb-2">Direct Chat with Admin</h3>
          <p className="text-gray-600">
            Reporters and admins can securely communicate to resolve issues quickly.
          </p>
        </div>
      </div>

    
      <div className="mt-12">
        <Link to={'/report-form'} className="px-6 py-3 bg-blue-700 text-white rounded-lg text-lg hover:bg-blue-800 transition">
           Submit a Case
        </Link>
      </div>
    </div>
  );
}
