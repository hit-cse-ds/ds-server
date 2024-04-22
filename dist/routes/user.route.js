"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const auth_1 = require("./../middleware/auth");
const express_1 = __importDefault(require("express"));
const user_controller_1 = require("../controllers/user.controller");
const userRouter = express_1.default.Router();
userRouter.post('/registration', user_controller_1.registrationUser);
userRouter.post('/activate-user', user_controller_1.activateUser);
userRouter.post('/login', user_controller_1.loginUser);
userRouter.get('/logout', auth_1.isAuthenticate, user_controller_1.logoutUser);
userRouter.get("/refresh", user_controller_1.updateAccessToken);
userRouter.get("/me", auth_1.isAuthenticate, user_controller_1.getUserInfo);
userRouter.put("/update-user-info", auth_1.isAuthenticate, user_controller_1.updateUserInfo);
userRouter.put("/update-user-password", auth_1.isAuthenticate, user_controller_1.updatePassword);
exports.default = userRouter;
//# sourceMappingURL=user.route.js.map