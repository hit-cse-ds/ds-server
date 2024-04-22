import { Document } from "mongoose";
import ErrorHandler from "../utlis/ErrorHandler";
import { CatchAsyncError } from "../middleware/CatchAsyncError";
import { NextFunction, Request, Response } from "express";
import cloudinary from "cloudinary";
import { create } from "domain";

import { moocsCourseModel, moocsModel } from "../models/moocs.model";
import { categoryModel } from "../models/mar.model";
import userModel from "../models/user.model";
import nodemailer from "nodemailer";
import ejs from "ejs";
import path from "path";
import sendMail from "../utlis/sendMail";
import { marModel } from "../models/mar.model";

// export const allStudentDetails = CatchAsyncError(
//   async (req: Request, res: Response, next: NextFunction) => {
//     try {
//       const allStudentDetails = await userModel.find().sort({ createdAt: -1 });

//       // Convert Mongoose documents to plain JavaScript objects
//       const plainStudentDetails = allStudentDetails.map((student) =>
//         student.toObject()
//       );

//       // Modify isVerified property to 'active' or 'inactive' and rename to 'status'
//       const modifiedDetails = plainStudentDetails.map((student) => ({
//         ...student,
//         status: student.isVerfied ? "active" : "inactive",
//       }));

//       // Remove the isVerified property from the modified details
//       const detailsWithoutIsVerified = modifiedDetails.map(
//         ({ isVerfied, ...rest }) => rest
//       );

//       res.status(201).json({
//         success: true,
//         allStudentDetails: detailsWithoutIsVerified,
//       });
//     } catch (error: any) {
//       return next(new ErrorHandler(error.message, 400));
//     }
//   }
// );

// get all details of the student :-
export const allStudentDetails = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const allStudentDetails = await userModel
        .find({ role: "user" })
        .populate({
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
        })
        .populate({
          path: "mar",
          populate: [
            {
              path: "marCategory",
              model: "MarCategory",
            },
          ],
        })
        .sort({ createdAt: -1 });

      // Convert Mongoose documents to plain JavaScript objects
      const plainStudentDetails = allStudentDetails.map((student) =>
        student.toObject()
      );

      // Modify isVerified property to 'active' or 'inactive' and rename to 'status'
      const modifiedDetails = plainStudentDetails.map((student) => ({
        ...student,
        status: student.isVerfied ? "active" : "inactive",
      }));

      // Remove the isVerified property from the modified details
      const detailsWithoutIsVerified = modifiedDetails.map(
        ({ isVerfied, ...rest }) => rest
      );

      // Calculate total MOOCs credits for each user
      const usersWithMoocsCredits = detailsWithoutIsVerified.map((student) => {
        let totalMoocsCredits = 0;
        let moocsStatus = "verified";
        if (student.moocs.length === 0) {
          moocsStatus = "not submitted";
        } else {
          student.moocs.forEach((mooc: any) => {
            if (mooc.status === "rejected") {
              moocsStatus = "rejected";
            } else if (mooc.status === "pending") {
              moocsStatus = "pending";
            }
            if (mooc.status === "verified") {
              totalMoocsCredits += mooc.moocsCourse.credit;
            }
          });
        }
        return { ...student, totalMoocs: totalMoocsCredits, moocsStatus };
      });

      // Add perMarPoints when the status of MAR is verified
      const usersWithMARPointsAndStatus = usersWithMoocsCredits.map(
        (student) => {
          let totalMarPoints = 0;
          let marStatus = "verified";
          if (student.mar.length === 0) {
            marStatus = "not submitted";
          } else {
            student.mar.forEach((mar: any) => {
              if (mar.status === "rejected") {
                marStatus = "rejected";
              } else if (mar.status === "pending") {
                marStatus = "pending";
              }
              if (mar.status === "verified") {
                totalMarPoints += mar.marCategory.perMarPoints;
              }
            });
          }
          return { ...student, totalMar: totalMarPoints, marStatus };
        }
      );

      res.status(201).json({
        success: true,
        allStudentDetails: usersWithMARPointsAndStatus,
      });
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 400));
    }
  }
);

