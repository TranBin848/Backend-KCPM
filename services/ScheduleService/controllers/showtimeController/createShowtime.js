const roundUpToQuarterHour = require("./roundUpToQuarterHour");

// Tạo suất chiếu đơn lẻ
const createShowtime = ({ Showtime, fetchMovieById, fetchRoomsByTheater }) => {
  return async (req, res) => {
    const {
      theaterId,
      roomId,
      movieId,
      date,
      startTime,
      priceRegular,
      priceVIP,
      showtimeType,
    } = req.body;

    // Kiểm tra thiếu thông tin bắt buộc
    if (
      !theaterId ||
      !roomId ||
      !movieId ||
      !date ||
      !startTime ||
      priceRegular == null ||
      priceVIP == null ||
      !showtimeType
    ) {
      return res.status(400).json({
        error:
          "Thiếu thông tin bắt buộc (theaterId, roomId, movieId, date, startTime, priceRegular, priceVIP)",
      });
    }

    //code sau fixed
    if (Number(priceRegular) < 0 || Number(priceVIP) < 0) {
        return res.status(400).json({ error: "Giá vé không được nhỏ hơn 0" });
    }

    try {
      const movie = await fetchMovieById(movieId);
      if (!movie) {
        return res
          .status(400)
          .json({ error: "Không tìm thấy thông tin phim" });
      }

      // Gọi sang TheaterService để xác thực room thuộc theater
      const rooms = await fetchRoomsByTheater(theaterId);
      const room = rooms.find((r) => r.id === roomId);

      if (!room) {
        return res
          .status(400)
          .json({ error: "Phòng không thuộc rạp này hoặc không tồn tại" });
      }

      // Tính thời gian bắt đầu
      const [hour, minute] = startTime.split(":").map(Number);
      const start = new Date(date);
      start.setHours(hour, minute, 0, 0);

      // Tính thời gian kết thúc: duration + 5 phút, rồi làm tròn
      const durationInMs = movie.duration * 60 * 1000;
      const rawEnd = new Date(start.getTime() + durationInMs + 5 * 60 * 1000);
      let end = roundUpToQuarterHour(rawEnd);

      // Giới hạn thời gian kết thúc không quá 02:00 hôm sau
      const maxEnd = new Date(start);
      maxEnd.setDate(maxEnd.getDate() + 1);
      maxEnd.setHours(2, 0, 0, 0);

      if (end > maxEnd) {
        end = new Date(maxEnd);
      }

      // Kiểm tra trùng lịch chiếu trong cùng phòng, cùng ngày
      const conflict = await Showtime.findOne({
        "room.roomId": roomId,
        date: new Date(date),
        $or: [{ startTime: { $lt: end }, endTime: { $gt: start } }],
      });

      if (conflict) {
        return res.status(409).json({
          error:
            "Trùng lịch chiếu! Phòng này đã có suất chiếu trong khoảng thời gian này",
        });
      }

      // Tạo showtime và lưu vào MongoDB
      const newShowtime = new Showtime({
        movie: {
          movieId: movieId,
          title: movie.title,
          duration: movie.duration,
        },
        theater: {
          theaterId: theaterId,
          theaterName: room.name,
        },
        room: {
          roomId: roomId,
          roomName: room.room_name,
        },
        startTime: start,
        endTime: end,
        date: new Date(date),
        priceRegular: priceRegular,
        priceVIP: priceVIP,
        showtimeType: showtimeType,
      });

      await newShowtime.save();

      res.status(201).json({
        message: "Tạo suất chiếu thành công",
        showtime: newShowtime,
      });
    } catch (error) {
      console.error("Lỗi khi tạo suất chiếu:", error.message);
      res.status(500).json({ error: "Lỗi khi tạo suất chiếu" });
    }
  };
};

module.exports = createShowtime;

