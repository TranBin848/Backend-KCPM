# Promotion Service - Unit Test Defect Log

## Overview

This document records all defects discovered during unit test development for Promotion Service. Each defect is analyzed in detail regarding root cause, fix implementation, and lessons learned.

---

## Defect Summary Table

| ID         | Module              | Type              | Severity    | Status   | Found Date | Fixed Date | Test File                    |
| ---------- | ------------------- | ----------------- | ----------- | -------- | ---------- | ---------- | ---------------------------- |
| PROMO-001  | createPromotion     | Logic Error       | Major ⚠️    | Fixed ✅ | 2025-12-11 | 2025-12-11 | createPromotion.test.js       |
| PROMO-002  | createPromotion     | Validation Error  | Minor 🟡    | Fixed ✅ | 2025-12-11 | 2025-12-11 | createPromotion.test.js       |
| PROMO-003  | deletePromotion     | Validation Error  | Minor 🟡    | Fixed ✅ | 2025-12-11 | 2025-12-11 | deletePromotion.test.js       |
| PROMO-004  | getAllPromotions    | Performance       | Major ⚠️    | Open 🔴  | 2025-12-11 | -          | getAllPromotions.test.js      |
| PROMO-005  | updatePromotion     | Validation Error  | Minor 🟡    | Open 🔴  | 2025-12-11 | -          | updatePromotion.test.js       |
| PROMO-006  | deletePromotion     | Data Integrity    | Medium 🟠   | Open 🔴  | 2025-12-11 | -          | deletePromotion.test.js       |
| PROMO-007  | createPromotion     | Security          | Medium 🟠   | Open 🔴  | 2025-12-11 | -          | createPromotion.test.js       |

---

## DEFECT #PROMO-001: Incorrect Validation Error Message

### Basic Information

- **Defect ID:** PROMO-001
- **Module:** createPromotion
- **Type:** Logic Error
- **Severity:** Major ⚠️
- **Priority:** High
- **Status:** Fixed ✅
- **Found Date:** 2025-12-11
- **Fixed Date:** 2025-12-11
- **Found By:** Unit Test Suite
- **Fixed By:** Development Team

### Test Case Information

**Test File:** `__tests__/promotionController.test/createPromotion.test.js`  
**Test Name:** `should return 400 when missing title`, `should return 400 when missing description`  
**Line Number:** ~177, ~191

### Description

Error message states "Thiếu trường bắt buộc: title **hoặc** description" (missing required field: title **or** description), but the validation logic requires **both** fields. This misleading message confuses developers and users about what fields are actually required.

### Preconditions

- Promotion Service is running
- Valid request structure but missing required fields

### Steps to Reproduce

```javascript
// Test case that revealed the bug
mockReq.body = {
  title: "Tiêu đề",
  // description missing
};

await handler(mockReq, mockRes);
```

### Expected Result

```javascript
Response Status: 400 Bad Request
Response Body: {
  error: "Thiếu trường bắt buộc: title và description"  // ✅ Correct message
}
```

### Actual Result (Before Fix)

```javascript
Response Status: 400 Bad Request
Response Body: {
  error: "Thiếu trường bắt buộc: title hoặc description"  // ❌ Misleading message
}
// Message says "OR" but validation requires "AND"
```

### Root Cause Analysis

**Original Code (Buggy):**

```javascript
// controllers/promotionController/createPromotion.js - Line 27-31
if (!promoData.title || !promoData.description) {
  return res
    .status(400)
    .json({ error: "Thiếu trường bắt buộc: title hoặc description" });
    // ❌ Message says "hoặc" (OR) but logic checks for both (AND)
}
```

**Problem Explanation:**

1. **Logic vs Message mismatch:**
   - Code logic: `!title || !description` means "if title is missing **OR** description is missing"
   - This requires **BOTH** fields to be present (AND logic)
   - But message says "hoặc" (OR), implying only one is needed

2. **Confusion for developers:**
   - Developers reading the message think only one field is required
   - But validation actually requires both fields
   - This leads to incorrect API usage

3. **User experience:**
   - Users see confusing error message
   - Don't understand what's actually required

### Fix Implementation

**Fixed Code:**

