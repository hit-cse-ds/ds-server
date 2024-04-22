import { isAuthenticate } from './../middleware/auth';
import express from 'express';
import { authorizeRoles } from './../middleware/auth';
import { activateMarCategory, activateMoocs, addMarCategory, allStudentDetails, deactivateMoocs, deleteMarCategory, editMarCategory,  editMoocsCourse,  getAllMarData,  getAllMoocsData,  getMarListAdmin, getMoocsListAdmin, moocsMarStatistics, rejectMarDocument, rejectMoocsDocument, rejectStudent, singleStudentDetail, verifyMarDocument, verifyMoocsDocument, verifyStudent } from '../controllers/admin.controller';
import { createMoocsCourse } from '../controllers/admin.controller';

const adminRouter = express.Router();

// Account ------------------------------
adminRouter.get("/all-student-details",isAuthenticate,authorizeRoles("admin"),allStudentDetails);

adminRouter.get("/single-student-details/:id",isAuthenticate,authorizeRoles("admin"),singleStudentDetail);

adminRouter.put("/account-verify/:id", isAuthenticate,authorizeRoles("admin"), verifyStudent);

adminRouter.put("/account-reject/:id", isAuthenticate,authorizeRoles("admin"), rejectStudent);




//create moocs course list ------------------------
adminRouter.post("/create-moocs-course", isAuthenticate,authorizeRoles("admin"), createMoocsCourse);

adminRouter.get("/moocs-course-list", isAuthenticate,authorizeRoles("admin"), getMoocsListAdmin);

adminRouter.put("/edit-moocs-category/:id", isAuthenticate,authorizeRoles("admin"), editMoocsCourse);

adminRouter.put("/activate-moocs-course/:id", isAuthenticate,authorizeRoles("admin"), activateMoocs);

adminRouter.put("/deactivate-moocs-course/:id", isAuthenticate, authorizeRoles("admin"), deactivateMoocs);


// Dashboard Statistics -------------------------
adminRouter.get("/moocs-mar-statistics/:year", isAuthenticate, authorizeRoles("admin"), moocsMarStatistics);







// Mar Category  --------------------------------
adminRouter.post("/add-mar-category", isAuthenticate,authorizeRoles("admin"), addMarCategory);

adminRouter.get("/mar-category", isAuthenticate,authorizeRoles("admin"), getMarListAdmin);

adminRouter.put("/edit-mar-category/:id", isAuthenticate,authorizeRoles("admin"), editMarCategory);

adminRouter.put("/activate-mar-category/:id", isAuthenticate,authorizeRoles("admin"), activateMarCategory);

adminRouter.put("/deactivate-mar-category/:id", isAuthenticate,authorizeRoles("admin"), deleteMarCategory);



// Moocs ------------------ 
adminRouter.get("/all-moocs-list", isAuthenticate,authorizeRoles("admin"), getAllMoocsData  );

adminRouter.put("/moocs-verify/:id", isAuthenticate,authorizeRoles("admin"), verifyMoocsDocument );

adminRouter.put("/moocs-reject/:id", isAuthenticate,authorizeRoles("admin"), rejectMoocsDocument );



// Mar ------------------------
adminRouter.get("/all-mar-list", isAuthenticate,authorizeRoles("admin"), getAllMarData  );

adminRouter.put("/mar-verify/:id", isAuthenticate,authorizeRoles("admin"), verifyMarDocument );

adminRouter.put("/mar-reject/:id", isAuthenticate,authorizeRoles("admin"), rejectMarDocument );


export default adminRouter;