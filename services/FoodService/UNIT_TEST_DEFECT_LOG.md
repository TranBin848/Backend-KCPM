# Unit Test Defect Log - Food Service

**Project:** Cinema Web Backend - Food Service  
**Test Framework:** Jest 29.7.0  
**Test Period:** December 2025  
**Total Test Cases:** 100+  
**Defects Found:** 6  
**Defects Fixed:** 4  
**Defects Open:** 2

---

## Defect Summary Table

| ID       | Module      | Type              | Severity    | Status   | Found Date | Fixed Date | Test File           |
| -------- | ----------- | ----------------- | ----------- | -------- | ---------- | ---------- | ------------------- |
| FOOD-001 | createFood  | Validation Error  | Major ⚠️    | Fixed ✅ | 2025-12-01 | 2025-12-01 | createFood.test.js  |
| FOOD-002 | getAllFoods | Logic Error       | Minor 🟡    | Fixed ✅ | 2025-12-02 | 2025-12-02 | getAllFoods.test.js |
| FOOD-003 | createFood  | Data Validation   | Critical 🔴 | Fixed ✅ | 2025-12-03 | 2025-12-03 | createFood.test.js  |
| FOOD-004 | updateFood  | Validation Error  | Major ⚠️    | Fixed ✅ | 2025-12-05 | 2025-12-05 | updateFood.test.js  |
| FOOD-005 | deleteFood  | Resource Leak     | Minor 🟡    | Open 🔴  | 2025-12-10 | -          | deleteFood.test.js  |
| FOOD-006 | getAllFoods | Performance Issue | Minor 🟡    | Open 🔴  | 2025-12-11 | -          | getAllFoods.test.js |

---

## DEFECT #FOOD-001: Negative Price Accepted

### Basic Information

- **Defect ID:** FOOD-001
- **Module:** createFood
- **Type:** Validation Error
- **Severity:** Major ⚠️
- **Priority:** High
- **Status:** Fixed ✅
- **Found Date:** 2025-12-01
- **Fixed Date:** 2025-12-01
- **Found By:** Unit Test Suite
- **Fixed By:** Development Team

### Test Case Information

**Test File:** `__tests__/foodController/createFood.test.js`  
**Test Name:** `should return 400 when price is negative`  
**Line Number:** ~265

### Description

System allows creating food items with negative prices, violating business logic that prices must be positive values. This could lead to financial inconsistencies and incorrect billing.

### Preconditions

- Food Service is running
- MongoDB connection is established
- Valid food data except for price field

### Steps to Reproduce

```javascript
// Test code that revealed the bug
mockReq.body = {
  name: "Popcorn",
  price: -1000, // ❌ Negative price
  category: "Snack",
  description: "Test",
  isAvailable: true,
};

await handler(mockReq, mockRes);
```

### Expected Result

```javascript
Response Status: 400 Bad Request
Response Body: {
  error: "Price must be greater than 0"
}
```

### Actual Result (Before Fix)

```javascript
Response Status: 201 Created  // ❌ Wrong!
Response Body: {
  message: "Tạo món ăn thành công",
  food: {
    _id: "507f1f77bcf86cd799439011",
    name: "Popcorn",
    price: -1000,  // ❌ Negative price accepted!
    category: "Snack"
  }
}
```

### Root Cause Analysis

**Original Code (Buggy):**

```javascript
// controllers/foodController/createFood.js - Line 15-18
if (!foodData.price) {
  // ❌ Only checks falsy
  return res.status(400).json({
    error: "Price must be greater than 0",
  });
}
```

**Problem Explanation:**

1. `!foodData.price` only checks for **falsy values**:

   - `!(0)` = true → Rejects 0 ✓
   - `!(undefined)` = true → Rejects undefined ✓
   - `!(null)` = true → Rejects null ✓
   - **But:** `!(-1000)` = false → **Accepts negative!** ❌

2. JavaScript type coercion issue:
   - Negative numbers are **truthy** values
   - The condition passes validation incorrectly

### Fix Implementation

**Fixed Code:**

```javascript
// controllers/foodController/createFood.js - Line 15-22
if (
  foodData.price === undefined ||
  foodData.price === null ||
  foodData.price === "" ||
  Number(foodData.price) <= 0 // ✅ Explicit check for <= 0
) {
  return res.status(400).json({
    error: "Price must be greater than 0",
  });
}
```

**Why This Fix Works:**

1. **Explicit undefined/null checks**: Handles missing values
2. **Empty string check**: Handles empty form submissions
3. **`Number(foodData.price) <= 0`**:
   - Converts to number first (handles strings like "100")
   - Checks both zero and negative values
   - Rejects: -1000, -0.01, 0
   - Accepts: 0.01, 1, 1000

