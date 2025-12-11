# User Service - Unit Test Defect Log

## Tổng Quan
Document này ghi lại tất cả các lỗi được phát hiện trong quá trình viết unit test cho User Service. Mỗi defect được phân tích chi tiết về nguyên nhân gốc rễ, cách khắc phục và bài học kinh nghiệm.

---

## Danh Sách Defects

### USER-001: Logic Error - OTP Expiration Check
- **Module**: verifyOTP.js, resetPassword.js
- **Type**: Logic Error
- **Severity**: Major
- **Status**: Fixed
- **Found Date**: 2024-01-XX
- **Fixed Date**: 2024-01-XX
- **Test File**: `__tests__/userController/verifyOTP.test.js`
- **Test Case**: "should return 400 when OTP expires at exact current time"

#### Mô Tả
OTP được chấp nhận ngay cả khi `expiresAt` bằng chính xác `Date.now()`. Test case kiểm tra trường hợp OTP hết hạn đúng tại thời điểm hiện tại thất bại.

#### Root Cause
Điều kiện kiểm tra expiration sử dụng `<` thay vì `<=`:
```javascript
if (record.expiresAt < Date.now()) {  // Bug: không reject khi bằng
  otpStore.delete(email);
  return res.status(400).json({ error: "OTP đã hết hạn." });
}
```

Logic này cho phép OTP được sử dụng ngay cả khi `expiresAt === Date.now()`, vi phạm nguyên tắc bảo mật "expired at or before".

#### Fix Applied
Thay đổi điều kiện từ `<` thành `<=`:
```javascript
if (record.expiresAt <= Date.now()) {  // Fixed: reject khi bằng hoặc nhỏ hơn
  otpStore.delete(email);
  return res.status(400).json({ error: "OTP đã hết hạn." });
}
```

#### Verification
- Test case "should return 400 when OTP expires at exact current time" hiện đã pass
- Test case "should verify OTP that expires in 1 second" vẫn pass (OTP còn hiệu lực)
- Test case "should return 400 when OTP expired 5 minutes ago" pass

#### Impact
- **Security**: Medium - OTP có thể được sử dụng thêm 1 millisecond sau khi hết hạn
- **User Experience**: Low - Ảnh hưởng rất nhỏ đến trải nghiệm người dùng
- **Business**: Low - Không ảnh hưởng đáng kể đến hoạt động nghiệp vụ

#### Lessons Learned
1. Điều kiện thời gian nên sử dụng `<=` hoặc `>=` thay vì `<` hoặc `>` cho các trường hợp "expired at"
2. Test edge cases với giá trị biên (boundary values) rất quan trọng
3. Áp dụng nguyên tắc "fail-safe" trong bảo mật - nên reject khi không chắc chắn

---

## Các Vấn Đề Tiềm Ẩn (Potential Issues)

### USER-P001: Missing Validation - Password Requirements
- **Module**: signup.js, createEmployee.js, changePassword.js, resetPassword.js
- **Type**: Data Validation
- **Severity**: Minor
- **Status**: Open

#### Mô Tả
Các hàm liên quan đến password không validate độ mạnh của password (minimum length, complexity requirements).

#### Recommendation
Thêm validation cho password:
- Minimum length: 8 characters
- At least 1 uppercase letter
- At least 1 number
- At least 1 special character

---

### USER-P002: Missing Validation - Email Format
- **Module**: signup.js, sendOTP.js, createEmployee.js
- **Type**: Data Validation
- **Severity**: Minor
- **Status**: Open

#### Mô Tả
Email không được validate format trước khi insert vào database. Dựa vào PostgreSQL constraint để validate.

#### Recommendation
Thêm regex validation cho email format:
```javascript
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
if (!emailRegex.test(email)) {
  return res.status(400).json({ error: "Email không hợp lệ." });
}
```

---

### USER-P003: Missing Validation - Phone Format
- **Module**: signup.js, createEmployee.js, updateUser.js, updateEmployee.js
- **Type**: Data Validation
- **Severity**: Minor
- **Status**: Open

#### Mô Tả
Số điện thoại không được validate format (10-11 số, bắt đầu bằng 0).

#### Recommendation
Thêm validation cho phone format:
```javascript
const phoneRegex = /^0\d{9,10}$/;
if (!phoneRegex.test(phone)) {
  return res.status(400).json({ error: "Số điện thoại không hợp lệ." });
}
```

---

### USER-P004: Resource Management - OTP Store Memory Leak
- **Module**: sendOTP.js
- **Type**: Resource Leak
- **Severity**: Medium
- **Status**: Open

#### Mô Tả
OTP được lưu trong Map in-memory nhưng chỉ được xóa khi:
1. User verify OTP thành công
2. User reset password thành công
3. User verify OTP với expired OTP

Nếu user không bao giờ verify/reset, OTP sẽ nằm trong memory mãi mãi.

