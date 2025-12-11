module.exports = ({ pool }) => {
  return async (req, res) => {
    try {
      const result = await pool.query(
        "SELECT * FROM theaters WHERE id = $1",
        [req.params.id]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({ message: "Theater not found" });
      }

      res.json(result.rows[0]);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  };
};