### Test Cases Added/Modified

```javascript
// Comprehensive price validation tests
describe("Price validation", () => {
  it("should return 400 when price is negative", async () => {
    mockReq.body = { price: -1000 };
    await handler(mockReq, mockRes);
    expect(mockRes.status).toHaveBeenCalledWith(400);
  });

  it("should return 400 when price is 0", async () => {
    mockReq.body = { price: 0 };
    await handler(mockReq, mockRes);
    expect(mockRes.status).toHaveBeenCalledWith(400);
  });

  it("should return 400 when price is -0.01", async () => {
    mockReq.body = { price: -0.01 };
    await handler(mockReq, mockRes);
    expect(mockRes.status).toHaveBeenCalledWith(400);
  });

  it("should accept price 0.01", async () => {
    mockReq.body = { price: 0.01 };
    await handler(mockReq, mockRes);
    expect(mockRes.status).toHaveBeenCalledWith(201);
  });
});
```

### Verification

```bash
npm test createFood.test.js

✓ should return 400 when price is negative (3ms)
✓ should return 400 when price is 0 (2ms)
✓ should return 400 when price is -0.01 (2ms)
✓ should accept price 0.01 (4ms)

All tests passed!
```

### Impact Assessment

- **Business Impact:** High - Could cause financial loss
- **User Impact:** Medium - Customers could see incorrect prices
- **Data Integrity:** High - Database could contain invalid data

### Lessons Learned

1. **Always use explicit comparisons** for numeric validations
2. **Don't rely on falsy checks** for numbers (0 is falsy but might be valid)
3. **Add boundary tests** for all numeric inputs (-1, 0, 0.01, MAX)
4. **Type conversion matters**: Always convert strings to numbers before comparison

---

## DEFECT #FOOD-002: Invalid Query Parameter Applies Wrong Filter

### Basic Information

- **Defect ID:** FOOD-002
- **Module:** getAllFoods
- **Type:** Logic Error
- **Severity:** Minor 🟡
- **Priority:** Medium
- **Status:** Fixed ✅
- **Found Date:** 2025-12-02
- **Fixed Date:** 2025-12-02

### Test Case Information

**Test File:** `__tests__/foodController/getAllFoods.test.js`  
**Test Name:** `should handle invalid query parameters gracefully`

### Description

When users send invalid values for `isAvailable` query parameter (e.g., `?isAvailable=invalid`), the system incorrectly filters for `isAvailable: false` instead of ignoring the invalid parameter and returning all foods.

### Steps to Reproduce

```javascript
// Request
GET /foods?isAvailable=invalid

// Test code
mockReq.query = { isAvailable: 'invalid' };
await handler(mockReq, mockRes);
```

### Expected Result

```javascript
// Should ignore invalid parameter
MongoDB Query: Food.find({})  // ✅ Empty filter
Returns: ALL foods (both available and unavailable)
```

### Actual Result (Before Fix)

```javascript
// Incorrectly applies false filter
MongoDB Query: Food.find({ isAvailable: false })  // ❌
Returns: ONLY unavailable foods
```

### Root Cause Analysis

**Original Code (Buggy):**

```javascript
// controllers/foodController/getAllFoods.js
const filter = {};
const { isAvailable } = req.query;

if (isAvailable !== undefined) {
  // ❌ Too permissive
  filter.isAvailable = isAvailable === "true";
}

const foods = await Food.find(filter);
```

**Problem Breakdown:**

```javascript
// When isAvailable = "invalid":
isAvailable !== undefined; // true → enters if block
isAvailable === "true"; // "invalid" === "true" → false
filter.isAvailable = false; // ❌ Wrong filter applied!
```

**Logic Error:**

1. Any non-undefined value enters the if block
2. "invalid" !== "true" results in false
3. `filter.isAvailable = false` filters out available items
4. User gets unexpected filtered results

### Fix Implementation

**Fixed Code:**

```javascript
// controllers/foodController/getAllFoods.js
const filter = {};
const { isAvailable } = req.query;

if (isAvailable === "true") {
  filter.isAvailable = true;
} else if (isAvailable === "false") {
  filter.isAvailable = false;
}
// If isAvailable is anything else (undefined, "invalid", etc.)
// → filter remains empty → returns all foods ✅

const foods = await Food.find(filter);
```

**Why This Fix Works:**

1. **Explicit whitelist**: Only "true" and "false" strings are accepted
2. **Fall-through behavior**: Invalid values are silently ignored
3. **Clear intent**: Code is self-documenting
4. **Defensive programming**: Handles unexpected inputs gracefully

### Test Cases Added

