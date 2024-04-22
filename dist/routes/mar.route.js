"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mar_controller_1 = require("../controllers/mar.controller");
const auth_1 = require("../middleware/auth");
const express_1 = __importDefault(require("express"));
const marRouter = express_1.default.Router();
marRouter.post("/upload-mar", auth_1.isAuthenticate, mar_controller_1.uploadMAR);
marRouter.get("/mar-list", auth_1.isAuthenticate, mar_controller_1.getMyMar);
marRouter.delete("/delete-mar/:id", auth_1.isAuthenticate, mar_controller_1.deleteMAR);
marRouter.get("/mar-category-list", auth_1.isAuthenticate, mar_controller_1.getVerifiedMarCategories);
exports.default = marRouter;
//# sourceMappingURL=mar.route.js.map