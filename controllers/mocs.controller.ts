import { Document } from "mongoose";
import ErrorHandler from "../utlis/ErrorHandler";
import { CatchAsyncError } from "../middleware/CatchAsyncError";
import { NextFunction, Request, Response } from "express";
import cloudinary from "cloudinary";
import {
  documentsModel,
  moocsCourseModel,
  moocsModel,
} from "../models/moocs.model";
import userModel from "../models/user.model";
import multer from "multer";
import fs from "fs";
import { redis } from "../utlis/redis";

const storage = multer.memoryStorage();
const upload = multer({ storage: storage }).single("file");

interface IMoocsUpload {
  title: string;
  startDate: Date;
  endDate: Date;
  year: number;
  verificationUrl: string;
}

export const uploadMoocs = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      upload(req, res, async (err: any) => {
        if (err) {
          return next(new ErrorHandler("File upload failed", 400));
        }
        try {
          const { title, startDate, endDate, year, verificationUrl } =
            req.body as IMoocsUpload;

          // Find moocs course id by title
          const course = await moocsCourseModel.findById(title);

          if (!course) {
            return next(new ErrorHandler("Course not found", 400));
          }
          const user = await userModel.findById(req.user?._id);

          if (!user) {
            return next(new ErrorHandler("User not found", 400));
          }

          // Check if the user has already uploaded the MOOCs
          const existingMoocs = await moocsModel.findOne({
            user: user._id,
            moocsCourse: course._id,
          });

          if (existingMoocs) {
            return next(new ErrorHandler("You have already uploaded this MOOCs", 400));
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
            folder: "Document_Moocs",
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

          const moocsDocument = await documentsModel.create(documentData);
          const data = {
            user: user._id,
            moocsCourse: course._id,
            startDate: startDate,
            endDate: endDate,
            year: year,
            document: moocsDocument._id,
            verificationUrl: verificationUrl,
          };

          const moocs = await moocsModel.create(data);

          user.moocs.push(moocs._id);
          await user.save();
          await redis.set(req.user?._id, JSON.stringify(user));

          res.status(201).json({
            success: true,
            moocs,
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


// get my moocs list
export const getMyMoocs = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = await userModel.findById(req.user?._id).populate({
        path: "moocs",
        populate: [
          {
            path: "moocsCourse",
            model: "MoocsCourse",
          },
          {
            path: "document",
            model: "MoocsDocuments",
          },
        ],
      });

      if (!user) {
        return next(new ErrorHandler("User not found", 400));
      }

      const moocs = user.moocs as any;

      // Calculate total credit points of verified Moocs entries
      let totalCreditPoints = 0;
      moocs.forEach((mooc : any) => {
        if (mooc.status === "verified") { // Ensure mooc is properly typed as MoocsDocument
          totalCreditPoints += mooc.moocsCourse.credit;
        }
      });
      if(user.totalMoocs!==totalCreditPoints){
        user.totalMoocs=totalCreditPoints;
        await user.save();
        await redis.set(req.user?._id, JSON.stringify(user));
      }

      res.status(200).json({
        success: true,
        totalCreditPoints,
        moocs,
      });
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 400));
    }
  }
);

// edit moocs
// export const editMocs = CatchAsyncError(
//   async (req: Request, res: Response, next: NextFunction) => {
//     try {
//       const data = req.body;
//       const document = data.document;
//       if (document) {
//         await cloudinary.v2.uploader.destroy(document.public_id);
//         const myCloud = await cloudinary.v2.uploader.upload(document, {
//           folder: "Document_Moocs",
//         });

//         data.document = {
//           public_id: myCloud.public_id,
//           url: myCloud.secure_url,
//         };
//       }

//       const mocsId = req.params.id;
//       const mocs = await moocsModel.findByIdAndUpdate(
//         mocsId,
//         {
//           $set: data,
//         },
//         { new: true }
//       );
//       res.status(201).json({
//         success: true,
//         mocs,
//       });
//     } catch (error: any) {
//       return next(new ErrorHandler(error.message, 400));
//     }
//   }
// );

//create moocs course (admin only)


// get all moocs list 
export const getMoocsList = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {

      const  moocsList =  await moocsCourseModel.find({ isActive: true }).select('id platform title credit').sort({ createdAt: -1 });
     
        res.status(201).json({
          success: true,
          moocsList,
        });
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 400));
    }
  }
);

// edit moocs list by user 

export const editMoocs = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      
      const moocsId = req.params.id;
      const { title, startDate, endDate, year, verificationUrl } = req.body;

      // Find the Moocs document by its ID
      const moocs = await moocsModel.findById(moocsId);
      
      if(moocs?.status === 'verified' ){
        return next(new ErrorHandler("You can change verified Document , Kindly approach to HOD", 400));

      }
      if (!moocs) {
        return next(new ErrorHandler("Moocs document not found", 404));
      }

      // Update the fields if they're provided in the request body
      if (title) {
        // Find the moocs course id by title
        const course = await moocsCourseModel.findById(title);
        if (!course) {
          return next(new ErrorHandler("Course not found", 400));
        }
        moocs.moocsCourse = course._id;
      }
      if (startDate) {
        moocs.startDate = startDate;
      }
      if (endDate) {
        moocs.endDate = endDate;
      }
      if (year) {
        moocs.year = year;
      }
      if (verificationUrl) {
        moocs.verificationUrl = verificationUrl;
      }

      // Save the updated Moocs document
      await moocs.save();

      res.status(200).json({
        success: true,
        message: "Moocs document updated successfully",
        moocs,
      });
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 400));
    }
  }
);

export const deleteMoocs = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const moocsId = req.params.id as any;

      // Find the Moocs entry by its ID
      const moocs = await moocsModel.findById(moocsId);
      if (!moocs) {
        return next(new ErrorHandler("Moocs entry not found", 404));
      }

      

      // Check if the logged-in user is the owner of the Moocs entry
      if (moocs.user.toString() !== req.user?._id.toString()) {
        return next(new ErrorHandler("You are not authorized to delete this Moocs entry", 403));
      }

      // Check if the Moocs entry status is "verified"
      if (moocs.status === "verified") {
        return next(new ErrorHandler("Cannot delete a verified Moocs entry", 403));
      }

      // Delete the document from Cloudinary
      const document = await documentsModel.findById(moocs.document);
      if (document) {
        await cloudinary.v2.uploader.destroy(document.public_id);
        await document.deleteOne();
      }

      // Delete the Moocs entry from the database
      await moocs.deleteOne();

      // Remove the Moocs entry ID from the user's moocs array
      const user = await userModel.findById(req.user?._id);
      if (user) {
        const index = user.moocs.indexOf(moocsId);
        if (index !== -1) {
          user.moocs.splice(index, 1);
          await user.save();
          await redis.set(req.user?._id, JSON.stringify(user));
        }
      }

      res.status(200).json({
        success: true,
        message: "Moocs entry and associated document deleted successfully",
      });
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 400));
    }
  }
);