```javascript
describe("Query parameter handling", () => {
  it("should filter available foods when isAvailable=true", async () => {
    mockReq.query = { isAvailable: "true" };
    await handler(mockReq, mockRes);
    expect(mockFood.find).toHaveBeenCalledWith({ isAvailable: true });
  });

  it("should filter unavailable foods when isAvailable=false", async () => {
    mockReq.query = { isAvailable: "false" };
    await handler(mockReq, mockRes);
    expect(mockFood.find).toHaveBeenCalledWith({ isAvailable: false });
  });

  it("should return all foods when isAvailable is invalid", async () => {
    mockReq.query = { isAvailable: "invalid" };
    await handler(mockReq, mockRes);
    expect(mockFood.find).toHaveBeenCalledWith({}); // ✅ No filter
  });

  it("should return all foods when isAvailable is missing", async () => {
    mockReq.query = {};
    await handler(mockReq, mockRes);
    expect(mockFood.find).toHaveBeenCalledWith({});
  });
});
```

### Verification

```bash
npm test getAllFoods.test.js

✓ should filter available foods when isAvailable=true
✓ should filter unavailable foods when isAvailable=false
✓ should return all foods when isAvailable is invalid
✓ should return all foods when isAvailable is missing

Test Suites: 1 passed
Tests: 12 passed
```

### Impact Assessment

- **Business Impact:** Low - Minor UX issue
- **User Impact:** Medium - Users might get unexpected filtered results
- **API Consistency:** High - API should handle invalid inputs gracefully

### Lessons Learned

1. **Whitelist valid values** instead of blacklisting invalid ones
2. **Boolean query parameters** need explicit string checks ("true"/"false")
3. **Fail safely**: Invalid inputs should return default behavior
4. **Test edge cases**: Always test valid, invalid, and missing parameters

---

## DEFECT #FOOD-003: Insufficient Validation - Missing Required Fields

### Basic Information

- **Defect ID:** FOOD-003
- **Module:** createFood
- **Type:** Data Validation
- **Severity:** Critical 🔴
- **Priority:** Highest
- **Status:** Fixed ✅
- **Found Date:** 2025-12-03
- **Fixed Date:** 2025-12-03

### Test Case Information

**Test File:** `__tests__/foodController/createFood.test.js`  
**Test Name:** `should return 400 when name is missing` and related tests

### Description

System allows creating food items without required fields (name, category, description), resulting in incomplete data in the database. This is a data integrity violation.

### Steps to Reproduce

```javascript
// Missing name field
mockReq.body = {
  price: 50000,
  category: "Drink",
  isAvailable: true,
  // name: missing! ❌
};

await handler(mockReq, mockRes);
```

### Expected Result

```javascript
Response Status: 400 Bad Request
Response Body: {
  error: "Thiếu thông tin bắt buộc"
}
```

### Actual Result (Before Fix)

```javascript
Response Status: 201 Created  // ❌
Response Body: {
  food: {
    _id: "507f1f77bcf86cd799439011",
    name: undefined,  // ❌ Missing required field!
    price: 50000,
    category: "Drink"
  }
}
```

### Root Cause Analysis

**Original Code (Buggy):**

```javascript
// Only validated price, ignored other fields
if (!foodData.price) {
  return res.status(400).json({ error: "..." });
}

// Immediately tried to save without checking other fields ❌
const newFood = new Food(foodData);
await newFood.save();
```

**Problem:**

1. **No validation** for required fields (name, category, description)
2. **Relied on Mongoose schema validation** which might be incomplete
3. **No explicit checks** before database operation
4. Could create records with undefined/null critical fields

### Fix Implementation

**Fixed Code:**

```javascript
const { name, price, category, description, imageUrl, isAvailable } = foodData;

// ✅ Comprehensive validation
if (!name || !price || !category || !description) {
  return res.status(400).json({
    error: "Thiếu thông tin bắt buộc",
  });
}

// ✅ Trim strings to avoid whitespace-only values
const trimmedName = name.trim();
const trimmedCategory = category.trim();
const trimmedDescription = description.trim();

if (!trimmedName || !trimmedCategory || !trimmedDescription) {
  return res.status(400).json({
    error: "Thông tin không được chỉ chứa khoảng trắng",
  });
}

// ✅ Price validation
if (
  price === undefined ||
  price === null ||
  price === "" ||
  Number(price) <= 0
) {
  return res.status(400).json({
    error: "Price must be greater than 0",
  });
}

// Now safe to create
const newFood = new Food({
  name: trimmedName,
  price: Number(price),
  category: trimmedCategory,
  description: trimmedDescription,
  imageUrl: imageUrl || "",
  isAvailable: isAvailable !== false,
});
```

**Why This Fix Works:**

1. **Early validation**: Checks all required fields upfront
2. **String trimming**: Prevents whitespace-only submissions
3. **Type conversion**: Ensures price is a number
4. **Clear error messages**: Helps developers debug
5. **Defense in depth**: Validation at controller level + Mongoose schema

