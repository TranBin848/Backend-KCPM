const roundUpToQuarterHour = require("./roundUpToQuarterHour");

// Tạo nhiều suất chiếu tự động
const generateShowtimes = ({
  Showtime,
  fetchMovieById,
  fetchRoomsByTheater,
}) => {
  return async (req, res) => {
    const {
      theaterId,
      movieId,
      startDate,
      endDate,
      showtimesPerDay = [],
      priceRegular,
      priceVIP,
      priceRegularWeekend,
      priceVIPWeekend,
      showtimeType,
    } = req.body;

    if (
      !theaterId ||
      !movieId ||
      !startDate ||
      !endDate ||
      showtimesPerDay.length === 0
    ) {
      return res.status(400).json({ error: "Thiếu thông tin bắt buộc" });
    }

    const session = await Showtime.startSession();
    session.startTransaction();

    try {
      const movie = await fetchMovieById(movieId);
      if (!movie) {
        await session.abortTransaction();
        return res.status(404).json({ error: "Không tìm thấy phim" });
      }

      let rooms = await fetchRoomsByTheater(theaterId);
      if (!rooms || rooms.length === 0) {
        await session.abortTransaction();
        return res.status(404).json({ error: "Không tìm thấy phòng" });
      }

      let expectedRoomType = null;
      if (showtimeType.includes("2D")) expectedRoomType = "2D";
      else if (showtimeType.includes("3D")) expectedRoomType = "3D";
      else if (showtimeType.includes("IMAX")) expectedRoomType = "IMAX";

      rooms = rooms.filter((room) => room.room_type === expectedRoomType);

      if (rooms.length === 0) {
        await session.abortTransaction();
        return res.status(400).json({
          error: `Không có phòng phù hợp với định dạng ${showtimeType}`,
        });
      }

      const durationMs = (movie.duration + 5) * 60 * 1000;
      const createdShowtimes = [];

      //code sau fixed
      const start = new Date(startDate);
      start.setHours(0,0,0,0); // Ensure midnight
      const end = new Date(endDate);
      end.setHours(23,59,59,999); // Cover full end day

      for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
        const date = new Date(d);

        for (const timeStr of showtimesPerDay) {
          const [hour, minute] = timeStr.split(":").map(Number);
          const startTime = new Date(date);
          startTime.setHours(hour, minute, 0, 0);

          const rawEnd = new Date(startTime.getTime() + durationMs);
          const endTime = roundUpToQuarterHour(rawEnd);

          // Lấy thứ trong tuần theo giờ VN (0: Chủ nhật, 6: Thứ 7)
          const vnDay = new Date(
            startTime.toLocaleString("en-US", { timeZone: "Asia/Ho_Chi_Minh" })
          ).getDay();
          const isWeekend = vnDay === 0 || vnDay === 6;

          const finalPriceRegular =
            isWeekend && priceRegularWeekend
              ? priceRegularWeekend
              : priceRegular;
          const finalPriceVIP =
            isWeekend && priceVIPWeekend ? priceVIPWeekend : priceVIP;

          // Kiểm tra duplicate
          const duplicate = await Showtime.findOne({
            "movie.movieId": movieId,
            showtimeType,
            date,
            startTime,
            "theater.theaterId": theaterId,
          });

          if (duplicate) {
            await session.abortTransaction();
            return res.status(409).json({
              error: `Suất ${timeStr} ngày ${
                date.toISOString().split("T")[0]
              } đã tồn tại.`,
            });
          }

          let added = false;

          for (const room of rooms) {
            const conflict = await Showtime.findOne({
              "room.roomId": room.id,
              date: date,
              startTime: { $lt: endTime },
              endTime: { $gt: startTime },
            });

            const isConflictInSession = createdShowtimes.some(
              (st) =>
                st.room.roomId === room.id &&
                st.date.toISOString().slice(0, 10) ===
                  date.toISOString().slice(0, 10) &&
                !(endTime <= st.startTime || startTime >= st.endTime)
            );

            if (!conflict && !isConflictInSession) {
              const newShowtime = new Showtime({
                movie: {
                  movieId,
                  title: movie.title,
                  duration: movie.duration,
                },
                theater: {
                  theaterId,
                  theaterName: room.name,
                },
                room: {
                  roomId: room.id,
                  roomName: room.room_name,
                },
                startTime,
                endTime,
                date: new Date(date),
                priceRegular: finalPriceRegular,
                priceVIP: finalPriceVIP,
                showtimeType,
              });

              await newShowtime.save({ session });
              createdShowtimes.push(newShowtime);
              added = true;
              break;
            }
          }

          if (!added) {
            await session.abortTransaction();
            return res.status(409).json({
              error: `Không thể thêm suất ${timeStr} ngày ${
                date.toISOString().split("T")[0]
              }: Không còn phòng trống phù hợp (${expectedRoomType})`,
            });
          }
        }
      }

      await session.commitTransaction();
      session.endSession();

      return res.status(201).json({
        message: "Tạo tất cả suất chiếu thành công",
        createdShowtimes,
      });
    } catch (error) {
      await session.abortTransaction();
      session.endSession();
      console.error("Lỗi khi tạo suất chiếu:", error);
      return res
        .status(500)
        .json({ error: "Lỗi hệ thống khi tạo suất chiếu" });
    }
  };
};

module.exports = generateShowtimes;

