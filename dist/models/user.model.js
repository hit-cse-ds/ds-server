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
require('dotenv').config();
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const mongoose_1 = __importStar(require("mongoose"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const emailRegexPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
;
const userSchema = new mongoose_1.default.Schema({
    name: {
        type: String,
        required: [true, "please enter your name"],
    },
    classroll: {
        type: String,
        required: [true, "please enter your Class Roll"],
    },
    universityroll: {
        type: String,
        required: [true, "please enter your university Roll"],
    },
    registration: {
        type: String,
        required: [true, "please enter your registration"],
    },
    year: {
        type: String,
        required: [true, "please enter your password"],
    },
    email: {
        type: String,
        required: [true, "please enter your email"],
        validate: {
            validator: function (value) {
                return emailRegexPattern.test(value);
            },
            message: "please enter a valid email",
        },
        unique: true,
    },
    password: {
        type: String,
        required: [true, "please enter your email"],
        minlength: [6, "password must be at least 6 characters"],
        select: false,
    },
    role: {
        type: String,
        default: "user",
    },
    moocs: [
        {
            type: mongoose_1.Schema.Types.ObjectId,
            ref: "Moocs",
        }
    ],
    mar: [
        {
            type: mongoose_1.Schema.Types.ObjectId,
            ref: "Mar",
        }
    ],
    totalMar: {
        type: Number,
        default: 0,
    },
    totalMoocs: {
        type: Number,
        default: 0,
    },
    isVerfied: {
        type: Boolean,
        default: false,
    },
}, { timestamps: true });
//Hash password before saving
userSchema.pre('save', function (next) {
    return __awaiter(this, void 0, void 0, function* () {
        if (!this.isModified('password')) {
            next();
        }
        this.password = yield bcryptjs_1.default.hash(this.password, 10);
        next();
    });
});
// signin acess and refresh token 
userSchema.methods.SignAcessToken = function () {
    return jsonwebtoken_1.default.sign({ id: this._id }, process.env.ACCESS_TOKEN || '', {
        expiresIn: "5m",
    });
};
userSchema.methods.SignRefreshToken = function () {
    return jsonwebtoken_1.default.sign({ id: this._id }, process.env.REFRESH_TOKEN || '', {
        expiresIn: "5m",
    });
};
//compare password
userSchema.methods.comparePassword = function (enteredPassword) {
    return __awaiter(this, void 0, void 0, function* () {
        return yield bcryptjs_1.default.compare(enteredPassword, this.password);
    });
};
const userModel = mongoose_1.default.model("User", userSchema);
exports.default = userModel;
//# sourceMappingURL=user.model.js.map