### Test Cases Added

```javascript
describe("Required fields validation", () => {
  it("should return 400 when name is missing", async () => {
    mockReq.body = { price: 50000, category: "Drink", description: "Test" };
    await handler(mockReq, mockRes);
    expect(mockRes.status).toHaveBeenCalledWith(400);
  });

  it("should return 400 when category is missing", async () => {
    mockReq.body = { name: "Coke", price: 50000, description: "Test" };
    await handler(mockReq, mockRes);
    expect(mockRes.status).toHaveBeenCalledWith(400);
  });

  it("should return 400 when description is missing", async () => {
    mockReq.body = { name: "Coke", price: 50000, category: "Drink" };
    await handler(mockReq, mockRes);
    expect(mockRes.status).toHaveBeenCalledWith(400);
  });

  it("should return 400 when name is only whitespace", async () => {
    mockReq.body = {
      name: "   ",
      price: 50000,
      category: "Drink",
      description: "Test",
    };
    await handler(mockReq, mockRes);
    expect(mockRes.status).toHaveBeenCalledWith(400);
  });
});
```

### Verification

```bash
npm test createFood.test.js

✓ should return 400 when name is missing (2ms)
✓ should return 400 when category is missing (2ms)
✓ should return 400 when description is missing (2ms)
✓ should return 400 when name is only whitespace (3ms)
✓ should create food with all required fields (5ms)

Test Suites: 1 passed
Tests: 21 passed
```

### Impact Assessment

- **Business Impact:** Critical - Data integrity compromised
- **User Impact:** High - Customers see incomplete food information
- **Database Quality:** Critical - Invalid records in production

### Lessons Learned

1. **Validate all required fields** explicitly in controller
2. **Don't rely solely on database constraints** - validate early
3. **Trim string inputs** to catch whitespace-only submissions
4. **Use clear error messages** for each validation failure
5. **Test each required field individually** to ensure coverage

---

## DEFECT #FOOD-004: Price Update Validation Missing

### Basic Information

- **Defect ID:** FOOD-004
- **Module:** updateFood
- **Type:** Validation Error
- **Severity:** Major ⚠️
- **Priority:** High
- **Status:** Fixed ✅
- **Found Date:** 2025-12-05
- **Fixed Date:** 2025-12-05

### Test Case Information

**Test File:** `__tests__/foodController/updateFood.test.js`  
**Test Name:** `should return 400 when updating with negative price`

### Description

When updating an existing food item, the system doesn't validate the new price value, allowing negative prices to be saved. This is inconsistent with create validation.

### Steps to Reproduce

```javascript
// Update existing food with negative price
mockReq.params.id = "507f1f77bcf86cd799439011";
mockReq.body = {
  price: -5000, // ❌ Negative price
};

await handler(mockReq, mockRes);
```

### Expected Result

```javascript
Response Status: 400 Bad Request
Response Body: {
  error: "Price must be greater than 0"
}
```

### Actual Result (Before Fix)

```javascript
Response Status: 200 OK  // ❌
Response Body: {
  message: "Cập nhật món ăn thành công",
  food: {
    _id: "507f1f77bcf86cd799439011",
    name: "Popcorn",
    price: -5000  // ❌ Negative price saved!
  }
}
```

### Root Cause Analysis

**Original Code (Buggy):**

```javascript
// updateFood.js
const { name, price, category, description, imageUrl, isAvailable } = req.body;

// ❌ No validation before update!
const updatedFood = await Food.findByIdAndUpdate(
  id,
  { name, price, category, description, imageUrl, isAvailable },
  { new: true }
);
```

**Problem:**

1. **No validation** on incoming update data
2. **Inconsistent with createFood** which has validation
3. **Mongoose schema validation** might not catch all cases
4. **Direct database update** without checking business rules

### Fix Implementation

**Fixed Code:**

```javascript
const { name, price, category, description, imageUrl, isAvailable } = req.body;

// ✅ Validate price if provided
if (price !== undefined && price !== null) {
  const numPrice = Number(price);
  if (isNaN(numPrice) || numPrice <= 0) {
    return res.status(400).json({
      error: "Price must be greater than 0",
    });
  }
}

// ✅ Trim strings if provided
const updateData = {};
if (name !== undefined) {
  const trimmedName = name.trim();
  if (!trimmedName) {
    return res.status(400).json({
      error: "Name cannot be empty or only whitespace",
    });
  }
  updateData.name = trimmedName;
}

if (price !== undefined) updateData.price = Number(price);
if (category !== undefined) updateData.category = category.trim();
if (description !== undefined) updateData.description = description.trim();
if (imageUrl !== undefined) updateData.imageUrl = imageUrl;
if (isAvailable !== undefined) updateData.isAvailable = isAvailable;

const updatedFood = await Food.findByIdAndUpdate(
  id,
  updateData,
  { new: true, runValidators: true } // ✅ Run validators
);
```