// get single student detail.
export const singleStudentDetail = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const id = req.params.id;
      const singleStudent = await userModel
        .findById(id)
        .populate({
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
        })
        .populate({
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

      if (!singleStudent) {
        return next(new ErrorHandler("Not record found!", 400));
      }
      res.status(201).json({
        success: true,
        singleStudent,
      });
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 400));
    }
  }
);

// verify student (when student register for first time)

export const verifyStudent = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const student = await userModel.findById(req.params.id);
      if (!student) {
        return next(new Error("User not found"));
      }
      if (student.isVerfied) {
        return next(new Error("Already verified!"));
      }
      if (!student.isVerfied) {
        student.isVerfied = true;
      }
      await student.save();
      const { email } = req.body;
      if (email) {
        const data = { user: { name: student.name } };

        const html = await ejs.renderFile(
          path.join(__dirname, "../mails/account-verification-mail.ejs"),
          data
        );

        try {
          await sendMail({
            email: student.email,
            subject: "Account verification mail",
            template: "account-verification-mail.ejs",
            data,
          });

          res.status(201).json({
            success: true,
            message: `An email notification has been sent to the registered email : ${student.email}`,
          });
        } catch (error: any) {
          return next(new ErrorHandler(error.message, 400));
        }
      }

      res.status(201).json({
        success: true,
        message: `Account verified !`,
      });
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 400));
    }
  }
);

// Reject  student by admin and send mail (optional)
export const rejectStudent = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const student = await userModel.findById(req.params.id);
      if (!student) {
        return next(new Error("User not found"));
      }
      if (!student.isVerfied) {
        return next(new Error("Already not verified!"));
      }
      if (student.isVerfied) {
        student.isVerfied = false;
      }
      await student.save();
      const { email, reason } = req.body;
      if (email) {
        const data = { user: { name: student.name }, reason };

        const html = await ejs.renderFile(
          path.join(__dirname, "../mails/account-rejection-mail.ejs"),
          data
        );

        try {
          await sendMail({
            email: student.email,
            subject: "Account Rejection mail",
            template: "account-rejection-mail.ejs",
            data,
          });
          res.status(201).json({
            success: true,
            message: `An email notification has been sent to the registered email : ${student.email}`,
          });
        } catch (error: any) {
          return next(new ErrorHandler(error.message, 400));
        }
      }
      res.status(201).json({
        success: true,
        message: `Account Deativated!`,
      });
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 400));
    }
  }
);

// edit moocs course add or remove moocs list and credit

export const createMoocsCourse = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { title, platform, credit } = req.body;
      if (!title) {
        return next(new ErrorHandler("Enter Course Title", 400));
      }
      if (!platform) {
        return next(new ErrorHandler("Enter Course Platform", 400));
      }
      if (!credit) {
        return next(new ErrorHandler("Enter Course Credit", 400));
      }

      const data = {
        title: title,
        platform: platform,
        credit: credit,
      };

      const moocsCourse = await moocsCourseModel.create(data);
      res.status(201).json({
        success: true,
        moocsCourse,
      });
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 400));
    }
  }
);

// edit moocs list by admin
export const editMoocsCourse = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const courseId = req.params.id;
      const { title, platform, credit } = req.body;

      if (!title) {
        return next(new ErrorHandler("Enter Course Title", 400));
      }
      if (!platform) {
        return next(new ErrorHandler("Enter Course Platform", 400));
      }
      if (!credit) {
        return next(new ErrorHandler("Enter Course Credit", 400));
      }

      const updatedCourse = await moocsCourseModel.findByIdAndUpdate(
        courseId,
        {
          title: title,
          platform: platform,
          credit: credit,
        },
        { new: true }
      );

      if (!updatedCourse) {
        return next(new Error("Course not found"));
      }

      res.status(200).json({
        success: true,
        updatedCourse,
      });
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 400));
    }
  }
);

// edit mar list :-
export const editMAR = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const marId = req.params.id;
      const { title, year, category, points } = req.body;

      if (!title) {
        return next(new ErrorHandler("Enter MAR Title", 400));
      }
      if (!year) {
        return next(new ErrorHandler("Enter MAR Year", 400));
      }
      if (!category) {
        return next(new ErrorHandler("Enter MAR Category", 400));
      }
      if (!points) {
        return next(new ErrorHandler("Enter MAR Points", 400));
      }

      const updatedMAR = await marModel.findByIdAndUpdate(
        marId,
        {
          title: title,
          year: year,
          category: category,
          points: points,
        },
        { new: true }
      );

      if (!updatedMAR) {
        return next(new Error("MAR not found"));
      }

      res.status(200).json({
        success: true,
        updatedMAR,
      });
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 400));
    }
  }
);

