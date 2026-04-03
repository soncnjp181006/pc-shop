import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import './App.css';
import AuthPage from './features/auth/pages/AuthPage';
import HomePage from './features/home/pages/HomePage';
import ProfilePage from './features/home/pages/ProfilePage';
import DashboardPage from './features/admin/pages/DashboardPage';
import ProductListPage from './features/products/pages/ProductListPage';
import ProductDetailPage from './features/products/pages/ProductDetailPage';
import CartPage from './features/cart/pages/CartPage';
import Header from './components/layout/Header';
import Footer from './components/layout/Footer';

// Route bảo vệ chung (yêu cầu login)
const ProtectedRoute = ({ children }) => {
  const token = localStorage.getItem('access_token');
  if (!token) {
    return <Navigate to="/" replace />;
  }
  return (
    <>
      <Header />
      <main style={{ flex: 1 }}>{children}</main>
      <Footer />
    </>
  );
};

// Route bảo vệ theo Role (Admin/Seller)
const AdminRoute = ({ children }) => {
  const token = localStorage.getItem('access_token');
  const role = localStorage.getItem('user_role');
  
  if (!token) return <Navigate to="/" replace />;
  if (role !== 'ADMIN' && role !== 'SELLER') {
    return <Navigate to="/home" replace />;
  }
  return children;
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
  return children;
};

// Route bán công khai (xem được khi chưa login, nhưng có Header nếu đã login)
const SemiPublicRoute = ({ children }) => {
  return (
    <>
      <Header />
      <main style={{ flex: 1 }}>{children}</main>
      <Footer />
    </>
  );
};

function App() {
  return (
    <Router>
      <Routes>
        {/* Auth Route */}
        <Route 
          path="/" 
          element={
            <PublicRoute>
              <AuthPage />
            </PublicRoute>
          } 
        />

        {/* Customer Routes */}
        <Route 
          path="/home" 
          element={
            <SemiPublicRoute>
              <HomePage />
            </SemiPublicRoute>
          } 
        />
        <Route 
          path="/profile" 
          element={
            <ProtectedRoute>
              <ProfilePage />
            </ProtectedRoute>
          } 
        />

        {/* Product Routes */}
        <Route 
          path="/products" 
          element={
            <SemiPublicRoute>
              <ProductListPage />
            </SemiPublicRoute>
          } 
        />
        <Route 
          path="/products/:id" 
          element={
            <SemiPublicRoute>
              <ProductDetailPage />
            </SemiPublicRoute>
          } 
        />

        {/* Cart Route */}
        <Route 
          path="/cart" 
          element={
            <SemiPublicRoute>
              <CartPage />
            </SemiPublicRoute>
          } 
        />

        {/* Admin/Seller Routes */}
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
