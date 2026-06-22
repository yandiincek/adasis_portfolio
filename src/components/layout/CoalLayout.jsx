import { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation, Outlet, Link } from 'react-router-dom';
import { 
  Truck, Home, Menu, Bell, ChevronDown, 
  User, LogOut as LogoutIcon, ChevronRight, Settings,
  ClipboardList, Fuel, Database, LayoutDashboard, CheckSquare, Droplet, FileText
} from 'lucide-react';
import logoAlamTri from '../../assets/logo-alamtri.png';

const CoalLayout = () => {
  const navigate = useNavigate();
  const location = useLocation();
  
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [expandedMenu, setExpandedMenu] = useState(''); // State untuk accordion sub-menu

  const profileRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (profileRef.current && !profileRef.current.contains(event.target)) setIsProfileOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const userName = localStorage.getItem('userName') || 'Guest';
  const userRole = localStorage.getItem('userRole') || 'USER';
  const userInitial = userName.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();

  const menuItems = [
    { 
      label: 'Dashboard', 
      path: '/coal-dashboard', 
      icon: LayoutDashboard,
      roles: ['ADMIN', 'ADMIN_TRANSPORT', 'DRIVER', 'FUELMAN', 'USER', 'ADMIN_VENDOR', 'UH_CGA', 'SH_CGA']
    },
    { 
      label: 'Data Sarana', 
      path: '/coal/data-sarana', 
      icon: Database,
      roles: ['ADMIN', 'ADMIN_TRANSPORT']
    },
    { 
      label: 'P2H & Checklist', 
      icon: ClipboardList, 
      roles: ['ADMIN', 'ADMIN_TRANSPORT', 'DRIVER', 'USER', 'ADMIN_VENDOR', 'UH_CGA', 'SH_CGA'],
      children: [
        { label: 'Form P2H', path: '/coal/form-p2h', roles: ['ADMIN', 'DRIVER'] },
        { label: 'Data P2H', path: '/coal/data-p2h', roles: ['ADMIN', 'ADMIN_TRANSPORT', 'DRIVER', 'USER', 'ADMIN_VENDOR', 'UH_CGA', 'SH_CGA'] }
      ]
    },
    { 
      label: 'Bahan Bakar (Fuel)', 
      icon: Fuel, 
      roles: ['ADMIN', 'ADMIN_TRANSPORT', 'FUELMAN', 'DRIVER', 'ADMIN_VENDOR'],
      children: [
        { label: 'Permintaan Kuota Fuel', path: '/coal/permintaan-kuota-fuel', roles: ['ADMIN', 'ADMIN_TRANSPORT'] },
        { label: 'Form Pengisian Fuel', path: '/coal/form-fuel', roles: ['ADMIN', 'FUELMAN', 'DRIVER'] },
        { label: 'Data Pengisian Fuel', path: '/coal/data-fuel', roles: ['ADMIN', 'ADMIN_TRANSPORT', 'FUELMAN', 'DRIVER', 'ADMIN_VENDOR'] },
        { label: 'Form Kupon BBM', path: '/coal/form-kupon-bbm', roles: ['ADMIN', 'DRIVER'] },
        { label: 'Data Kupon BBM', path: '/coal/data-kupon-bbm', roles: ['ADMIN', 'ADMIN_TRANSPORT', 'ADMIN_VENDOR', 'DRIVER', 'FUELMAN'] }
      ]
    },
    {
      label: 'Report Transport',
      icon: FileText,
      roles: ['ADMIN', 'ADMIN_TRANSPORT'],
      children: [
        { label: 'Daily Report', path: '/coal/report', roles: ['ADMIN', 'ADMIN_TRANSPORT'] },
        { label: 'Data Report BD', path: '/coal/data-report-bd', roles: ['ADMIN', 'ADMIN_TRANSPORT'] },
        { label: 'Report PA Before Backup', path: '/coal/report-pa-before-backup', roles: ['ADMIN', 'ADMIN_TRANSPORT'] },
        { label: 'Report PA After Backup', path: '/coal/report-pa-after-backup', roles: ['ADMIN', 'ADMIN_TRANSPORT'] }
      ]
    }
  ];

  // Filter menu berdasarkan role
  const filteredMenuItems = menuItems.filter(item => {
    if (item.roles && !item.roles.includes(userRole)) return false;
    
    // Jika punya children, filter juga children-nya
    if (item.children) {
      item.children = item.children.filter(child => child.roles && child.roles.includes(userRole));
      // Sembunyikan parent jika semua children tidak boleh diakses
      if (item.children.length === 0) return false;
    }
    return true;
  });

  const isActiveMenu = (path) => location.pathname === path;

  // Cek apakah parent menu sedang aktif (salah satu child-nya aktif)
  const isParentActive = (item) => {
    if (item.path && isActiveMenu(item.path)) return true;
    if (item.children) return item.children.some(child => isActiveMenu(child.path));
    return false;
  };

  // Menentukan Judul Header berdasarkan URL
  const getPageTitle = () => {
    for (const item of filteredMenuItems) {
      if (item.path === location.pathname) return item.label;
      if (item.children) {
        const found = item.children.find(child => child.path === location.pathname);
        if (found) return found.label;
      }
    }
    return 'Dashboard';
  };

  return (
    <div className="flex h-screen bg-[#F4F7F9] font-sans overflow-hidden text-slate-800 print:block print:h-auto print:overflow-visible">
      {/* ================= SIDEBAR ================= */}
      {/* Mobile Backdrop */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}
      
      <aside
        className={`${isSidebarOpen ? "md:w-64" : "md:w-20"} w-64 bg-gradient-to-b from-[#0a3d4f] to-[#052334] text-white transition-all duration-300 flex flex-col shadow-[4px_0_24px_rgba(0,0,0,0.15)] z-50 fixed inset-y-0 left-0 transform ${isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"} md:relative md:translate-x-0 print:hidden`}
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
            <span className="font-bold text-sm tracking-wide mt-1 inline-block">GACT COAL</span>
          )}
        </Link>

        <nav className="flex-1 py-6 px-3 space-y-2 overflow-y-auto custom-scrollbar-sidebar">
          {filteredMenuItems.map((item) => {
            const Icon = item.icon;
            
            // Render Menu tanpa Child (Menu Tunggal)
            if (!item.children) {
              const active = isActiveMenu(item.path);
              return (
                <Link
                  key={item.label}
                  to={item.path}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all border-l-4 block ${
                    active 
                      ? "bg-[#3298A0]/15 border-[#3298A0] text-white" 
                      : "border-transparent text-slate-400 hover:text-white hover:bg-white/5"
                  }`}
                >
                  <Icon className={`w-4 h-4 ${active ? "text-[#3298A0]" : ""}`} />
                  {isSidebarOpen && <span className="text-sm font-bold">{item.label}</span>}
                </Link>
              );
            }

            // Render Menu dengan Child (Sub-menu Accordion)
            const parentActive = isParentActive(item);
            const isExpanded = expandedMenu === item.label || parentActive;

            return (
              <div key={item.label} className="space-y-1">
                <button
                  onClick={() => {
                    if (!isSidebarOpen) setIsSidebarOpen(true);
                    setExpandedMenu(expandedMenu === item.label ? '' : item.label);
                  }}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg transition-all border-l-4 ${
                    parentActive 
                      ? "bg-[#3298A0]/5 border-[#3298A0] text-white" 
                      : "border-transparent text-slate-400 hover:text-white hover:bg-white/5"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon className={`w-4 h-4 ${parentActive ? "text-[#3298A0]" : ""}`} />
                    {isSidebarOpen && <span className="text-sm font-bold">{item.label}</span>}
                  </div>
                  {isSidebarOpen && (
                    <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${isExpanded ? 'rotate-180 text-[#3298A0]' : ''}`} />
                  )}
                </button>

                {/* Render Child Items */}
                {isSidebarOpen && isExpanded && (
                  <div className="pl-10 space-y-1 mt-1 animate-fade-in-up">
                    {item.children.map(child => {
                      const childActive = isActiveMenu(child.path);
                      return (
                        <Link
                          key={child.path}
                          to={child.path}
                          onClick={() => setIsMobileMenuOpen(false)}
                          className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-all text-left block ${
                            childActive
                              ? "text-white font-bold bg-white/5"
                              : "text-slate-400 hover:text-white hover:bg-white/5 font-medium"
                          }`}
                        >
                          <div className={`w-1.5 h-1.5 rounded-full ${childActive ? "bg-[#3298A0]" : "bg-slate-500"}`}></div>
                          <span className="text-xs">{child.label}</span>
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
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
      <div className="flex-1 flex flex-col overflow-y-auto relative print:block print:overflow-visible print:h-auto">
        {/* ================= HEADER NAVBAR ================= */}
        <header className="bg-white px-4 md:px-8 py-4 border-b border-slate-200/80 flex justify-between items-center sticky top-0 z-30 print:hidden">
          <div className="flex items-center gap-2">
            <button 
              className="md:hidden mr-2 p-1.5 text-slate-500 hover:text-[#3298A0] rounded-md hover:bg-slate-100 transition-colors"
              onClick={() => setIsMobileMenuOpen(true)}
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-2 text-[10px] md:text-xs font-semibold text-slate-400 tracking-wide uppercase">
              <Truck className="w-3.5 h-3.5 text-[#3298A0] hidden sm:block" />
              <span className="hidden sm:inline">Coal Transport</span>
              <ChevronRight className="w-3 h-3 hidden sm:block" />
              <span className="text-[#052334] truncate max-w-[120px] sm:max-w-none">{getPageTitle()}</span>
            </div>
          </div>

          <div className="flex items-center gap-5">
            {/* Profile Dropdown */}
            <div className="relative" ref={profileRef}>
              <button
                onClick={() => {
                  setIsProfileOpen(!isProfileOpen);
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
                <div className="h-9 w-9 rounded-full bg-[#0a3d4f] flex items-center justify-center text-white font-bold text-xs ring-2 ring-[#3298A0]/30 uppercase">
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
        <main className="p-4 md:p-8 max-w-7xl mx-auto w-full flex-grow print:p-0 print:m-0 print:max-w-none print:w-auto">
          <Outlet />
        </main>

        {/* ================= FOOTER ================= */}
        <footer className="bg-white border-t border-slate-200 py-6 mt-auto print:hidden">
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

export default CoalLayout;
