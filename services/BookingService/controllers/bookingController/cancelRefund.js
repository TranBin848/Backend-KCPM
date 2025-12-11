/**
 * Cancel refund request (set booking back to PAID and delete refund_booking record)
 * @param {Object} dependencies - { pool, getIO }
 * @returns {Function} Express handler function
 */
module.exports = ({ pool, getIO }) => {
  return async (req, res) => {
    const bookingId = req.params.id;
    const client = await pool.connect();

    try {
      await client.query("BEGIN");

      const bookingResult = await client.query(
        "SELECT * FROM booking WHERE id = $1 AND status = 'REFUND_REQUESTED'",
        [bookingId]
      );

      if (bookingResult.rows.length === 0) {
        await client.query("ROLLBACK");
        return res.status(404).json({ message: "No refund request to cancel" });
      }

      await client.query(
        "UPDATE booking SET status = 'PAID', updated_at = CURRENT_TIMESTAMP WHERE id = $1",
        [bookingId]
      );

      await client.query("DELETE FROM refund_booking WHERE booking_id = $1", [
        bookingId,
      ]);

      await client.query("COMMIT");
      const io = getIO();
      io.emit("booking_refund_cancelled", {
        bookingId,
      });
      res.json({
        message: "Refund request canceled and booking status set to PAID",
      });
    } catch (err) {
      await client.query("ROLLBACK");
      res.status(500).json({ error: err.message });
    } finally {
      client.release();
    }
  };
};
