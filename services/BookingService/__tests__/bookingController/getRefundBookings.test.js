const getRefundBookings = require("../../controllers/bookingController/getRefundBookings");

describe("getRefundBookings", () => {
  let mockPool;
  let handler;
  let mockReq;
  let mockRes;

  beforeAll(() => {
    jest.spyOn(console, "error").mockImplementation(() => {});
  });

  beforeEach(() => {
    mockPool = {
      query: jest.fn(),
    };

    handler = getRefundBookings({ pool: mockPool });

    mockReq = {};

    mockRes = {
      json: jest.fn(),
      status: jest.fn().mockReturnThis(),
    };
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("Success cases", () => {
    it("should return all refund bookings ordered by id DESC", async () => {
      const mockRefunds = [
        {
          id: 3,
          booking_id: 300,
          refund_amount: 200000,
          refund_reason: "Event cancelled",
          refund_status: "approved",
          request_date: "2025-12-03T10:00:00Z",
          refund_date: "2025-12-03T15:00:00Z",
        },
        {
          id: 2,
          booking_id: 200,
          refund_amount: 150000,
          refund_reason: "Customer requested",
          refund_status: "pending",
          request_date: "2025-12-02T10:00:00Z",
          refund_date: null,
        },
        {
          id: 1,
          booking_id: 100,
          refund_amount: 100000,
          refund_reason: "Double booking",
          refund_status: "rejected",
          request_date: "2025-12-01T10:00:00Z",
          refund_date: "2025-12-01T14:00:00Z",
        },
      ];

      mockPool.query.mockResolvedValue({ rows: mockRefunds });

      await handler(mockReq, mockRes);

      expect(mockPool.query).toHaveBeenCalledWith(
        "SELECT * FROM refund_booking ORDER BY id DESC"
      );
      expect(mockRes.json).toHaveBeenCalledWith(mockRefunds);
      // Verify order is descending
      for (let i = 1; i < mockRefunds.length; i++) {
        expect(mockRefunds[i].id).toBeLessThan(mockRefunds[i - 1].id);
      }
    });

    it("should return empty array when no refunds exist", async () => {
      mockPool.query.mockResolvedValue({ rows: [] });

      await handler(mockReq, mockRes);

      expect(mockRes.json).toHaveBeenCalledWith([]);
    });

    it("should return refunds with all statuses (pending, approved, rejected)", async () => {
      const mockRefunds = [
        {
          id: 3,
          booking_id: 300,
          refund_amount: 200000,
          refund_reason: "Test",
          refund_status: "pending",
          request_date: "2025-12-03T10:00:00Z",
          refund_date: null,
        },
        {
          id: 2,
          booking_id: 200,
          refund_amount: 150000,
          refund_reason: "Test",
          refund_status: "approved",
          request_date: "2025-12-02T10:00:00Z",
          refund_date: "2025-12-02T15:00:00Z",
        },
        {
          id: 1,
          booking_id: 100,
          refund_amount: 100000,
          refund_reason: "Test",
          refund_status: "rejected",
          request_date: "2025-12-01T10:00:00Z",
          refund_date: "2025-12-01T14:00:00Z",
        },
      ];

      mockPool.query.mockResolvedValue({ rows: mockRefunds });

      await handler(mockReq, mockRes);

      expect(mockRes.json).toHaveBeenCalledWith(mockRefunds);
      const statuses = mockRefunds.map((r) => r.refund_status);
      expect(statuses).toContain("pending");
      expect(statuses).toContain("approved");
      expect(statuses).toContain("rejected");
    });

    it("should return refunds with all required fields", async () => {
      const mockRefunds = [
        {
          id: 1,
          booking_id: 100,
          refund_amount: 150000,
          refund_reason: "Customer requested cancellation",
          refund_status: "pending",
          request_date: "2025-12-01T10:00:00Z",
          refund_date: null,
        },
      ];

      mockPool.query.mockResolvedValue({ rows: mockRefunds });

      await handler(mockReq, mockRes);

      const result = mockRes.json.mock.calls[0][0][0];
      expect(result).toHaveProperty("id");
      expect(result).toHaveProperty("booking_id");
      expect(result).toHaveProperty("refund_amount");
      expect(result).toHaveProperty("refund_reason");
      expect(result).toHaveProperty("refund_status");
      expect(result).toHaveProperty("request_date");
    });

    it("should return refunds with 0 amount", async () => {
      const mockRefunds = [
        {
          id: 1,
          booking_id: 100,
          refund_amount: 0,
          refund_reason: "Free ticket cancellation",
          refund_status: "approved",
          request_date: "2025-12-01T10:00:00Z",
          refund_date: "2025-12-01T15:00:00Z",
        },
      ];

      mockPool.query.mockResolvedValue({ rows: mockRefunds });

      await handler(mockReq, mockRes);

      expect(mockRes.json).toHaveBeenCalledWith(mockRefunds);
      expect(mockRefunds[0].refund_amount).toBe(0);
    });

    it("should return refunds with very high amounts", async () => {
      const mockRefunds = [
        {
          id: 2,
          booking_id: 200,
          refund_amount: 9999999,
          refund_reason: "VIP booking cancellation",
          refund_status: "pending",
          request_date: "2025-12-02T10:00:00Z",
          refund_date: null,
        },
        {
          id: 1,
          booking_id: 100,
          refund_amount: 5000000,
          refund_reason: "Group booking refund",
          refund_status: "approved",
          request_date: "2025-12-01T10:00:00Z",
          refund_date: "2025-12-01T15:00:00Z",
        },
      ];

      mockPool.query.mockResolvedValue({ rows: mockRefunds });

      await handler(mockReq, mockRes);

      expect(mockRes.json).toHaveBeenCalledWith(mockRefunds);
    });

    it("should return refunds with null refund_date for pending status", async () => {
      const mockRefunds = [
        {
          id: 1,
          booking_id: 100,
          refund_amount: 100000,
          refund_reason: "Waiting approval",
          refund_status: "pending",
          request_date: "2025-12-01T10:00:00Z",
          refund_date: null,
        },
      ];

      mockPool.query.mockResolvedValue({ rows: mockRefunds });

      await handler(mockReq, mockRes);

      expect(mockRes.json).toHaveBeenCalledWith(mockRefunds);
      expect(mockRefunds[0].refund_date).toBeNull();
    });

    it("should return refunds with admin_notes", async () => {
      const mockRefunds = [
        {
          id: 1,
          booking_id: 100,
          refund_amount: 100000,
          refund_reason: "Customer request",
          refund_status: "approved",
          request_date: "2025-12-01T10:00:00Z",
          refund_date: "2025-12-01T15:00:00Z",
          admin_notes: "Approved by manager",
        },
      ];

      mockPool.query.mockResolvedValue({ rows: mockRefunds });

      await handler(mockReq, mockRes);

      expect(mockRes.json).toHaveBeenCalledWith(mockRefunds);
      expect(mockRefunds[0].admin_notes).toBe("Approved by manager");
    });

    it("should handle large number of refunds", async () => {
      const mockRefunds = Array.from({ length: 100 }, (_, i) => ({
        id: 100 - i,
        booking_id: 100 - i,
        refund_amount: (100 - i) * 1000,
        refund_reason: `Refund ${100 - i}`,
        refund_status: ["pending", "approved", "rejected"][i % 3],
        request_date: "2025-12-01T10:00:00Z",
        refund_date: i % 3 === 0 ? null : "2025-12-01T15:00:00Z",
      }));

      mockPool.query.mockResolvedValue({ rows: mockRefunds });

      await handler(mockReq, mockRes);

      expect(mockRes.json).toHaveBeenCalledWith(mockRefunds);
      expect(mockRefunds.length).toBe(100);
    });

    it("should return refunds for same booking_id", async () => {
      const mockRefunds = [
        {
          id: 2,
          booking_id: 100,
          refund_amount: 50000,
          refund_reason: "Second refund attempt",
          refund_status: "pending",
          request_date: "2025-12-02T10:00:00Z",
          refund_date: null,
        },
        {
          id: 1,
          booking_id: 100,
          refund_amount: 100000,
          refund_reason: "First refund attempt",
          refund_status: "rejected",
          request_date: "2025-12-01T10:00:00Z",
          refund_date: "2025-12-01T15:00:00Z",
        },
      ];

      mockPool.query.mockResolvedValue({ rows: mockRefunds });

      await handler(mockReq, mockRes);

      expect(mockRes.json).toHaveBeenCalledWith(mockRefunds);
      expect(mockRefunds[0].booking_id).toBe(mockRefunds[1].booking_id);
    });
  });

  describe("Error cases", () => {
    it("should return 500 on database error", async () => {
      mockPool.query.mockRejectedValue(new Error("Database connection failed"));

      await handler(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: "Database connection failed",
      });
    });

    it("should return 500 on database timeout", async () => {
      mockPool.query.mockRejectedValue(new Error("Query timeout"));

      await handler(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: "Query timeout",
      });
    });

    it("should return 500 on connection pool exhausted", async () => {
      mockPool.query.mockRejectedValue(new Error("Connection pool exhausted"));

      await handler(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: "Connection pool exhausted",
      });
    });

    it("should return 500 on SQL syntax error", async () => {
      mockPool.query.mockRejectedValue(new Error("SQL syntax error"));

      await handler(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: "SQL syntax error",
      });
    });

    it("should return 500 on table not found error", async () => {
      mockPool.query.mockRejectedValue(
        new Error('relation "refund_booking" does not exist')
      );

      await handler(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: 'relation "refund_booking" does not exist',
      });
    });
  });

  describe("Edge cases", () => {
    it("should handle refunds with special characters in reason", async () => {
      const mockRefunds = [
        {
          id: 1,
          booking_id: 100,
          refund_amount: 100000,
          refund_reason: "Khách hàng yêu cầu hoàn tiền do sự kiện bị hủy 😢",
          refund_status: "pending",
          request_date: "2025-12-01T10:00:00Z",
          refund_date: null,
        },
      ];

      mockPool.query.mockResolvedValue({ rows: mockRefunds });

      await handler(mockReq, mockRes);

      expect(mockRes.json).toHaveBeenCalledWith(mockRefunds);
    });

    it("should handle refunds with very long reason", async () => {
      const longReason = "A".repeat(1000);
      const mockRefunds = [
        {
          id: 1,
          booking_id: 100,
          refund_amount: 100000,
          refund_reason: longReason,
          refund_status: "pending",
          request_date: "2025-12-01T10:00:00Z",
          refund_date: null,
        },
      ];

      mockPool.query.mockResolvedValue({ rows: mockRefunds });

      await handler(mockReq, mockRes);

      expect(mockRes.json).toHaveBeenCalledWith(mockRefunds);
      expect(mockRefunds[0].refund_reason.length).toBe(1000);
    });

    it("should handle refunds with null admin_notes", async () => {
      const mockRefunds = [
        {
          id: 1,
          booking_id: 100,
          refund_amount: 100000,
          refund_reason: "Test",
          refund_status: "pending",
          request_date: "2025-12-01T10:00:00Z",
          refund_date: null,
          admin_notes: null,
        },
      ];

      mockPool.query.mockResolvedValue({ rows: mockRefunds });

      await handler(mockReq, mockRes);

      expect(mockRes.json).toHaveBeenCalledWith(mockRefunds);
      expect(mockRefunds[0].admin_notes).toBeNull();
    });

    it("should handle refunds with duplicate booking_ids", async () => {
      const mockRefunds = [
        {
          id: 5,
          booking_id: 100,
          refund_amount: 100000,
          refund_reason: "Third attempt",
          refund_status: "pending",
          request_date: "2025-12-05T10:00:00Z",
          refund_date: null,
        },
        {
          id: 3,
          booking_id: 100,
          refund_amount: 100000,
          refund_reason: "Second attempt",
          refund_status: "rejected",
          request_date: "2025-12-03T10:00:00Z",
          refund_date: "2025-12-03T15:00:00Z",
        },
        {
          id: 1,
          booking_id: 100,
          refund_amount: 100000,
          refund_reason: "First attempt",
          refund_status: "rejected",
          request_date: "2025-12-01T10:00:00Z",
          refund_date: "2025-12-01T15:00:00Z",
        },
      ];

      mockPool.query.mockResolvedValue({ rows: mockRefunds });

      await handler(mockReq, mockRes);

      expect(mockRes.json).toHaveBeenCalledWith(mockRefunds);
    });

    it("should handle refunds with different currencies (implied by amount)", async () => {
      const mockRefunds = [
        {
          id: 2,
          booking_id: 200,
          refund_amount: 1000000,
          refund_reason: "Large refund",
          refund_status: "pending",
          request_date: "2025-12-02T10:00:00Z",
          refund_date: null,
        },
        {
          id: 1,
          booking_id: 100,
          refund_amount: 50,
          refund_reason: "Small refund",
          refund_status: "approved",
          request_date: "2025-12-01T10:00:00Z",
          refund_date: "2025-12-01T15:00:00Z",
        },
      ];

      mockPool.query.mockResolvedValue({ rows: mockRefunds });

      await handler(mockReq, mockRes);

      expect(mockRes.json).toHaveBeenCalledWith(mockRefunds);
    });

    it("should handle refunds with same request and refund date", async () => {
      const sameDate = "2025-12-01T10:00:00Z";
      const mockRefunds = [
        {
          id: 1,
          booking_id: 100,
          refund_amount: 100000,
          refund_reason: "Instant refund",
          refund_status: "approved",
          request_date: sameDate,
          refund_date: sameDate,
        },
      ];

      mockPool.query.mockResolvedValue({ rows: mockRefunds });

      await handler(mockReq, mockRes);

      expect(mockRes.json).toHaveBeenCalledWith(mockRefunds);
      expect(mockRefunds[0].request_date).toBe(mockRefunds[0].refund_date);
    });

    it("should maintain DESC order with gaps in id sequence", async () => {
      const mockRefunds = [
        {
          id: 100,
          booking_id: 100,
          refund_amount: 100000,
          refund_reason: "Test",
          refund_status: "pending",
          request_date: "2025-12-01T10:00:00Z",
          refund_date: null,
        },
        {
          id: 50,
          booking_id: 50,
          refund_amount: 50000,
          refund_reason: "Test",
          refund_status: "approved",
          request_date: "2025-12-01T10:00:00Z",
          refund_date: "2025-12-01T15:00:00Z",
        },
        {
          id: 10,
          booking_id: 10,
          refund_amount: 10000,
          refund_reason: "Test",
          refund_status: "rejected",
          request_date: "2025-12-01T10:00:00Z",
          refund_date: "2025-12-01T15:00:00Z",
        },
      ];

      mockPool.query.mockResolvedValue({ rows: mockRefunds });

      await handler(mockReq, mockRes);

      expect(mockRes.json).toHaveBeenCalledWith(mockRefunds);
      // Verify DESC order
      for (let i = 1; i < mockRefunds.length; i++) {
        expect(mockRefunds[i].id).toBeLessThan(mockRefunds[i - 1].id);
      }
    });
  });
});