//  delete moocs list :-

export const deleteMoocsCourse = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const courseId = req.params.id;
      const updatedCourse = await moocsCourseModel.findByIdAndUpdate(
        courseId,
        { isActive: false },
        { new: true }
      );

      if (!updatedCourse) {
        return next(new Error("Course not found"));
      }

      res.status(200).json({
        success: true,
        message: "Course deactivated successfully",
      });
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 400));
    }
  }
);

//  delete mar list :-
export const deactivateMAR = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const marId = req.params.id;
      const updatedMAR = await marModel.findByIdAndUpdate(
        marId,
        { isActive: false },
        { new: true }
      );

      if (!updatedMAR) {
        return next(new Error("MAR not found"));
      }

      res.status(200).json({
        success: true,
        message: "MAR deactivated successfully",
      });
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 400));
    }
  }
);

// Add MarCategory by admin
export const addMarCategory = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { category, perMarPoints, maximumMarPoints } = req.body;

      // Validate input fields
      if (!category) {
        return next(new ErrorHandler("Enter Category Name", 400));
      }
      if (!perMarPoints) {
        return next(new ErrorHandler("Enter Per Mar Points", 400));
      }
      if (!maximumMarPoints) {
        return next(new ErrorHandler("Enter Maximum Mar Points", 400));
      }
      const maxFile = maximumMarPoints / perMarPoints;
      // Create a new MarCategory
      const newMarCategory = await categoryModel.create({
        category,
        perMarPoints,
        maximumMarPoints,
        maxFile,
      });

      // Return success response
      res.status(201).json({
        success: true,
        message: "MarCategory added successfully",
        newMarCategory,
      });
    } catch (error: any) {
      // Handle errors
      return next(new ErrorHandler(error.message, 400));
    }
  }
);

// eedit marcategory list :-

export const editMarCategory = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const categoryId = req.params.id;
      const { category, perMarPoints, maximumMarPoints } = req.body;

      // Validate input fields
      if (!category) {
        return next(new ErrorHandler("Enter Category Name", 400));
      }
      if (!perMarPoints) {
        return next(new ErrorHandler("Enter Per Mar Points", 400));
      }
      if (!maximumMarPoints) {
        return next(new ErrorHandler("Enter Maximum Mar Points", 400));
      }

      // Find and update MarCategory
      const updatedCategory = await categoryModel.findByIdAndUpdate(
        categoryId,
        {
          category: category,
          perMarPoints: perMarPoints,
          maximumMarPoints: maximumMarPoints,
        },
        { new: true }
      );

      // Check if the category exists
      if (!updatedCategory) {
        return next(new Error("Category not found"));
      }

      // Return success response
      res.status(200).json({
        success: true,
        updatedCategory,
      });
    } catch (error: any) {
      // Handle errors
      return next(new ErrorHandler(error.message, 400));
    }
  }
);

// delkete marcategory
// Soft delete MarCategory by admin
export const deleteMarCategory = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const categoryId = req.params.id;

      // Check if categoryId is provided
      if (!categoryId) {
        return next(new ErrorHandler("Category ID is required", 400));
      }

      // Update isActive field to false
      const updatedCategory = await categoryModel.findByIdAndUpdate(
        categoryId,
        { isActive: false },
        { new: true }
      );

      // If the category doesn't exist, return an error
      if (!updatedCategory) {
        return next(new ErrorHandler("Category not found", 404));
      }

      // Return success response
      res.status(200).json({
        success: true,
        message: "MarCategory soft deleted successfully",
        updatedCategory,
      });
    } catch (error: any) {
      // Handle errors
      return next(new ErrorHandler(error.message, 400));
    }
  }
);

