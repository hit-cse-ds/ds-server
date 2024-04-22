"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const auth_1 = require("../middleware/auth");
const express_1 = __importDefault(require("express"));
const mocs_controller_1 = require("../controllers/mocs.controller");
const moocsRouter = express_1.default.Router();
moocsRouter.post("/upload-moocs", auth_1.isAuthenticate, mocs_controller_1.uploadMoocs);
// moocsRouter.post(
//   "/edit-moocs",
//   isAuthenticate,
//   authorizeRoles("admin"),
//   editMocs
// );
moocsRouter.get("/my-moocs", auth_1.isAuthenticate, mocs_controller_1.getMyMoocs);
moocsRouter.get("/moocs-list", auth_1.isAuthenticate, mocs_controller_1.getMoocsList);
moocsRouter.put("/edit-moocs/:id", auth_1.isAuthenticate, mocs_controller_1.editMoocs);
moocsRouter.delete("/delete-moocs/:id", auth_1.isAuthenticate, mocs_controller_1.deleteMoocs);
exports.default = moocsRouter;
//# sourceMappingURL=moocs.route.js.map