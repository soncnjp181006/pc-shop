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
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
};

// Layout cho Customer
const CustomerLayout = () => {
  return (
    <div className="app-container">
      <Header />
      <main style={{ flex: 1, minHeight: '100vh' }}>
        <Outlet />
      </main>
      <Footer />
    </div>
  );
};

// Route bảo vệ chung (yêu cầu login)
const ProtectedRoute = ({ children }) => {
  const token = localStorage.getItem('access_token');
  if (!token) {
    return <Navigate to="/" replace />;
  }
  return children || <Outlet />;
};

// Route bảo vệ theo Role (Admin/Seller)
const AdminRoute = ({ children }) => {
  const token = localStorage.getItem('access_token');
  const role = localStorage.getItem('user_role');
  
  if (!token) return <Navigate to="/" replace />;
  if (role !== 'ADMIN' && role !== 'SELLER') {
    return <Navigate to="/home" replace />;
  }
  return children || <Outlet />;
};

// Route công khai (chưa login mới vào được)
const PublicRoute = ({ children }) => {
  const token = localStorage.getItem('access_token');
  const role = localStorage.getItem('user_role');
  
  if (token) {
    if (role === 'ADMIN' || role === 'SELLER') {
      return <Navigate to="/admin" replace />;
    }
    return <Navigate to="/home" replace />;
  }
  return children || <Outlet />;
};

function App() {
  return (
    <Router>
      <ScrollToTop />
      <Routes>
        {/* Auth Route (No Header/Footer) */}
        <Route element={<PublicRoute />}>
          <Route path="/" element={<AuthPage />} />
        </Route>

        {/* Customer Routes (With Header/Footer) */}
        <Route element={<CustomerLayout />}>
          <Route path="/home" element={<HomePage />} />
          <Route path="/products" element={<ProductListPage />} />
          <Route path="/products/:id" element={<ProductDetailPage />} />
          
          {/* Routes require login */}
          <Route element={<ProtectedRoute />}>
            <Route path="/profile" element={<ProfilePage />} />
            <Route path="/profile/payment" element={<PaymentSettingsPage />} />
            <Route path="/cart" element={<CartPage />} />
            <Route path="/checkout" element={<CheckoutPage />} />
            <Route path="/favorites" element={<FavoritesPage />} />
          </Route>
        </Route>

        {/* Admin/Seller Routes (Maybe different layout later) */}
        <Route 
          path="/admin" 
          element={
            <AdminRoute>
              <DashboardPage />
            </AdminRoute>
          } 
        />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
