const createRoom = require("./createRoom");
const updateRoom = require("./updateRoom");
const deleteRoom = require("./deleteRoom");
const getRoomsByTheater = require("./getRoomsByTheater");

module.exports = ({ pool }) => {
  return {
    createRoom: createRoom({ pool }),
    updateRoom: updateRoom({ pool }),
    deleteRoom: deleteRoom({ pool }),
    getRoomsByTheater: getRoomsByTheater({ pool }),
  };
};
