import { deleteMAR,  getMyMar, getVerifiedMarCategories, uploadMAR } from "../controllers/mar.controller";
import { isAuthenticate } from "../middleware/auth";
import express from "express";


const marRouter = express.Router();

marRouter.post("/upload-mar", isAuthenticate, uploadMAR);
marRouter.get("/mar-list", isAuthenticate, getMyMar );
marRouter.delete("/delete-mar/:id", isAuthenticate, deleteMAR );
marRouter.get("/mar-category-list", isAuthenticate, getVerifiedMarCategories );








export default marRouter;