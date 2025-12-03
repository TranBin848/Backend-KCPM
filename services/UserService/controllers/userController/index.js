const signup = require("./signup");
const login = require("./login");
const getAllUsers = require("./getAllUsers");
const getUserById = require("./getUserById");
const updateUser = require("./updateUser");
const changePassword = require("./changePassword");
const sendOTP = require("./sendOTP");
const verifyOTP = require("./verifyOTP");
const resetPassword = require("./resetPassword");
const createEmployee = require("./createEmployee");
const updateEmployee = require("./updateEmployee");
const deleteEmployee = require("./deleteEmployee");
const getAllEmployees = require("./getAllEmployees");

/**
 * User Controller Factory
 * Exports a function that accepts dependencies and returns all handler functions
 * @param {Object} dependencies - { pool, bcrypt, jwt, otpStore, sendEmail }
 * @returns {Object} Object containing all controller methods
 */
module.exports = ({ pool, bcrypt, jwt, otpStore, sendEmail }) => {
  return {
    signup: signup({ pool, bcrypt }),
    login: login({ pool, bcrypt, jwt }),
    getAllUsers: getAllUsers({ pool }),
    getUserById: getUserById({ pool }),
    updateUser: updateUser({ pool }),
    changePassword: changePassword({ pool, bcrypt }),
    sendOTP: sendOTP({ pool, otpStore, sendEmail }),
    verifyOTP: verifyOTP({ otpStore }),
    resetPassword: resetPassword({ pool, bcrypt, otpStore }),
    createEmployee: createEmployee({ pool, bcrypt }),
    updateEmployee: updateEmployee({ pool }),
    deleteEmployee: deleteEmployee({ pool }),
    getAllEmployees: getAllEmployees({ pool }),
  };
};
