const express = require("express");
const router = express.Router();

module.exports = ({ userController, checkAuth, checkAdmin }) => {
  // Auth routes
  router.post("/signup", userController.signup);
  router.post("/login", userController.login);

  // Forgot password routes
  router.post("/forgot-password/send-otp", userController.sendOTP);
  router.post("/forgot-password/verify-otp", userController.verifyOTP);
  router.post("/forgot-password/reset-password", userController.resetPassword);

  // User routes
  router.get("/users", checkAuth, userController.getAllUsers);
  router.get("/users/:id", userController.getUserById);
  router.put("/users/:id", checkAuth, userController.updateUser);
  router.put(
    "/users/:id/change-password",
    checkAuth,
    userController.changePassword
  );

  // Employee routes (admin only)
  router.post(
    "/employees",
    checkAuth,
    checkAdmin,
    userController.createEmployee
  );
  router.put(
    "/employees/:id",
    checkAuth,
    checkAdmin,
    userController.updateEmployee
  );
  router.delete(
    "/employees/:id",
    checkAuth,
    checkAdmin,
    userController.deleteEmployee
  );
  router.get(
    "/employees",
    checkAuth,
    checkAdmin,
    userController.getAllEmployees
  );

  return router;
};