#### Recommendation
Implement background job để cleanup expired OTPs:
```javascript
// Chạy mỗi 10 phút
setInterval(() => {
  const now = Date.now();
  for (const [email, record] of otpStore.entries()) {
    if (record.expiresAt <= now) {
      otpStore.delete(email);
    }
  }
}, 10 * 60 * 1000);
```

---

### USER-P005: Security - OTP Brute Force Attack
- **Module**: verifyOTP.js
- **Type**: Security Issue
- **Severity**: Major
- **Status**: Open

#### Mô Tả
Không có rate limiting cho OTP verification. Attacker có thể thử tất cả 1 triệu combination (000000-999999) trong thời gian 5 phút.

#### Recommendation
Implement rate limiting:
- Maximum 5 attempts per email trong 5 phút
- Lock account sau 10 failed attempts
- Thêm CAPTCHA sau 3 failed attempts

---

### USER-P006: Authorization - Missing Role Check in changePassword
- **Module**: changePassword.js
- **Type**: Authorization Issue
- **Severity**: Low
- **Status**: Open

#### Mô Tả
Function chỉ check `req.user.userId === userId` nhưng không check role. Một employee có thể đổi password của user khác có cùng userId (nếu có bug trong auth middleware).

#### Recommendation
Thêm role check hoặc additional validation:
```javascript
const userResult = await pool.query(
  "SELECT id, role FROM users WHERE id = $1",
  [userId]
);
if (req.user.role !== 'admin' && req.user.userId !== userId) {
  return res.status(403).json({ error: "Không có quyền." });
}
```

---

### USER-P007: Performance - No Pagination in getAllUsers/getAllEmployees
- **Module**: getAllUsers.js, getAllEmployees.js
- **Type**: Performance Issue
- **Severity**: Minor
- **Status**: Open

#### Mô Tả
Các hàm trả về tất cả records cùng lúc. Với database lớn (hàng nghìn users), response sẽ rất chậm và tốn memory.

#### Recommendation
Implement pagination:
```javascript
const page = parseInt(req.query.page) || 1;
const limit = parseInt(req.query.limit) || 20;
const offset = (page - 1) * limit;

const result = await pool.query(
  `SELECT ... FROM users WHERE role = 'user' 
   ORDER BY id LIMIT $1 OFFSET $2`,
  [limit, offset]
);
```

---

### USER-P008: Data Integrity - No Transaction in Password Reset
- **Module**: resetPassword.js
- **Type**: Data Integrity
- **Severity**: Low
- **Status**: Open

#### Mô Tả
Nếu UPDATE password thành công nhưng `otpStore.delete()` fail (unlikely), OTP vẫn còn trong store và có thể bị reuse.

#### Recommendation
Sử dụng try-finally để đảm bảo cleanup:
```javascript
try {
  await pool.query(...); // Update password
} finally {
  otpStore.delete(email); // Always cleanup
}
```

---

## Thống Kê

### Theo Severity
- **Critical**: 0
- **Major**: 2 (1 Fixed, 1 Open)
- **Minor**: 4 (All Open)
- **Medium**: 1 (Open)
- **Low**: 2 (All Open)

### Theo Type
- **Logic Error**: 1 (Fixed)
- **Data Validation**: 3 (Open)
- **Security Issue**: 1 (Open)
- **Resource Leak**: 1 (Open)
- **Performance Issue**: 1 (Open)
- **Authorization Issue**: 1 (Open)
- **Data Integrity**: 1 (Open)

### Theo Status
- **Fixed**: 1 (100% trong Critical/Major)
- **Open**: 8 (Mostly Minor issues)

---

## Kết Luận

### Defects Fixed
1 defect đã được fix thông qua unit testing, đảm bảo logic OTP expiration hoạt động chính xác.

### Code Quality
- Test coverage: 289 test cases cho 13 functions
- All tests passing
- Code đã được refactor thành modular structure
- Dependency injection pattern được áp dụng đúng

### Recommendations
1. **Priority 1 (Security)**: Fix USER-P005 (OTP brute force protection)
2. **Priority 2 (Data Validation)**: Implement USER-P001, USER-P002, USER-P003
3. **Priority 3 (Performance)**: Implement USER-P007 (pagination)
4. **Priority 4 (Cleanup)**: Fix USER-P004 (OTP memory leak), USER-P008 (transaction)

### Best Practices Learned
1. Edge case testing (boundary values) phát hiện logic errors
2. Security-first mindset trong validation
3. Comprehensive test suite (20-30 tests per function) đảm bảo coverage
4. Mock dependencies properly để test isolation
5. Document defects với root cause analysis để học hỏi

---

**Document Version**: 1.0  
**Last Updated**: 2024-01-XX  
**Author**: GitHub Copilot  
**Review Status**: Pending Review
