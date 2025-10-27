# BookingService Testing Guide

## Giới thiệu

BookingService đã được refactor để tách logic ra khỏi routes vào controllers, cho phép viết whitebox tests (unit tests) dễ dàng hơn.

## Cấu trúc

```
BookingService/
├── controllers/
│   └── bookingController.js    # Business logic được tách ra
├── routes/
│   ├── bookingRoutes.js         # Chỉ định nghĩa routes
│   └── foodBookingRoutes.js
├── __tests__/
│   └── bookingController.test.js # Unit tests
├── jest.config.js               # Cấu hình Jest
└── package.json
```

## Controller Pattern

Controller sử dụng **Factory Pattern** với dependency injection:

```javascript
// controllers/bookingController.js
module.exports = ({ pool, redisClient, getIO }) => {
  return {
    getAllBookings: async (req, res) => { ... },
    createBooking: async (req, res) => { ... },
    // ... các handlers khác
  };
};
```

Điều này cho phép:

- ✅ Mock dependencies dễ dàng trong tests
- ✅ Test logic mà không cần database thật
- ✅ Test các edge cases và error handling
- ✅ Whitebox testing với code coverage

## Chạy Tests

### Cài đặt dependencies

```bash
npm install
```

### Chạy tất cả tests

```bash
npm test
```

### Chạy tests với watch mode (tự động chạy lại khi code thay đổi)

```bash
npm run test:watch
```

### Chạy tests với code coverage

```bash
npm run test:coverage
```

## Test Coverage hiện tại

- **bookingController.js**: ~80% coverage
- Tổng cộng: **25 test cases** đang pass

### Test cases bao gồm:

#### getAllBookings

- ✅ Lấy tất cả bookings thành công
- ✅ Xử lý lỗi database

#### getBookingById

- ✅ Lấy booking với seat_ids khi tìm thấy
- ✅ Trả về 404 khi không tìm thấy

#### createBooking

- ✅ Tạo booking thành công với dữ liệu hợp lệ
- ✅ Merge với locked seats có sẵn trong Redis
- ✅ Trả về 400 khi thiếu required fields
- ✅ Rollback transaction khi có lỗi

#### updateBookingStatus

- ✅ Cập nhật status thành PAID thành công
- ✅ Trả về 400 với status không hợp lệ
- ✅ Trả về 404 khi không tìm thấy booking

#### deleteBooking

- ✅ Xóa booking và clear Redis cache
- ✅ Trả về 404 khi không tìm thấy booking

#### getLockedSeats

- ✅ Lấy locked seats từ Redis cache
- ✅ Query database và cache kết quả khi cache miss

#### requestRefund

- ✅ Tạo refund request với phương thức Momo
- ✅ Tạo refund request với phương thức Bank
- ✅ Validate required fields cho Momo
- ✅ Validate required fields cho Bank
- ✅ Trả về 404 khi không tìm thấy booking

#### cancelRefund

- ✅ Hủy refund request thành công
- ✅ Trả về 404 khi không có refund request

#### Các handlers khác

- ✅ getRefundBookings
- ✅ updateTotalPrice (với validation)

## Cách viết thêm tests

### 1. Tạo mock dependencies

```javascript
const mockPool = {
  query: jest.fn(),
  connect: jest.fn().mockResolvedValue(mockClient),
};

const mockRedisClient = {
  get: jest.fn(),
  setEx: jest.fn(),
  del: jest.fn(),
};

const mockGetIO = jest.fn(() => ({
  emit: jest.fn(),
}));
```

### 2. Khởi tạo controller với mocks

```javascript
const controller = createBookingController({
  pool: mockPool,
  redisClient: mockRedisClient,
  getIO: mockGetIO,
});
```

### 3. Setup mock request/response

```javascript
const mockReq = {
  params: { id: "1" },
  body: {
    /* data */
  },
};

const mockRes = {
  status: jest.fn().mockReturnThis(),
  json: jest.fn().mockReturnThis(),
};
```

### 4. Viết test case

```javascript
it('should do something', async () => {
  // Arrange
  mockPool.query.mockResolvedValue({ rows: [...] });

  // Act
  await controller.someHandler(mockReq, mockRes);

  // Assert
  expect(mockRes.status).toHaveBeenCalledWith(200);
  expect(mockRes.json).toHaveBeenCalledWith(expectedData);
});
```

## Best Practices

1. **Mock tất cả external dependencies** (database, Redis, Socket.IO)
2. **Test cả success và error cases**
3. **Test validation logic** (400 errors)
4. **Test edge cases** (404 not found, empty data, etc.)
5. **Test transaction rollback** khi có lỗi
6. **Verify side effects** (Redis cache updates, socket emissions)
7. **Keep tests isolated** - mỗi test độc lập với nhau

## Mở rộng

Để áp dụng pattern này cho các services khác:

1. Tạo folder `controllers/` trong service
2. Tách logic từ routes sang controller với factory pattern
3. Update routes để import và sử dụng controller
4. Tạo folder `__tests__/` và viết tests tương tự
5. Cấu hình Jest (copy `jest.config.js`)
6. Thêm test scripts vào `package.json`

## Tài liệu tham khảo

- [Jest Documentation](https://jestjs.io/)
- [Testing Node.js Applications](https://nodejs.org/en/docs/guides/testing/)
- [Dependency Injection Pattern](https://en.wikipedia.org/wiki/Dependency_injection)
