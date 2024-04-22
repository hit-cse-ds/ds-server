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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteMoocs = exports.editMoocs = exports.getMoocsList = exports.getMyMoocs = exports.uploadMoocs = void 0;
const ErrorHandler_1 = __importDefault(require("../utlis/ErrorHandler"));
const CatchAsyncError_1 = require("../middleware/CatchAsyncError");
const cloudinary_1 = __importDefault(require("cloudinary"));
const moocs_model_1 = require("../models/moocs.model");
const user_model_1 = __importDefault(require("../models/user.model"));
const multer_1 = __importDefault(require("multer"));
const fs_1 = __importDefault(require("fs"));
const redis_1 = require("../utlis/redis");
const storage = multer_1.default.memoryStorage();
const upload = (0, multer_1.default)({ storage: storage }).single("file");
exports.uploadMoocs = (0, CatchAsyncError_1.CatchAsyncError)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        upload(req, res, (err) => __awaiter(void 0, void 0, void 0, function* () {
            var _a, _b;
            if (err) {
                return next(new ErrorHandler_1.default("File upload failed", 400));
            }
            try {
                const { title, startDate, endDate, year, verificationUrl } = req.body;
                // Find moocs course id by title
                const course = yield moocs_model_1.moocsCourseModel.findById(title);
                if (!course) {
                    return next(new ErrorHandler_1.default("Course not found", 400));
                }
                const user = yield user_model_1.default.findById((_a = req.user) === null || _a === void 0 ? void 0 : _a._id);
                if (!user) {
                    return next(new ErrorHandler_1.default("User not found", 400));
                }
                // Check if the user has already uploaded the MOOCs
                const existingMoocs = yield moocs_model_1.moocsModel.findOne({
                    user: user._id,
                    moocsCourse: course._id,
                });
                if (existingMoocs) {
                    return next(new ErrorHandler_1.default("You have already uploaded this MOOCs", 400));
                }
                const file = req.file; // Access the uploaded file
                if (!file) {
                    return next(new ErrorHandler_1.default("No file uploaded", 400));
                }
                // Create a temporary file path
                const tempFilePath = `temp_${Date.now()}_${file.originalname}`;
                // Write the buffer to the temporary file
                fs_1.default.writeFileSync(tempFilePath, file.buffer);
                // Upload temporary file to Cloudinary
                const myCloud = yield cloudinary_1.default.v2.uploader.upload(tempFilePath, {
                    folder: "Document_Moocs",
                });
                // Delete the temporary file
                fs_1.default.unlinkSync(tempFilePath);
                const documentData = {
                    user: user._id,
                    public_id: myCloud.public_id,
                    url: myCloud.secure_url,
                    pageCount: myCloud.pages,
                    size: myCloud.bytes,
                    format: myCloud.format,
                };
                const moocsDocument = yield moocs_model_1.documentsModel.create(documentData);
                const data = {
                    user: user._id,
                    moocsCourse: course._id,
                    startDate: startDate,
                    endDate: endDate,
                    year: year,
                    document: moocsDocument._id,
                    verificationUrl: verificationUrl,
                };
                const moocs = yield moocs_model_1.moocsModel.create(data);
                user.moocs.push(moocs._id);
                yield user.save();
                yield redis_1.redis.set((_b = req.user) === null || _b === void 0 ? void 0 : _b._id, JSON.stringify(user));
                res.status(201).json({
                    success: true,
                    moocs,
                });
            }
            catch (error) {
                return next(new ErrorHandler_1.default(error.message, 400));
            }
        }));
    }
    catch (error) {
        return next(new ErrorHandler_1.default(error.message, 400));
    }
}));
// get my moocs list
exports.getMyMoocs = (0, CatchAsyncError_1.CatchAsyncError)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _c, _d;
    try {
        const user = yield user_model_1.default.findById((_c = req.user) === null || _c === void 0 ? void 0 : _c._id).populate({
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
            return next(new ErrorHandler_1.default("User not found", 400));
        }
        const moocs = user.moocs;
        // Calculate total credit points of verified Moocs entries
        let totalCreditPoints = 0;
        moocs.forEach((mooc) => {
            if (mooc.status === "verified") { // Ensure mooc is properly typed as MoocsDocument
                totalCreditPoints += mooc.moocsCourse.credit;
            }
        });
        if (user.totalMoocs !== totalCreditPoints) {
            user.totalMoocs = totalCreditPoints;
            yield user.save();
            yield redis_1.redis.set((_d = req.user) === null || _d === void 0 ? void 0 : _d._id, JSON.stringify(user));
        }
        res.status(200).json({
            success: true,
            totalCreditPoints,
            moocs,
        });
    }
    catch (error) {
        return next(new ErrorHandler_1.default(error.message, 400));
    }
}));
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
exports.getMoocsList = (0, CatchAsyncError_1.CatchAsyncError)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const moocsList = yield moocs_model_1.moocsCourseModel.find({ isActive: true }).select('id platform title credit').sort({ createdAt: -1 });
        res.status(201).json({
            success: true,
            moocsList,
        });
    }
    catch (error) {
        return next(new ErrorHandler_1.default(error.message, 400));
    }
}));
// edit moocs list by user 
exports.editMoocs = (0, CatchAsyncError_1.CatchAsyncError)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const moocsId = req.params.id;
        const { title, startDate, endDate, year, verificationUrl } = req.body;
        // Find the Moocs document by its ID
        const moocs = yield moocs_model_1.moocsModel.findById(moocsId);
        if ((moocs === null || moocs === void 0 ? void 0 : moocs.status) === 'verified') {
            return next(new ErrorHandler_1.default("You can change verified Document , Kindly approach to HOD", 400));
        }
        if (!moocs) {
            return next(new ErrorHandler_1.default("Moocs document not found", 404));
        }
        // Update the fields if they're provided in the request body
        if (title) {
            // Find the moocs course id by title
            const course = yield moocs_model_1.moocsCourseModel.findById(title);
            if (!course) {
                return next(new ErrorHandler_1.default("Course not found", 400));
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
        yield moocs.save();
        res.status(200).json({
            success: true,
            message: "Moocs document updated successfully",
            moocs,
        });
    }
    catch (error) {
        return next(new ErrorHandler_1.default(error.message, 400));
    }
}));
exports.deleteMoocs = (0, CatchAsyncError_1.CatchAsyncError)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _e, _f, _g;
    try {
        const moocsId = req.params.id;
        // Find the Moocs entry by its ID
        const moocs = yield moocs_model_1.moocsModel.findById(moocsId);
        if (!moocs) {
            return next(new ErrorHandler_1.default("Moocs entry not found", 404));
        }
        // Check if the logged-in user is the owner of the Moocs entry
        if (moocs.user.toString() !== ((_e = req.user) === null || _e === void 0 ? void 0 : _e._id.toString())) {
            return next(new ErrorHandler_1.default("You are not authorized to delete this Moocs entry", 403));
        }
        // Check if the Moocs entry status is "verified"
        if (moocs.status === "verified") {
            return next(new ErrorHandler_1.default("Cannot delete a verified Moocs entry", 403));
        }
        // Delete the document from Cloudinary
        const document = yield moocs_model_1.documentsModel.findById(moocs.document);
        if (document) {
            yield cloudinary_1.default.v2.uploader.destroy(document.public_id);
            yield document.deleteOne();
        }
        // Delete the Moocs entry from the database
        yield moocs.deleteOne();
        // Remove the Moocs entry ID from the user's moocs array
        const user = yield user_model_1.default.findById((_f = req.user) === null || _f === void 0 ? void 0 : _f._id);
        if (user) {
            const index = user.moocs.indexOf(moocsId);
            if (index !== -1) {
                user.moocs.splice(index, 1);
                yield user.save();
                yield redis_1.redis.set((_g = req.user) === null || _g === void 0 ? void 0 : _g._id, JSON.stringify(user));
            }
        }
        res.status(200).json({
            success: true,
            message: "Moocs entry and associated document deleted successfully",
        });
    }
    catch (error) {
        return next(new ErrorHandler_1.default(error.message, 400));
    }
}));
//# sourceMappingURL=mocs.controller.js.map