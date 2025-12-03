/**
 * BookingController - Modular controller functions for Booking Service
 * Each function accepts dependencies and returns an Express handler
 */

const getRefundBookings = require("./getRefundBookings");
const getRefundBookingById = require("./getRefundBookingById");
const getRefundBookingsByBookingId = require("./getRefundBookingsByBookingId");
const getAllBookings = require("./getAllBookings");
const getBookingsByUser = require("./getBookingsByUser");
const getBookingById = require("./getBookingById");
const createBooking = require("./createBooking");
const updateTotalPrice = require("./updateTotalPrice");
const updateBookingStatus = require("./updateBookingStatus");
const deleteBooking = require("./deleteBooking");
const getLockedSeats = require("./getLockedSeats");
const requestRefund = require("./requestRefund");
const cancelRefund = require("./cancelRefund");

/**
 * Factory function to create all controller handlers
 * @param {Object} dependencies - { pool, redisClient, getIO }
 * @returns {Object} Object containing all controller handlers
 */
module.exports = ({ pool, redisClient, getIO }) => {
  return {
    getRefundBookings: getRefundBookings({ pool }),
    getRefundBookingById: getRefundBookingById({ pool }),
    getRefundBookingsByBookingId: getRefundBookingsByBookingId({ pool }),
    getAllBookings: getAllBookings({ pool }),
    getBookingsByUser: getBookingsByUser({ pool }),
    getBookingById: getBookingById({ pool }),
    createBooking: createBooking({ pool, redisClient }),
    updateTotalPrice: updateTotalPrice({ pool }),
    updateBookingStatus: updateBookingStatus({ pool, redisClient }),
    deleteBooking: deleteBooking({ pool, redisClient }),
    getLockedSeats: getLockedSeats({ pool, redisClient }),
    requestRefund: requestRefund({ pool, getIO }),
    cancelRefund: cancelRefund({ pool, getIO }),
  };
};
