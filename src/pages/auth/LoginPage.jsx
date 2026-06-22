import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Lock, LogIn, ArrowRight } from 'lucide-react';
import logoAlamTri from '../../assets/logo-alamtri.png'; 
import bgLogin from '../../assets/bg-login.png'; 
import Swal from 'sweetalert2';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
const LoginPage = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleLogin = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const res = await api.post('/login', { username, password });
      const userData = res.data;
      
      // Gunakan fungsi login dari AuthContext agar state React terupdate
      login(userData);
      
      navigate('/home');
    } catch (error) {
      const msg = error.response?.data?.error || 'Gagal login. Pastikan backend menyala.';
      Swal.fire({ 
        title: 'Akses Ditolak', 
        text: msg, 
        icon: 'error', 
        confirmButtonColor: '#0891b2',
        background: '#0f172a',
        color: '#fff',
        customClass: {
          popup: 'rounded-2xl border border-white/10 shadow-2xl backdrop-blur-xl'
        }
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div 
      className="min-h-screen relative font-sans text-white flex flex-col bg-[#020b12] overflow-hidden"
    >
      {/* Background with overlay */}
      <div 
        className="absolute inset-0 z-0"
        style={{
          backgroundImage: `url(${bgLogin})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat'
        }}
      >
        <div className="absolute inset-0 bg-[#020b12]/70"></div>
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-[#020b12]/60 to-[#020b12]"></div>
        
        {/* Animated Orbs */}
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-cyan-600/30 blur-[120px] animate-pulse"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-teal-600/20 blur-[150px] animate-pulse delay-1000"></div>
      </div>

      {/* ================= HEADER / NAVBAR ================= */}
      <header className="w-full px-6 lg:px-16 py-6 flex items-center justify-end relative z-50">
        <div className="flex items-center bg-white/5 px-5 py-2.5 rounded-full border border-white/10 backdrop-blur-md shadow-lg">
          <img 
            src={logoAlamTri} 
            alt="Logo AlamTri" 
            className="h-7 brightness-0 invert drop-shadow-md" 
            onError={(e) => {
              e.target.style.display = 'none';
              e.target.nextSibling.style.display = 'block';
            }}
          />
          <span style={{ display: 'none' }} className="text-xl font-bold tracking-wider drop-shadow-md bg-gradient-to-r from-cyan-400 to-teal-200 bg-clip-text text-transparent">GACT</span>
        </div>
      </header>

      {/* ================= MAIN CONTENT ================= */}
      <main className="flex-1 flex flex-col lg:flex-row items-center justify-between relative z-10 px-6 lg:px-20 xl:px-32 w-full max-w-[1600px] mx-auto gap-12 lg:gap-0 mt-8 lg:mt-0">
        
        {/* Kiri: Tipografi & Branding (Muncul di Desktop) */}
        <div className="hidden lg:flex flex-col flex-1 pr-10 xl:pr-20 animate-in fade-in slide-in-from-left-8 duration-1000">
          <div className="inline-flex items-center gap-3 px-5 py-2.5 rounded-full bg-cyan-950/40 border border-cyan-500/30 w-fit mb-8 backdrop-blur-md shadow-[0_0_15px_rgba(34,211,238,0.15)]">
            <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-pulse shadow-[0_0_10px_rgba(34,211,238,0.8)]"></span>
            <span className="text-cyan-300 text-sm font-semibold tracking-widest uppercase">General Affair Coal Transport</span>
          </div>
          <h1 className="text-5xl xl:text-7xl font-bold text-white leading-[1.1] mb-6 drop-shadow-2xl">
            Sistem Terpadu <br/>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-teal-300 to-emerald-400">Section GACT</span>
          </h1>
          <p className="text-lg xl:text-xl text-white/70 max-w-xl leading-relaxed font-light drop-shadow-md">
            Portal manajemen operasional terintegrasi untuk Section General Affair Coal Transport. Mendukung penuh seluruh aktivitas pengelolaan Infra, Transport, dan Mess secara efisien dan terkendali.
          </p>
        </div>

        {/* Kanan: Login Card */}
        <div className="w-full max-w-[28rem] lg:w-[440px] shrink-0 animate-in fade-in slide-in-from-right-8 duration-1000 z-20">
          
          <div className="relative group">
            {/* Glow di belakang card */}
            <div className="absolute -inset-1 bg-gradient-to-r from-cyan-500 to-teal-500 rounded-[2.5rem] blur opacity-25 group-hover:opacity-40 transition duration-1000"></div>
            
            <div className="bg-[#04121e]/80 backdrop-blur-2xl border border-white/10 p-10 sm:p-12 rounded-[2.5rem] shadow-[0_20px_50px_rgba(0,0,0,0.5)] relative overflow-hidden">
              {/* Efek kilap (glossy) */}
              <div className="absolute top-0 left-[-100%] w-[50%] h-[100%] bg-gradient-to-r from-transparent via-white/5 to-transparent skew-x-[-45deg] group-hover:left-[200%] transition-all duration-1000 ease-in-out pointer-events-none"></div>
              
              <div className="mb-10">
                <h2 className="text-4xl font-light tracking-tight mb-3 text-white">Welcome <span className="font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-teal-300">Back</span></h2>
                <p className="text-sm text-white/50 leading-relaxed font-medium">
                  Enter your credentials to access the system.
                </p>
              </div>

              <form onSubmit={handleLogin} className="space-y-6">
                
                {/* Input Username */}
                <div className="space-y-2.5">
                  <label className="text-xs font-bold text-white/70 uppercase tracking-widest ml-1">Username</label>
                  <div className="relative group/input">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <User className="h-5 w-5 text-white/40 group-focus-within/input:text-cyan-400 transition-colors" />
                    </div>
                    <input 
                      type="text" 
                      className="w-full pl-12 pr-4 py-4 bg-black/30 border border-white/5 rounded-2xl text-white focus:outline-none focus:border-cyan-400/50 focus:ring-1 focus:ring-cyan-400/50 focus:bg-black/50 transition-all duration-300 placeholder-white/20 text-sm shadow-inner"
                      placeholder="Enter your username"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      required
                    />
                  </div>
                </div>

                {/* Input Password */}
                <div className="space-y-2.5">
                  <label className="text-xs font-bold text-white/70 uppercase tracking-widest ml-1">Password</label>
                  <div className="relative group/input">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <Lock className="h-5 w-5 text-white/40 group-focus-within/input:text-cyan-400 transition-colors" />
                    </div>
                    <input 
                      type="password" 
                      className="w-full pl-12 pr-4 py-4 bg-black/30 border border-white/5 rounded-2xl text-white focus:outline-none focus:border-cyan-400/50 focus:ring-1 focus:ring-cyan-400/50 focus:bg-black/50 transition-all duration-300 placeholder-white/20 text-sm shadow-inner"
                      placeholder="Enter your password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2 pb-2">
                  <label className="flex items-center gap-2.5 cursor-pointer group/check">
                    <div className="relative flex items-center justify-center w-4 h-4 rounded border border-white/30 bg-black/30 group-hover/check:border-cyan-400 transition-colors">
                      <input type="checkbox" className="opacity-0 absolute inset-0 cursor-pointer" />
                    </div>
                    <span className="text-xs text-white/60 group-hover/check:text-white/90 transition-colors font-medium">Remember me</span>
                  </label>
                  <a href="#" className="text-xs text-cyan-400 hover:text-cyan-300 font-semibold transition-colors">Forgot Password?</a>
                </div>

                {/* Tombol Login */}
                <div className="pt-2">
                  <button 
                    type="submit" 
                    disabled={isLoading}
                    className="w-full relative flex items-center justify-center gap-2 bg-gradient-to-r from-cyan-600 to-teal-500 hover:from-cyan-500 hover:to-teal-400 text-white font-bold py-4 px-8 rounded-2xl transition-all duration-300 shadow-[0_0_20px_rgba(8,145,178,0.3)] hover:shadow-[0_0_30px_rgba(8,145,178,0.6)] hover:-translate-y-1 active:translate-y-0 disabled:opacity-70 disabled:cursor-not-allowed overflow-hidden group/btn"
                  >
                    <span className="relative z-10 tracking-wider">{isLoading ? 'AUTHENTICATING...' : 'SIGN IN'}</span>
                    {!isLoading && <ArrowRight className="w-5 h-5 relative z-10 group-hover/btn:translate-x-1.5 transition-transform" />}
                    <div className="absolute inset-0 bg-white/20 translate-y-full group-hover/btn:translate-y-0 transition-transform duration-300 ease-in-out rounded-2xl"></div>
                  </button>
                </div>

              </form>
            </div>
          </div>
        </div>
      </main>

      {/* ================= FOOTER ================= */}
      <footer className="w-full py-6 mt-auto relative z-20 border-t border-white/5 bg-black/20 backdrop-blur-sm">
        <div className="text-center text-xs text-white/40 font-medium tracking-wide">
          Copyright © 2026 PT Alamtri Resources Indonesia Tbk - General Affair Coal Transport
        </div>
      </footer>

    </div>
  );
};

export default LoginPage;