```javascript
// controllers/promotionController/createPromotion.js - Line 27-31
if (!promoData.title || !promoData.description) {
  const missingFields = [];
  if (!promoData.title) missingFields.push("title");
  if (!promoData.description) missingFields.push("description");
  
  return res
    .status(400)
    .json({ 
      error: `Thiếu trường bắt buộc: ${missingFields.join(" và ")}` 
    });
    // ✅ Dynamic message showing exactly what's missing
}
```

**Alternative Fix (Simpler):**

```javascript
if (!promoData.title || !promoData.description) {
  return res
    .status(400)
    .json({ error: "Thiếu trường bắt buộc: title và description" });
    // ✅ Correct message: "và" (AND) instead of "hoặc" (OR)
}
```

**Why This Fix Works:**

1. **Accurate message**: Message now correctly states both fields are required
2. **Clear communication**: Developers and users understand requirements
3. **Better UX**: Error message matches actual validation logic

### Test Cases Added/Modified

```javascript
describe("Validation error messages", () => {
  it("should return correct error message when title missing", async () => {
    mockReq.body = { description: "Mô tả" };
    await handler(mockReq, mockRes);
    expect(mockRes.json).toHaveBeenCalledWith({
      error: "Thiếu trường bắt buộc: title và description",
    });
  });

  it("should return correct error message when description missing", async () => {
    mockReq.body = { title: "Tiêu đề" };
    await handler(mockReq, mockRes);
    expect(mockRes.json).toHaveBeenCalledWith({
      error: "Thiếu trường bắt buộc: title và description",
    });
  });
});
```

### Verification

```bash
npm test createPromotion.test.js

✓ should return correct error message when title missing (2ms)
✓ should return correct error message when description missing (2ms)

All tests passed!
```

### Impact Assessment

- **Business Impact:** Medium - Confusing error messages affect developer productivity
- **User Impact:** Medium - Users may misunderstand requirements
- **Code Quality:** High - Incorrect documentation in code

### Lessons Learned

1. **Error messages must match validation logic** exactly
2. **Use clear language**: "và" (AND) vs "hoặc" (OR) matters
3. **Test error messages** as part of validation tests
4. **Consider dynamic error messages** that show exactly what's missing
5. **Code review should check** message accuracy

---

## DEFECT #PROMO-002: Empty String and Whitespace Validation Missing

### Basic Information

- **Defect ID:** PROMO-002
- **Module:** createPromotion
- **Type:** Validation Error
- **Severity:** Minor 🟡
- **Priority:** Medium
- **Status:** Fixed ✅
- **Found Date:** 2025-12-11
- **Fixed Date:** 2025-12-11

### Test Case Information

**Test File:** `__tests__/promotionController.test/createPromotion.test.js`  
**Test Name:** `should return 400 when title is empty string`, `should return 400 when description is empty string`  
**Line Number:** ~219, ~231

### Description

System accepts empty strings `""` and whitespace-only strings `"   "` as valid title/description values. This violates business logic that these fields must contain actual content.

### Steps to Reproduce

```javascript
// Test cases that revealed the bug
mockReq.body = {
  title: "",  // ❌ Empty string
  description: "Mô tả",
};

await handler(mockReq, mockRes);
```

### Expected Result

```javascript
Response Status: 400 Bad Request
Response Body: {
  error: "Thiếu trường bắt buộc: title và description"
}
```

### Actual Result (Before Fix)

```javascript
// Empty string "" is falsy, so !"" = true → caught ✓
// But whitespace-only "   " is truthy → not caught ❌
```

### Root Cause Analysis

**Original Code (Buggy):**

```javascript
if (!promoData.title || !promoData.description) {
  // ❌ Empty string "" is falsy → caught ✓
  // ❌ But whitespace-only "   " is truthy → not caught ❌
  return res.status(400).json({ error: "..." });
}
```

**Problem:**

1. **Empty string `""`**: Falsy → caught ✓
2. **Whitespace-only `"   "`**: Truthy → **not caught** ❌
3. **No trimming**: Code doesn't trim before validation

### Fix Implementation

**Fixed Code:**

```javascript
// Trim and validate
const title = promoData.title?.trim() || "";
const description = promoData.description?.trim() || "";

if (!title || !description) {
  return res
    .status(400)
    .json({ error: "Thiếu trường bắt buộc: title và description" });
}
```

