import { Document } from "mongoose";
import ErrorHandler from "../utlis/ErrorHandler";
import { CatchAsyncError } from "../middleware/CatchAsyncError";
import { NextFunction, Request, Response } from "express";
import cloudinary from "cloudinary";

import {
  categoryModel,
  documentsModel,
  
  marModel,
} from "../models/mar.model";
import userModel from "../models/user.model";
import multer from "multer";
import fs from "fs";
import { redis } from "../utlis/redis";

const storage = multer.memoryStorage();
const upload = multer({ storage: storage }).single("file");

// Define IMARUpload interface
interface IMARUpload {
  title: string;
  year: number;
  category: string; // Assuming category is an ObjectId
  date: string;
}

// Uplaod Mar points
export const uploadMAR = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      upload(req, res, async (err: any) => {
        if (err) {
          return next(new ErrorHandler("File upload failed", 400));
        }
        try {
          const { title, year, category, date } = req.body as IMARUpload;

          // Check if the user exists
          const user = await userModel.findById(req.user?._id);
          if (!user) {
            return next(new ErrorHandler("User not found", 400));
          }

          // Check if the user has already uploaded MAR with the same title
          const existingMAR = await marModel.findOne({
            user: user._id,
            title: title,
          });

          if (existingMAR) {
            return next(
              new ErrorHandler(
                "You have already uploaded MAR with this title",
                400
              )
            );
          }

          const file = req.file; // Access the uploaded file
          if (!file) {
            return next(new ErrorHandler("No file uploaded", 400));
          }

          // Create a temporary file path
          const tempFilePath = `temp_${Date.now()}_${file.originalname}`;

          // Write the buffer to the temporary file
          fs.writeFileSync(tempFilePath, file.buffer);

          // Upload temporary file to Cloudinary
          const myCloud = await cloudinary.v2.uploader.upload(tempFilePath, {
            folder: "Document_MAR",
          });

          // Delete the temporary file
          fs.unlinkSync(tempFilePath);

          const documentData = {
            user: user._id,
            public_id: myCloud.public_id,
            url: myCloud.secure_url,
            pageCount: myCloud.pages,
            size: myCloud.bytes,
            format: myCloud.format,
          };

          // Retrieve category data
          const categoryData = await categoryModel.findById(category);
          if (!categoryData) {
            return next(new ErrorHandler("Category not found", 404));
          }

          // Check if the student has already crossed the maxFile limit in the selected category
          const existingMARsInCategory = await marModel.countDocuments({
            user: user._id,
            marCategory: category,
          });

          if (existingMARsInCategory >= categoryData.maxFile) {
            return next(
              new ErrorHandler(
                `You have already uploaded the maximum number of files in this category`,
                400
              )
            );
          }

          const points = categoryData.perMarPoints;
          const marDocument = await documentsModel.create(documentData);

          // Calculate current MAR points within the category
          const currentCategoryPoints = await marModel.aggregate([
            {
              $match: {
                marCategory: category,
                user: user._id,
              },
            },
            {
              $group: {
                _id: null,
                totalPoints: { $sum: "$points" },
              },
            },
          ]);

          // Get maximum MAR points allowed for the category from the database
          const maxCategoryPoints = categoryData.maximumMarPoints;

          // Calculate overall MAR points collected across all categories
          const overallPoints = await marModel.aggregate([
            {
              $match: {
                user: user._id,
              },
            },
            {
              $group: {
                _id: null,
                totalPoints: { $sum: "$points" },
              },
            },
          ]);

          // Check if adding new points exceeds the maximum allowed
          if (
            currentCategoryPoints[0]?.totalPoints + points >
            (maxCategoryPoints ?? Number.MAX_VALUE)
          ) {
            return next(
              new ErrorHandler(
                `Adding ${points} MAR points exceeds the maximum allowed for category ${category}`,
                400
              )
            );
          }

          const data = {
            user: user._id,
            title: title,
            year: year,
            marCategory: category,
            certificateDate: date,
            document: marDocument._id,
            points: points, // Add points to the data
          };

          const mar = await marModel.create(data);

          // Push the newly created MAR document ID to the user's mar array
          user.mar.push(mar._id);
          await user.save();
          await redis.set(req.user?._id, JSON.stringify(user));

          res.status(201).json({
            success: true,
            mar,
            overallPoints: overallPoints[0]?.totalPoints ?? 0, // Return overall MAR points collected
          });
        } catch (error: any) {
          return next(new ErrorHandler(error.message, 400));
        }
      });
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 400));
    }
  }
);

export const deleteMAR = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const marId = req.params.id as any;

      // Find the MAR entry by its ID
      const mar = await marModel.findById(marId);
      if (!mar) {
        return next(new ErrorHandler("MAR entry not found", 404));
      }

      // Check if the logged-in user is the owner of the MAR entry
      if (mar.user.toString() !== req.user?._id.toString()) {
        return next(
          new ErrorHandler(
            "You are not authorized to delete this MAR entry",
            403
          )
        );
      }

      // Check if the Moocs entry status is "verified"
      if (mar.status === "verified") {
        return next(new ErrorHandler("Cannot delete a verified Mar entry", 403));
      }

      // Delete the document from Cloudinary
      const document = await documentsModel.findById(mar.document);
      if (document) {
        await cloudinary.v2.uploader.destroy(document.public_id);
        await document.deleteOne();
      }

      // Delete the MAR entry from the database
      await mar.deleteOne();

      const user = await userModel.findById(req.user?._id);
      if (user) {
        const index = user.mar.indexOf(marId);
        if (index !== -1) {
          user.mar.splice(index, 1);
          await user.save();
          await redis.set(req.user?._id, JSON.stringify(user));
        }
      }

      res.status(200).json({
        success: true,
        message: "MAR entry and associated document deleted successfully",
      });
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 400));
    }
  }
);

// get all mar point list
export const getMyMar = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = await userModel.findById(req.user?._id).populate({
        path: "mar",
        populate: [
          {
            path: "marCategory",
            model: "MarCategory",
          },
          {
            path: "document",
            model: "MarDocuments",
          },
        ],
      });

      if (!user) {
        return next(new ErrorHandler("User not found", 400));
      }

      const mar = user.mar as any;

      // Calculate total credit points of verified Moocs entries
      let totalMarPoints = 0;
      mar.forEach((mar: any) => {
        if (mar.status === "verified") {
          // Ensure mooc is properly typed as MoocsDocument
          totalMarPoints += mar.marCategory.perMarPoints;
        }
      });

      if(user.totalMar!==totalMarPoints){
        user.totalMar=totalMarPoints;
        await user.save();
        await redis.set(req.user?._id, JSON.stringify(user));
      }

      res.status(200).json({
        success: true,
        totalMarPoints,
        mar,
      });
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 400));
    }
  }
);

//  get category list :-
export const getVerifiedMarCategories = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Fetch verified MAR categories from the database
      const categories = await categoryModel.find({ isActive: true });

      res.status(200).json({
        success: true,
        categories
      });
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 400));
    }
  }
);

