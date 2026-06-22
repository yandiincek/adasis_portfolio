import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Lock, UserPlus, LogIn, Mail, Shield, Building, CreditCard } from 'lucide-react';
import logoAlamTri from '../../assets/logo-alamtri.png'; 
import bgLogin from '../../assets/bg-login.png'; 
import Swal from 'sweetalert2';
import api from '../../api/axios';

const RegisterPage = () => {
  const [fullName, setFullName] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [level, setLevel] = useState('USER');
  const [nrp, setNrp] = useState('');
  const [department, setDepartment] = useState('');
  const [email, setEmail] = useState('');
  const [suppliers, setSuppliers] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchSuppliers = async () => {
      try {
        const res = await api.get('/coal-transport/sarana');
        const uniqueSuppliers = [...new Set(res.data.map(item => item.supplier).filter(Boolean))];
        setSuppliers(uniqueSuppliers.sort());
      } catch (err) {
        console.error('Failed to fetch suppliers', err);
      }
    };
    fetchSuppliers();
  }, []);

  const handleRegister = async (e) => {
    e.preventDefault();
    try {
      await api.post('/register', {
        full_name: fullName,
        username,
        password,
        role: level,
        nrp,
        department,
        email
      });
      Swal.fire({ title: 'Berhasil!', text: `Akun ${fullName} berhasil dibuat`, icon: 'success', confirmButtonColor: '#248B96' }).then(() => {
        navigate('/login');
      });
    } catch (error) {
      console.error(error);
      const msg = error.response?.data?.error || 'Gagal mendaftar';
      Swal.fire({ title: 'Gagal', text: msg, icon: 'error', confirmButtonColor: '#248B96' });
    }
  };

  return (
    <div 
      className="min-h-screen relative font-sans text-white flex flex-col bg-[#052334]"
      style={{
        backgroundImage: `url(${bgLogin})`,
        backgroundSize: 'cover',
        backgroundPosition: 'top center',
        backgroundRepeat: 'no-repeat'
      }}
    >

      {/* ================= HEADER / NAVBAR ================= */}
      <header className="w-full px-8 lg:px-16 py-4 flex items-center justify-between sticky top-0 z-50 border-b border-white/10 bg-[#052334]/80 backdrop-blur-md transition-all">
        
        {/* Kiri: Login & Register */}
        <div className="flex items-center gap-8 text-sm font-semibold">
          <div onClick={() => navigate('/login')} className="flex items-center gap-2 text-white/70 hover:text-white cursor-pointer transition-colors">
            <LogIn className="w-4 h-4" />
            <span>Login</span>
          </div>
          <div className="flex items-center gap-2 text-white cursor-pointer">
            <UserPlus className="w-4 h-4" />
            <span>Register</span>
          </div>
        </div>
        
        {/* Tengah: Menu Utama Disesuaikan untuk GACT */}
        <div className="hidden lg:flex absolute left-1/2 transform -translate-x-1/2 items-center gap-10 text-sm font-bold text-white">
          <span onClick={() => navigate('/home')} className="cursor-pointer hover:text-[#3298A0] transition-colors">Home</span>
          <span className="cursor-pointer hover:text-[#3298A0] transition-colors">About GACT</span>
          <span className="cursor-pointer hover:text-[#3298A0] transition-colors">Coal Transport Ops</span>
        </div>

        {/* Kanan: Logo AlamTri */}
        <div className="flex items-center">
          <img 
            src={logoAlamTri} 
            alt="Logo AlamTri" 
            className="h-8 brightness-0 invert drop-shadow-md" 
            onError={(e) => {
              e.target.style.display = 'none';
              e.target.nextSibling.style.display = 'block';
            }}
          />
          <span style={{ display: 'none' }} className="text-2xl font-bold tracking-widest drop-shadow-md">AlamTri GACT</span>
        </div>
      </header>


      {/* ================= MAIN CONTENT (Area Register) ================= */}
      <main className="flex-1 flex items-center justify-end relative z-10 px-8 lg:px-24 w-full max-w-[1400px] mx-auto py-10">
        
        <div className="w-full max-w-[24rem] lg:mr-10 xl:mr-20">
          
          <h1 className="text-[2.5rem] font-light tracking-wide mb-4">REGISTER</h1>
          
          <p className="text-[13px] text-white/90 mb-8 leading-relaxed drop-shadow-sm font-medium">
            Form pendaftaran akun <span className="font-bold text-white">GACT Portal</span>. Hanya Administrator yang dapat mendaftarkan akun baru berdasarkan level aksesnya.
          </p>

          <form onSubmit={handleRegister} className="space-y-4">
            
            {/* Input Full Name */}
            <div>
              <label className="block text-xs font-bold text-white mb-1.5 drop-shadow-sm">Nama Lengkap</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <User className="h-4 w-4 text-white/60" />
                </div>
                <input 
                  type="text" 
                  className="w-full pl-10 pr-4 py-2 bg-transparent border border-[#2B5C70] rounded text-white focus:outline-none focus:border-[#3298A0] focus:ring-1 focus:ring-[#3298A0] transition-colors placeholder-white/40 text-sm"
                  placeholder="Masukkan nama lengkap"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                />
              </div>
            </div>

            {/* Input Username */}
            <div>
              <label className="block text-xs font-bold text-white mb-1.5 drop-shadow-sm">Username</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <User className="h-4 w-4 text-white/60" />
                </div>
                <input 
                  type="text" 
                  className="w-full pl-10 pr-4 py-2 bg-transparent border border-[#2B5C70] rounded text-white focus:outline-none focus:border-[#3298A0] focus:ring-1 focus:ring-[#3298A0] transition-colors placeholder-white/40 text-sm"
                  placeholder="Buat username unik"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                />
              </div>
            </div>

            {/* Input NRP */}
            <div>
              <label className="block text-xs font-bold text-white mb-1.5 drop-shadow-sm">NRP</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <CreditCard className="h-4 w-4 text-white/60" />
                </div>
                <input 
                  type="text" 
                  className="w-full pl-10 pr-4 py-2 bg-transparent border border-[#2B5C70] rounded text-white focus:outline-none focus:border-[#3298A0] focus:ring-1 focus:ring-[#3298A0] transition-colors placeholder-white/40 text-sm"
                  placeholder="Masukkan NRP"
                  value={nrp}
                  onChange={(e) => setNrp(e.target.value)}
                />
              </div>
            </div>

            {/* Input Level Akses */}
            <div>
              <label className="block text-xs font-bold text-white mb-1.5 drop-shadow-sm">Level Akses</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Shield className="h-4 w-4 text-white/60" />
                </div>
                <select 
                  className="w-full pl-10 pr-4 py-2 bg-transparent border border-[#2B5C70] rounded text-white focus:outline-none focus:border-[#3298A0] focus:ring-1 focus:ring-[#3298A0] transition-colors text-sm appearance-none"
                  value={level}
                  onChange={(e) => setLevel(e.target.value)}
                  style={{ backgroundColor: level ? '#052334' : 'transparent' }}
                  required
                >
                  <option value="ADMIN" className="bg-[#052334]">Administrator</option>
                  <option value="ADMIN_INFRA" className="bg-[#052334]">Admin Infra</option>
                  <option value="ADMIN_TRANSPORT" className="bg-[#052334]">Admin Transport</option>
                  <option value="USER" className="bg-[#052334]">User</option>
                  <option value="UH_CGA" className="bg-[#052334]">Unit Head (UH)</option>
                  <option value="SH_CGA" className="bg-[#052334]">Section Head (SH)</option>
                  <option value="DRIVER" className="bg-[#052334]">Driver</option>
                  <option value="FUELMAN" className="bg-[#052334]">Fuelman</option>
                  <option value="ADMIN_VENDOR" className="bg-[#052334]">Admin Vendor</option>
                </select>
                <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none">
                  <svg className="w-4 h-4 text-white/60" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                </div>
              </div>
            </div>

            {/* Input Department / Section / Supplier */}
            <div>
              <label className="block text-xs font-bold text-white mb-1.5 drop-shadow-sm">
                {(level === 'DRIVER' || level === 'ADMIN_VENDOR') ? 'Supplier / Vendor' : 'Sect / Department'}
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Building className="h-4 w-4 text-white/60" />
                </div>
                {(level === 'DRIVER' || level === 'ADMIN_VENDOR') ? (
                  <select
                    className="w-full pl-10 pr-4 py-2 bg-transparent border border-[#2B5C70] rounded text-white focus:outline-none focus:border-[#3298A0] focus:ring-1 focus:ring-[#3298A0] transition-colors text-sm appearance-none"
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    style={{ backgroundColor: department ? '#052334' : 'transparent' }}
                  >
                    <option value="" className="bg-[#052334]">-- Pilih Supplier --</option>
                    {suppliers.map((sup, idx) => (
                      <option key={idx} value={sup} className="bg-[#052334]">{sup}</option>
                    ))}
                  </select>
                ) : (
                  <input 
                    type="text" 
                    className="w-full pl-10 pr-4 py-2 bg-transparent border border-[#2B5C70] rounded text-white focus:outline-none focus:border-[#3298A0] focus:ring-1 focus:ring-[#3298A0] transition-colors placeholder-white/40 text-sm"
                    placeholder="Masukkan section atau departemen"
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                  />
                )}
                {(level === 'DRIVER' || level === 'ADMIN_VENDOR') && (
                  <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none">
                    <svg className="w-4 h-4 text-white/60" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                  </div>
                )}
              </div>
            </div>

            {/* Input Email */}
            <div>
              <label className="block text-xs font-bold text-white mb-1.5 drop-shadow-sm">Email</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-4 w-4 text-white/60" />
                </div>
                <input 
                  type="email" 
                  className="w-full pl-10 pr-4 py-2 bg-transparent border border-[#2B5C70] rounded text-white focus:outline-none focus:border-[#3298A0] focus:ring-1 focus:ring-[#3298A0] transition-colors placeholder-white/40 text-sm"
                  placeholder="Masukkan alamat email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>

            {/* Input Password */}
            <div>
              <label className="block text-xs font-bold text-white mb-1.5 drop-shadow-sm">Password Default</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-4 w-4 text-white/60" />
                </div>
                <input 
                  type="password" 
                  className="w-full pl-10 pr-4 py-2 bg-transparent border border-[#2B5C70] rounded text-white focus:outline-none focus:border-[#3298A0] focus:ring-1 focus:ring-[#3298A0] transition-colors placeholder-white/40 text-sm"
                  placeholder="Buat password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
            </div>

            {/* Tombol Register */}
            <div className="pt-4">
              <button 
                type="submit" 
                className="bg-[#3298A0] hover:bg-[#248B96] text-white font-bold py-2 w-full transition-colors duration-300 text-sm rounded shadow-lg shadow-[#3298A0]/20"
              >
                CREATE ACCOUNT
              </button>
            </div>

            {/* Link Tambahan */}
            <div className="mt-4 text-center text-xs text-white/80">
              Sudah memiliki akun? <a href="#" onClick={() => navigate('/login')} className="text-[#3298A0] font-bold hover:text-white transition-colors">Login di sini.</a>
            </div>

          </form>
        </div>
      </main>

      {/* ================= FOOTER ================= */}
      <footer className="w-full py-4 mt-auto relative z-20 bg-gradient-to-t from-[#041a26] to-transparent">
        <div className="text-center text-[10px] text-white/70 font-medium tracking-wide">
          Copyright © 2026 PT Alamtri Resources Indonesia Tbk - General Affair Coal Transport
        </div>
      </footer>

    </div>
  );
};

export default RegisterPage;
