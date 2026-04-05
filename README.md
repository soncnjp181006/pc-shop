# PC-Shop - Nền tảng thương mại điện tử giải pháp máy tính

## Tổng quan

PC-Shop là nền tảng thương mại điện tử chuyên cung cấp giải pháp máy tính tích hợp (thành phần riêng lẻ, phần mềm, dịch vụ). Dự án bao gồm hệ thống hoàn chỉnh với backend FastAPI, frontend React 18+ hiệu năng cao, cơ sở dữ liệu quan hệ và giao diện người dùng được tối ưu hóa cho trải nghiệm mua sắm suôn sẻ.

## Phạm vi kinh doanh

### Khách hàng
- Duyệt sản phẩm theo danh mục, xem chi tiết kỹ thuật.
- Thêm sản phẩm vào giỏ hàng, chỉnh sửa số lượng.
- Chọn địa chỉ giao hàng và phương thức thanh toán.
- Theo dõi lịch sử đơn hàng.

### Quản trị
- Quản lý danh mục sản phẩm, biến thể, hình ảnh.
- Xuất bản sản phẩm và quản lý kho hàng.
- Xử lý đơn hàng và thông tin giao hàng.
- Quản lý người dùng và quyền truy cập.

## Công nghệ sử dụng

### Backend
- FastAPI: Web framework để xây dựng API REST.
- SQLAlchemy ORM: Lập bản đồ đối tượng-quan hệ.
- JWT: Xác thực token.
- Pydantic: Xác thực và tuần tự hóa dữ liệu.
- Alembic: Migration cơ sở dữ liệu có phiên bản.

### Frontend
- React 18+: Thư viện giao diện người dùng.
- Vite: Build tool hiệu năng cao.
- React Router: Điều hướng ứng dụng.
- CSS Variables + Glassmorphism: Thiết kế hiện đại với chủ đề tối.
- Lucide React: Các biểu tượng giao diện.

## Các tính năng đã hoàn thành

1. Hệ thống quản lý người dùng.
   - Đăng ký, đăng nhập với JWT token.
   - Quản lý hồ sơ cá nhân, địa chỉ giao hàng.
   - Kiểm soát quyền truy cập dựa trên vai trò.

2. Hệ thống quản lý sản phẩm.
   - Phân loại sản phẩm theo danh mục.
   - Hỗ trợ biến thể sản phẩm (kích thước, màu sắc, công suất).
   - Quản lý hình ảnh sản phẩm.
   - Tìm kiếm và lọc nâng cao.

3. Hệ thống giỏ hàng và thanh toán.
   - Thêm, sửa, xóa sản phẩm trong giỏ hàng.
   - Chọn và bỏ chọn sản phẩm để thanh toán.
   - Tính toán tổng tiền theo thời gian thực.
   - Lưu trữ giỏ hàng trong phiên người dùng.

4. Trang checkout đa bước.
   - Nhập thông tin giao hàng.
   - Lựa chọn phương thức thanh toán.
   - Xem tóm tắt đơn hàng chi tiết với kiểm soát số lượng.
   - Áp dụng mã giảm giá (khung sẵn sàng).

5. Giao diện người dùng hiện đại.
   - Trang giỏ hàng: Thiết kế glassmorphic chủ đề tối, chọn sản phẩm, xác nhận xóa.
   - Trang chi tiết sản phẩm: Nút "Mua ngay" tự động thêm và chuyển đến thanh toán.
   - Trang thanh toán: Giao diện quy trình từng bước rõ ràng.
   - Hệ thống màu động với CSS Variables.
   - Hoạt ảnh và phản hồi tức thời.

6. Cơ sở dữ liệu.
   - SQLAlchemy ORM cho các mô hình đối tượng.
   - Alembic migration cho kiểm soát phiên bản schema.
   - 15+ migration đã được áp dụng.
   - Cấu trúc bảng tối ưu cho truy vấn.

7. Hỗ trợ WebSocket.
   - Gửi tin nhắn thời gian thực.

## Phương hướng phát triển sau này

1. Tích hợp cổng thanh toán.
   - Kết nối Stripe, VNPay, Momo.
   - Xác thực giao dịch và xử lý hoàn tiền.
   - Cập nhật trạng thái thanh toán tức thời.

2. Hệ thống quản lý kho hàng.
   - Theo dõi tồn kho thực tế.
   - Cảnh báo sản phẩm hết hàng.
   - Dự báo lập lại hàng tồn.

3. Công cụ phân tích và báo cáo.
   - Thống kê doanh thu theo thời gian.
   - Phân tích sản phẩm bán chạy.
   - Phân tích hành vi khách hàng.

4. Thông báo email.
   - Gửi email xác nhận đơn hàng.
   - Email cập nhật trạng thái đơn hàng.
   - Thông báo sản phẩm mới và khuyến mại.

5. Đánh giá và bình luận.
   - Hệ thống đánh giá sao 5 chiều.
   - Bình luận sản phẩm giữa người dùng.
   - Hiển thị trên trang chi tiết.

6. Danh sách yêu thích.
   - Lưu sản phẩm để mua sau.
   - Nhận thông báo khi giảm giá.

7. Trang điều hành (Admin).
   - Quản lý đơn hàng và khách hàng.
   - Quản lý sản phẩm và kho hàng.
   - Xem thống kê và báo cáo.

8. Tối ưu hóa hiệu năng.
   - Nén hình ảnh tự động.
   - Cache với CDN.
   - Code splitting và lazy loading.

## Hướng dẫn phát triển

### Chuỗi phát triển
- Yêu cầu: Xác định tính năng và giao diện cần thiết.
- Phát triển: Viết API, thành phần giao diện, mô hình dữ liệu.
- Kiểm tra: Chi tiết xác thực dữ liệu và kịch bản người dùng.
- Tối ưu: Phân tích hiệu năng và cải thiện.
- Triển khai: Chuẩn bị và hỗ trợ sản xuất.

### Cài đặt và chạy

#### Backend
```bash
pip install -r requirements.txt
python init_db.py
uvicorn app.main:app --reload
```

#### Frontend
```bash
cd client/PC-Shop
npm install
npm run dev
```

#### Database migration
```bash
alembic upgrade head
```

Xem chi tiết tại app/main.py (API routes) và app/models (database schema).
