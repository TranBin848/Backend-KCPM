// Controller factory for UserService route handlers
// Exports a function that accepts dependencies and returns handler functions.
module.exports = ({ pool, bcrypt, jwt, otpStore, sendEmail }) => {
  return {
    // Đăng ký
    signup: async (req, res) => {
      const { name, email, phone, gender, birthdate, password, role } =
        req.body;
      const finalRole = role || "user";

      try {
        const hashedPassword = await bcrypt.hash(password, 10);
        const result = await pool.query(
          "INSERT INTO users(name, email, phone, gender, birthdate, password, role) VALUES($1, $2, $3, $4, $5, $6, $7) RETURNING id",
          [name, email, phone, gender, birthdate, hashedPassword, finalRole]
        );
        res
          .status(201)
          .json({ message: "Signup successfully", userId: result.rows[0].id });
      } catch (error) {
        if (error.code === "23505") {
          if (error.detail.includes("email")) {
            return res.status(400).json({ error: "Email đã được sử dụng." });
          } else if (error.detail.includes("phone")) {
            return res
              .status(400)
              .json({ error: "Số điện thoại đã được sử dụng." });
          }
        }
        res.status(500).json({ error: "Đăng ký thất bại. Vui lòng thử lại." });
      }
    },

    // Đăng nhập
    login: async (req, res) => {
      const { email, password } = req.body;

      try {
        const result = await pool.query(
          "SELECT * FROM users WHERE email = $1",
          [email]
        );
        const user = result.rows[0];

        if (!user)
          return res.status(401).json({ error: "Email không tồn tại!" });

        const valid = await bcrypt.compare(password, user.password);
        if (!valid) return res.status(401).json({ error: "Sai mật khẩu!" });

        const token = jwt.sign(
          { userId: user.id, role: user.role },
          process.env.JWT_SECRET || "secret",
          { expiresIn: "24h" }
        );
        res.json({
          message: "Login successfully",
          token,
          user: {
            id: user.id,
            name: user.name,
            email: user.email,
            phone: user.phone,
            gender: user.gender,
            birthdate: user.birthdate,
            role: user.role,
            points: user.points,
            workplace: user.workplace || "",
          },
        });
      } catch (error) {
        res.status(500).json({ error: "Error: " + error.message });
      }
    },

    // Lấy tất cả user với role là "user"
    getAllUsers: async (req, res) => {
      try {
        const result = await pool.query(
          `SELECT id, name, email, phone, gender, birthdate, role, points, rank
           FROM users
           WHERE role = 'user'
           ORDER BY id ASC`
        );

        res.json(result.rows);
      } catch (error) {
        res
          .status(500)
          .json({
            error: "Lỗi server khi lấy danh sách user: " + error.message,
          });
      }
    },

    // Lấy thông tin user theo id
    getUserById: async (req, res) => {
      const userId = req.params.id;

      try {
        const result = await pool.query(
          "SELECT id, name, email, phone, gender, birthdate, role, points, rank FROM users WHERE id = $1",
          [userId]
        );

        if (result.rows.length === 0) {
          return res.status(404).json({ error: "User không tồn tại" });
        }

        res.json(result.rows[0]);
      } catch (error) {
        res.status(500).json({ error: "Lỗi server: " + error.message });
      }
    },

    // Cập nhật thông tin user
    updateUser: async (req, res) => {
      const userId = parseInt(req.params.id);
      const { name, email, phone, gender, birthdate } = req.body;

      try {
        const result = await pool.query(
          `UPDATE users 
           SET name = $1, email = $2, phone = $3, gender = $4, birthdate = $5 
           WHERE id = $6 
           RETURNING id, name, email, phone, gender, birthdate, role, points, rank`,
          [name, email, phone, gender, birthdate, userId]
        );

        if (result.rowCount === 0) {
          return res.status(404).json({ error: "Người dùng không tồn tại." });
        }

        res.json({
          message: "Cập nhật thông tin người dùng thành công.",
          user: result.rows[0],
        });
      } catch (error) {
        if (error.code === "23505") {
          if (error.detail.includes("email")) {
            return res.status(400).json({ error: "Email đã được sử dụng." });
          } else if (error.detail.includes("phone")) {
            return res
              .status(400)
              .json({ error: "Số điện thoại đã được sử dụng." });
          }
        }
        res.status(500).json({ error: "Lỗi khi cập nhật: " + error.message });
      }
    },

    // Đổi mật khẩu
    changePassword: async (req, res) => {
      const userId = parseInt(req.params.id);
      const { oldPassword, newPassword } = req.body;

      if (req.user.userId !== userId) {
        return res
          .status(403)
          .json({ error: "Bạn không có quyền thay đổi mật khẩu này." });
      }

      try {
        const result = await pool.query(
          "SELECT password FROM users WHERE id = $1",
          [userId]
        );
        if (result.rows.length === 0) {
          return res.status(404).json({ error: "Người dùng không tồn tại." });
        }

        const user = result.rows[0];
        const match = await bcrypt.compare(oldPassword, user.password);
        if (!match) {
          return res.status(400).json({ error: "Mật khẩu cũ không đúng." });
        }

        const hashedNewPassword = await bcrypt.hash(newPassword, 10);
        await pool.query("UPDATE users SET password = $1 WHERE id = $2", [
          hashedNewPassword,
          userId,
        ]);

        res.json({ message: "Đổi mật khẩu thành công." });
      } catch (error) {
        res.status(500).json({ error: "Lỗi server: " + error.message });
      }
    },

    // Gửi OTP qua email
    sendOTP: async (req, res) => {
      const { email } = req.body;
      if (!email) return res.status(400).json({ error: "Email là bắt buộc." });

      try {
        const userResult = await pool.query(
          "SELECT id FROM users WHERE email = $1",
          [email]
        );
        if (userResult.rows.length === 0) {
          return res.status(404).json({ error: "Email không tồn tại." });
        }

        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        otpStore.set(email, { otp, expiresAt: Date.now() + 5 * 60 * 1000 });

        const subject = "Mã OTP đặt lại mật khẩu của bạn";
        const text = `Mã OTP của bạn là: ${otp}. Mã có hiệu lực trong 5 phút. Nếu bạn không yêu cầu, vui lòng bỏ qua email này.`;

        await sendEmail(email, subject, text);

        res.json({ message: "OTP đã được gửi đến email." });
      } catch (error) {
        res
          .status(500)
          .json({ error: "Lỗi server khi gửi OTP: " + error.message });
      }
    },

    // Xác thực OTP
    verifyOTP: (req, res) => {
      const { email, otp } = req.body;
      if (!email || !otp)
        return res.status(400).json({ error: "Email và OTP là bắt buộc." });

      const record = otpStore.get(email);
      if (!record)
        return res
          .status(400)
          .json({ error: "OTP không hợp lệ hoặc đã hết hạn." });

      if (record.expiresAt < Date.now()) {
        otpStore.delete(email);
        return res.status(400).json({ error: "OTP đã hết hạn." });
      }

      if (record.otp !== otp) {
        return res.status(400).json({ error: "OTP không chính xác." });
      }

      res.json({ message: "Xác thực OTP thành công." });
    },

    // Đặt lại mật khẩu
    resetPassword: async (req, res) => {
      const { email, otp, newPassword } = req.body;
      if (!email || !otp || !newPassword) {
        return res
          .status(400)
          .json({ error: "Email, OTP và mật khẩu mới là bắt buộc." });
      }

      const record = otpStore.get(email);
      if (!record)
        return res
          .status(400)
          .json({ error: "OTP không hợp lệ hoặc đã hết hạn." });

      if (record.expiresAt < Date.now()) {
        otpStore.delete(email);
        return res.status(400).json({ error: "OTP đã hết hạn." });
      }

      if (record.otp !== otp) {
        return res.status(400).json({ error: "OTP không chính xác." });
      }

      try {
        const userResult = await pool.query(
          "SELECT id FROM users WHERE email = $1",
          [email]
        );
        if (userResult.rows.length === 0) {
          return res.status(404).json({ error: "Email không tồn tại." });
        }

        const hashedPassword = await bcrypt.hash(newPassword, 10);
        await pool.query("UPDATE users SET password = $1 WHERE email = $2", [
          hashedPassword,
          email,
        ]);

        otpStore.delete(email);

        res.json({ message: "Đặt lại mật khẩu thành công." });
      } catch (error) {
        res
          .status(500)
          .json({
            error: "Lỗi server khi cập nhật mật khẩu: " + error.message,
          });
      }
    },

    // Tạo nhân viên mới
    createEmployee: async (req, res) => {
      const {
        name,
        email,
        phone,
        gender,
        birthdate,
        password,
        role,
        identity_card,
        workplace,
      } = req.body;

      if (role !== "employee") {
        return res
          .status(400)
          .json({ error: "Chỉ được tạo tài khoản với role là employee" });
      }

      try {
        const hashedPassword = await bcrypt.hash(password, 10);
        const result = await pool.query(
          `INSERT INTO users (name, email, phone, gender, birthdate, password, role, identity_card, workplace)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
           RETURNING id, name, email, phone, gender, birthdate, role, identity_card, workplace`,
          [
            name,
            email,
            phone,
            gender,
            birthdate,
            hashedPassword,
            role,
            identity_card,
            workplace,
          ]
        );

        res
          .status(201)
          .json({
            message: "Tạo nhân viên thành công",
            employee: result.rows[0],
          });
      } catch (error) {
        if (error.code === "23505") {
          if (error.detail.includes("email")) {
            return res.status(400).json({ error: "Email đã được sử dụng." });
          } else if (error.detail.includes("phone")) {
            return res
              .status(400)
              .json({ error: "Số điện thoại đã được sử dụng." });
          }
        }
        res
          .status(500)
          .json({ error: "Lỗi server khi tạo nhân viên: " + error.message });
      }
    },

    // Cập nhật nhân viên
    updateEmployee: async (req, res) => {
      const employeeId = parseInt(req.params.id);
      const {
        name,
        email,
        phone,
        gender,
        birthdate,
        identity_card,
        workplace,
      } = req.body;

      try {
        const result = await pool.query(
          `UPDATE users SET name=$1, email=$2, phone=$3, gender=$4, birthdate=$5, identity_card=$6, workplace=$7
           WHERE id=$8 AND role='employee'
           RETURNING id, name, email, phone, gender, birthdate, role, identity_card, workplace`,
          [
            name,
            email,
            phone,
            gender,
            birthdate,
            identity_card,
            workplace,
            employeeId,
          ]
        );

        if (result.rowCount === 0) {
          return res
            .status(404)
            .json({
              error: "Nhân viên không tồn tại hoặc không phải nhân viên",
            });
        }

        res.json({
          message: "Cập nhật nhân viên thành công",
          employee: result.rows[0],
        });
      } catch (error) {
        if (error.code === "23505") {
          if (error.detail.includes("email")) {
            return res.status(400).json({ error: "Email đã được sử dụng." });
          } else if (error.detail.includes("phone")) {
            return res
              .status(400)
              .json({ error: "Số điện thoại đã được sử dụng." });
          }
        }
        res
          .status(500)
          .json({
            error: "Lỗi server khi cập nhật nhân viên: " + error.message,
          });
      }
    },

    // Xóa nhân viên
    deleteEmployee: async (req, res) => {
      const employeeId = parseInt(req.params.id);

      try {
        const result = await pool.query(
          "DELETE FROM users WHERE id = $1 AND role = 'employee'",
          [employeeId]
        );

        if (result.rowCount === 0) {
          return res
            .status(404)
            .json({
              error: "Nhân viên không tồn tại hoặc không phải nhân viên",
            });
        }

        res.json({ message: "Xóa nhân viên thành công" });
      } catch (error) {
        res
          .status(500)
          .json({ error: "Lỗi server khi xóa nhân viên: " + error.message });
      }
    },

    // Lấy danh sách nhân viên
    getAllEmployees: async (req, res) => {
      try {
        const result = await pool.query(
          "SELECT id, name, email, phone, gender, birthdate, role, identity_card, workplace FROM users WHERE role = 'employee' ORDER BY id"
        );
        res.json({ employees: result.rows });
      } catch (error) {
        res.status(500).json({
          error: "Lỗi server khi lấy danh sách nhân viên: " + error.message,
        });
      }
    },
  };
};