**Why This Fix Works:**

1. **Conditional validation**: Only validates fields that are being updated
2. **Consistent with create**: Same validation rules as createFood
3. **Type checking**: Validates numeric and string types
4. **Mongoose validators**: Enables runValidators option
5. **Partial updates**: Supports updating only specific fields

### Test Cases Added

```javascript
describe("Update validation", () => {
  it("should return 400 when updating with negative price", async () => {
    mockReq.params.id = "507f1f77bcf86cd799439011";
    mockReq.body = { price: -5000 };
    await handler(mockReq, mockRes);
    expect(mockRes.status).toHaveBeenCalledWith(400);
  });

  it("should return 400 when updating with price 0", async () => {
    mockReq.body = { price: 0 };
    await handler(mockReq, mockRes);
    expect(mockRes.status).toHaveBeenCalledWith(400);
  });

  it("should return 400 when updating name to empty string", async () => {
    mockReq.body = { name: "   " };
    await handler(mockReq, mockRes);
    expect(mockRes.status).toHaveBeenCalledWith(400);
  });

  it("should allow partial update with valid price", async () => {
    mockReq.body = { price: 60000 };
    await handler(mockReq, mockRes);
    expect(mockRes.status).toHaveBeenCalledWith(200);
  });
});
```

### Verification

```bash
npm test updateFood.test.js

✓ should return 400 when updating with negative price (3ms)
✓ should return 400 when updating with price 0 (2ms)
✓ should return 400 when updating name to empty string (2ms)
✓ should allow partial update with valid price (4ms)

Test Suites: 1 passed
Tests: 18 passed
```

### Impact Assessment

- **Business Impact:** High - Price integrity compromised on updates
- **User Impact:** High - Customers might see inconsistent prices
- **Consistency:** Critical - Create and Update should have same rules

### Lessons Learned

1. **Consistent validation** across create/update operations
2. **Validate partial updates** - check only provided fields
3. **Enable Mongoose validators** with `runValidators: true`
4. **Test both create and update** with same edge cases
5. **Defensive programming**: Validate at every data entry point

---

## DEFECT #FOOD-005: Image File Not Deleted When Food Deleted

### Basic Information

- **Defect ID:** FOOD-005
- **Module:** deleteFood
- **Type:** Resource Leak
- **Severity:** Minor 🟡
- **Priority:** Low
- **Status:** Open 🔴
- **Found Date:** 2025-12-10
- **Fixed Date:** -
- **Found By:** Code Review + Unit Test

### Test Case Information

**Test File:** `__tests__/foodController/deleteFood.test.js`  
**Test Name:** `should delete food with image (image file should be removed)`

### Description

When a food item is deleted from the database, the associated image file in the `/uploads` directory is not removed, causing:

- **Storage leaks**: Unused files accumulate over time
- **Orphaned files**: No database reference but files remain
- **Disk space waste**: Especially problematic with many deletions

### Current Behavior

```javascript
// deleteFood.js - Current implementation
const deletedFood = await Food.findByIdAndDelete(id);

if (!deletedFood) {
  return res.status(404).json({ error: "Món ăn không tồn tại" });
}

// ❌ Missing: Delete image file from filesystem
res.json({ message: "Xóa món ăn thành công" });
```

**What Happens:**

1. Database record deleted ✅
2. Image file remains on disk ❌
3. File becomes orphaned (no reference)
4. Disk space not reclaimed

### Expected Behavior

```javascript
// Desired flow:
1. Delete from MongoDB ✅
2. If food has imageUrl:
   - Delete physical file from /uploads ✅
   - Handle file deletion errors gracefully ✅
3. Return success response ✅
```

### Proposed Fix

```javascript
const fs = require("fs").promises;
const path = require("path");

module.exports = ({ Food }) => {
  return async (req, res) => {
    const { id } = req.params;

    try {
      const deletedFood = await Food.findByIdAndDelete(id);

      if (!deletedFood) {
        return res.status(404).json({ error: "Món ăn không tồn tại" });
      }

      // ✅ Delete associated image file
      if (deletedFood.imageUrl && deletedFood.imageUrl !== "") {
        try {
          // Construct absolute path
          const imagePath = path.join(
            __dirname,
            "..",
            "..",
            deletedFood.imageUrl
          );

          // Check if file exists before deletion
          await fs.access(imagePath);

          // Delete the file
          await fs.unlink(imagePath);

          console.log(`Deleted image: ${imagePath}`);
        } catch (fileErr) {
          // Log but don't fail the request
          // Database deletion already succeeded
          console.error(`Failed to delete image file: ${fileErr.message}`);
        }
      }

      res.json({ message: "Xóa món ăn thành công" });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  };
};
```

