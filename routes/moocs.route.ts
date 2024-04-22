import { isAuthenticate } from "../middleware/auth";
import express from "express";
import {
  deleteMoocs,
  
  editMoocs,
  
  getMoocsList,
  getMyMoocs,
  uploadMoocs,
} from "../controllers/mocs.controller";
import { authorizeRoles } from "../middleware/auth";

const moocsRouter = express.Router();

moocsRouter.post("/upload-moocs", isAuthenticate, uploadMoocs);

// moocsRouter.post(
//   "/edit-moocs",
//   isAuthenticate,
//   authorizeRoles("admin"),
//   editMocs
// );

moocsRouter.get("/my-moocs", isAuthenticate, getMyMoocs);
moocsRouter.get("/moocs-list", isAuthenticate, getMoocsList);
moocsRouter.put("/edit-moocs/:id", isAuthenticate, editMoocs);
moocsRouter.delete("/delete-moocs/:id", isAuthenticate, deleteMoocs);

export default moocsRouter;
