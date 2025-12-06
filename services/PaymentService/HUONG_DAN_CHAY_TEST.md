# 📚 Hướng Dẫn Chạy Test - PaymentService

## 🎯 Mục Tiêu
Hướng dẫn từng bước cách chạy test để kiểm tra các hàm trong PaymentService.

---

## 📋 Bước 1: Mở Terminal/Command Prompt

1. **Mở PowerShell hoặc Command Prompt** trên Windows
2. **Di chuyển đến thư mục PaymentService** bằng lệnh:
   ```bash
   cd "c:\Users\lolvl\source\repos\HocKi1_2025\BE_KCPM\Backend-KCPM\services\PaymentService"
   ```

---

## 📋 Bước 2: Kiểm Tra Dependencies

Trước khi chạy test, đảm bảo đã cài đặt các package cần thiết:

```bash
npm install
```

Lệnh này sẽ cài đặt:
- `jest` (framework test)
- Các dependencies khác trong `package.json`

---

## 📋 Bước 3: Chạy Tất Cả Test

### 3.1. Chạy tất cả test một lần:
```bash
npm test
```

**Kết quả mong đợi:**
- Jest sẽ tìm tất cả file `*.test.js` trong thư mục `__tests__`
- Chạy tất cả test cases
- Hiển thị kết quả: ✅ Pass hoặc ❌ Fail

**Ví dụ output:**
```
PASS  __tests__/paymentController.test/createPaymentLink.test.js
PASS  __tests__/paymentController.test/confirmPaymentSuccess.test.js

Test Suites: 2 passed, 2 total
Tests:       35 passed, 35 total
```

---

## 📋 Bước 4: Chạy Test Theo File Cụ Thể

### 4.1. Chỉ chạy test cho `createPaymentLink`:
```bash
npm test createPaymentLink
```

### 4.2. Chỉ chạy test cho `confirmPaymentSuccess`:
```bash
npm test confirmPaymentSuccess
```

### 4.3. Chạy test theo tên pattern:
```bash
npm test -- --testNamePattern="should create payment link successfully"
```

---

## 📋 Bước 5: Chạy Test Ở Chế Độ Watch (Tự Động Chạy Lại Khi Code Thay Đổi)

```bash
npm run test:watch
```

**Cách sử dụng:**
- Jest sẽ chạy test và chờ bạn chỉnh sửa code
- Khi bạn lưu file, test sẽ tự động chạy lại
- Nhấn `a` để chạy tất cả test
- Nhấn `f` để chỉ chạy test bị fail
- Nhấn `q` để thoát

---

## 📋 Bước 6: Xem Coverage (Độ Bao Phủ Code)

```bash
npm run test:coverage
```

**Kết quả:**
- Hiển thị % code được test
- Tạo thư mục `coverage/` với báo cáo chi tiết
- Mở file `coverage/index.html` trong trình duyệt để xem báo cáo đẹp hơn

**Ví dụ output:**
```
----------|---------|----------|---------|---------|-------------------|
File      | % Stmts | % Branch | % Funcs | % Lines | Uncovered Line #s |
----------|---------|----------|---------|---------|-------------------|
All files |   95.45 |    90.00 |   100.00 |   95.45 |                   |
```

---

## 📋 Bước 7: Chạy Test Với Verbose (Chi Tiết Hơn)

```bash
npm test -- --verbose
```

Hiển thị chi tiết từng test case đang chạy.

---

## 📋 Bước 8: Chạy Test Và Chỉ Hiển Thị Kết Quả Fail

```bash
npm test -- --onlyFailures
```

Chỉ hiển thị các test bị fail (hữu ích khi có nhiều test).

---

## 📋 Bước 9: Chạy Test Với Timeout Tùy Chỉnh

Nếu test bị timeout, có thể tăng thời gian chờ:

```bash
npm test -- --testTimeout=30000
```

(30 giây thay vì mặc định 10 giây)

---

## 🔍 Các Lệnh Jest Hữu Ích Khác

### Chạy test và dừng ngay khi có 1 test fail:
```bash
npm test -- --bail
```

### Chạy test và hiển thị output real-time:
```bash
npm test -- --verbose --no-coverage
```

### Chạy test với pattern cụ thể:
```bash
npm test -- --testPathPattern=createPaymentLink
```

---

## 📊 Cấu Trúc Test Files

```
__tests__/
└── paymentController.test/
    ├── createPaymentLink.test.js      (15+ test cases)
    └── confirmPaymentSuccess.test.js  (20+ test cases)
```

---

## 🐛 Xử Lý Lỗi Thường Gặp

### Lỗi 1: "jest: command not found"
**Giải pháp:** Chạy `npm install` để cài đặt jest

### Lỗi 2: "Cannot find module"
**Giải pháp:** Kiểm tra đường dẫn import trong file test có đúng không

### Lỗi 3: Test timeout
**Giải pháp:** Tăng timeout: `npm test -- --testTimeout=30000`

### Lỗi 4: "SyntaxError"
**Giải pháp:** Kiểm tra cú pháp JavaScript trong file test

---

## ✅ Checklist Trước Khi Chạy Test

- [ ] Đã cài đặt dependencies: `npm install`
- [ ] Đang ở đúng thư mục PaymentService
- [ ] File test đã được tạo trong `__tests__/paymentController.test/`
- [ ] Code controller đã được tách ra các file riêng

---

## 🎓 Ví Dụ Thực Hành

### Ví dụ 1: Chạy test lần đầu
```bash
# Bước 1: Di chuyển đến thư mục
cd "c:\Users\lolvl\source\repos\HocKi1_2025\BE_KCPM\Backend-KCPM\services\PaymentService"

# Bước 2: Cài đặt (nếu chưa cài)
npm install

# Bước 3: Chạy test
npm test
```

### Ví dụ 2: Phát triển và test liên tục
```bash
# Chạy ở chế độ watch
npm run test:watch

# Sau đó chỉnh sửa code, test sẽ tự động chạy lại
```

### Ví dụ 3: Kiểm tra coverage
```bash
# Chạy test với coverage
npm run test:coverage

# Mở báo cáo trong trình duyệt
# Windows: start coverage/index.html
```

---

## 📝 Ghi Chú

- Jest sẽ tự động tìm các file có pattern `*.test.js` hoặc `*.spec.js`
- Test files nên đặt trong thư mục `__tests__` hoặc cùng cấp với file source
- Mỗi test case nên test một chức năng cụ thể
- Sử dụng `describe()` để nhóm các test case
- Sử dụng `it()` hoặc `test()` để định nghĩa một test case

---

## 🎉 Chúc Bạn Test Thành Công!

Nếu có vấn đề, hãy kiểm tra:
1. Console output để xem lỗi cụ thể
2. File `jest.config.js` để xem cấu hình
3. Đường dẫn import trong file test

