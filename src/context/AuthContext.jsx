import { createContext, useContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    // Inisialisasi dari localStorage saat load awal
    const role = localStorage.getItem('userRole');
    const id = localStorage.getItem('userId');
    const name = localStorage.getItem('userName');
    const nrp = localStorage.getItem('userNrp');
    const department = localStorage.getItem('userDepartment');
    
    if (role && id) {
      return { role, id, name, nrp, department };
    }
    return null;
  });

  const navigate = useNavigate();

  const login = (userData) => {
    setUser({
      role: userData.role,
      id: userData.id,
      name: userData.full_name,
      nrp: userData.nrp || '',
      department: userData.department || ''
    });
    localStorage.setItem('userRole', userData.role);
    localStorage.setItem('userId', userData.id);
    localStorage.setItem('userName', userData.full_name);
    localStorage.setItem('userNrp', userData.nrp || '');
    localStorage.setItem('userDepartment', userData.department || '');
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('userRole');
    localStorage.removeItem('userId');
    localStorage.removeItem('userName');
    localStorage.removeItem('userNrp');
    localStorage.removeItem('userDepartment');
    navigate('/login');
  };

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
