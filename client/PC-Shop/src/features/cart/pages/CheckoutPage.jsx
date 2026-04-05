/**
 * Checkout một trang (single-page): giảm số bước, tăng khả năng quét thông tin.
 *
 * Bố cục desktop:
 *  [Breadcrumb: Giỏ hàng → Thanh toán → Hoàn tất]
 *  [Cột trái: người nhận | địa chỉ | ghi chú | phương thức TT | trust | gợi ý SP]
 *  [Cột phải sticky: tóm tắt đơn | mã giảm giá | phí ship | tổng | CTA Đặt hàng | giao hàng dự kiến]
 *
 * Mobile: form trước, tóm tắt sau; CTA trong khối tóm tắt (vùng bấm lớn — Fitts’s Law).
 */
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  BadgePercent,
  Building2,
  Check,
  ChevronRight,
  Clock,
  CreditCard,
  MapPin,
  Package,
  Phone,
  RotateCcw,
  Settings2,
  ShieldCheck,
  ShoppingBag,
  Smartphone,
  Sparkles,
  Truck,
  Wallet,
} from 'lucide-react';
import { cartApi, customerProfileApi, getImageUrl, productsApi } from '../../../utils/api';
import { formatVnd } from '../../../utils/format';
import './CheckoutPage.css';

const PAYMENT_OPTIONS = [
  {
    id: 'cod',
    title: 'Thanh toán khi nhận hàng (COD)',
    desc: 'Trả tiền mặt khi nhận hàng — phổ biến nhất tại VN.',
    Icon: Wallet,
    badge: 'Phổ biến',
  },
  {
    id: 'ewallet',
    title: 'Ví điện tử (MoMo, ZaloPay…)',
    desc: 'Quét QR hoặc thanh toán trong app ví.',
    Icon: Smartphone,
    badge: null,
  },
  {
    id: 'bank',
    title: 'Chuyển khoản ngân hàng',
    desc: 'CK qua app ngân hàng; đơn sẽ xử lý sau khi nhận tiền.',
    Icon: Building2,
    badge: null,
  },
  {
    id: 'visa',
    title: 'Thẻ Visa / Mastercard',
    desc: 'Thanh toán quốc tế qua cổng bảo mật.',
    Icon: CreditCard,
    badge: null,
  },
];

/** Mã demo — có thể nối API sau */
const COUPON_RULES = {
  WELCOME10: { type: 'percent', value: 10, label: 'Giảm 10% đơn đầu' },
  PC500K: { type: 'fixed', value: 500_000, label: 'Giảm 500.000 ₫' },
};

