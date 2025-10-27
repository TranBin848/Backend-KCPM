const express = require("express");
const router = express.Router();
const pool = require("../db");
const redisClient = require("../redisClient");
const { getIO } = require("../socket");
const createBookingController = require("../controllers/bookingController");
const bookingController = createBookingController({ pool, redisClient, getIO });

// Lấy tất cả refund_booking
router.get("/refund-bookings", bookingController.getRefundBookings);

// Lấy refund_booking theo id
router.get("/refund-bookings/:id", bookingController.getRefundBookingById);

// Lấy refund_booking theo booking_id
router.get(
  "/refund-bookings/booking/:bookingId",
  bookingController.getRefundBookingsByBookingId
);
// Get all bookings
router.get("/", bookingController.getAllBookings);

// Get all bookings by user_id
router.get("/user/:userId", bookingController.getBookingsByUser);

// Get booking by ID (kèm theo seat_ids)
router.get("/:id", bookingController.getBookingById);

// Create new booking
router.post("/", bookingController.createBooking);

// Update only total_price of a booking by ID
router.put("/:id/total_price", bookingController.updateTotalPrice);

// Update booking status
router.put("/:id/status", bookingController.updateBookingStatus);

router.delete("/:id", bookingController.deleteBooking);

router.get("/locked-seats/:showtimeId", bookingController.getLockedSeats);

// Gửi yêu cầu hoàn tiền (refund)
router.post("/:id/refund-request", bookingController.requestRefund);

// Hủy yêu cầu hoàn tiền (chuyển về PAID và xóa bản ghi refund_booking)
router.delete("/:id/refund-cancel", bookingController.cancelRefund);

module.exports = router;
