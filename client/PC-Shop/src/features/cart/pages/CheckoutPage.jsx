import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { cartApi, getImageUrl } from '../../../utils/api';
import './CheckoutPage.css';

const CheckoutPage = () => {
  const navigate = useNavigate();
  const [cart, setCart] = useState(null);
  const [loading, setLoading] = useState(true);
  const [step, setStep] = useState(1); // 1: Shipping, 2: Payment, 3: Review
  
  const [formData, setShippingData] = useState({
    fullName: '',
    phone: '',
    address: '',
    note: ''
  });

  const [paymentMethod, setPaymentMethod] = useState('cod');

  useEffect(() => {
    fetchCart();
  }, []);

  const fetchCart = async () => {
    try {
      const response = await cartApi.getCart();
      if (response.ok) {
        const data = await response.json();
        if (!data.items || data.items.length === 0) {
          navigate('/cart');
          return;
        }
        setCart(data);
      } else {
        navigate('/cart');
      }
    } catch (error) {
      console.error('Lỗi khi tải giỏ hàng:', error);
      navigate('/cart');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setShippingData(prev => ({ ...prev, [name]: value }));
  };

  const calculateTotal = () => {
    if (!cart) return 0;
    return cart.items.reduce((acc, item) => acc + (item.price * item.quantity), 0);
  };

  if (loading) return (
    <div className="loading-container">
      <div className="spinner"></div>
      <p>Đang chuẩn bị đơn hàng...</p>
    </div>
  );

  return (
    <div className="checkout-page animate-fade-in">
      <div className="container checkout-container">
        <header className="checkout-header">
          <h1 className="checkout-title">Thanh toán đơn hàng</h1>
          <div className="checkout-steps">
            <div className={`step-item ${step >= 1 ? 'active' : ''} ${step > 1 ? 'completed' : ''}`}>
              <span className="step-number">1</span>
              <span className="step-label">Vận chuyển</span>
            </div>
            <div className="step-divider"></div>
            <div className={`step-item ${step >= 2 ? 'active' : ''} ${step > 2 ? 'completed' : ''}`}>
              <span className="step-number">2</span>
              <span className="step-label">Thanh toán</span>
            </div>
            <div className="step-divider"></div>
            <div className={`step-item ${step >= 3 ? 'active' : ''}`}>
              <span className="step-number">3</span>
              <span className="step-label">Hoàn tất</span>
            </div>
          </div>
        </header>

        <div className="checkout-grid">
          <main className="checkout-main">
            {step === 1 && (
              <section className="checkout-section glass-panel animate-fade-in">
                <h2 className="section-title">Thông tin giao hàng</h2>
                <div className="form-group">
                  <label>Họ và tên người nhận</label>
                  <input 
                    type="text" 
                    name="fullName" 
                    placeholder="VD: Nguyễn Văn A"
                    value={formData.fullName}
                    onChange={handleInputChange}
                  />
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label>Số điện thoại</label>
                    <input 
                      type="tel" 
                      name="phone" 
                      placeholder="Số điện thoại liên lạc"
                      value={formData.phone}
                      onChange={handleInputChange}
                    />
                  </div>
                </div>
                <div className="form-group">
                  <label>Địa chỉ nhận hàng</label>
                  <textarea 
                    name="address" 
                    placeholder="Số nhà, tên đường, phường/xã, quận/huyện, tỉnh/thành phố"
                    rows="3"
                    value={formData.address}
                    onChange={handleInputChange}
                  ></textarea>
                </div>
                <div className="form-group">
                  <label>Ghi chú đơn hàng (tùy chọn)</label>
                  <textarea 
                    name="note" 
                    placeholder="Ví dụ: Giao giờ hành chính, gọi trước khi đến..."
                    rows="2"
                    value={formData.note}
                    onChange={handleInputChange}
                  ></textarea>
                </div>
                <div className="action-row">
                  <button className="btn btn-primary btn-lg" onClick={() => setStep(2)}>
                    Tiếp tục: Phương thức thanh toán
                  </button>
                </div>
              </section>
            )}

            {step === 2 && (
              <section className="checkout-section glass-panel animate-fade-in">
                <h2 className="section-title">Phương thức thanh toán</h2>
                <div className="payment-options">
                  <label className={`payment-card ${paymentMethod === 'cod' ? 'active' : ''}`}>
                    <input 
                      type="radio" 
                      name="payment" 
                      value="cod" 
                      checked={paymentMethod === 'cod'}
                      onChange={() => setPaymentMethod('cod')}
                    />
                    <div className="payment-icon">💵</div>
                    <div className="payment-details">
                      <span className="payment-name">Thanh toán khi nhận hàng (COD)</span>
                      <span className="payment-desc">Thanh toán bằng tiền mặt khi shipper giao hàng đến.</span>
                    </div>
                  </label>

                  <label className={`payment-card ${paymentMethod === 'bank' ? 'active' : ''}`}>
                    <input 
                      type="radio" 
                      name="payment" 
                      value="bank" 
                      checked={paymentMethod === 'bank'}
                      onChange={() => setPaymentMethod('bank')}
                    />
                    <div className="payment-icon">🏦</div>
                    <div className="payment-details">
                      <span className="payment-name">Chuyển khoản ngân hàng</span>
                      <span className="payment-desc">Chuyển khoản trực tiếp qua App ngân hàng hoặc quét mã QR.</span>
                    </div>
                  </label>

                  <label className={`payment-card ${paymentMethod === 'visa' ? 'active' : ''}`}>
                    <input 
                      type="radio" 
                      name="payment" 
                      value="visa" 
                      checked={paymentMethod === 'visa'}
                      onChange={() => setPaymentMethod('visa')}
                    />
                    <div className="payment-icon">💳</div>
                    <div className="payment-details">
                      <span className="payment-name">Thẻ quốc tế (Visa/Mastercard)</span>
                      <span className="payment-desc">Thanh toán an toàn qua cổng cổng kết nối quốc tế.</span>
                    </div>
                  </label>
                </div>
                <div className="action-row">
                  <button className="btn btn-secondary" onClick={() => setStep(1)}>Quay lại</button>
                  <button className="btn btn-primary btn-lg" onClick={() => setStep(3)}>
                    Tiếp tục: Kiểm tra đơn hàng
                  </button>
                </div>
              </section>
            )}

            {step === 3 && (
              <section className="checkout-section glass-panel animate-fade-in">
                <h2 className="section-title">Xác nhận đơn hàng</h2>
                <div className="review-summary">
                  <div className="review-item">
                    <span className="label">Người nhận:</span>
                    <span className="value">{formData.fullName}</span>
                  </div>
                  <div className="review-item">
                    <span className="label">Số điện thoại:</span>
                    <span className="value">{formData.phone}</span>
                  </div>
                  <div className="review-item">
                    <span className="label">Địa chỉ:</span>
                    <span className="value">{formData.address}</span>
                  </div>
                  <div className="review-item">
                    <span className="label">Thanh toán:</span>
                    <span className="value">
                      {paymentMethod === 'cod' && 'Thanh toán khi nhận hàng'}
                      {paymentMethod === 'bank' && 'Chuyển khoản ngân hàng'}
                      {paymentMethod === 'visa' && 'Thẻ quốc tế'}
                    </span>
                  </div>
                </div>
                <div className="action-row">
                  <button className="btn btn-secondary" onClick={() => setStep(2)}>Quay lại</button>
                  <button className="btn btn-primary btn-lg" onClick={() => alert('Chức năng đặt hàng đang được phát triển!')}>
                    Xác nhận Đặt hàng
                  </button>
                </div>
              </section>
            )}
          </main>

          <aside className="checkout-sidebar">
            <div className="order-summary-card glass-panel">
              <h3 className="summary-title">Đơn hàng của bạn</h3>
              <div className="checkout-items-list">
                {cart && cart.items.map(item => (
                  <div key={item.id} className="checkout-item-mini">
                    <div className="item-img">
                      <img src={getImageUrl(item.variant.product?.image_url)} alt="thumb" />
                    </div>
                    <div className="item-info">
                      <span className="name">{item.variant.product?.name}</span>
                      <span className="qty">SL: {item.quantity} x {item.price.toLocaleString()} ₫</span>
                    </div>
                    <span className="subtotal">{(item.price * item.quantity).toLocaleString()} ₫</span>
                  </div>
                ))}
              </div>
              <div className="summary-footer">
                <div className="summary-line">
                  <span>Tạm tính</span>
                  <span>{calculateTotal().toLocaleString()} ₫</span>
                </div>
                <div className="summary-line">
                  <span>Vận chuyển</span>
                  <span>Miễn phí</span>
                </div>
                <div className="summary-line total">
                  <span>Tổng thanh toán</span>
                  <span className="grand-total">{calculateTotal().toLocaleString()} ₫</span>
                </div>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
};

export default CheckoutPage;
