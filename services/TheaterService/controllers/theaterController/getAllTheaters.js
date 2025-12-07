module.exports = ({ pool }) => {
  return async (req, res) => {
    try {
      const result = await pool.query(
        "SELECT * FROM theaters ORDER BY id DESC"
      );
      res.json(result.rows);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  };
};
