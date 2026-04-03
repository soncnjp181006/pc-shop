import React from 'react';
import { Link } from 'react-router-dom';
import './Footer.css';

const Footer = () => {
  return (
    <footer className="main-footer">
      <div className="container footer-grid">
        <div className="footer-brand">
          <Link to="/home" className="footer-logo">
            <span className="logo-text">PC<span className="accent">SHOP</span></span>
          </Link>
          <p className="footer-desc">
            Nền tảng mua sắm linh kiện máy tính hàng đầu. Chúng tôi cung cấp giải pháp
            phần cứng tối ưu cho game thủ và chuyên gia.
          </p>
          <div className="social-links">
            <a href="#" className="social-icon">FB</a>
            <a href="#" className="social-icon">IG</a>
            <a href="#" className="social-icon">YT</a>
          </div>
        </div>

        <div className="footer-nav-group">
          <h3>Sản phẩm</h3>
          <ul>
            <li><Link to="/products">Linh kiện PC</Link></li>
            <li><Link to="/products">Màn hình</Link></li>
            <li><Link to="/products">Gaming Gear</Link></li>
            <li><Link to="/products">Laptop</Link></li>
          </ul>
        </div>

        <div className="footer-nav-group">
          <h3>Hỗ trợ</h3>
          <ul>
            <li><a href="#">Bảo hành</a></li>
            <li><a href="#">Vận chuyển</a></li>
            <li><a href="#">Thanh toán</a></li>
            <li><a href="#">Liên hệ</a></li>
          </ul>
        </div>

        <div className="footer-contact">
          <h3>Newsletter</h3>
          <p>Đăng ký để nhận tin tức mới nhất về các linh kiện đỉnh cao.</p>
          <form className="footer-form">
            <input type="email" placeholder="Email của bạn" />
            <button type="submit" className="btn btn-primary">Gửi</button>
          </form>
        </div>
      </div>
      <div className="footer-bottom">
        <div className="container bottom-flex">
          <p>&copy; 2026 PC SHOP. All rights reserved.</p>
          <div className="bottom-links">
            <a href="#">Privacy Policy</a>
            <a href="#">Terms of Service</a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