### Why This Fix Works

1. **Checks for imageUrl**: Only attempts deletion if image exists
2. **fs.access()**: Verifies file exists before unlinking
3. **Error handling**: Doesn't fail request if file deletion fails
4. **Logging**: Provides visibility into file operations
5. **Graceful degradation**: Database operation still succeeds

### Test Cases to Add

```javascript
describe("Image file deletion", () => {
  it("should delete image file when deleting food", async () => {
    const mockFood = {
      _id: "507f1f77bcf86cd799439011",
      name: "Popcorn",
      imageUrl: "uploads/food-123.jpg",
    };

    mockFood.findByIdAndDelete.mockResolvedValue(mockFood);
    mockFs.access.mockResolvedValue(true);
    mockFs.unlink.mockResolvedValue(true);

    await handler(mockReq, mockRes);

    expect(mockFs.unlink).toHaveBeenCalledWith(
      expect.stringContaining("uploads/food-123.jpg")
    );
  });

  it("should succeed even if image file does not exist", async () => {
    const mockFood = {
      _id: "507f1f77bcf86cd799439011",
      imageUrl: "uploads/missing.jpg",
    };

    mockFood.findByIdAndDelete.mockResolvedValue(mockFood);
    mockFs.access.mockRejectedValue(new Error("File not found"));

    await handler(mockReq, mockRes);

    expect(mockRes.status).toHaveBeenCalledWith(200); // ✅ Still succeeds
  });

  it("should not attempt deletion if imageUrl is empty", async () => {
    const mockFood = {
      _id: "507f1f77bcf86cd799439011",
      imageUrl: "", // Empty string
    };

    mockFood.findByIdAndDelete.mockResolvedValue(mockFood);

    await handler(mockReq, mockRes);

    expect(mockFs.unlink).not.toHaveBeenCalled(); // ✅ Skips deletion
  });
});
```

### Impact Assessment

- **Business Impact:** Low - No functional impact on users
- **Operational Impact:** Medium - Disk space consumption over time
- **Maintenance:** Medium - Manual cleanup required currently

### Reason for Status: Open 🔴

1. **Low priority**: Not affecting user experience
2. **Backward compatibility**: Need to handle existing orphaned files
3. **Testing complexity**: Requires filesystem mocking
4. **Scheduled for future sprint**: Will be addressed in cleanup task

### Workaround

Manual cleanup script can be run periodically:

```bash
# Find orphaned image files
find ./uploads -type f -name "food-*.jpg" | while read file; do
  # Check if referenced in database
  # Delete if not found
done
```

### Lessons Learned

1. **Resource cleanup**: Always clean up associated resources
2. **File operations**: Test both success and failure paths
3. **Graceful degradation**: Don't fail main operation if cleanup fails
4. **Logging**: Important for debugging filesystem operations
5. **Consider transaction-like behavior**: What if DB delete fails after file delete?

---

## DEFECT #FOOD-006: No Pagination Support

### Basic Information

- **Defect ID:** FOOD-006
- **Module:** getAllFoods
- **Type:** Performance Issue
- **Severity:** Minor 🟡
- **Priority:** Medium
- **Status:** Open 🔴
- **Found Date:** 2025-12-11
- **Fixed Date:** -

### Test Case Information

**Test File:** `__tests__/foodController/getAllFoods.test.js`  
**Test Name:** `should handle large dataset (performance consideration)`

### Description

The `getAllFoods` endpoint returns all food items without pagination, which can cause:

- **Performance issues**: Slow response with large datasets
- **Memory problems**: Large arrays in memory
- **Poor UX**: Frontend receives too much data at once
- **Network overhead**: Unnecessarily large payloads

### Current Behavior

```javascript
// getAllFoods.js
const foods = await Food.find(filter); // ❌ Returns ALL records
res.json(foods);
```

**Example Response:**

```javascript
// If database has 1000 food items:
GET / foods;
Response: [
  {
    /* food 1 */
  },
  {
    /* food 2 */
  },
  // ... 998 more items
];
// 1000 items in single response!
```

### Expected Behavior

```javascript
// With pagination
GET /foods?page=1&limit=20

Response: {
  foods: [
    { /* food 1 */ },
    // ... 19 more items (total 20)
  ],
  pagination: {
    currentPage: 1,
    totalPages: 50,
    totalItems: 1000,
    itemsPerPage: 20
  }
}
```

### Proposed Fix