// activate mar-category:-
export const activateMarCategory = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const categoryId = req.params.id;

      // Check if categoryId is
      if (!categoryId) {
        return next(new ErrorHandler("Category ID is required", 400));
      }

      // Update isActive field to false
      const updatedCategory = await categoryModel.findByIdAndUpdate(
        categoryId,
        { isActive: true },
        { new: true }
      );

      // If the category doesn't exist, return an error
      if (!updatedCategory) {
        return next(new ErrorHandler("Category not found", 404));
      }

      // Return success response
      res.status(200).json({
        success: true,
        message: "MarCategory soft activated successfully",
        updatedCategory,
      });
    } catch (error: any) {
      // Handle errors
      return next(new ErrorHandler(error.message, 400));
    }
  }
);

// activate moocs by admin:-

export const activateMoocs = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const categoryId = req.params.id;

      // Check if categoryId is provided
      if (!categoryId) {
        return next(new ErrorHandler("Category ID is required", 400));
      }

      // Update isActive field to true for the MOOCs category
      const updatedCategory = await moocsCourseModel.findByIdAndUpdate(
        categoryId,
        { isActive: true },
        { new: true }
      );

      // If the category doesn't exist, return an error
      if (!updatedCategory) {
        return next(new ErrorHandler("Category not found", 404));
      }

      // Return success response
      res.status(200).json({
        success: true,
        message: "MOOCs category activated successfully",
        updatedCategory,
      });
    } catch (error: any) {
      // Handle errors
      return next(new ErrorHandler(error.message, 400));
    }
  }
);

// deactivate moocs course :-
export const deactivateMoocs = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const categoryId = req.params.id;

      // Check if categoryId is provided
      if (!categoryId) {
        return next(new ErrorHandler("Category ID is required", 400));
      }

      // Update isActive field to false for the MOOCs category
      const updatedCategory = await moocsCourseModel.findByIdAndUpdate(
        categoryId,
        { isActive: false },
        { new: true }
      );

      // If the category doesn't exist, return an error
      if (!updatedCategory) {
        return next(new ErrorHandler("Category not found", 404));
      }

      // Return success response
      res.status(200).json({
        success: true,
        message: "MOOCs category deactivated successfully",
        updatedCategory,
      });
    } catch (error: any) {
      // Handle errors
      return next(new ErrorHandler(error.message, 400));
    }
  }
);

// verify mar list uplaoded by student:-
export const verifyMarDocument = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Find the MAR document by ID
      const marDoc = (await marModel
        .findById(req.params.id)
        .populate("user")) as any;
      if (!marDoc) {
        return next(new Error("MAR document not found"));
      }

      // Check if the MAR document is already verified
      if (marDoc.status === "verified") {
        return next(new Error("MAR document is already verified!"));
      }

      // If not verified, update the isVerified field to true
      marDoc.status = "verified";
      await marDoc.save();

      // Send notification email if requested
      const { email } = req.body;
      if (email) {
        const data = { marTitle: marDoc.title };

        const html = await ejs.renderFile(
          path.join(__dirname, "../mails/mar-verification-mail.ejs"),
          data
        );

        try {
          await sendMail({
            email: marDoc.user.email,
            subject: "MAR Document Verification",
            template: "mar-verification-mail.ejs",
            data,
          });

          return res.status(200).json({
            success: true,
            message: `MAR document "${marDoc.title}" has been successfully verified. An email notification has been sent.`,
          });
        } catch (error: any) {
          return next(new ErrorHandler(error.message, 400));
        }
      }

      // Respond with success message
      res.status(200).json({
        success: true,
        message: `MAR document "${marDoc.title}" has been successfully verified.`,
      });
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 400));
    }
  }
);

// verify moocs document :-
export const verifyMoocsDocument = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Find the MOOCs document by ID
      const moocsDoc = (await moocsModel
        .findById(req.params.id)
        .populate("user")
        .populate("moocsCourse")) as any;
      if (!moocsDoc) {
        return next(new Error("MOOCs document not found"));
      }

      // Check if the MOOCs document is already verified
      if (moocsDoc.status === "verified") {
        return next(new Error("MOOCs document is already verified!"));
      }

      // If not verified, update the isVerified field to true
      moocsDoc.status = "verified";
      await moocsDoc.save();

      // Send notification email if requested
      const { email } = req.body;
      if (email) {
        const data = { moocsTitle: moocsDoc.moocsCourse.title };

        const html = await ejs.renderFile(
          path.join(__dirname, "../mails/moocs-verification-mail.ejs"),
          data
        );

        try {
          await sendMail({
            email: moocsDoc.user.email,
            subject: "MOOCs Document Verification",
            template: "moocs-verification-mail.ejs",
            data,
          });

          return res.status(200).json({
            success: true,
            message: `MOOCs document "${moocsDoc.moocsCourse.title}" has been successfully verified. An email notification has been sent.`,
          });
        } catch (error: any) {
          return next(new ErrorHandler(error.message, 400));
        }
      }

      // Respond with success message
      res.status(200).json({
        success: true,
        message: `MOOCs document "${moocsDoc.moocsCourse.title}" has been successfully verified.`,
      });
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 400));
    }
  }
);

