import React, { createContext, useState, useEffect } from "react";


 // creating context if we have to use admin data somewhere else after his login 
export const AdminContext = createContext();

export const AdminProvider = ({ children }) => {
  const [admin, setAdmin] = useState(null);

  useEffect(() => {
    // Restore admin from localStorage if available
    const savedAdmin = localStorage.getItem("adminData");
    if (savedAdmin) {
      setAdmin(JSON.parse(savedAdmin));
    }
  }, []);

  const saveAdmin = (adminData, token) => {
    localStorage.setItem("adminData", JSON.stringify(adminData));
    localStorage.setItem("adminToken", token);
    setAdmin(adminData);
  };

  const logoutAdmin = () => {
    localStorage.removeItem("adminData");
    localStorage.removeItem("adminToken");
    setAdmin(null);
  };

  return (
    <AdminContext.Provider value={{ admin, saveAdmin, logoutAdmin }}>
      {children}
    </AdminContext.Provider>
  );
};
