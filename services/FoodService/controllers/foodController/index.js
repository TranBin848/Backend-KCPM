const getAllFoods = require("./getAllFoods");
const getFoodById = require("./getFoodById");
const createFood = require("./createFood");
const updateFood = require("./updateFood");
const deleteFood = require("./deleteFood");

/**
 * Food Controller Factory
 * Exports a function that accepts dependencies and returns all handler functions
 * @param {Object} dependencies - { Food } - Mongoose Food model
 * @returns {Object} Object containing all controller methods
 */
module.exports = ({ Food }) => {
  return {
    getAllFoods: getAllFoods({ Food }),
    getFoodById: getFoodById({ Food }),
    createFood: createFood({ Food }),
    updateFood: updateFood({ Food }),
    deleteFood: deleteFood({ Food }),
  };
};