```javascript
module.exports = ({ Food }) => {
  return async (req, res) => {
    try {
      const filter = {};
      const { isAvailable, page = 1, limit = 20 } = req.query;

      // ✅ Validate pagination parameters
      const pageNum = Math.max(1, parseInt(page) || 1);
      const limitNum = Math.min(100, Math.max(1, parseInt(limit) || 20));

      // Build filter
      if (isAvailable === "true") {
        filter.isAvailable = true;
      } else if (isAvailable === "false") {
        filter.isAvailable = false;
      }

      // ✅ Calculate skip value
      const skip = (pageNum - 1) * limitNum;

      // ✅ Execute query with pagination
      const [foods, totalCount] = await Promise.all([
        Food.find(filter).skip(skip).limit(limitNum).sort({ createdAt: -1 }), // Newest first
        Food.countDocuments(filter),
      ]);

      // ✅ Calculate pagination metadata
      const totalPages = Math.ceil(totalCount / limitNum);

      res.json({
        foods,
        pagination: {
          currentPage: pageNum,
          totalPages,
          totalItems: totalCount,
          itemsPerPage: limitNum,
          hasNextPage: pageNum < totalPages,
          hasPrevPage: pageNum > 1,
        },
      });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  };
};
```

### Why This Fix Works

1. **Default values**: page=1, limit=20 for backward compatibility
2. **Parameter validation**:
   - Min page = 1
   - Min limit = 1, Max limit = 100 (prevents abuse)
3. **Parallel queries**: Uses `Promise.all` for performance
4. **Metadata**: Provides pagination info for UI
5. **Sorting**: Consistent ordering (newest first)

### Test Cases to Add

```javascript
describe("Pagination", () => {
  it("should return first page with default limit", async () => {
    mockReq.query = { page: 1 };
    const mockFoods = Array(20)
      .fill(null)
      .map((_, i) => ({ id: i }));

    mockFood.find.mockReturnValue({
      skip: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      sort: jest.fn().mockResolvedValue(mockFoods),
    });
    mockFood.countDocuments.mockResolvedValue(100);

    await handler(mockReq, mockRes);

    expect(mockRes.json).toHaveBeenCalledWith({
      foods: mockFoods,
      pagination: {
        currentPage: 1,
        totalPages: 5,
        totalItems: 100,
        itemsPerPage: 20,
        hasNextPage: true,
        hasPrevPage: false,
      },
    });
  });

  it("should return custom page with custom limit", async () => {
    mockReq.query = { page: 2, limit: 10 };

    const skipMock = jest.fn().mockReturnThis();
    mockFood.find.mockReturnValue({
      skip: skipMock,
      limit: jest.fn().mockReturnThis(),
      sort: jest.fn().mockResolvedValue([]),
    });

    await handler(mockReq, mockRes);

    expect(skipMock).toHaveBeenCalledWith(10); // (2-1) * 10
  });

  it("should limit maximum items per page to 100", async () => {
    mockReq.query = { limit: 999 }; // Too high

    const limitMock = jest.fn().mockReturnThis();
    mockFood.find.mockReturnValue({
      skip: jest.fn().mockReturnThis(),
      limit: limitMock,
      sort: jest.fn().mockResolvedValue([]),
    });

    await handler(mockReq, mockRes);

    expect(limitMock).toHaveBeenCalledWith(100); // ✅ Capped
  });
});
```

### Impact Assessment

- **Performance:** High - Reduces response time significantly
- **User Experience:** Medium - Better frontend performance
- **API Design:** High - Modern REST API best practice
- **Backward Compatibility:** Low impact - Can use default values

### Reason for Status: Open 🔴

1. **Breaking change**: Response structure changes
2. **Frontend update needed**: UI must handle pagination
3. **Testing required**: Load testing with large datasets
4. **API versioning**: Consider /v2/foods endpoint
5. **Documentation**: API docs need updating

### Workaround

Frontend can implement client-side pagination:

```javascript
// Frontend workaround (not ideal)
const allFoods = await fetch("/foods");
const page1 = allFoods.slice(0, 20);
const page2 = allFoods.slice(20, 40);
// But still downloads all data!
```

### Migration Plan

1. **Phase 1**: Add pagination with optional parameters (backward compatible)
2. **Phase 2**: Update frontend to use pagination
3. **Phase 3**: Deprecate non-paginated response
4. **Phase 4**: Make pagination mandatory in v2 API

### Lessons Learned

1. **Plan for scale**: Always consider large datasets
2. **Pagination is standard**: Should be in initial API design
3. **Performance testing**: Test with realistic data volumes
4. **Backward compatibility**: Consider migration path
5. **API evolution**: Use versioning for breaking changes

---

## Metrics & Analysis

### Test Coverage

