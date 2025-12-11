// Controller factory for PromotionService route handlers
// Exports a function that accepts dependencies and returns handler functions.
const getAllPromotions = require("./promotionController/getAllPromotions");
const getPromotionById = require("./promotionController/getPromotionById");
const createPromotion = require("./promotionController/createPromotion");
const updatePromotion = require("./promotionController/updatePromotion");
const deletePromotion = require("./promotionController/deletePromotion");

module.exports = ({ Promotion }) => {
  return {
    getAllPromotions: getAllPromotions({ Promotion }),
    getPromotionById: getPromotionById({ Promotion }),
    createPromotion: createPromotion({ Promotion }),
    updatePromotion: updatePromotion({ Promotion }),
    deletePromotion: deletePromotion({ Promotion }),
  };
};