const CheckoutPage = () => {
  const navigate = useNavigate();
  const [cart, setCart] = useState(null);
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState(null);
  const [addressMode, setAddressMode] = useState('manual');
  const [selectedAddressId, setSelectedAddressId] = useState(null);
  const [selectedItems, setSelectedItems] = useState(new Set()); // Track selected items
  const [itemQuantities, setItemQuantities] = useState(new Map()); // Track quantities

  const [formData, setShippingData] = useState({
    fullName: '',
    phone: '',
    address: '',
    note: '',
  });

  const [paymentMethod, setPaymentMethod] = useState('cod');
  const [couponInput, setCouponInput] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [couponError, setCouponError] = useState('');
  const [formError, setFormError] = useState('');
  const [relatedProducts, setRelatedProducts] = useState([]);
  const [savingAddress, setSavingAddress] = useState(false);
  const [showAddressModal, setShowAddressModal] = useState(false);
  const [newAddressForm, setNewAddressForm] = useState({
    recipient_name: '',
    phone: '',
    address_line: '',
    note: '',
  });

  const applyAddress = useCallback((addr) => {
    setShippingData({
      fullName: addr.recipient_name,
      phone: addr.phone,
      address: addr.address_line,
      note: addr.note || '',
    });
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
        // Initialize selected items (all by default) and quantities
        const ids = new Set(data.items.map(item => item.id));
        setSelectedItems(ids);
        const qtyMap = new Map();
        data.items.forEach(item => {
          qtyMap.set(item.id, item.quantity || 1);
        });
        setItemQuantities(qtyMap);
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

  const fetchProfile = async () => {
    try {
      const res = await customerProfileApi.getCheckoutProfile();
      if (!res.ok) return;
      const data = await res.json();
      setProfile(data);

      const addresses = data.shipping_addresses || [];
      const defAddr = addresses.find((a) => a.is_default) || addresses[0];
      if (defAddr) {
        setSelectedAddressId(defAddr.id);
        setAddressMode('saved');
        applyAddress(defAddr);
      }

      const pms = data.payment_methods || [];
      const defPm = pms.find((p) => p.is_default) || pms[0];
      if (defPm && PAYMENT_OPTIONS.some((o) => o.id === defPm.method_type)) {
        setPaymentMethod(defPm.method_type);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const fetchRelated = async () => {
    try {
      const res = await productsApi.getAll({ page: 1, limit: 8, active_only: true });
      if (!res.ok) return;
      const data = await res.json();
      const list = data.data || [];
      setRelatedProducts(list.slice(0, 4));
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchCart();
    fetchProfile();
    fetchRelated();
  }, []);

  const cartProductIds = useMemo(() => {
    if (!cart?.items?.length) return new Set();
    return new Set(cart.items.map((i) => i.variant?.product?.id).filter(Boolean));
  }, [cart]);

  const suggestedProducts = useMemo(
    () => relatedProducts.filter((p) => !cartProductIds.has(p.id)),
    [relatedProducts, cartProductIds]
  );

  const subtotal = useMemo(() => {
    if (!cart?.items?.length) return 0;
    
    // Calculate only selected items with their updated quantities
    return cart.items.reduce((acc, item) => {
      if (!selectedItems.has(item.id)) return acc;
      
      const qty = itemQuantities.get(item.id) || item.quantity || 1;
      const unitPrice = Number(item.price) || 0;
      return acc + (unitPrice * qty);
    }, 0);
  }, [cart, selectedItems, itemQuantities]);

  const discountAmount = useMemo(() => {
    if (!appliedCoupon) return 0;
    const rule = COUPON_RULES[appliedCoupon.code];
    if (!rule) return 0;
    if (rule.type === 'percent') return Math.min(subtotal, Math.round((subtotal * rule.value) / 100));
    return Math.min(subtotal, rule.value);
  }, [appliedCoupon, subtotal]);

  const shippingFee = 0;
  const orderTotal = Math.max(0, subtotal - discountAmount + shippingFee);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setAddressMode('manual');
    setSelectedAddressId(null);
    setFormError('');
    setShippingData((prev) => ({ ...prev, [name]: value }));
  };

  const toggleItemSelect = (itemId) => {
    setSelectedItems(prev => {
      const newSet = new Set(prev);
      if (newSet.has(itemId)) {
        newSet.delete(itemId);
      } else {
        newSet.add(itemId);
      }
      return newSet;
    });
  };

  const updateItemQuantity = (itemId, newQty) => {
    if (newQty < 1) return;
    setItemQuantities(prev => {
      const newMap = new Map(prev);
      newMap.set(itemId, newQty);
      return newMap;
    });
  };

  const onSelectSavedAddress = (id) => {
    const addr = profile?.shipping_addresses?.find((a) => a.id === id);
    if (!addr) return;
    setSelectedAddressId(id);
    setAddressMode('saved');
    setFormError('');
    applyAddress(addr);
  };

  const onSwitchToManualAddress = () => {
    setAddressMode('manual');
    setSelectedAddressId(null);
  };

  const applySavedPhone = (num) => {
    setShippingData((prev) => ({ ...prev, phone: num }));
  };

  const applyCoupon = (e) => {
    e.preventDefault();
    setCouponError('');
    const code = couponInput.trim().toUpperCase();
    if (!code) {
      setCouponError('Nhập mã ưu đãi.');
      return;
    }
    const rule = COUPON_RULES[code];
    if (!rule) {
      setCouponError('Mã không hợp lệ hoặc đã hết hạn.');
      return;
    }
    setAppliedCoupon({ code, label: rule.label });
  };

  const removeCoupon = () => {
    setAppliedCoupon(null);
    setCouponInput('');
    setCouponError('');
  };

  const paymentLabel = () => {
    const opt = PAYMENT_OPTIONS.find((o) => o.id === paymentMethod);
    return opt ? opt.title : paymentMethod;
  };

  const validateForm = () => {
    if (!formData.fullName?.trim()) return 'Vui lòng nhập họ tên người nhận.';
    if (!formData.phone?.trim()) return 'Vui lòng nhập số điện thoại.';
    if (!formData.address?.trim()) return 'Vui lòng nhập địa chỉ giao hàng.';
    return '';
  };

  const handlePlaceOrder = () => {
    const err = validateForm();
    if (err) {
      setFormError(err);
      return;
    }
    setFormError('');
    alert(
      `Đặt hàng (demo)\nThanh toán: ${paymentLabel()}\nTổng: ${formatVnd(orderTotal)}\n\nChức năng xử lý đơn sẽ được nối API sau.`
    );
  };

  const handleSaveAddress = async () => {
    if (!formData.fullName.trim() || !formData.phone.trim() || !formData.address.trim()) {
      setFormError('Vui lòng điền đầy đủ thông tin để lưu địa chỉ.');
      return;
    }
    setSavingAddress(true);
    try {
      const res = await customerProfileApi.createShippingAddress({
        recipient_name: formData.fullName,
        phone: formData.phone,
        address_line: formData.address,
        note: formData.note,
        is_default: savedAddresses.length === 0, // Nếu là địa chỉ đầu tiên, đặt làm mặc định
      });
      if (res.ok) {
        // Refresh profile để cập nhật danh sách địa chỉ
        await fetchProfile();
        setFormError('');
      } else {
        setFormError('Lỗi khi lưu địa chỉ. Vui lòng thử lại.');
      }
    } catch (e) {
      console.error(e);
      setFormError('Lỗi khi lưu địa chỉ. Vui lòng thử lại.');
    } finally {
      setSavingAddress(false);
    }
  };

  const handleOpenAddressModal = () => {
    setNewAddressForm({
      recipient_name: '',
      phone: '',
      address_line: '',
      note: '',
    });
    setShowAddressModal(true);
  };

  const handleSaveNewAddress = async () => {
    if (!newAddressForm.recipient_name.trim() || !newAddressForm.phone.trim() || !newAddressForm.address_line.trim()) {
      setFormError('Vui lòng điền đầy đủ thông tin.');
      return;
    }
    setSavingAddress(true);
    try {
      const res = await customerProfileApi.createShippingAddress({
        recipient_name: newAddressForm.recipient_name,
        phone: newAddressForm.phone,
        address_line: newAddressForm.address_line,
        note: newAddressForm.note,
        is_default: false,
      });
      if (res.ok) {
        await fetchProfile();
        setShowAddressModal(false);
        setFormError('');
      } else {
        setFormError('Lỗi khi lưu địa chỉ.');
      }
    } catch (e) {
      console.error(e);
      setFormError('Lỗi khi lưu địa chỉ.');
    } finally {
      setSavingAddress(false);
    }
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner" />
        <p>Đang chuẩn bị đơn hàng...</p>
      </div>
    );
  }

  const savedAddresses = profile?.shipping_addresses || [];
  const savedPhones = profile?.phones || [];

  return (
    <div className="checkout-page checkout-v2 animate-fade-in">
      <div className="container checkout-v2-container">
        <nav className="checkout-breadcrumb" aria-label="Tiến trình đặt hàng">
          <Link to="/cart" className="cb-link">
            <ShoppingBag size={16} /> Giỏ hàng
          </Link>
          <ChevronRight size={16} className="cb-chevron" aria-hidden />
          <span className="cb-current">
            <Sparkles size={16} /> Thanh toán
          </span>
          <ChevronRight size={16} className="cb-chevron" aria-hidden />
          <span className="cb-future">Hoàn tất</span>
        </nav>

        <header className="checkout-v2-header">
          <h1 className="checkout-v2-title">Thanh toán</h1>
        </header>

        <div className="checkout-v2-grid">
          <div className="checkout-v2-main">
            {formError && (
              <div className="checkout-inline-alert" role="alert">
                {formError}
              </div>
            )}

            <section className="checkout-card glass-panel">
              <div className="checkout-card-head">
                <h2 className="checkout-card-title">
                  <Truck size={22} className="checkout-card-title-icon" />
                  Người nhận & địa chỉ giao hàng
                </h2>
                <Link className="checkout-manage-link" to="/profile/payment">
                  <Settings2 size={16} /> Đã lưu
                </Link>
              </div>

              {savedAddresses.length > 0 && (
                <div className="saved-block">
                  <div className="saved-label">
                    <MapPin size={16} /> Chọn địa chỉ đã lưu
                  </div>
                  <div className="saved-address-grid">
                    {savedAddresses.map((a) => (
                      <button
                        key={a.id}
                        type="button"
                        className={`saved-address-card ${selectedAddressId === a.id && addressMode === 'saved' ? 'active' : ''}`}
                        onClick={() => onSelectSavedAddress(a.id)}
                      >
                        {a.is_default && <span className="saved-pill">Mặc định</span>}
                        <span className="saved-name">{a.recipient_name}</span>
                        <span className="saved-line">{a.phone}</span>
                        <span className="saved-addr">{a.address_line}</span>
                      </button>
                    ))}
                  </div>
                  <button type="button" className="btn-textish" onClick={handleOpenAddressModal}>
                    + Nhập địa chỉ khác
                  </button>
                </div>
              )}

              {savedPhones.length > 0 && (
                <div className="phone-chips-block">
                  <span className="phone-chips-label">
                    <Phone size={14} /> Số điện thoại đã lưu
                  </span>
                  <div className="phone-chips">
                    {savedPhones.map((p) => (
                      <button
                        key={p.id}
                        type="button"
                        className={`phone-chip ${formData.phone === p.phone_number ? 'active' : ''}`}
                        onClick={() => applySavedPhone(p.phone_number)}
                      >
                        {p.phone_number}
                        {p.label && <span className="chip-sub">{p.label}</span>}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="form-grid-2">
                <div className="form-group">
                  <label htmlFor="co-fullName">Họ và tên người nhận</label>
                  <input
                    id="co-fullName"
                    type="text"
                    name="fullName"
                    autoComplete="name"
                    placeholder="VD: Nguyễn Văn A"
                    value={formData.fullName}
                    onChange={handleInputChange}
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="co-phone">Số điện thoại</label>
                  <input
                    id="co-phone"
                    type="tel"
                    name="phone"
                    autoComplete="tel"
                    placeholder="VD: 0901 234 567"
                    value={formData.phone}
                    onChange={handleInputChange}
                  />
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="co-address">Địa chỉ nhận hàng đầy đủ</label>
                <textarea
                  id="co-address"
                  name="address"
                  rows={3}
                  autoComplete="street-address"
                  placeholder="Số nhà, đường, phường/xã, quận/huyện, tỉnh/thành phố"
                  value={formData.address}
                  onChange={handleInputChange}
                />
              </div>

              <div className="form-group">
                <label htmlFor="co-note">Ghi chú giao hàng (không bắt buộc)</label>
                <textarea
                  id="co-note"
                  name="note"
                  rows={2}
                  placeholder="Ví dụ: Giao giờ hành chính, gọi trước khi đến…"
                  value={formData.note}
                  onChange={handleInputChange}
                />
              </div>

              {savedAddresses.length === 0 && addressMode === 'manual' && (
                <button type="button" className="btn-save-address" onClick={handleSaveAddress} disabled={savingAddress}>
                  {savingAddress ? 'Đang lưu...' : 'Lưu địa chỉ này'}
                </button>
              )}
            </section>

            <section className="checkout-card glass-panel">
              <div className="checkout-card-head">
                <h2 className="checkout-card-title">
                  <CreditCard size={22} className="checkout-card-title-icon" />
                  Phương thức thanh toán
                </h2>
              </div>
              <p className="payment-intro">
                Chọn một phương thức — ưu tiên hiển thị COD và ví điện tử (thói quen mua sắm tại Việt Nam).
              </p>
              <div className="payment-grid-v2">
                {PAYMENT_OPTIONS.map(({ id, title, desc, Icon, badge }) => {
                  const active = paymentMethod === id;
                  return (
                    <button
                      key={id}
                      type="button"
                      className={`payment-tile-v2 ${active ? 'active' : ''}`}
                      onClick={() => setPaymentMethod(id)}
                    >
                      {badge && <span className="payment-tile-badge">{badge}</span>}
                      <div className="payment-tile-icon-v2">
                        <Icon size={24} strokeWidth={1.75} />
                      </div>
                      <div className="payment-tile-text">
                        <span className="payment-tile-title">{title}</span>
                        <span className="payment-tile-desc">{desc}</span>
                      </div>
                      <div className={`payment-tile-check ${active ? 'on' : ''}`}>
                        {active && <Check size={16} strokeWidth={3} />}
                      </div>
                    </button>
                  );
                })}
              </div>
            </section>

            <section className="checkout-trust-strip glass-panel" aria-label="Cam kết">
              <div className="trust-item">
                <ShieldCheck size={22} strokeWidth={1.75} />
                <div>
                  <strong>Thanh toán an toàn</strong>
                  <span>Thông tin được mã hóa khi kết nối cổng thanh toán.</span>
                </div>
              </div>
              <div className="trust-item">
                <Truck size={22} strokeWidth={1.75} />
                <div>
                  <strong>Giao hàng chuyên nghiệp</strong>
                  <span>Đóng gói cẩn thận, theo dõi đơn qua tài khoản (sắp ra mắt).</span>
                </div>
              </div>
              <div className="trust-item">
                <RotateCcw size={22} strokeWidth={1.75} />
                <div>
                  <strong>Đổi trả rõ ràng</strong>
                  <span>Hỗ trợ theo chính sách cửa hàng cho từng loại sản phẩm.</span>
                </div>
              </div>
            </section>

            {suggestedProducts.length > 0 && (
              <section className="checkout-related glass-panel">
                <h3 className="checkout-related-title">
                  <Package size={20} /> Có thể bạn cần thêm
                </h3>
                <div className="checkout-related-scroll">
                  {suggestedProducts.map((p) => (
                    <Link key={p.id} to={`/products/${p.id}`} className="checkout-related-card">
                      <div className="checkout-related-img">
                        <img src={getImageUrl(p.image_url)} alt="" />
                      </div>
                      <span className="checkout-related-name">{p.name}</span>
                      <span className="checkout-related-price">{formatVnd(p.base_price)}</span>
                    </Link>
                  ))}
                </div>
              </section>
            )}
          </div>

          <aside className="checkout-v2-aside">
            <div className="order-summary-v2 glass-panel">
              <h3 className="summary-title-v2">Tóm tắt đơn hàng</h3>
              <div className="checkout-items-list-v2">
                {cart?.items?.map((item) => {
                  const unit = Number(item.price);
                  const qty = itemQuantities.get(item.id) || item.quantity || 1;
                  const isSelected = selectedItems.has(item.id);
                  const line = Number.isFinite(unit) ? unit * qty : 0;
                  return (
                    <div key={item.id} className={`checkout-line-item ${isSelected ? 'selected' : ''}`}>
                      {/* Checkbox */}
                      <label className="item-checkbox-wrap">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleItemSelect(item.id)}
                          className="item-checkbox"
                        />
                        <span className={`checkbox-visual ${isSelected ? 'checked' : ''}`} />
                      </label>

                      {/* Image */}
                      <div className="cli-img">
                        <img src={getImageUrl(item.variant?.product?.image_url)} alt="" />
                      </div>

                      {/* Product Info */}
                      <div className="cli-body">
                        <span className="cli-name">{item.variant?.product?.name || 'Sản phẩm'}</span>
                        <span className="cli-meta">
                          {formatVnd(unit)} / chiếc
                        </span>
                      </div>

                      {/* Quantity Controls */}
                      <div className="item-qty-controls">
                        <button
                          type="button"
                          className="qty-btn"
                          onClick={() => updateItemQuantity(item.id, qty - 1)}
                          disabled={qty <= 1}
                        >
                          −
                        </button>
                        <input
                          type="number"
                          value={qty}
                          onChange={(e) => updateItemQuantity(item.id, parseInt(e.target.value) || 1)}
                          className="qty-input"
                          min="1"
                        />
                        <button
                          type="button"
                          className="qty-btn"
                          onClick={() => updateItemQuantity(item.id, qty + 1)}
                        >
                          +
                        </button>
                      </div>

                      {/* Price */}
                      <span className="cli-price">{formatVnd(line)}</span>
                    </div>
                  );
                })}
              </div>

              <form className="coupon-box" onSubmit={applyCoupon}>
                <label className="coupon-label" htmlFor="co-coupon">
                  <BadgePercent size={16} /> Mã giảm giá
                </label>
                <div className="coupon-row">
                  <input
                    id="co-coupon"
                    type="text"
                    placeholder="Nhập mã (thử WELCOME10, PC500K)"
                    value={couponInput}
                    onChange={(e) => setCouponInput(e.target.value)}
                    disabled={!!appliedCoupon}
                  />
                  {appliedCoupon ? (
                    <button type="button" className="btn-coupon-remove" onClick={removeCoupon}>
                      Xóa
                    </button>
                  ) : (
                    <button type="submit" className="btn-coupon-apply">
                      Áp dụng
                    </button>
                  )}
                </div>
                {couponError && <p className="coupon-hint error">{couponError}</p>}
                {appliedCoupon && !couponError && (
                  <p className="coupon-hint success">
                    Đã áp dụng: {appliedCoupon.label}
                  </p>
                )}
              </form>

              <div className="summary-lines">
                <div className="summary-line">
                  <span>Tạm tính</span>
                  <span>{formatVnd(subtotal)}</span>
                </div>
                {discountAmount > 0 && (
                  <div className="summary-line discount">
                    <span>Giảm giá</span>
                    <span>−{formatVnd(discountAmount)}</span>
                  </div>
                )}
                <div className="summary-line">
                  <span>Phí vận chuyển</span>
                  <span className="ship-free">{shippingFee === 0 ? 'Miễn phí' : formatVnd(shippingFee)}</span>
                </div>
                <div className="summary-line total-line">
                  <span>Tổng thanh toán</span>
                  <span className="grand-total-v2">{formatVnd(orderTotal)}</span>
                </div>
              </div>

              <div className="delivery-estimate">
                <Clock size={18} />
                <div>
                  <strong>Dự kiến giao hàng</strong>
                  <span>2–4 ngày làm việc sau khi xác nhận đơn (khu vực nội thành).</span>
                </div>
              </div>

              <button type="button" className="btn-place-order" onClick={handlePlaceOrder}>
                Đặt hàng — {formatVnd(orderTotal)}
              </button>
              <p className="place-order-note">
                Bằng việc đặt hàng, bạn đồng ý với điều khoản mua bán & chính sách bảo mật của cửa hàng.
              </p>

              <div className="aside-trust-mini">
                <ShieldCheck size={16} />
                <span>Thanh toán được bảo vệ &amp; mã hóa SSL</span>
              </div>
            </div>
          </aside>
        </div>
      </div>

      {showAddressModal && (
        <div className="address-modal-overlay" onClick={() => setShowAddressModal(false)}>
          <div className="address-modal" onClick={(e) => e.stopPropagation()}>
            <h3>Thêm địa chỉ mới</h3>
            <div className="form-group">
              <label>Họ và tên người nhận</label>
              <input
                type="text"
                value={newAddressForm.recipient_name}
                onChange={(e) => setNewAddressForm(prev => ({ ...prev, recipient_name: e.target.value }))}
                placeholder="VD: Nguyễn Văn A"
              />
            </div>
            <div className="form-group">
              <label>Số điện thoại</label>
              <input
                type="tel"
                value={newAddressForm.phone}
                onChange={(e) => setNewAddressForm(prev => ({ ...prev, phone: e.target.value }))}
                placeholder="VD: 0901 234 567"
              />
            </div>
            <div className="form-group">
              <label>Địa chỉ nhận hàng đầy đủ</label>
              <textarea
                value={newAddressForm.address_line}
                onChange={(e) => setNewAddressForm(prev => ({ ...prev, address_line: e.target.value }))}
                rows={3}
                placeholder="Số nhà, đường, phường/xã, quận/huyện, tỉnh/thành phố"
              />
            </div>
            <div className="form-group">
              <label>Ghi chú giao hàng (không bắt buộc)</label>
              <textarea
                value={newAddressForm.note}
                onChange={(e) => setNewAddressForm(prev => ({ ...prev, note: e.target.value }))}
                rows={2}
                placeholder="Ví dụ: Giao giờ hành chính, gọi trước khi đến…"
              />
            </div>
            <div className="modal-actions">
              <button className="btn-secondary" onClick={() => setShowAddressModal(false)}>Hủy</button>
              <button className="btn-primary" onClick={handleSaveNewAddress} disabled={savingAddress}>
                {savingAddress ? 'Đang lưu...' : 'Lưu địa chỉ'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CheckoutPage;
