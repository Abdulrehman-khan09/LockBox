import React from "react";
import { Link, } from "react-router-dom";
export default function Home() {
  return (

    <div className="min-h-screen bg-blue-50 flex flex-col">
    
      <nav className="flex justify-between items-center px-8 py-4 bg-blue-50">
        <h1 className="text-2xl font-bold text-blue-700">LockBox</h1>
        <div className="space-x-4">
          <Link to={'/login'} className="px-4 py-2 bg-transparent border border-blue-700 text-blue-700 rounded-lg hover:bg-blue-100 transition">
            Sign In
          </Link>
          <Link to={'/register'} className="px-4 py-2 bg-blue-700 text-white rounded-lg hover:bg-blue-800 transition">
            Sign Up
          </Link>
        </div>
      </nav>

      <section className="flex-1 flex flex-col items-center justify-center text-center px-6">
        <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
          Speak-Up Culture <br /> Made Simple
        </h2>
        <p className="text-lg text-gray-600 mb-6 max-w-2xl">
          Get leading all-in-one platform for whistleblowing and
          employee engagement.
        </p>
        <div className="space-x-4">
          <Link to={'/report-form'} className="px-6 py-3 cursor-pointer bg-blue-700 text-white rounded-lg text-lg hover:bg-blue-800 transition">
            Submit a Case
          </Link>
          <Link to={'/learn-more'} className="px-6 py-3 bg-transparent border border-blue-700 text-blue-700 rounded-lg text-lg hover:bg-blue-100 transition">
            Learn More
          </Link>
        </div>
      </section>
    </div>
  );
}