// get all moocs course list :- by admin
export const getMoocsListAdmin = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const moocsList = await moocsCourseModel.find().sort({ createdAt: -1 });

      // Convert Mongoose documents to plain JavaScript objects
      const plainMoocsListDetails = moocsList.map((moocs) => moocs.toObject());

      // Modify isVerified property to 'active' or 'inactive' and rename to 'status'
      const modifiedDetails = plainMoocsListDetails.map((moocs) => ({
        ...moocs,
        status: moocs.isActive ? "active" : "inactive",
      }));

      // Remove the isVerified property from the modified details
      const FinalMoocsList = modifiedDetails.map(
        ({ isActive, ...rest }) => rest
      );

      res.status(201).json({
        success: true,
        moocsList: FinalMoocsList,
      });
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 400));
    }
  }
);

//  get all mar list by admin :
export const getMarListAdmin = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const marList = await categoryModel.find().sort({ createdAt: -1 });

      // Convert Mongoose documents to plain JavaScript objects
      const plainMarListDetails = marList.map((mar) => mar.toObject());

      // Modify isVerified property to 'active' or 'inactive' and rename to 'status'
      const modifiedDetails = plainMarListDetails.map((mar) => ({
        ...mar,
        status: mar.isActive ? "active" : "inactive",
      }));

      // Remove the isVerified property from the modified details
      const FinalMarList = modifiedDetails.map(({ isActive, ...rest }) => rest);

      res.status(201).json({
        success: true,
        marList: FinalMarList,
      });
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 400));
    }
  }
);

// get moocs list uplaoded by student by admin :-
export const getAllMoocsData = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const moocsData = await moocsModel
        .find()
        .populate("user")
        .populate("moocsCourse")
        .populate("document");

      res.status(200).json({
        success: true,
        moocsData,
      });
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 400));
    }
  }
);

// get all mar data uploaded by student by admin
export const getAllMarData = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const marData = await marModel
        .find()
        .populate("user")
        .populate("marCategory")
        .populate("document");

      res.status(200).json({
        success: true,
        marData,
      });
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 400));
    }
  }
);

// reject moocs uploaded by student by admin
export const rejectMoocsDocument = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Find the MOOCs document by ID
      const moocsDoc = (await moocsModel
        .findById(req.params.id)
        .populate("user")
        .populate("moocsCourse")) as any;
      if (!moocsDoc) {
        return next(new Error("MOOCs document not found"));
      }

      // Check if the MOOCs document is already verified
      if (moocsDoc.status !== "verified") {
        return next(new Error("MOOCs document is already rejected!"));
      }

      // If not verified, update the isVerified field to true
      moocsDoc.status = "rejected";
      await moocsDoc.save();

      // Send notification email if requested
      const { email, reason } = req.body;
      if (email) {
        const data = { moocsTitle: moocsDoc.moocsCourse.title, reason: reason };

        const html = await ejs.renderFile(
          path.join(__dirname, "../mails/moocs-rejection-mail.ejs"),
          data
        );

        try {
          await sendMail({
            email: moocsDoc.user.email,
            subject: "MOOCs Document rejected",
            template: "moocs-rejection-mail.ejs",
            data,
          });

          return res.status(200).json({
            success: true,
            message: `MOOCs document "${moocsDoc.moocsCourse.title}" has been successfully rejected. An email notification has been sent.`,
          });
        } catch (error: any) {
          return next(new ErrorHandler(error.message, 400));
        }
      }

      // Respond with success message
      res.status(200).json({
        success: true,
        message: `MOOCs document "${moocsDoc.moocsCourse.title}" has been successfully rejected.`,
      });
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 400));
    }
  }
);