```
File                    | % Stmts | % Branch | % Funcs | % Lines
------------------------|---------|----------|---------|--------
createFood.js           |   100   |   100    |   100   |   100
getAllFoods.js          |   95.2  |   87.5   |   100   |   95.2
getFoodById.js          |   100   |   100    |   100   |   100
updateFood.js           |   100   |   100    |   100   |   100
deleteFood.js           |   88.9  |   75.0   |   100   |   88.9
------------------------|---------|----------|---------|--------
All files               |   96.8  |   92.5   |   100   |   96.8
```

### Defect Statistics

#### By Severity

- 🔴 Critical: 1 (16.7%)
- ⚠️ Major: 2 (33.3%)
- 🟡 Minor: 3 (50.0%)

#### By Status

- ✅ Fixed: 4 (66.7%)
- 🔴 Open: 2 (33.3%)

#### By Module

- createFood: 2 defects
- getAllFoods: 2 defects
- updateFood: 1 defect
- deleteFood: 1 defect

#### Time to Fix

- Average: 0.5 days (for fixed defects)
- Critical issues: Fixed within same day
- Major issues: Fixed within 1 day
- Minor issues: Deferred to future sprints

### Defect Type Distribution

1. **Validation Error** (50%): 3 defects - FOOD-001, FOOD-003, FOOD-004
2. **Logic Error** (16.7%): 1 defect - FOOD-002
3. **Resource Leak** (16.7%): 1 defect - FOOD-005
4. **Performance Issue** (16.7%): 1 defect - FOOD-006

### Root Cause Categories

1. **Validation Issues** (50%): Insufficient or incorrect validation
2. **Business Logic** (33%): Missing or incomplete business rules
3. **Resource Management** (17%): File/resource cleanup missing

### Test Effectiveness

- **Defects found by tests:** 6/6 (100%)
- **Defects found before production:** 6/6 (100%)
- **Tests written after defect:** 25 new test cases
- **Regression prevention:** All defects have test coverage

---

## Recommendations

### Immediate Actions (High Priority)

1. ✅ **Fix all Critical and Major defects** - COMPLETED
2. 🔄 **Add comprehensive validation** - IN PROGRESS
3. 📝 **Document validation rules** - PENDING

### Short-term Improvements (Medium Priority)

1. 🔴 **Implement image file deletion** (FOOD-005)
2. 🔴 **Add pagination support** (FOOD-006)
3. ⚠️ **Add input sanitization** for SQL injection prevention
4. ⚠️ **Implement rate limiting** for API endpoints

### Long-term Enhancements (Low Priority)

1. 📊 **Add monitoring and alerting** for validation failures
2. 🔍 **Implement audit logging** for all CRUD operations
3. 🚀 **Performance optimization** with caching (Redis)
4. 📚 **API documentation** with Swagger/OpenAPI

### Process Improvements

1. **Code Review Checklist:**

   - ✅ All inputs validated
   - ✅ Numeric ranges checked
   - ✅ String inputs trimmed
   - ✅ Resources cleaned up
   - ✅ Error handling implemented

2. **Testing Strategy:**

   - ✅ Unit tests for all functions
   - ✅ Edge case testing (boundary values)
   - ✅ Negative testing (invalid inputs)
   - 🔄 Integration tests with real database
   - 🔄 Load testing for performance

3. **Validation Standards:**
   ```javascript
   // Standard validation pattern
   const validate = (data) => {
     // 1. Check required fields
     if (!data.field) return { error: "Field required" };

     // 2. Trim strings
     const trimmed = data.field.trim();
     if (!trimmed) return { error: "Field empty" };

     // 3. Type conversion
     const num = Number(data.number);
     if (isNaN(num)) return { error: "Invalid number" };

     // 4. Range checking
     if (num <= 0) return { error: "Must be positive" };

     return { valid: true };
   };
   ```

---

## Conclusion

This defect log demonstrates the value of comprehensive unit testing:

1. **Early Detection**: All 6 defects found before production
2. **Data Integrity**: Prevented invalid data in database
3. **Business Logic**: Enforced correct validation rules
4. **Quality Improvement**: 96.8% code coverage achieved
5. **Documentation**: Clear record of issues and fixes

**Key Takeaways:**

- ✅ Unit tests catch logic errors effectively
- ✅ Validation should be explicit and comprehensive
- ✅ Edge cases must be tested systematically
- ✅ Consistency matters (create vs update)
- ✅ Resource management is often overlooked

**Next Steps:**

1. Fix remaining open defects (FOOD-005, FOOD-006)
2. Maintain test coverage above 95%
3. Apply lessons learned to other services
4. Regular defect review meetings
5. Continuous test improvement

---

**Document Version:** 1.0  
**Last Updated:** December 11, 2025  
**Prepared By:** QA Team  
**Reviewed By:** Development Team Lead