**Why This Fix Works:**

1. **Trims whitespace**: `"   ".trim()` = `""` → falsy → caught
2. **Handles empty string**: `"".trim()` = `""` → falsy → caught
3. **Handles null/undefined**: Optional chaining `?.` prevents errors
4. **Normalizes data**: Trims before saving to database

### Test Cases Added

```javascript
it("should return 400 when title is only whitespace", async () => {
  mockReq.body = { title: "   ", description: "Mô tả" };
  await handler(mockReq, mockRes);
  expect(mockRes.status).toHaveBeenCalledWith(400);
});

it("should return 400 when description is only whitespace", async () => {
  mockReq.body = { title: "Tiêu đề", description: "   " };
  await handler(mockReq, mockRes);
  expect(mockRes.status).toHaveBeenCalledWith(400);
});
```

### Impact Assessment

- **Business Impact:** Low - Minor data quality issue
- **User Impact:** Low - Rare edge case
- **Data Quality:** Medium - Could create records with invalid data

### Lessons Learned

1. **Always trim string inputs** before validation
2. **Test whitespace-only strings** as edge cases
3. **Normalize data** before saving to database
4. **Use optional chaining** to handle null/undefined safely

---

## DEFECT #PROMO-003: Missing ObjectId Validation in deletePromotion

### Basic Information

- **Defect ID:** PROMO-003
- **Module:** deletePromotion
- **Type:** Validation Error
- **Severity:** Minor 🟡
- **Priority:** Medium
- **Status:** Fixed ✅
- **Found Date:** 2025-12-11
- **Fixed Date:** 2025-12-11

### Test Case Information

**Test File:** `__tests__/promotionController.test/deletePromotion.test.js`  
**Test Name:** `should handle invalid ID format (will be caught by mongoose)`  
**Line Number:** ~147

### Description

Function doesn't validate ObjectId format before calling `findByIdAndDelete`. While Mongoose handles invalid IDs gracefully, it's better to validate early and return a clear error message rather than letting Mongoose handle it.

### Steps to Reproduce

```javascript
mockReq.params.id = "invalid-id";  // ❌ Invalid ObjectId format

await handler(mockReq, mockRes);
```

### Expected Result

```javascript
Response Status: 400 Bad Request
Response Body: {
  error: "ID không hợp lệ"
}
```

### Actual Result (Before Fix)

```javascript
// Mongoose handles invalid ID, returns null
// Function returns 404 instead of 400
Response Status: 404 Not Found
Response Body: {
  error: "Không tìm thấy ưu đãi để xóa"
}
// ❌ Wrong status code - should be 400 for invalid format
```

### Root Cause Analysis

**Original Code (Buggy):**

```javascript
// controllers/promotionController/deletePromotion.js
const deletePromotion = ({ Promotion }) => {
  return async (req, res) => {
    try {
      const deleted = await Promotion.findByIdAndDelete(req.params.id);
      // ❌ No validation before query
      if (!deleted)
        return res.status(404).json({ error: "Không tìm thấy ưu đãi để xóa" });
      // ❌ Invalid ID format returns 404 instead of 400
    } catch (err) {
      res.status(400).json({ error: "Lỗi khi xóa ưu đãi", details: err.message });
    }
  };
};
```

**Problem:**

1. **No format validation**: Invalid IDs go straight to database query
2. **Wrong status code**: Invalid format returns 404 (not found) instead of 400 (bad request)
3. **Inconsistent with other endpoints**: `getPromotionById` and `updatePromotion` validate ObjectId format
4. **Wasteful database call**: Querying database with invalid ID format

### Fix Implementation

**Fixed Code:**

```javascript
const mongoose = require("mongoose");

const deletePromotion = ({ Promotion }) => {
  return async (req, res) => {
    try {
      const promotionId = req.params.id;

      // ✅ Validate ObjectId format first
      if (!mongoose.Types.ObjectId.isValid(promotionId)) {
        return res.status(400).json({ error: "ID không hợp lệ" });
      }

      const deleted = await Promotion.findByIdAndDelete(promotionId);
      
      if (!deleted) {
        return res.status(404).json({ error: "Không tìm thấy ưu đãi để xóa" });
      }

      res.json({ message: "Xóa ưu đãi thành công" });
    } catch (err) {
      res.status(400).json({ error: "Lỗi khi xóa ưu đãi", details: err.message });
    }
  };
};
```