// rejecting mar document
export const rejectMarDocument = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Find the MOOCs document by ID
      const marDoc = (await marModel
        .findById(req.params.id)
        .populate("marCategory")
        .populate("user")) as any;
      if (!marDoc) {
        return next(new Error("MAR document not found"));
      }

      // Check if the MAR document is already rejected
      if (marDoc.status === "rejected") {
        return next(new Error("MAR document is already rejected!"));
      }

      // If not verified, update the isVerified field to true
      marDoc.status = "rejected";
      await marDoc.save();

      // Send notification email if requested
      const { email, reason } = req.body;
      if (email) {
        const data = { marTitle: marDoc.marCategory.category, reason: reason };

        const html = await ejs.renderFile(
          path.join(__dirname, "../mails/mar-rejection-mail.ejs"),
          data
        );

        try {
          await sendMail({
            email: marDoc.user.email,
            subject: "Mar Document rejected",
            template: "mar-rejection-mail.ejs",
            data,
          });

          return res.status(200).json({
            success: true,
            message: `MOOCs document "${marDoc.title}" has been successfully rejected. An email notification has been sent.`,
          });
        } catch (error: any) {
          return next(new ErrorHandler(error.message, 400));
        }
      }

      // Respond with success message
      res.status(200).json({
        success: true,
        message: `MOOCs document "${marDoc.title}" has been successfully rejected.`,
      });
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 400));
    }
  }
);

export const moocsMarStatistics = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const year: string = req.params.year;

      // Query the database to get user data for the specified year
      const userData = await userModel
        .find({ year: year })
        .populate({
          path: "moocs",
        })
        .populate({
          path: "mar",
        });

      // Initialize counters for different statuses
      let moocsVerifiedCount: number = 0;
      let moocsPendingCount: number = 0;
      let moocsRejectedCount: number = 0;
      let moocsNotSubmittedCount: number = 0;

      let marVerifiedCount: number = 0;
      let marPendingCount: number = 0;
      let marRejectedCount: number = 0;
      let marNotSubmittedCount: number = 0;

      // Iterate through user data and count statuses for MOOCs and MAR
      userData.forEach((user: any) => {
        if (user.role === "user") {
          // Count statuses for MOOCs
          if (user.moocs.length === 0) {
            moocsNotSubmittedCount++;
          } else {
            let allVerified: boolean = true;
            let hasPending: boolean = false;
            let hasRejected: boolean = false;
            user.moocs.forEach((mooc: any) => {
              switch (mooc.status) {
                case "verified":
                  break;
                case "pending":
                  allVerified = false;
                  moocsPendingCount++;
                  hasPending = true;
                  break;
                case "rejected":
                  allVerified = false;
                  moocsRejectedCount++;
                  hasRejected = true;
                  break;
              }
            });
            if (allVerified) {
              moocsVerifiedCount++;
            } else if (hasPending || !hasRejected) {
              moocsPendingCount--;
            }
          }

          // Count statuses for MAR
          if (user.mar.length === 0) {
            marNotSubmittedCount++;
          } else {
            let allVerified: boolean = true;
            let hasPending: boolean = false;
            let hasRejected: boolean = false;
            user.mar.forEach((mar: any) => {
              switch (mar.status) {
                case "verified":
                  break;
                case "pending":
                  allVerified = false;
                  marPendingCount++;
                  hasPending = true;
                  break;
                case "rejected":
                  allVerified = false;
                  marRejectedCount++;
                  hasRejected = true;
                  break;
              }
            });
            if (allVerified) {
              marVerifiedCount++;
            } else if (hasPending || !hasRejected) {
              marPendingCount--;
            }
          }
        }
      });

      // Return the counts in the response
      res.status(200).json({
        success: true,
        year: year,
        moocsCounts: [
          { name: "Verified", value: moocsVerifiedCount },
          { name: "Pending", value: moocsPendingCount },
          { name: "Rejected", value: moocsRejectedCount },
          { name: "Not Submitted", value: moocsNotSubmittedCount },
        ],
        marCounts: [
          { name: "Verified", value: marVerifiedCount },
          { name: "Pending", value: marPendingCount },
          { name: "Rejected", value: marRejectedCount },
          { name: "Not Submitted", value: marNotSubmittedCount },
        ],
      });
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 400));
    }
  }
);
