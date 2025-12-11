const getAllTheaters = require("./getAllTheaters");
const getTheaterById = require("./getTheaterById");
const getTheaterGallery = require("./getTheaterGallery");
const createTheater = require("./createTheater");
const updateTheater = require("./updateTheater");
const deleteTheater = require("./deleteTheater");

module.exports = (dependencies) => ({
  getAllTheaters: getAllTheaters(dependencies),
  getTheaterById: getTheaterById(dependencies),
  getTheaterGallery: getTheaterGallery(dependencies),
  createTheater: createTheater(dependencies),
  updateTheater: updateTheater(dependencies),
  deleteTheater: deleteTheater(dependencies),
});
