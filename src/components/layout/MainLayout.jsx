import { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation, Outlet, Link } from 'react-router-dom';
import { 
  Wrench, Home, Menu, Bell, Database, ChevronDown, 
  User, LogOut as LogoutIcon, Clock, ChevronRight, Settings
} from 'lucide-react';
import api from '../../api/axios';
import logoAlamTri from '../../assets/logo-alamtri.png';

const MainLayout = () => {
  const navigate = useNavigate();
  const location = useLocation();
  
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isMasterOpen, setIsMasterOpen] = useState(location.pathname.includes('/master'));
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isNotifOpen, setIsNotifOpen] = useState(false);

  const profileRef = useRef(null);
  const notifRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (profileRef.current && !profileRef.current.contains(event.target)) setIsProfileOpen(false);
      if (notifRef.current && !notifRef.current.contains(event.target)) setIsNotifOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const [notifications, setNotifications] = useState([]);
  const userName = localStorage.getItem('userName') || 'Guest';
  const userRole = localStorage.getItem('userRole') || 'USER';
  const userInitial = userName.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();

  const fetchNotifications = () => {
    const role = localStorage.getItem('userRole');
    const userId = localStorage.getItem('userId');
    if (role && userId) {
      api.get(`/work-orders/notifications?role=${role}&user_id=${userId}`)
        .then(res => setNotifications(res.data))
        .catch(console.error);
    }
  };

  useEffect(() => {
    fetchNotifications();

    const handleRefresh = () => fetchNotifications();
    window.addEventListener('refreshNotifications', handleRefresh);
    
    return () => window.removeEventListener('refreshNotifications', handleRefresh);
  }, [location.pathname]); // Refresh notifikasi ketika ganti halaman

  const masterMenu = [
    { label: 'Area', path: '/master/area' },
    { label: 'Bangunan', path: '/master/bangunan' },
    { label: 'Jenis Bangunan', path: '/master/jenis-bangunan' },
    { label: 'Kepemilikan', path: '/master/kepemilikan' },
  ];



  const isActiveMenu = (path) => location.pathname === path;
  const isMasterDataActive = location.pathname.includes('/master');

  // Menentukan Judul Header berdasarkan URL
  const getPageTitle = () => {
    if (location.pathname === '/dashboard-infra') return 'Overview Dashboard';
    if (location.pathname === '/master/area') return 'Master Data Area';
    if (location.pathname === '/master/bangunan') return 'Master Data Bangunan';
    if (location.pathname === '/master/jenis-bangunan') return 'Master Jenis Bangunan';
    if (location.pathname === '/master/kepemilikan') return 'Master Kepemilikan';
    return 'Dashboard';
  };

  return (
    <div className="flex h-screen bg-[#F4F7F9] font-sans overflow-hidden text-slate-800">
      {/* ================= SIDEBAR ================= */}
      {/* Mobile Backdrop */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}
      
      <aside
        className={`${isSidebarOpen ? "md:w-64" : "md:w-20"} w-64 bg-gradient-to-b from-[#0a3d4f] to-[#052334] text-white transition-all duration-300 flex flex-col shadow-[4px_0_24px_rgba(0,0,0,0.15)] z-50 fixed inset-y-0 left-0 transform ${isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"} md:relative md:translate-x-0`}
      >
        <Link
          to="/home"
          className="h-16 flex items-center gap-3 px-5 border-b border-white/10 cursor-pointer hover:bg-white/5 transition-colors block"
        >
          <img
            src={logoAlamTri}
            alt="Logo GACT"
            className="h-5 brightness-0 invert"
          />
          {isSidebarOpen && (
            <span className="font-bold text-sm tracking-wide mt-1 inline-block">GACT INFRA</span>
          )}
        </Link>

        <nav className="flex-1 py-6 px-3 space-y-2 overflow-y-auto custom-scrollbar-sidebar">
          {/* MENU HOME DIHAPUS DARI SINI */}

          {/* MENU DASHBOARD INFRA SELALU MUNCUL UNTUK SEMUA ROLE INFRA */}
          <Link
            to="/dashboard-infra"
            onClick={() => setIsMobileMenuOpen(false)}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all border-l-4 block ${isActiveMenu("/dashboard-infra") ? "bg-[#E58032]/10 border-[#E58032] text-white" : "border-transparent text-slate-400 hover:text-white hover:bg-white/5"}`}
          >
            <Wrench
              className={`w-4 h-4 inline-block mr-2 ${isActiveMenu("/dashboard-infra") ? "text-[#E58032]" : ""}`}
            />
            {isSidebarOpen && (
              <span className="text-sm font-bold inline-block">Dashboard Infra</span>
            )}
          </Link>

          {/* MENU MASTER DATA HANYA UNTUK ADMIN DAN ADMIN_INFRA */}
          {['ADMIN', 'ADMIN_INFRA'].includes(userRole) && (
            <div className="pt-2">
            <button
              onClick={() => setIsMasterOpen(!isMasterOpen)}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg transition-all ${isMasterDataActive ? "text-white" : "text-slate-400 hover:text-white hover:bg-white/5"}`}
            >
              <div className="flex items-center gap-3">
                <Database
                  className={`w-4 h-4 ${isMasterDataActive ? "text-[#E58032]" : ""}`}
                />
                {isSidebarOpen && (
                  <span className="text-sm font-medium">Master Data</span>
                )}
              </div>
              {isSidebarOpen && (
                <ChevronDown
                  className={`w-4 h-4 transition-transform duration-300 ${isMasterOpen ? "rotate-180" : ""}`}
                />
              )}
            </button>

            <div
              className={`overflow-hidden transition-all duration-300 ${isMasterOpen && isSidebarOpen ? "max-h-64 opacity-100 mt-1" : "max-h-0 opacity-0"}`}
            >
              <div className="pl-10 space-y-1">
                {masterMenu.map((item) => {
                  const isSubMenuActice = isActiveMenu(item.path);
                  return (
                    <Link
                      key={item.label}
                      to={item.path}
                      onClick={() => setIsMobileMenuOpen(false)}
                      className={`w-full text-left text-xs py-2.5 transition-colors flex items-center gap-3 block ${isSubMenuActice ? "font-bold text-white" : "font-medium text-slate-400 hover:text-white"}`}
                    >
                      <div
                        className={`w-1.5 h-1.5 rounded-full transition-colors ${isSubMenuActice ? "bg-[#E58032] shadow-[0_0_8px_#E58032]" : "bg-slate-500"}`}
                      ></div>
                      {item.label}
                    </Link>
                  );
                })}
              </div>
            </div>
          </div>
          )}
        </nav>

        {/* Custom scrollbar class for sidebar (optional styling) */}
        <style>{`
          .custom-scrollbar-sidebar::-webkit-scrollbar { width: 4px; }
          .custom-scrollbar-sidebar::-webkit-scrollbar-track { background: transparent; }
          .custom-scrollbar-sidebar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 4px; }
          .custom-scrollbar-sidebar::-webkit-scrollbar-thumb:hover { background: rgba(255,255,255,0.2); }
        `}</style>

        {/* Sidebar Footer */}
        <div className="px-3 pb-4 border-t border-white/10 pt-4">
          <Link
            to="/home"
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition-all border-l-4 border-transparent block"
          >
            <Home className="w-4 h-4 inline-block mr-2" />
            {isSidebarOpen && (
              <span className="text-sm font-medium inline-block">Kembali ke Home</span>
            )}
          </Link>
        </div>
      </aside>

      {/* ================= MAIN CONTENT AREA ================= */}
      <div className="flex-1 flex flex-col overflow-y-auto relative">
        {/* ================= HEADER NAVBAR ================= */}
        <header className="bg-white px-4 md:px-8 py-4 border-b border-slate-200/80 flex justify-between items-center sticky top-0 z-30">
          <div className="flex items-center gap-2">
            <button 
              className="md:hidden mr-2 p-1.5 text-slate-500 hover:text-[#3298A0] rounded-md hover:bg-slate-100 transition-colors"
              onClick={() => setIsMobileMenuOpen(true)}
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-2 text-[10px] md:text-xs font-semibold text-slate-400 tracking-wide uppercase">
              <span className="hidden sm:inline">Infrastructure Management</span>
              <ChevronRight className="w-3 h-3 hidden sm:block" />
              <span className="text-[#052334] truncate max-w-[150px] sm:max-w-none">{getPageTitle()}</span>
            </div>
          </div>

          <div className="flex items-center gap-5">
            {/* Notification */}
            <div className="relative" ref={notifRef}>
              <button
                onClick={() => {
                  setIsNotifOpen(!isNotifOpen);
                  setIsProfileOpen(false);
                }}
                className="relative p-2 text-slate-400 hover:text-[#052334] transition-colors rounded-full hover:bg-slate-50"
              >
                <Bell className="w-5 h-5" />
                {notifications.length > 0 && (
                  <span className="absolute top-1 right-1 w-3.5 h-3.5 bg-red-500 rounded-full text-white text-[8px] font-bold flex items-center justify-center border-2 border-white">{notifications.length}</span>
                )}
              </button>
              {isNotifOpen && (
                <div className="absolute right-0 mt-3 w-80 bg-white rounded-xl shadow-[0_10px_40px_-10px_rgba(0,0,0,0.15)] border border-slate-100 py-1 z-50">
                  <div className="px-4 py-3 border-b border-slate-100 flex justify-between items-center">
                    <p className="text-xs font-bold text-[#052334]">
                      Notifications
                    </p>
                    {notifications.length > 0 && (
                      <span className="bg-red-50 text-red-600 text-[10px] font-bold px-2 py-0.5 rounded">
                        {notifications.length} New
                      </span>
                    )}
                  </div>
                  <div className="max-h-64 overflow-y-auto">
                    {notifications.length > 0 ? (
                      notifications.map((req) => (
                        <div
                          key={req.id}
                          onClick={() => {
                            if (req.message.includes('Isi No WO')) {
                              navigate(`/isi-no-wo/form/${req.id}`);
                            } else {
                              const isApproval = req.message.includes('Approval') || req.message.includes('Persetujuan');
                              navigate(isApproval ? `/approval-detail/${req.id}` : `/progress-detail/${req.id}`);
                            }
                            setIsNotifOpen(false);
                          }}
                          className="px-4 py-3 hover:bg-slate-50 border-b border-slate-50 cursor-pointer transition-colors"
                        >
                          <div className="flex justify-between items-start mb-0.5">
                            <p className="text-sm font-semibold text-[#052334]">{req.user}</p>
                            <span className="text-[9px] font-bold text-[#E58032] bg-[#E58032]/10 px-1.5 py-0.5 rounded uppercase">{req.message}</span>
                          </div>
                          <p className="text-xs text-slate-500 mt-0.5">
                            {req.task}
                          </p>
                          <p className="text-[10px] text-slate-400 mt-1.5 flex items-center gap-1">
                            <Clock className="w-3 h-3" /> {req.time}
                          </p>
                        </div>
                      ))
                    ) : (
                      <div className="px-4 py-8 text-center text-slate-400 text-xs font-medium">
                        Tidak ada notifikasi baru
                      </div>
                    )}
                  </div>
                  {/* View All Button */}
                  <div 
                    onClick={() => {
                      navigate('/dashboard-infra');
                      setIsNotifOpen(false);
                    }}
                    className="p-3 text-center border-t border-slate-100 cursor-pointer hover:bg-slate-50 transition-colors"
                  >
                    <span className="text-[11px] font-bold text-[#3298A0] hover:text-[#248B96]">View all notifications</span>
                  </div>
                </div>
              )}
            </div>

            {/* Profile Dropdown */}
            <div className="relative" ref={profileRef}>
              <button
                onClick={() => {
                  setIsProfileOpen(!isProfileOpen);
                  setIsNotifOpen(false);
                }}
                className="flex items-center gap-3 focus:outline-none"
              >
                <div className="text-right hidden md:block">
                  <p className="text-sm font-bold text-[#052334] leading-tight">
                    {userName}
                  </p>
                  <p className="text-[11px] font-medium text-slate-400 truncate max-w-[150px]">
                    {['ADMIN_VENDOR', 'DRIVER', 'ADMIN_INFRA', 'ADMIN_TRANSPORT'].includes(userRole) 
                      ? (localStorage.getItem('userDepartment') || userRole.replace('_', ' ')) 
                      : (userRole === 'ADMIN' ? 'ADMINISTRATOR' : userRole.replace('_', ' '))}
                  </p>
                </div>
                <div className="h-9 w-9 rounded-full bg-[#052334] flex items-center justify-center text-white font-bold text-xs ring-2 ring-slate-100 uppercase">
                  {userInitial}
                </div>
              </button>
              {isProfileOpen && (
                <div className="absolute right-0 mt-3 w-48 bg-white rounded-xl shadow-[0_10px_40px_-10px_rgba(0,0,0,0.15)] border border-slate-100 py-1 z-50">
                  <button className="w-full text-left px-4 py-2.5 text-xs font-semibold text-slate-600 hover:bg-slate-50 hover:text-[#052334] flex items-center gap-2">
                    <User className="w-4 h-4" /> My Profile
                  </button>
                  <button className="w-full text-left px-4 py-2.5 text-xs font-semibold text-slate-600 hover:bg-slate-50 hover:text-[#052334] flex items-center gap-2">
                    <Settings className="w-4 h-4" /> Account Settings
                  </button>
                  <div className="h-px bg-slate-100 my-1"></div>
                  <button
                    onClick={() => navigate("/login")}
                    className="w-full text-left px-4 py-2.5 text-xs font-bold text-red-500 hover:bg-red-50 flex items-center gap-2"
                  >
                    <LogoutIcon className="w-4 h-4" /> Sign Out
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* ================= OUTLET (Tempat Halaman Dirender) ================= */}
        <main className="p-8 max-w-7xl mx-auto w-full flex-grow">
          <Outlet />
        </main>

        {/* ================= FOOTER ================= */}
        <footer className="bg-white border-t border-slate-200 py-6 mt-auto">
          <div className="max-w-7xl mx-auto px-8 flex justify-between items-center text-[11px] font-medium text-slate-400">
            <span className="uppercase tracking-widest">
              © 2026 PT Alamtri Resources Indonesia Tbk
            </span>
            <span>General Affair Coal Transport (GACT)</span>
          </div>
        </footer>
      </div>
    </div>
  );
};

export default MainLayout;