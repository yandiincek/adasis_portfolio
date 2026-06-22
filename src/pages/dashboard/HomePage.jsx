import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import {
  UserPlus,
  Shield,
  LogOut,
  Wrench,
  Truck,
  Building,
  ArrowRight,
  Lock,
} from "lucide-react";
import heroBg from "../../assets/bg-login.png";
import logoAlamTri from "../../assets/logo-alamtri.png";
import Footer from "../../components/Footer";

const HomePage = () => {
  const navigate = useNavigate();
  const userRole = localStorage.getItem('userRole') || 'USER';
  const userName = localStorage.getItem('userName') || 'Guest';

  const formatRole = (role) => {
    if (role === 'ADMIN') return 'Administrator';
    if (role === 'UH_CGA') return 'Unit Head (UH)';
    if (role === 'SH_CGA') return 'Section Head (SH)';
    if (role === 'DRIVER') return 'Driver';
    if (role === 'FUELMAN') return 'Fuelman';
    if (role === 'ADMIN_INFRA') return 'Admin Infra';
    if (role === 'ADMIN_TRANSPORT') return 'Admin Transport';
    if (role === 'ADMIN_VENDOR') return 'Admin Vendor';
    return 'User / Requester';
  };

  const infraAllowedRoles = ['ADMIN', 'USER', 'SH_CGA', 'UH_CGA', 'ADMIN_INFRA'];
  const transportAllowedRoles = ['ADMIN', 'USER', 'SH_CGA', 'UH_CGA', 'ADMIN_TRANSPORT', 'FUELMAN', 'DRIVER', 'ADMIN_VENDOR'];

  const canAccessInfra = infraAllowedRoles.includes(userRole);
  const canAccessTransport = transportAllowedRoles.includes(userRole);

  return (
    <div className="min-h-screen flex flex-col bg-[#F4F7F9]">
      {/* Banner & Header (Full Width Banner) */}
      <div className="relative bg-[#052334] overflow-hidden shadow-2xl">
        <div
          className="absolute inset-0 opacity-20 bg-center bg-cover mix-blend-overlay"
          style={{ backgroundImage: `url(${heroBg})` }}
        ></div>
        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-[#052334]/95"></div>

        {/* Content Wrapper untuk memastikan teks tidak melar ke pinggir layar */}
        <div className="relative z-10 max-w-7xl mx-auto px-8 pt-8 pb-32">
          {/* Top Bar */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 md:gap-0 mb-12 md:mb-16 w-full">
            <div className="flex items-center gap-3 w-full md:w-auto border-b border-white/10 md:border-0 pb-4 md:pb-0">
              <div className="bg-white/10 px-3 py-2 rounded-lg backdrop-blur-sm flex items-center justify-center shrink-0">
                <img src={logoAlamTri} alt="AlamTri" className="h-6 brightness-0 invert drop-shadow-sm" />
              </div>
              <div>
                <h2 className="text-white font-bold text-lg md:text-xl tracking-wide leading-tight">
                  GACT Portal
                </h2>
                <p className="text-[#3298A0] text-[10px] font-bold uppercase tracking-widest hidden sm:block">
                  General Affair Coal Transport
                </p>
                <p className="text-[#3298A0] text-[10px] font-bold uppercase tracking-widest sm:hidden">
                  GACT Operations
                </p>
              </div>
            </div>

            <div className="flex items-center justify-between md:justify-end gap-3 w-full md:w-auto">
              {userRole === 'ADMIN' && (
                <button onClick={() => navigate('/register')} className="flex items-center gap-2 bg-[#3298A0] text-white px-3 py-2 md:px-4 rounded-lg text-xs md:text-sm font-bold shadow-lg hover:bg-[#248B96] transition-colors shrink-0">
                  <UserPlus className="w-4 h-4" /> <span className="hidden sm:inline">New User</span>
                </button>
              )}
              <div className="flex items-center gap-3 text-white md:border-l border-white/20 md:pl-4">
                <Shield className="w-5 h-5 text-emerald-400 hidden sm:block" />
                <div className="text-left md:text-right flex-1">
                  <p className="text-sm font-bold leading-tight">{userName}</p>
                  <p className="text-[10px] text-emerald-400 leading-tight">{formatRole(userRole)}</p>
                </div>
                <button
                  onClick={() => navigate("/login")}
                  className="p-2 bg-red-500/10 text-red-400 hover:bg-red-500 hover:text-white transition-colors rounded-lg ml-2 shrink-0"
                  title="Logout"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Banner Text */}
          <div className="text-center">
            <div className="inline-flex items-center gap-2 bg-white/10 border border-white/20 px-4 py-1.5 rounded-full mb-6">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              <span className="text-xs font-bold text-slate-200 tracking-wider">
                SYSTEM FULLY OPERATIONAL
              </span>
            </div>
            <h1 className="text-4xl md:text-6xl font-black text-white mb-6 tracking-tight">
              GACT Operations <span className="text-[#3298A0]">Center</span>
            </h1>
            <p className="text-slate-300 text-lg max-w-2xl mx-auto">
              Sistem informasi terpadu untuk manajemen operasional
              Transport hauling, pemeliharaan Infrastruktur, dan pengelolaan fasilitas
              Mess.
            </p>
          </div>
        </div>
      </div>

      {/* Module Cards Section (Menggunakan max-w-7xl agar rapi) */}
      <div className="max-w-7xl mx-auto w-full px-4 pt-8 md:pt-0 mt-4 md:-mt-20 relative z-20 mb-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Card 1 */}
          <div
            onClick={() => {
              if (canAccessInfra) navigate("/dashboard-infra");
              else Swal.fire({
                title: 'Akses Terkunci',
                text: 'Maaf, role Anda tidak memiliki izin untuk mengakses modul Infrastructure.',
                confirmButtonColor: '#3298A0',
                iconHtml: '<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-lock text-slate-500"><rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>',
                customClass: { icon: 'border-none' }
              });
            }}
            className={`group rounded-2xl p-8 transition-all relative overflow-hidden ${
              canAccessInfra 
                ? 'bg-white shadow-xl border-t-4 border-[#E58032] cursor-pointer hover:shadow-2xl' 
                : 'bg-slate-100 shadow-sm border-t-4 border-slate-300 cursor-not-allowed'
            }`}
          >
            {/* Overlay diagonal lines for locked state */}
            {!canAccessInfra && (
              <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'repeating-linear-gradient(45deg, #000 0, #000 2px, transparent 2px, transparent 8px)' }}></div>
            )}
            
            <div className="flex justify-between items-start mb-6 relative z-10">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${canAccessInfra ? 'bg-[#E58032]/10' : 'bg-slate-200'}`}>
                <Wrench className={`w-6 h-6 ${canAccessInfra ? 'text-[#E58032]' : 'text-slate-400'}`} />
              </div>
              <span className={`px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1 ${canAccessInfra ? 'bg-slate-100 text-slate-500' : 'bg-slate-200 text-slate-400'}`}>
                {!canAccessInfra && <Lock className="w-3 h-3" />}
                Module 01
              </span>
            </div>
            <h3 className={`text-xl font-black mb-2 relative z-10 ${canAccessInfra ? 'text-[#052334]' : 'text-slate-400'}`}>
              Infrastructure
            </h3>
            <p className={`text-sm mb-6 relative z-10 ${canAccessInfra ? 'text-slate-500' : 'text-slate-400'}`}>
              Manajemen pemeliharaan aset, jadwal perbaikan, dan monitoring
              kondisi fisik fasilitas GACT.
            </p>
            {canAccessInfra ? (
              <span className="text-sm font-bold text-[#E58032] flex items-center gap-1 transition-all group-hover:text-[#D97706] relative z-10">
                Access Dashboard <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
              </span>
            ) : (
              <span className="text-sm font-bold text-slate-400 flex items-center gap-1 relative z-10">
                <Lock className="w-4 h-4" /> Akses Terkunci
              </span>
            )}
          </div>

          {/* Card 2 */}
          <div
            onClick={() => {
              if (canAccessTransport) navigate("/coal-dashboard");
              else Swal.fire({
                title: 'Akses Terkunci',
                text: 'Maaf, role Anda tidak memiliki izin untuk mengakses modul Transport.',
                confirmButtonColor: '#3298A0',
                iconHtml: '<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-lock text-slate-500"><rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>',
                customClass: { icon: 'border-none' }
              });
            }}
            className={`group rounded-2xl p-8 transition-all relative overflow-hidden ${
              canAccessTransport 
                ? 'bg-white shadow-xl border-t-4 border-[#3298A0] cursor-pointer hover:shadow-2xl' 
                : 'bg-slate-100 shadow-sm border-t-4 border-slate-300 cursor-not-allowed'
            }`}
          >
            {/* Overlay diagonal lines for locked state */}
            {!canAccessTransport && (
              <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'repeating-linear-gradient(45deg, #000 0, #000 2px, transparent 2px, transparent 8px)' }}></div>
            )}

            <div className="flex justify-between items-start mb-6 relative z-10">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${canAccessTransport ? 'bg-[#3298A0]/10' : 'bg-slate-200'}`}>
                <Truck className={`w-6 h-6 ${canAccessTransport ? 'text-[#3298A0]' : 'text-slate-400'}`} />
              </div>
              <span className={`px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1 ${canAccessTransport ? 'bg-[#3298A0]/10 text-[#3298A0]' : 'bg-slate-200 text-slate-400'}`}>
                {!canAccessTransport && <Lock className="w-3 h-3" />}
                High Priority
              </span>
            </div>
            <h3 className={`text-xl font-black mb-2 relative z-10 ${canAccessTransport ? 'text-[#052334]' : 'text-slate-400'}`}>
              Transport
            </h3>
            <p className={`text-sm mb-6 relative z-10 ${canAccessTransport ? 'text-slate-500' : 'text-slate-400'}`}>
              Manajemen & efesiensi logistik, dan
              unit sarana.
            </p>
            {canAccessTransport ? (
              <span className="text-sm font-bold text-[#3298A0] flex items-center gap-1 transition-all group-hover:text-[#248B96] relative z-10">
                Access Dashboard <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
              </span>
            ) : (
              <span className="text-sm font-bold text-slate-400 flex items-center gap-1 relative z-10">
                <Lock className="w-4 h-4" /> Akses Terkunci
              </span>
            )}
          </div>

          {/* Card 3 */}
          <div className="group bg-white rounded-2xl p-8 shadow-xl border-t-4 border-slate-600 cursor-pointer hover:shadow-2xl transition-all">
            <div className="flex justify-between items-start mb-6">
              <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center">
                <Building className="w-6 h-6 text-slate-600" />
              </div>
              <span className="px-3 py-1 bg-slate-100 text-slate-500 rounded-full text-xs font-bold">
                Module 03
              </span>
            </div>
            <h3 className="text-xl font-black text-[#052334] mb-2">
              Mess Facility
            </h3>
            <p className="text-sm text-slate-500 mb-6">
              Pengaturan akomodasi karyawan, kapasitas kamar, dan manajemen
              pemeliharaan di lingkungan Mess GACT.
            </p>
            <span className="text-sm font-bold text-slate-600 flex items-center gap-1 transition-all group-hover:text-slate-800">
              Access Dashboard <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
            </span>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default HomePage;
