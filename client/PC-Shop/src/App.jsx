import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation, Outlet } from 'react-router-dom';
import './App.css';
import AuthPage from './features/auth/pages/AuthPage';
import HomePage from './features/home/pages/HomePage';
import ProfilePage from './features/home/pages/ProfilePage';
import PaymentSettingsPage from './features/home/pages/PaymentSettingsPage';
import DashboardPage from './features/admin/pages/DashboardPage';
import ProductListPage from './features/products/pages/ProductListPage';
import ProductDetailPage from './features/products/pages/ProductDetailPage';
import CartPage from './features/cart/pages/CartPage';
import CheckoutPage from './features/cart/pages/CheckoutPage';
import { FavoritesPage } from './features/favorites/pages';
import Header from './components/layout/Header';
import Footer from './components/layout/Footer';

// Tự động scroll lên đầu trang khi chuyển Route
const ScrollToTop = () => {
  const { pathname } = useLocation();
  useEffect(() => {
    // Sử dụng requestAnimationFrame để đợi cho đến khi component mới render xong
    // giúp tránh hiện tượng "nhảy" trang khi scroll diễn ra quá sớm
    const animationId = requestAnimationFrame(() => {
      window.scrollTo({
        top: 0,
        left: 0,
        behavior: 'instant' // Dùng instant để tránh cảm giác giật khi kết hợp với animation CSS
      });
    });
    return () => cancelAnimationFrame(animationId);
  }, [pathname]);
  return null;
};

// Layout chính chứa Header và Footer cố định
const MainLayout = () => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <Header />
      <main style={{ flex: 1, paddingTop: 'var(--header-height)' }}>
        <Outlet />
      </main>
      <Footer />
    </div>
  );
};

// Route bảo vệ chung (yêu cầu login)
const ProtectedRoute = () => {
  const token = localStorage.getItem('access_token');
  if (!token) {
    return <Navigate to="/" replace />;
  }
  return <Outlet />;
};

// Route bảo vệ theo Role (Admin/Seller)
const AdminRoute = () => {
  const token = localStorage.getItem('access_token');
  const role = localStorage.getItem('user_role');
  
  if (!token) return <Navigate to="/" replace />;
  if (role !== 'ADMIN' && role !== 'SELLER') {
    return <Navigate to="/home" replace />;
  }
  return <Outlet />;
};

// Route công khai (chưa login mới vào được)
const PublicRoute = () => {
  const token = localStorage.getItem('access_token');
  const role = localStorage.getItem('user_role');
  
  if (token) {
    if (role === 'ADMIN' || role === 'SELLER') {
      return <Navigate to="/admin" replace />;
    }
    return <Navigate to="/home" replace />;
  }
  return <Outlet />;
};

function App() {
  return (
    <Router>
      <ScrollToTop />
      <Routes>
        {/* Auth Route - Không có Header/Footer */}
        <Route element={<PublicRoute />}>
          <Route path="/" element={<AuthPage />} />
        </Route>

        {/* Các Route có Header/Footer */}
        <Route element={<MainLayout />}>
          {/* Customer Routes công khai */}
          <Route path="/home" element={<HomePage />} />
          <Route path="/products" element={<ProductListPage />} />
          <Route path="/products/:id" element={<ProductDetailPage />} />
          <Route path="/cart" element={<CartPage />} />

          {/* Customer Routes cần login */}
          <Route element={<ProtectedRoute />}>
            <Route path="/profile" element={<ProfilePage />} />
            <Route path="/profile/payment" element={<PaymentSettingsPage />} />
            <Route path="/checkout" element={<CheckoutPage />} />
            <Route path="/favorites" element={<FavoritesPage />} />
          </Route>
        </Route>

        {/* Admin/Seller Routes */}
        <Route element={<AdminRoute />}>
          <Route path="/admin" element={<DashboardPage />} />
        </Route>

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
