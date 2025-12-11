/**
 * MovieController Factory - combines all movie handlers
 */
const getAllMovies = require("./getAllMovies");
const getMovieById = require("./getMovieById");
const createMovie = require("./createMovie");
const updateMovie = require("./updateMovie");
const deleteMovie = require("./deleteMovie");

module.exports = ({ Movie }) => {
  return {
    getAllMovies: getAllMovies({ Movie }),
    getMovieById: getMovieById({ Movie }),
    createMovie: createMovie({ Movie }),
    updateMovie: updateMovie({ Movie }),
    deleteMovie: deleteMovie({ Movie }),
  };
};
