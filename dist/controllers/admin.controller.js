"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.moocsMarStatistics = exports.rejectMarDocument = exports.rejectMoocsDocument = exports.getAllMarData = exports.getAllMoocsData = exports.getMarListAdmin = exports.getMoocsListAdmin = exports.verifyMoocsDocument = exports.verifyMarDocument = exports.deactivateMoocs = exports.activateMoocs = exports.activateMarCategory = exports.deleteMarCategory = exports.editMarCategory = exports.addMarCategory = exports.deactivateMAR = exports.deleteMoocsCourse = exports.editMAR = exports.editMoocsCourse = exports.createMoocsCourse = exports.rejectStudent = exports.verifyStudent = exports.singleStudentDetail = exports.allStudentDetails = void 0;
const ErrorHandler_1 = __importDefault(require("../utlis/ErrorHandler"));
const CatchAsyncError_1 = require("../middleware/CatchAsyncError");
const moocs_model_1 = require("../models/moocs.model");
const mar_model_1 = require("../models/mar.model");
const user_model_1 = __importDefault(require("../models/user.model"));
const ejs_1 = __importDefault(require("ejs"));
const path_1 = __importDefault(require("path"));
const sendMail_1 = __importDefault(require("../utlis/sendMail"));
const mar_model_2 = require("../models/mar.model");
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
exports.allStudentDetails = (0, CatchAsyncError_1.CatchAsyncError)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const allStudentDetails = yield user_model_1.default
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
        const plainStudentDetails = allStudentDetails.map((student) => student.toObject());
        // Modify isVerified property to 'active' or 'inactive' and rename to 'status'
        const modifiedDetails = plainStudentDetails.map((student) => (Object.assign(Object.assign({}, student), { status: student.isVerfied ? "active" : "inactive" })));
        // Remove the isVerified property from the modified details
        const detailsWithoutIsVerified = modifiedDetails.map((_a) => {
            var { isVerfied } = _a, rest = __rest(_a, ["isVerfied"]);
            return rest;
        });
        // Calculate total MOOCs credits for each user
        const usersWithMoocsCredits = detailsWithoutIsVerified.map((student) => {
            let totalMoocsCredits = 0;
            let moocsStatus = "verified";
            if (student.moocs.length === 0) {
                moocsStatus = "not submitted";
            }
            else {
                student.moocs.forEach((mooc) => {
                    if (mooc.status === "rejected") {
                        moocsStatus = "rejected";
                    }
                    else if (mooc.status === "pending") {
                        moocsStatus = "pending";
                    }
                    if (mooc.status === "verified") {
                        totalMoocsCredits += mooc.moocsCourse.credit;
                    }
                });
            }
            return Object.assign(Object.assign({}, student), { totalMoocs: totalMoocsCredits, moocsStatus });
        });
        // Add perMarPoints when the status of MAR is verified
        const usersWithMARPointsAndStatus = usersWithMoocsCredits.map((student) => {
            let totalMarPoints = 0;
            let marStatus = "verified";
            if (student.mar.length === 0) {
                marStatus = "not submitted";
            }
            else {
                student.mar.forEach((mar) => {
                    if (mar.status === "rejected") {
                        marStatus = "rejected";
                    }
                    else if (mar.status === "pending") {
                        marStatus = "pending";
                    }
                    if (mar.status === "verified") {
                        totalMarPoints += mar.marCategory.perMarPoints;
                    }
                });
            }
            return Object.assign(Object.assign({}, student), { totalMar: totalMarPoints, marStatus });
        });
        res.status(201).json({
            success: true,
            allStudentDetails: usersWithMARPointsAndStatus,
        });
    }
    catch (error) {
        return next(new ErrorHandler_1.default(error.message, 400));
    }
}));
// get single student detail.
exports.singleStudentDetail = (0, CatchAsyncError_1.CatchAsyncError)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const id = req.params.id;
        const singleStudent = yield user_model_1.default
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
            return next(new ErrorHandler_1.default("Not record found!", 400));
        }
        res.status(201).json({
            success: true,
            singleStudent,
        });
    }
    catch (error) {
        return next(new ErrorHandler_1.default(error.message, 400));
    }
}));
// verify student (when student register for first time)
exports.verifyStudent = (0, CatchAsyncError_1.CatchAsyncError)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const student = yield user_model_1.default.findById(req.params.id);
        if (!student) {
            return next(new Error("User not found"));
        }
        if (student.isVerfied) {
            return next(new Error("Already verified!"));
        }
        if (!student.isVerfied) {
            student.isVerfied = true;
        }
        yield student.save();
        const { email } = req.body;
        if (email) {
            const data = { user: { name: student.name } };
            const html = yield ejs_1.default.renderFile(path_1.default.join(__dirname, "../mails/account-verification-mail.ejs"), data);
            try {
                yield (0, sendMail_1.default)({
                    email: student.email,
                    subject: "Account verification mail",
                    template: "account-verification-mail.ejs",
                    data,
                });
                res.status(201).json({
                    success: true,
                    message: `An email notification has been sent to the registered email : ${student.email}`,
                });
            }
            catch (error) {
                return next(new ErrorHandler_1.default(error.message, 400));
            }
        }
        res.status(201).json({
            success: true,
            message: `Account verified !`,
        });
    }
    catch (error) {
        return next(new ErrorHandler_1.default(error.message, 400));
    }
}));
// Reject  student by admin and send mail (optional)
exports.rejectStudent = (0, CatchAsyncError_1.CatchAsyncError)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const student = yield user_model_1.default.findById(req.params.id);
        if (!student) {
            return next(new Error("User not found"));
        }
        if (!student.isVerfied) {
            return next(new Error("Already not verified!"));
        }
        if (student.isVerfied) {
            student.isVerfied = false;
        }
        yield student.save();
        const { email, reason } = req.body;
        if (email) {
            const data = { user: { name: student.name }, reason };
            const html = yield ejs_1.default.renderFile(path_1.default.join(__dirname, "../mails/account-rejection-mail.ejs"), data);
            try {
                yield (0, sendMail_1.default)({
                    email: student.email,
                    subject: "Account Rejection mail",
                    template: "account-rejection-mail.ejs",
                    data,
                });
                res.status(201).json({
                    success: true,
                    message: `An email notification has been sent to the registered email : ${student.email}`,
                });
            }
            catch (error) {
                return next(new ErrorHandler_1.default(error.message, 400));
            }
        }
        res.status(201).json({
            success: true,
            message: `Account Deativated!`,
        });
    }
    catch (error) {
        return next(new ErrorHandler_1.default(error.message, 400));
    }
}));
// edit moocs course add or remove moocs list and credit
exports.createMoocsCourse = (0, CatchAsyncError_1.CatchAsyncError)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { title, platform, credit } = req.body;
        if (!title) {
            return next(new ErrorHandler_1.default("Enter Course Title", 400));
        }
        if (!platform) {
            return next(new ErrorHandler_1.default("Enter Course Platform", 400));
        }
        if (!credit) {
            return next(new ErrorHandler_1.default("Enter Course Credit", 400));
        }
        const data = {
            title: title,
            platform: platform,
            credit: credit,
        };
        const moocsCourse = yield moocs_model_1.moocsCourseModel.create(data);
        res.status(201).json({
            success: true,
            moocsCourse,
        });
    }
    catch (error) {
        return next(new ErrorHandler_1.default(error.message, 400));
    }
}));
// edit moocs list by admin
exports.editMoocsCourse = (0, CatchAsyncError_1.CatchAsyncError)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const courseId = req.params.id;
        const { title, platform, credit } = req.body;
        if (!title) {
            return next(new ErrorHandler_1.default("Enter Course Title", 400));
        }
        if (!platform) {
            return next(new ErrorHandler_1.default("Enter Course Platform", 400));
        }
        if (!credit) {
            return next(new ErrorHandler_1.default("Enter Course Credit", 400));
        }
        const updatedCourse = yield moocs_model_1.moocsCourseModel.findByIdAndUpdate(courseId, {
            title: title,
            platform: platform,
            credit: credit,
        }, { new: true });
        if (!updatedCourse) {
            return next(new Error("Course not found"));
        }
        res.status(200).json({
            success: true,
            updatedCourse,
        });
    }
    catch (error) {
        return next(new ErrorHandler_1.default(error.message, 400));
    }
}));
// edit mar list :-
exports.editMAR = (0, CatchAsyncError_1.CatchAsyncError)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const marId = req.params.id;
        const { title, year, category, points } = req.body;
        if (!title) {
            return next(new ErrorHandler_1.default("Enter MAR Title", 400));
        }
        if (!year) {
            return next(new ErrorHandler_1.default("Enter MAR Year", 400));
        }
        if (!category) {
            return next(new ErrorHandler_1.default("Enter MAR Category", 400));
        }
        if (!points) {
            return next(new ErrorHandler_1.default("Enter MAR Points", 400));
        }
        const updatedMAR = yield mar_model_2.marModel.findByIdAndUpdate(marId, {
            title: title,
            year: year,
            category: category,
            points: points,
        }, { new: true });
        if (!updatedMAR) {
            return next(new Error("MAR not found"));
        }
        res.status(200).json({
            success: true,
            updatedMAR,
        });
    }
    catch (error) {
        return next(new ErrorHandler_1.default(error.message, 400));
    }
}));
//  delete moocs list :-
exports.deleteMoocsCourse = (0, CatchAsyncError_1.CatchAsyncError)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const courseId = req.params.id;
        const updatedCourse = yield moocs_model_1.moocsCourseModel.findByIdAndUpdate(courseId, { isActive: false }, { new: true });
        if (!updatedCourse) {
            return next(new Error("Course not found"));
        }
        res.status(200).json({
            success: true,
            message: "Course deactivated successfully",
        });
    }
    catch (error) {
        return next(new ErrorHandler_1.default(error.message, 400));
    }
}));
//  delete mar list :-
exports.deactivateMAR = (0, CatchAsyncError_1.CatchAsyncError)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const marId = req.params.id;
        const updatedMAR = yield mar_model_2.marModel.findByIdAndUpdate(marId, { isActive: false }, { new: true });
        if (!updatedMAR) {
            return next(new Error("MAR not found"));
        }
        res.status(200).json({
            success: true,
            message: "MAR deactivated successfully",
        });
    }
    catch (error) {
        return next(new ErrorHandler_1.default(error.message, 400));
    }
}));
// Add MarCategory by admin
exports.addMarCategory = (0, CatchAsyncError_1.CatchAsyncError)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { category, perMarPoints, maximumMarPoints } = req.body;
        // Validate input fields
        if (!category) {
            return next(new ErrorHandler_1.default("Enter Category Name", 400));
        }
        if (!perMarPoints) {
            return next(new ErrorHandler_1.default("Enter Per Mar Points", 400));
        }
        if (!maximumMarPoints) {
            return next(new ErrorHandler_1.default("Enter Maximum Mar Points", 400));
        }
        const maxFile = maximumMarPoints / perMarPoints;
        // Create a new MarCategory
        const newMarCategory = yield mar_model_1.categoryModel.create({
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
    }
    catch (error) {
        // Handle errors
        return next(new ErrorHandler_1.default(error.message, 400));
    }
}));
// eedit marcategory list :-
exports.editMarCategory = (0, CatchAsyncError_1.CatchAsyncError)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const categoryId = req.params.id;
        const { category, perMarPoints, maximumMarPoints } = req.body;
        // Validate input fields
        if (!category) {
            return next(new ErrorHandler_1.default("Enter Category Name", 400));
        }
        if (!perMarPoints) {
            return next(new ErrorHandler_1.default("Enter Per Mar Points", 400));
        }
        if (!maximumMarPoints) {
            return next(new ErrorHandler_1.default("Enter Maximum Mar Points", 400));
        }
        // Find and update MarCategory
        const updatedCategory = yield mar_model_1.categoryModel.findByIdAndUpdate(categoryId, {
            category: category,
            perMarPoints: perMarPoints,
            maximumMarPoints: maximumMarPoints,
        }, { new: true });
        // Check if the category exists
        if (!updatedCategory) {
            return next(new Error("Category not found"));
        }
        // Return success response
        res.status(200).json({
            success: true,
            updatedCategory,
        });
    }
    catch (error) {
        // Handle errors
        return next(new ErrorHandler_1.default(error.message, 400));
    }
}));
// delkete marcategory
// Soft delete MarCategory by admin
exports.deleteMarCategory = (0, CatchAsyncError_1.CatchAsyncError)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const categoryId = req.params.id;
        // Check if categoryId is provided
        if (!categoryId) {
            return next(new ErrorHandler_1.default("Category ID is required", 400));
        }
        // Update isActive field to false
        const updatedCategory = yield mar_model_1.categoryModel.findByIdAndUpdate(categoryId, { isActive: false }, { new: true });
        // If the category doesn't exist, return an error
        if (!updatedCategory) {
            return next(new ErrorHandler_1.default("Category not found", 404));
        }
        // Return success response
        res.status(200).json({
            success: true,
            message: "MarCategory soft deleted successfully",
            updatedCategory,
        });
    }
    catch (error) {
        // Handle errors
        return next(new ErrorHandler_1.default(error.message, 400));
    }
}));
// activate mar-category:-
exports.activateMarCategory = (0, CatchAsyncError_1.CatchAsyncError)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const categoryId = req.params.id;
        // Check if categoryId is
        if (!categoryId) {
            return next(new ErrorHandler_1.default("Category ID is required", 400));
        }
        // Update isActive field to false
        const updatedCategory = yield mar_model_1.categoryModel.findByIdAndUpdate(categoryId, { isActive: true }, { new: true });
        // If the category doesn't exist, return an error
        if (!updatedCategory) {
            return next(new ErrorHandler_1.default("Category not found", 404));
        }
        // Return success response
        res.status(200).json({
            success: true,
            message: "MarCategory soft activated successfully",
            updatedCategory,
        });
    }
    catch (error) {
        // Handle errors
        return next(new ErrorHandler_1.default(error.message, 400));
    }
}));
// activate moocs by admin:-
exports.activateMoocs = (0, CatchAsyncError_1.CatchAsyncError)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const categoryId = req.params.id;
        // Check if categoryId is provided
        if (!categoryId) {
            return next(new ErrorHandler_1.default("Category ID is required", 400));
        }
        // Update isActive field to true for the MOOCs category
        const updatedCategory = yield moocs_model_1.moocsCourseModel.findByIdAndUpdate(categoryId, { isActive: true }, { new: true });
        // If the category doesn't exist, return an error
        if (!updatedCategory) {
            return next(new ErrorHandler_1.default("Category not found", 404));
        }
        // Return success response
        res.status(200).json({
            success: true,
            message: "MOOCs category activated successfully",
            updatedCategory,
        });
    }
    catch (error) {
        // Handle errors
        return next(new ErrorHandler_1.default(error.message, 400));
    }
}));
// deactivate moocs course :-
exports.deactivateMoocs = (0, CatchAsyncError_1.CatchAsyncError)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const categoryId = req.params.id;
        // Check if categoryId is provided
        if (!categoryId) {
            return next(new ErrorHandler_1.default("Category ID is required", 400));
        }
        // Update isActive field to false for the MOOCs category
        const updatedCategory = yield moocs_model_1.moocsCourseModel.findByIdAndUpdate(categoryId, { isActive: false }, { new: true });
        // If the category doesn't exist, return an error
        if (!updatedCategory) {
            return next(new ErrorHandler_1.default("Category not found", 404));
        }
        // Return success response
        res.status(200).json({
            success: true,
            message: "MOOCs category deactivated successfully",
            updatedCategory,
        });
    }
    catch (error) {
        // Handle errors
        return next(new ErrorHandler_1.default(error.message, 400));
    }
}));
// verify mar list uplaoded by student:-
exports.verifyMarDocument = (0, CatchAsyncError_1.CatchAsyncError)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        // Find the MAR document by ID
        const marDoc = (yield mar_model_2.marModel
            .findById(req.params.id)
            .populate("user"));
        if (!marDoc) {
            return next(new Error("MAR document not found"));
        }
        // Check if the MAR document is already verified
        if (marDoc.status === "verified") {
            return next(new Error("MAR document is already verified!"));
        }
        // If not verified, update the isVerified field to true
        marDoc.status = "verified";
        yield marDoc.save();
        // Send notification email if requested
        const { email } = req.body;
        if (email) {
            const data = { marTitle: marDoc.title };
            const html = yield ejs_1.default.renderFile(path_1.default.join(__dirname, "../mails/mar-verification-mail.ejs"), data);
            try {
                yield (0, sendMail_1.default)({
                    email: marDoc.user.email,
                    subject: "MAR Document Verification",
                    template: "mar-verification-mail.ejs",
                    data,
                });
                return res.status(200).json({
                    success: true,
                    message: `MAR document "${marDoc.title}" has been successfully verified. An email notification has been sent.`,
                });
            }
            catch (error) {
                return next(new ErrorHandler_1.default(error.message, 400));
            }
        }
        // Respond with success message
        res.status(200).json({
            success: true,
            message: `MAR document "${marDoc.title}" has been successfully verified.`,
        });
    }
    catch (error) {
        return next(new ErrorHandler_1.default(error.message, 400));
    }
}));
// verify moocs document :-
exports.verifyMoocsDocument = (0, CatchAsyncError_1.CatchAsyncError)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        // Find the MOOCs document by ID
        const moocsDoc = (yield moocs_model_1.moocsModel
            .findById(req.params.id)
            .populate("user")
            .populate("moocsCourse"));
        if (!moocsDoc) {
            return next(new Error("MOOCs document not found"));
        }
        // Check if the MOOCs document is already verified
        if (moocsDoc.status === "verified") {
            return next(new Error("MOOCs document is already verified!"));
        }
        // If not verified, update the isVerified field to true
        moocsDoc.status = "verified";
        yield moocsDoc.save();
        // Send notification email if requested
        const { email } = req.body;
        if (email) {
            const data = { moocsTitle: moocsDoc.moocsCourse.title };
            const html = yield ejs_1.default.renderFile(path_1.default.join(__dirname, "../mails/moocs-verification-mail.ejs"), data);
            try {
                yield (0, sendMail_1.default)({
                    email: moocsDoc.user.email,
                    subject: "MOOCs Document Verification",
                    template: "moocs-verification-mail.ejs",
                    data,
                });
                return res.status(200).json({
                    success: true,
                    message: `MOOCs document "${moocsDoc.moocsCourse.title}" has been successfully verified. An email notification has been sent.`,
                });
            }
            catch (error) {
                return next(new ErrorHandler_1.default(error.message, 400));
            }
        }
        // Respond with success message
        res.status(200).json({
            success: true,
            message: `MOOCs document "${moocsDoc.moocsCourse.title}" has been successfully verified.`,
        });
    }
    catch (error) {
        return next(new ErrorHandler_1.default(error.message, 400));
    }
}));
// get all moocs course list :- by admin
exports.getMoocsListAdmin = (0, CatchAsyncError_1.CatchAsyncError)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const moocsList = yield moocs_model_1.moocsCourseModel.find().sort({ createdAt: -1 });
        // Convert Mongoose documents to plain JavaScript objects
        const plainMoocsListDetails = moocsList.map((moocs) => moocs.toObject());
        // Modify isVerified property to 'active' or 'inactive' and rename to 'status'
        const modifiedDetails = plainMoocsListDetails.map((moocs) => (Object.assign(Object.assign({}, moocs), { status: moocs.isActive ? "active" : "inactive" })));
        // Remove the isVerified property from the modified details
        const FinalMoocsList = modifiedDetails.map((_a) => {
            var { isActive } = _a, rest = __rest(_a, ["isActive"]);
            return rest;
        });
        res.status(201).json({
            success: true,
            moocsList: FinalMoocsList,
        });
    }
    catch (error) {
        return next(new ErrorHandler_1.default(error.message, 400));
    }
}));
//  get all mar list by admin :
exports.getMarListAdmin = (0, CatchAsyncError_1.CatchAsyncError)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const marList = yield mar_model_1.categoryModel.find().sort({ createdAt: -1 });
        // Convert Mongoose documents to plain JavaScript objects
        const plainMarListDetails = marList.map((mar) => mar.toObject());
        // Modify isVerified property to 'active' or 'inactive' and rename to 'status'
        const modifiedDetails = plainMarListDetails.map((mar) => (Object.assign(Object.assign({}, mar), { status: mar.isActive ? "active" : "inactive" })));
        // Remove the isVerified property from the modified details
        const FinalMarList = modifiedDetails.map((_a) => {
            var { isActive } = _a, rest = __rest(_a, ["isActive"]);
            return rest;
        });
        res.status(201).json({
            success: true,
            marList: FinalMarList,
        });
    }
    catch (error) {
        return next(new ErrorHandler_1.default(error.message, 400));
    }
}));
// get moocs list uplaoded by student by admin :-
exports.getAllMoocsData = (0, CatchAsyncError_1.CatchAsyncError)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const moocsData = yield moocs_model_1.moocsModel
            .find()
            .populate("user")
            .populate("moocsCourse")
            .populate("document");
        res.status(200).json({
            success: true,
            moocsData,
        });
    }
    catch (error) {
        return next(new ErrorHandler_1.default(error.message, 400));
    }
}));
// get all mar data uploaded by student by admin
exports.getAllMarData = (0, CatchAsyncError_1.CatchAsyncError)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const marData = yield mar_model_2.marModel
            .find()
            .populate("user")
            .populate("marCategory")
            .populate("document");
        res.status(200).json({
            success: true,
            marData,
        });
    }
    catch (error) {
        return next(new ErrorHandler_1.default(error.message, 400));
    }
}));
// reject moocs uploaded by student by admin
exports.rejectMoocsDocument = (0, CatchAsyncError_1.CatchAsyncError)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        // Find the MOOCs document by ID
        const moocsDoc = (yield moocs_model_1.moocsModel
            .findById(req.params.id)
            .populate("user")
            .populate("moocsCourse"));
        if (!moocsDoc) {
            return next(new Error("MOOCs document not found"));
        }
        // Check if the MOOCs document is already verified
        if (moocsDoc.status !== "verified") {
            return next(new Error("MOOCs document is already rejected!"));
        }
        // If not verified, update the isVerified field to true
        moocsDoc.status = "rejected";
        yield moocsDoc.save();
        // Send notification email if requested
        const { email, reason } = req.body;
        if (email) {
            const data = { moocsTitle: moocsDoc.moocsCourse.title, reason: reason };
            const html = yield ejs_1.default.renderFile(path_1.default.join(__dirname, "../mails/moocs-rejection-mail.ejs"), data);
            try {
                yield (0, sendMail_1.default)({
                    email: moocsDoc.user.email,
                    subject: "MOOCs Document rejected",
                    template: "moocs-rejection-mail.ejs",
                    data,
                });
                return res.status(200).json({
                    success: true,
                    message: `MOOCs document "${moocsDoc.moocsCourse.title}" has been successfully rejected. An email notification has been sent.`,
                });
            }
            catch (error) {
                return next(new ErrorHandler_1.default(error.message, 400));
            }
        }
        // Respond with success message
        res.status(200).json({
            success: true,
            message: `MOOCs document "${moocsDoc.moocsCourse.title}" has been successfully rejected.`,
        });
    }
    catch (error) {
        return next(new ErrorHandler_1.default(error.message, 400));
    }
}));
// rejecting mar document
exports.rejectMarDocument = (0, CatchAsyncError_1.CatchAsyncError)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        // Find the MOOCs document by ID
        const marDoc = (yield mar_model_2.marModel
            .findById(req.params.id)
            .populate("marCategory")
            .populate("user"));
        if (!marDoc) {
            return next(new Error("MAR document not found"));
        }
        // Check if the MAR document is already rejected
        if (marDoc.status === "rejected") {
            return next(new Error("MAR document is already rejected!"));
        }
        // If not verified, update the isVerified field to true
        marDoc.status = "rejected";
        yield marDoc.save();
        // Send notification email if requested
        const { email, reason } = req.body;
        if (email) {
            const data = { marTitle: marDoc.marCategory.category, reason: reason };
            const html = yield ejs_1.default.renderFile(path_1.default.join(__dirname, "../mails/mar-rejection-mail.ejs"), data);
            try {
                yield (0, sendMail_1.default)({
                    email: marDoc.user.email,
                    subject: "Mar Document rejected",
                    template: "mar-rejection-mail.ejs",
                    data,
                });
                return res.status(200).json({
                    success: true,
                    message: `MOOCs document "${marDoc.title}" has been successfully rejected. An email notification has been sent.`,
                });
            }
            catch (error) {
                return next(new ErrorHandler_1.default(error.message, 400));
            }
        }
        // Respond with success message
        res.status(200).json({
            success: true,
            message: `MOOCs document "${marDoc.title}" has been successfully rejected.`,
        });
    }
    catch (error) {
        return next(new ErrorHandler_1.default(error.message, 400));
    }
}));
exports.moocsMarStatistics = (0, CatchAsyncError_1.CatchAsyncError)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const year = req.params.year;
        // Query the database to get user data for the specified year
        const userData = yield user_model_1.default
            .find({ year: year })
            .populate({
            path: "moocs",
        })
            .populate({
            path: "mar",
        });
        // Initialize counters for different statuses
        let moocsVerifiedCount = 0;
        let moocsPendingCount = 0;
        let moocsRejectedCount = 0;
        let moocsNotSubmittedCount = 0;
        let marVerifiedCount = 0;
        let marPendingCount = 0;
        let marRejectedCount = 0;
        let marNotSubmittedCount = 0;
        // Iterate through user data and count statuses for MOOCs and MAR
        userData.forEach((user) => {
            if (user.role === "user") {
                // Count statuses for MOOCs
                if (user.moocs.length === 0) {
                    moocsNotSubmittedCount++;
                }
                else {
                    let allVerified = true;
                    let hasPending = false;
                    let hasRejected = false;
                    user.moocs.forEach((mooc) => {
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
                    }
                    else if (hasPending || !hasRejected) {
                        moocsPendingCount--;
                    }
                }
                // Count statuses for MAR
                if (user.mar.length === 0) {
                    marNotSubmittedCount++;
                }
                else {
                    let allVerified = true;
                    let hasPending = false;
                    let hasRejected = false;
                    user.mar.forEach((mar) => {
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
                    }
                    else if (hasPending || !hasRejected) {
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
    }
    catch (error) {
        return next(new ErrorHandler_1.default(error.message, 400));
    }
}));
//# sourceMappingURL=admin.controller.js.map