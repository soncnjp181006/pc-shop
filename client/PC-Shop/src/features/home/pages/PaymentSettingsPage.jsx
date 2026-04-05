import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Building2,
  CreditCard,
  MapPin,
  Phone,
  Plus,
  Smartphone,
  Sparkles,
  Trash2,
  Wallet,
} from 'lucide-react';
import { customerProfileApi } from '../../../utils/api';
import './PaymentSettingsPage.css';

const METHOD_LABELS = {
  cod: 'Thanh toán khi nhận hàng (COD)',
  ewallet: 'Ví điện tử (MoMo, ZaloPay…)',
  bank: 'Chuyển khoản ngân hàng',
  visa: 'Thẻ quốc tế (Visa/Mastercard)',
};

const MethodIcon = ({ type }) => {
  if (type === 'cod') return <Wallet size={22} strokeWidth={2} />;
  if (type === 'ewallet') return <Smartphone size={22} strokeWidth={2} />;
  if (type === 'bank') return <Building2 size={22} strokeWidth={2} />;
  return <CreditCard size={22} strokeWidth={2} />;
};

const PaymentSettingsPage = () => {
  const navigate = useNavigate();
  const [tab, setTab] = useState('payment');
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState(null);
  const [paymentMethods, setPaymentMethods] = useState([]);
  const [addresses, setAddresses] = useState([]);
  const [phones, setPhones] = useState([]);

  const [pmForm, setPmForm] = useState({ method_type: 'cod', label: '', is_default: false });
  const [addrForm, setAddrForm] = useState({
    recipient_name: '',
    phone: '',
    address_line: '',
    note: '',
    is_default: false,
  });
  const [phoneForm, setPhoneForm] = useState({ phone_number: '', label: '', is_default: false });

  const loadAll = useCallback(async () => {
    setErr(null);
    try {
      const res = await customerProfileApi.getCheckoutProfile();
      if (!res.ok) {
        setErr('Không tải được dữ liệu. Vui lòng thử lại.');
        return;
      }
      const data = await res.json();
      setPaymentMethods(data.payment_methods || []);
      setAddresses(data.shipping_addresses || []);
      setPhones(data.phones || []);
    } catch (e) {
      console.error(e);
      setErr('Lỗi mạng hoặc máy chủ.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  const handleAddPayment = async (e) => {
    e.preventDefault();
    setErr(null);
    const res = await customerProfileApi.createPaymentMethod({
      method_type: pmForm.method_type,
      label: pmForm.label.trim() || null,
      is_default: pmForm.is_default,
    });
    if (!res.ok) {
      const j = await res.json().catch(() => ({}));
      setErr(j.detail || 'Không thêm được phương thức.');
      return;
    }
    setPmForm({ method_type: 'cod', label: '', is_default: false });
    loadAll();
  };

  const handleDeletePm = async (id) => {
    if (!window.confirm('Xóa phương thức thanh toán này?')) return;
    await customerProfileApi.deletePaymentMethod(id);
    loadAll();
  };

  const handleSetDefaultPm = async (id, current) => {
    if (current) return;
    await customerProfileApi.updatePaymentMethod(id, { is_default: true });
    loadAll();
  };

  const handleAddAddress = async (e) => {
    e.preventDefault();
    setErr(null);
    const res = await customerProfileApi.createShippingAddress({
      recipient_name: addrForm.recipient_name.trim(),
      phone: addrForm.phone.trim(),
      address_line: addrForm.address_line.trim(),
      note: addrForm.note.trim() || null,
      is_default: addrForm.is_default,
    });
    if (!res.ok) {
      const j = await res.json().catch(() => ({}));
      setErr(j.detail || 'Không thêm được địa chỉ.');
      return;
    }
    setAddrForm({
      recipient_name: '',
      phone: '',
      address_line: '',
      note: '',
      is_default: false,
    });
    loadAll();
  };

  const handleDeleteAddr = async (id) => {
    if (!window.confirm('Xóa địa chỉ này?')) return;
    await customerProfileApi.deleteShippingAddress(id);
    loadAll();
  };

  const handleSetDefaultAddr = async (id, current) => {
    if (current) return;
    await customerProfileApi.updateShippingAddress(id, { is_default: true });
    loadAll();
  };

  const handleAddPhone = async (e) => {
    e.preventDefault();
    setErr(null);
    const res = await customerProfileApi.createPhone({
      phone_number: phoneForm.phone_number.trim(),
      label: phoneForm.label.trim() || null,
      is_default: phoneForm.is_default,
    });
    if (!res.ok) {
      const j = await res.json().catch(() => ({}));
      setErr(j.detail || 'Không thêm được số điện thoại.');
      return;
    }
    setPhoneForm({ phone_number: '', label: '', is_default: false });
    loadAll();
  };

  const handleDeletePhone = async (id) => {
    if (!window.confirm('Xóa số điện thoại này?')) return;
    await customerProfileApi.deletePhone(id);
    loadAll();
  };

  const handleSetDefaultPhone = async (id, current) => {
    if (current) return;
    await customerProfileApi.updatePhone(id, { is_default: true });
    loadAll();
  };

  if (loading) {
    return (
      <div className="payment-settings-loading">
        <div className="payment-settings-spinner" />
        <p>Đang tải thông tin...</p>
      </div>
    );
  }

  return (
    <div className="payment-settings-page animate-fade-in">
      <div className="payment-settings-container">
        <header className="payment-settings-hero">
          <button type="button" className="ps-back" onClick={() => navigate('/profile')}>
            <ArrowLeft size={18} /> Quay lại hồ sơ
          </button>
          <div className="ps-hero-inner">
            <div className="ps-hero-icon">
              <Sparkles size={28} />
            </div>
            <div>
              <h1 className="ps-title">Thông tin thanh toán & giao hàng</h1>
              <p className="ps-sub">
                Quản lý phương thức thanh toán, địa chỉ nhận hàng và số điện thoại — dùng nhanh khi đặt hàng.
              </p>
            </div>
          </div>
        </header>

        {err && (
          <div className="ps-alert" role="alert">
            {err}
          </div>
        )}

        <nav className="ps-tabs" aria-label="Chọn mục">
          <button
            type="button"
            className={`ps-tab ${tab === 'payment' ? 'active' : ''}`}
            onClick={() => setTab('payment')}
          >
            <CreditCard size={18} /> Phương thức thanh toán
          </button>
          <button
            type="button"
            className={`ps-tab ${tab === 'address' ? 'active' : ''}`}
            onClick={() => setTab('address')}
          >
            <MapPin size={18} /> Địa chỉ nhận hàng
          </button>
          <button
            type="button"
            className={`ps-tab ${tab === 'phone' ? 'active' : ''}`}
            onClick={() => setTab('phone')}
          >
            <Phone size={18} /> Số điện thoại
          </button>
        </nav>

        {tab === 'payment' && (
          <section className="ps-panel glass-panel">
            <h2 className="ps-panel-title">Đã lưu</h2>
            {paymentMethods.length === 0 ? (
              <p className="ps-empty">Chưa có phương thức nào. Thêm bên dưới để thanh toán nhanh hơn.</p>
            ) : (
              <ul className="ps-card-list">
                {paymentMethods.map((pm) => (
                  <li key={pm.id} className={`ps-data-card ${pm.is_default ? 'is-default' : ''}`}>
                    <div className="ps-data-card-icon">
                      <MethodIcon type={pm.method_type} />
                    </div>
                    <div className="ps-data-card-body">
                      <div className="ps-data-card-title">{METHOD_LABELS[pm.method_type] || pm.method_type}</div>
                      {pm.label && <div className="ps-data-card-meta">{pm.label}</div>}
                      {pm.is_default && <span className="ps-badge">Mặc định</span>}
                    </div>
                    <div className="ps-data-card-actions">
                      {!pm.is_default && (
                        <button type="button" className="ps-btn-link" onClick={() => handleSetDefaultPm(pm.id, pm.is_default)}>
                          Đặt mặc định
                        </button>
                      )}
                      <button type="button" className="ps-icon-btn danger" onClick={() => handleDeletePm(pm.id)} aria-label="Xóa">
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}

            <form className="ps-form" onSubmit={handleAddPayment}>
              <h3 className="ps-form-title">
                <Plus size={18} /> Thêm phương thức
              </h3>
              <div className="ps-form-grid">
                <label className="ps-field">
                  <span>Loại</span>
                  <select
                    value={pmForm.method_type}
                    onChange={(e) => setPmForm((p) => ({ ...p, method_type: e.target.value }))}
                  >
                    <option value="cod">COD</option>
                    <option value="ewallet">Ví điện tử</option>
                    <option value="bank">Chuyển khoản</option>
                    <option value="visa">Thẻ quốc tế</option>
                  </select>
                </label>
                <label className="ps-field">
                  <span>Ghi chú (tùy chọn)</span>
                  <input
                    type="text"
                    placeholder="VD: TK ngân hàng chính"
                    value={pmForm.label}
                    onChange={(e) => setPmForm((p) => ({ ...p, label: e.target.value }))}
                  />
                </label>
              </div>
              <label className="ps-check">
                <input
                  type="checkbox"
                  checked={pmForm.is_default}
                  onChange={(e) => setPmForm((p) => ({ ...p, is_default: e.target.checked }))}
                />
                Đặt làm mặc định
              </label>
              <button type="submit" className="ps-btn-primary">
                Lưu phương thức
              </button>
            </form>
          </section>
        )}

        {tab === 'address' && (
          <section className="ps-panel glass-panel">
            <h2 className="ps-panel-title">Địa chỉ đã lưu</h2>
            {addresses.length === 0 ? (
              <p className="ps-empty">Chưa có địa chỉ. Thêm để giao hàng đúng nơi bạn muốn.</p>
            ) : (
              <ul className="ps-card-list">
                {addresses.map((a) => (
                  <li key={a.id} className={`ps-data-card ps-address-card ${a.is_default ? 'is-default' : ''}`}>
                    <div className="ps-data-card-icon muted">
                      <MapPin size={22} />
                    </div>
                    <div className="ps-data-card-body">
                      <div className="ps-data-card-title">{a.recipient_name}</div>
                      <div className="ps-data-card-meta">{a.phone}</div>
                      <div className="ps-address-text">{a.address_line}</div>
                      {a.note && <div className="ps-note">Ghi chú: {a.note}</div>}
                      {a.is_default && <span className="ps-badge">Mặc định</span>}
                    </div>
                    <div className="ps-data-card-actions">
                      {!a.is_default && (
                        <button type="button" className="ps-btn-link" onClick={() => handleSetDefaultAddr(a.id, a.is_default)}>
                          Đặt mặc định
                        </button>
                      )}
                      <button type="button" className="ps-icon-btn danger" onClick={() => handleDeleteAddr(a.id)} aria-label="Xóa">
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}

            <form className="ps-form" onSubmit={handleAddAddress}>
              <h3 className="ps-form-title">
                <Plus size={18} /> Thêm địa chỉ
              </h3>
              <div className="ps-form-grid two">
                <label className="ps-field">
                  <span>Họ tên người nhận</span>
                  <input
                    required
                    value={addrForm.recipient_name}
                    onChange={(e) => setAddrForm((p) => ({ ...p, recipient_name: e.target.value }))}
                  />
                </label>
                <label className="ps-field">
                  <span>Số điện thoại</span>
                  <input
                    required
                    type="tel"
                    value={addrForm.phone}
                    onChange={(e) => setAddrForm((p) => ({ ...p, phone: e.target.value }))}
                  />
                </label>
              </div>
              <label className="ps-field">
                <span>Địa chỉ đầy đủ</span>
                <textarea
                  required
                  rows={3}
                  value={addrForm.address_line}
                  onChange={(e) => setAddrForm((p) => ({ ...p, address_line: e.target.value }))}
                />
              </label>
              <label className="ps-field">
                <span>Ghi chú (tùy chọn)</span>
                <textarea
                  rows={2}
                  value={addrForm.note}
                  onChange={(e) => setAddrForm((p) => ({ ...p, note: e.target.value }))}
                />
              </label>
              <label className="ps-check">
                <input
                  type="checkbox"
                  checked={addrForm.is_default}
                  onChange={(e) => setAddrForm((p) => ({ ...p, is_default: e.target.checked }))}
                />
                Đặt làm mặc định
              </label>
              <button type="submit" className="ps-btn-primary">
                Lưu địa chỉ
              </button>
            </form>
          </section>
        )}

        {tab === 'phone' && (
          <section className="ps-panel glass-panel">
            <h2 className="ps-panel-title">Số điện thoại đã lưu</h2>
            {phones.length === 0 ? (
              <p className="ps-empty">Chưa có số nào. Thêm để liên hệ khi giao hàng.</p>
            ) : (
              <ul className="ps-card-list">
                {phones.map((p) => (
                  <li key={p.id} className={`ps-data-card ${p.is_default ? 'is-default' : ''}`}>
                    <div className="ps-data-card-icon muted">
                      <Phone size={22} />
                    </div>
                    <div className="ps-data-card-body">
                      <div className="ps-data-card-title">{p.phone_number}</div>
                      {p.label && <div className="ps-data-card-meta">{p.label}</div>}
                      {p.is_default && <span className="ps-badge">Mặc định</span>}
                    </div>
                    <div className="ps-data-card-actions">
                      {!p.is_default && (
                        <button type="button" className="ps-btn-link" onClick={() => handleSetDefaultPhone(p.id, p.is_default)}>
                          Đặt mặc định
                        </button>
                      )}
                      <button type="button" className="ps-icon-btn danger" onClick={() => handleDeletePhone(p.id)} aria-label="Xóa">
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}

            <form className="ps-form" onSubmit={handleAddPhone}>
              <h3 className="ps-form-title">
                <Plus size={18} /> Thêm số điện thoại
              </h3>
              <div className="ps-form-grid two">
                <label className="ps-field">
                  <span>Số điện thoại</span>
                  <input
                    required
                    type="tel"
                    value={phoneForm.phone_number}
                    onChange={(e) => setPhoneForm((p) => ({ ...p, phone_number: e.target.value }))}
                  />
                </label>
                <label className="ps-field">
                  <span>Nhãn (tùy chọn)</span>
                  <input
                    placeholder="VD: Cá nhân, Công ty"
                    value={phoneForm.label}
                    onChange={(e) => setPhoneForm((p) => ({ ...p, label: e.target.value }))}
                  />
                </label>
              </div>
              <label className="ps-check">
                <input
                  type="checkbox"
                  checked={phoneForm.is_default}
                  onChange={(e) => setPhoneForm((p) => ({ ...p, is_default: e.target.checked }))}
                />
                Đặt làm mặc định
              </label>
              <button type="submit" className="ps-btn-primary">
                Lưu số điện thoại
              </button>
            </form>
          </section>
        )}
      </div>
    </div>
  );
};

export default PaymentSettingsPage;
