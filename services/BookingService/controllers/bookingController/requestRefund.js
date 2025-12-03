/**
 * Create refund request and emit socket event
 * @param {Object} dependencies - { pool, getIO }
 * @returns {Function} Express handler function
 */
module.exports = ({ pool, getIO }) => {
  return async (req, res) => {
    const bookingId = req.params.id;
    const {
      amount,
      method,
      phone,
      bank_account_name,
      bank_name,
      bank_account_number,
      momo_account_name,
    } = req.body;

    if (
      amount === undefined ||
      amount === null ||
      method === undefined ||
      method === null ||
      (method === "momo" && (!phone || !momo_account_name)) ||
      (method === "bank" &&
        (!bank_account_name || !bank_name || !bank_account_number))
    ) {
      return res
        .status(400)
        .json({ error: "Missing required refund information" });
    }

    const client = await pool.connect();

    try {
      await client.query("BEGIN");

      const updateResult = await client.query(
        `UPDATE booking 
       SET status = 'REFUND_REQUESTED', updated_at = CURRENT_TIMESTAMP 
       WHERE id = $1 
       RETURNING *`,
        [bookingId]
      );

      if (updateResult.rows.length === 0) {
        await client.query("ROLLBACK");
        return res.status(404).json({ message: "Booking not found" });
      }

      await client.query(
        `INSERT INTO refund_booking (
    booking_id, amount, method, phone, momo_account_name, bank_account_name, bank_name, bank_account_number
  ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
        [
          bookingId,
          amount,
          method,
          method === "momo" ? phone : null,
          method === "momo" ? momo_account_name : null,
          method === "bank" ? bank_account_name : null,
          method === "bank" ? bank_name : null,
          method === "bank" ? bank_account_number : null,
        ]
      );

      await client.query("COMMIT");

      const io = getIO();
      io.emit("booking_refund_requested", {
        bookingId,
        amount,
        method,
        phone,
        momo_account_name,
        bank_account_name,
        bank_name,
        bank_account_number,
      });

      res
        .status(200)
        .json({ message: "Refund request submitted successfully" });
    } catch (err) {
      await client.query("ROLLBACK");
      console.error(err);
      res.status(500).json({ error: "Failed to submit refund request" });
    } finally {
      client.release();
    }
  };
};
