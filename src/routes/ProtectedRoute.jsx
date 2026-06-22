import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Swal from 'sweetalert2';
import { useEffect } from 'react';

const ProtectedRoute = ({ allowedRoles }) => {
  const { user } = useAuth();

  useEffect(() => {
    if (user && allowedRoles && !allowedRoles.includes(user.role)) {
      Swal.fire({
        title: 'Akses Ditolak',
        text: 'Anda tidak memiliki izin untuk mengakses halaman ini.',
        icon: 'error',
        confirmButtonColor: '#0891b2',
        background: '#0f172a',
        color: '#fff',
        customClass: {
          popup: 'rounded-2xl border border-white/10 shadow-2xl backdrop-blur-xl'
        }
      });
    }
  }, [user, allowedRoles]);

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Jika allowedRoles tidak didefinisikan, berarti semua role yang login boleh akses
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/home" replace />;
  }

  return <Outlet />;
};

export default ProtectedRoute;
