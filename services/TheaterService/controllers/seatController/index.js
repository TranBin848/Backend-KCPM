const generateSeats = require("./generateSeats");
const getSeatById = require("./getSeatById");
const getSeatsByRoom = require("./getSeatsByRoom");
const updateSeatType = require("./updateSeatType");
const updateSeatStatus = require("./updateSeatStatus");

// Controller Factory
module.exports = (dependencies) => ({
  generateSeats: generateSeats(dependencies),
  getSeatById: getSeatById(dependencies),
  getSeatsByRoom: getSeatsByRoom(dependencies),
  updateSeatType: updateSeatType(dependencies),
  updateSeatStatus: updateSeatStatus(dependencies),
});
