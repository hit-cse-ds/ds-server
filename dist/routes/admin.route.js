"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const auth_1 = require("./../middleware/auth");
const express_1 = __importDefault(require("express"));
const auth_2 = require("./../middleware/auth");
const admin_controller_1 = require("../controllers/admin.controller");
const admin_controller_2 = require("../controllers/admin.controller");
const adminRouter = express_1.default.Router();
// Account ------------------------------
adminRouter.get("/all-student-details", auth_1.isAuthenticate, (0, auth_2.authorizeRoles)("admin"), admin_controller_1.allStudentDetails);
adminRouter.get("/single-student-details/:id", auth_1.isAuthenticate, (0, auth_2.authorizeRoles)("admin"), admin_controller_1.singleStudentDetail);
adminRouter.put("/account-verify/:id", auth_1.isAuthenticate, (0, auth_2.authorizeRoles)("admin"), admin_controller_1.verifyStudent);
adminRouter.put("/account-reject/:id", auth_1.isAuthenticate, (0, auth_2.authorizeRoles)("admin"), admin_controller_1.rejectStudent);
//create moocs course list ------------------------
adminRouter.post("/create-moocs-course", auth_1.isAuthenticate, (0, auth_2.authorizeRoles)("admin"), admin_controller_2.createMoocsCourse);
adminRouter.get("/moocs-course-list", auth_1.isAuthenticate, (0, auth_2.authorizeRoles)("admin"), admin_controller_1.getMoocsListAdmin);
adminRouter.put("/edit-moocs-category/:id", auth_1.isAuthenticate, (0, auth_2.authorizeRoles)("admin"), admin_controller_1.editMoocsCourse);
adminRouter.put("/activate-moocs-course/:id", auth_1.isAuthenticate, (0, auth_2.authorizeRoles)("admin"), admin_controller_1.activateMoocs);
adminRouter.put("/deactivate-moocs-course/:id", auth_1.isAuthenticate, (0, auth_2.authorizeRoles)("admin"), admin_controller_1.deactivateMoocs);
// Dashboard Statistics -------------------------
adminRouter.get("/moocs-mar-statistics/:year", auth_1.isAuthenticate, (0, auth_2.authorizeRoles)("admin"), admin_controller_1.moocsMarStatistics);
// Mar Category  --------------------------------
adminRouter.post("/add-mar-category", auth_1.isAuthenticate, (0, auth_2.authorizeRoles)("admin"), admin_controller_1.addMarCategory);
adminRouter.get("/mar-category", auth_1.isAuthenticate, (0, auth_2.authorizeRoles)("admin"), admin_controller_1.getMarListAdmin);
adminRouter.put("/edit-mar-category/:id", auth_1.isAuthenticate, (0, auth_2.authorizeRoles)("admin"), admin_controller_1.editMarCategory);
adminRouter.put("/activate-mar-category/:id", auth_1.isAuthenticate, (0, auth_2.authorizeRoles)("admin"), admin_controller_1.activateMarCategory);
adminRouter.put("/deactivate-mar-category/:id", auth_1.isAuthenticate, (0, auth_2.authorizeRoles)("admin"), admin_controller_1.deleteMarCategory);
// Moocs ------------------ 
adminRouter.get("/all-moocs-list", auth_1.isAuthenticate, (0, auth_2.authorizeRoles)("admin"), admin_controller_1.getAllMoocsData);
adminRouter.put("/moocs-verify/:id", auth_1.isAuthenticate, (0, auth_2.authorizeRoles)("admin"), admin_controller_1.verifyMoocsDocument);
adminRouter.put("/moocs-reject/:id", auth_1.isAuthenticate, (0, auth_2.authorizeRoles)("admin"), admin_controller_1.rejectMoocsDocument);
// Mar ------------------------
adminRouter.get("/all-mar-list", auth_1.isAuthenticate, (0, auth_2.authorizeRoles)("admin"), admin_controller_1.getAllMarData);
adminRouter.put("/mar-verify/:id", auth_1.isAuthenticate, (0, auth_2.authorizeRoles)("admin"), admin_controller_1.verifyMarDocument);
adminRouter.put("/mar-reject/:id", auth_1.isAuthenticate, (0, auth_2.authorizeRoles)("admin"), admin_controller_1.rejectMarDocument);
exports.default = adminRouter;
//# sourceMappingURL=admin.route.js.map