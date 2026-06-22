import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import ProtectedRoute from "./routes/ProtectedRoute";

// Import Layout Utama
import MainLayout from "./components/layout/MainLayout";
import CoalLayout from "./components/layout/CoalLayout";

// Import Semua Halaman (Pages)
import LoginPage from "./pages/auth/LoginPage";
import RegisterPage from "./pages/auth/RegisterPage";
import HomePage from "./pages/dashboard/HomePage";
import InfraDashboard from "./pages/dashboard/InfraDashboard";
import AreaPage from "./pages/master-data/AreaPage";
import BangunanPage from "./pages/master-data/BangunanPage";
import JenisBangunanPage from "./pages/master-data/JenisBangunanPage";
import KepemilikanPage from "./pages/master-data/KepemilikanPage";
import PengajuanWOPage from "./pages/work-orders/PengajuanWOPage";
import IsiNoWOPage from "./pages/work-orders/IsiNoWOPage";
import FormIsiNoWOPage from "./pages/work-orders/FormIsiNoWOPage";
import ApprovalListPage from "./pages/work-orders/ApprovalListPage";
import DetailApprovalPage from "./pages/work-orders/DetailApprovalPage";
import ProgressDetailPage from "./pages/work-orders/ProgressDetailPage";
import PdfPrintPage from "./pages/work-orders/PdfPrintPage";
import PdfPrintHasilPage from "./pages/work-orders/PdfPrintHasilPage";

// Import Halaman Coal Transport
import CoalDashboard from "./pages/coal-transport/CoalDashboard";
import DataSaranaPage from "./pages/coal-transport/DataSaranaPage";
import FormP2HPage from "./pages/coal-transport/FormP2HPage";
import DataP2HPage from "./pages/coal-transport/DataP2HPage";
import DetailApprovalP2HPage from "./pages/coal-transport/DetailApprovalP2HPage";
import PermintaanKuotaFuelPage from "./pages/coal-transport/PermintaanKuotaFuelPage";
import FormFuelPage from "./pages/coal-transport/FormFuelPage";
import DataFuelPage from "./pages/coal-transport/DataFuelPage";
import ReportPage from "./pages/coal-transport/ReportPage";
import DataReportBDPage from "./pages/coal-transport/DataReportBDPage";
import ReportPABeforePage from "./pages/coal-transport/ReportPABeforePage";
import ReportPAAfterPage from "./pages/coal-transport/ReportPAAfterPage";
import FormKuponBBMPage from './pages/coal-transport/FormKuponBBMPage';
import DataKuponBBMPage from './pages/coal-transport/DataKuponBBMPage';

// Role Definitions
const INFRA_ROLES = ['ADMIN', 'ADMIN_INFRA', 'USER', 'UH_CGA', 'SH_CGA'];
const COAL_ROLES = ['ADMIN', 'ADMIN_TRANSPORT', 'DRIVER', 'FUELMAN', 'USER', 'ADMIN_VENDOR', 'UH_CGA', 'SH_CGA'];

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Halaman Login & Register */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/" element={<Navigate to="/login" replace />} />

          {/* Halaman yang butuh login (semua role bisa) */}
          <Route element={<ProtectedRoute />}>
            <Route path="/home" element={<HomePage />} />
          </Route>

          {/* Halaman Dashboard & Master Data (DENGAN Sidebar) */}
          <Route element={<ProtectedRoute allowedRoles={INFRA_ROLES} />}>
            <Route element={<MainLayout />}>
              <Route path="/dashboard-infra" element={<InfraDashboard />} />
              <Route path="/master/area" element={<AreaPage />} />
              <Route path="/master/bangunan" element={<BangunanPage />} />
              <Route path="/master/jenis-bangunan" element={<JenisBangunanPage />} />
              <Route path="/master/kepemilikan" element={<KepemilikanPage />} />
              <Route path="/pengajuan-wo" element={<PengajuanWOPage />} />
              <Route path="/isi-no-wo" element={<IsiNoWOPage />} />
              <Route path="/isi-no-wo/form/:id" element={<FormIsiNoWOPage />} />
              <Route path="/approval-list/:status" element={<ApprovalListPage />} />
              <Route path="/approval-detail/:id" element={<DetailApprovalPage />} />
              <Route path="/progress-detail/:id" element={<ProgressDetailPage />} />
            </Route>
          </Route>

          {/* Halaman Coal Transport (DENGAN Sidebar Coal) */}
          <Route element={<ProtectedRoute allowedRoles={COAL_ROLES} />}>
            <Route element={<CoalLayout />}>
              <Route path="/coal-dashboard" element={<CoalDashboard />} />
              <Route element={<ProtectedRoute allowedRoles={['ADMIN', 'ADMIN_TRANSPORT']} />}>
                <Route path="/coal/data-sarana" element={<DataSaranaPage />} />
              </Route>
              <Route path="/coal/form-kupon-bbm" element={<FormKuponBBMPage />} />
              <Route path="/coal/data-kupon-bbm" element={<DataKuponBBMPage />} />
              <Route path="/coal/form-p2h" element={<FormP2HPage />} />
              <Route path="/coal/data-p2h" element={<DataP2HPage />} />
              <Route path="/coal/data-p2h/review/:id" element={<DetailApprovalP2HPage />} />
              <Route path="/coal/permintaan-kuota-fuel" element={<PermintaanKuotaFuelPage />} />
              <Route path="/coal/form-fuel" element={<FormFuelPage />} />
              <Route path="/coal/data-fuel" element={<DataFuelPage />} />
              <Route path="/coal/report" element={<ReportPage />} />
              <Route path="/coal/data-report-bd" element={<DataReportBDPage />} />
              <Route path="/coal/report-pa-before-backup" element={<ReportPABeforePage />} />
              <Route path="/coal/report-pa-after-backup" element={<ReportPAAfterPage />} />
            </Route>
          </Route>
          
          {/* Rute PDF */}
          <Route element={<ProtectedRoute />}>
            <Route path="/cetak-pdf/:id" element={<PdfPrintPage />} />
            <Route path="/cetak-pdf-hasil/:id" element={<PdfPrintHasilPage />} />
          </Route>
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;

