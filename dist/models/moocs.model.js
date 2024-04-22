"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.moocsCourseModel = exports.documentsModel = exports.moocsModel = void 0;
require("dotenv").config();
const mongoose_1 = __importStar(require("mongoose"));
const documentsSchema = new mongoose_1.Schema({
    user: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
    public_id: {
        type: String,
        required: true,
    },
    url: {
        type: String,
        required: true,
    },
    pageCount: {
        type: Number,
        required: true,
    },
    size: {
        type: Number,
        required: true,
    },
    format: {
        type: String,
        required: true,
    },
}, { timestamps: true });
const moocsCourseSchema = new mongoose_1.Schema({
    title: {
        type: String,
        required: true,
    },
    platform: {
        type: String,
        required: true,
    },
    credit: {
        type: Number,
        required: true,
    },
    isActive: {
        type: Boolean,
        default: true,
        required: true,
    },
}, { timestamps: true });
const moocsDbSchema = new mongoose_1.Schema({
    user: {
        type: mongoose_1.Schema.Types.ObjectId,
        required: true,
        ref: "User",
    },
    moocsCourse: {
        type: mongoose_1.Schema.Types.ObjectId,
        required: true,
        ref: "MoocsCourse",
    },
    startDate: {
        type: String,
        required: true,
    },
    endDate: {
        type: String,
        required: true,
    },
    year: {
        type: Number,
        required: true,
    },
    document: {
        type: mongoose_1.Schema.Types.ObjectId,
        required: true,
        ref: "MoocsDocuments",
    },
    verificationUrl: {
        type: String,
        required: true
    },
    status: {
        type: String,
        default: "pending",
    },
}, { timestamps: true });
const documentsModel = mongoose_1.default.model("MoocsDocuments", documentsSchema);
exports.documentsModel = documentsModel;
const moocsCourseModel = mongoose_1.default.model("MoocsCourse", moocsCourseSchema);
exports.moocsCourseModel = moocsCourseModel;
const moocsModel = mongoose_1.default.model("Moocs", moocsDbSchema);
exports.moocsModel = moocsModel;
//# sourceMappingURL=moocs.model.js.map