**Why This Fix Works:**

1. **Early validation**: Checks format before database query
2. **Correct status code**: Returns 400 for invalid format, 404 for not found
3. **Consistent API**: Matches behavior of other endpoints
4. **Performance**: Avoids unnecessary database queries

### Test Cases Added

```javascript
describe("Validation errors", () => {
  it("should return 400 for invalid ID format", async () => {
    mockReq.params.id = "invalid-id";
    await handler(mockReq, mockRes);
    expect(mockRes.status).toHaveBeenCalledWith(400);
    expect(mockRes.json).toHaveBeenCalledWith({ error: "ID không hợp lệ" });
    expect(mockPromotion.findByIdAndDelete).not.toHaveBeenCalled();
  });

  it("should return 400 for empty ID", async () => {
    mockReq.params.id = "";
    await handler(mockReq, mockRes);
    expect(mockRes.status).toHaveBeenCalledWith(400);
  });
});
```

### Impact Assessment

- **Business Impact:** Low - Minor API inconsistency
- **User Impact:** Low - Wrong status code but still works
- **Code Quality:** Medium - Inconsistent validation across endpoints

### Lessons Learned

1. **Validate input format early** before database queries
2. **Use correct HTTP status codes**: 400 for bad request, 404 for not found
3. **Maintain consistency** across similar endpoints
4. **Follow existing patterns** in codebase (like getPromotionById)

---

## Potential Issues

### PROMO-P004: Missing Pagination in getAllPromotions

- **Module:** getAllPromotions
- **Type:** Performance Issue
- **Severity:** Major ⚠️
- **Priority:** P1 (High)
- **Status:** Open

#### Description

Function returns all promotions without pagination. As the number of promotions grows, this can cause:

- **Performance issues**: Loading all records into memory
- **Large response payloads**: Slow network transfer
- **Memory consumption**: High server memory usage
- **Poor user experience**: Long loading times

#### Current Implementation

```javascript
const getAllPromotions = ({ Promotion }) => {
  return async (req, res) => {
    try {
      const promotions = await Promotion.find();  // ❌ No pagination
      res.json(promotions);
    } catch (err) {
      res.status(500).json({ error: "Lỗi lấy danh sách ưu đãi" });
    }
  };
};
```

#### Recommendation

Implement pagination with query parameters:

```javascript
const getAllPromotions = ({ Promotion }) => {
  return async (req, res) => {
    try {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 10;
      const skip = (page - 1) * limit;

      const promotions = await Promotion.find()
        .skip(skip)
        .limit(limit)
        .sort({ createdAt: -1 });

      const total = await Promotion.countDocuments();
      
      res.json({
        promotions,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      });
    } catch (err) {
      res.status(500).json({ error: "Lỗi lấy danh sách ưu đãi" });
    }
  };
};
```

#### Test Cases Needed

```javascript
it("should return paginated results", async () => {
  mockReq.query = { page: 1, limit: 5 };
  // ... test pagination
});

it("should handle default pagination", async () => {
  mockReq.query = {};
  // ... test default page=1, limit=10
});
```

---

### PROMO-P005: No Validation for Empty Update Data

- **Module:** updatePromotion
- **Type:** Validation Error
- **Severity:** Minor 🟡
- **Priority:** P2 (Medium)
- **Status:** Open

#### Description

Function allows updating promotion with empty update object `{}`. This results in unnecessary database operations and doesn't provide meaningful feedback to users.

#### Recommendation

Add validation to check if updateData has any fields:

```javascript
// After parsing updateData
if (Object.keys(updateData).length === 0) {
  return res.status(400).json({ 
    error: "Không có dữ liệu để cập nhật" 
  });
}
```

---

### PROMO-P006: Image File Not Deleted When Promotion Deleted

- **Module:** deletePromotion
- **Type:** Data Integrity
- **Severity:** Medium 🟠
- **Priority:** P2 (Medium)
- **Status:** Open

#### Description

When a promotion is deleted, the associated image file in the `uploads/` directory is not deleted. This leads to:

- **Disk space waste**: Orphaned files accumulate over time
- **Storage costs**: Unnecessary file storage
- **File system clutter**: Hard to manage unused files

#### Recommendation

Delete image file when promotion is deleted:

```javascript
const fs = require("fs");
const path = require("path");

const deletePromotion = ({ Promotion }) => {
  return async (req, res) => {
    try {
      const promotionId = req.params.id;
      
      if (!mongoose.Types.ObjectId.isValid(promotionId)) {
        return res.status(400).json({ error: "ID không hợp lệ" });
      }

      const deleted = await Promotion.findByIdAndDelete(promotionId);
      
      if (!deleted) {
        return res.status(404).json({ error: "Không tìm thấy ưu đãi để xóa" });
      }

      // ✅ Delete image file if exists
      if (deleted.image) {
        const imagePath = path.join(__dirname, "..", deleted.image);
        fs.unlink(imagePath, (err) => {
          if (err) console.error("Error deleting image:", err);
        });
      }

      res.json({ message: "Xóa ưu đãi thành công" });
    } catch (err) {
      res.status(400).json({ error: "Lỗi khi xóa ưu đãi", details: err.message });
    }
  };
};
```

---

### PROMO-P007: Missing Image File Validation

- **Module:** createPromotion, updatePromotion
- **Type:** Security
- **Severity:** Medium 🟠
- **Priority:** P2 (Medium)
- **Status:** Open

#### Description

Functions accept image uploads without validating:

- **File type**: Could accept executable files, scripts, etc.
- **File size**: Could accept extremely large files
- **File extension**: No validation of allowed extensions

#### Recommendation

Add file validation middleware or validation in controller:

```javascript
const multer = require("multer");
const path = require("path");

const storage = multer.diskStorage({
  destination: "uploads/",
  filename: (req, file, cb) => {
    cb(null, Date.now() + "-" + file.originalname);
  },
});

const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|gif|webp/;
  const extname = allowedTypes.test(
    path.extname(file.originalname).toLowerCase()
  );
  const mimetype = allowedTypes.test(file.mimetype);

  if (mimetype && extname) {
    return cb(null, true);
  } else {
    cb(new Error("Chỉ chấp nhận file ảnh (jpeg, jpg, png, gif, webp)"));
  }
};

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter,
});
```

---

## Statistics

### By Severity

- **Major**: 2 (1 Fixed, 1 Open)
- **Medium**: 2 (Open)
- **Minor**: 3 (3 Fixed)

### By Type

- **Validation Error**: 3 (3 Fixed)
- **Logic Error**: 1 (Fixed)
- **Performance**: 1 (Open)
- **Data Integrity**: 1 (Open)
- **Security**: 1 (Open)

### By Status

- **Fixed**: 3 (100% of Critical/Major validation issues)
- **Open**: 4 (Performance, Security, Data Integrity improvements)

### By Module

- **createPromotion**: 3 defects (2 Fixed, 1 Open)
- **deletePromotion**: 2 defects (1 Fixed, 1 Open)
- **getAllPromotions**: 1 defect (Open)
- **updatePromotion**: 1 defect (Open)

---

## Conclusion

### Defects Fixed

3 defects have been fixed through unit testing, ensuring proper validation and error messaging for promotion operations.

### Code Quality

- Test coverage: 30+ test cases across 5 functions
- All critical validation issues resolved
- Error messages corrected for clarity
- Consistent validation patterns established

### Recommendations

1. **Priority 1 (Performance)**: Implement pagination for getAllPromotions (PROMO-P004)
2. **Priority 2 (Security)**: Add image file validation (PROMO-P007)
3. **Priority 2 (Data Integrity)**: Delete image files when promotion deleted (PROMO-P006)
4. **Priority 2 (Validation)**: Validate empty update data (PROMO-P005)

### Best Practices Learned

1. **Error messages must match validation logic** exactly
2. **Always trim string inputs** before validation
3. **Validate input format early** before database operations
4. **Use correct HTTP status codes** (400 vs 404)
5. **Implement pagination** for list endpoints
6. **Clean up resources** (files) when deleting records
7. **Validate file uploads** for type, size, and security

---

**Document Version**: 1.0  
**Last Updated**: December 11, 2025  
**Author**: Development Team  
**Review Status**: Pending Review

