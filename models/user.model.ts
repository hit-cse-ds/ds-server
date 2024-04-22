require('dotenv').config();
import bcrypt from "bcryptjs";
import mongoose, { Document, ObjectId, Schema } from "mongoose";
import jwt  from "jsonwebtoken";
import { Model } from "mongoose";

const emailRegexPattern : RegExp = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export interface IUser extends Document{
    name : string;
    classroll : string;
    universityroll:string;
    registration:string;
    year:string;
    email: string;
    password: string;
    role: string;
    moocs:  Array<{ moocsId:ObjectId}>;
    mar:  Array<{ marId:ObjectId}>;
    totalMar:number,
    totalMoocs:number,
    isVerfied: boolean;
    
    comparePassword: (password: string) => Promise<boolean>;
    SignAcessToken : ()=> string;
    SignRefreshToken : () => string;
};

const userSchema: Schema<IUser> = new mongoose.Schema({
    name:{
        type: String,
        required: [true, "please enter your name"],
    },
    classroll:{
        type:String,
        required: [true, "please enter your Class Roll"],
    },
    universityroll:{
        type:String,
        required: [true, "please enter your university Roll"],
    },
    registration:{
        type:String,
        required: [true, "please enter your registration"],
    },
    year:{
        type:String,
        required: [true, "please enter your password"],
    },
    email:{
        type: String,
        required: [true, "please enter your email"],
        validate: {
            validator: function (value : string){
                return emailRegexPattern.test(value);
            },
            message: "please enter a valid email",
        },
        unique:true,
    },
    password:{
        type:String,
        required: [true, "please enter your email"],
        minlength: [6, "password must be at least 6 characters"],
        select: false,
    },
    
    role:{
        type:String,
        default: "user",
    },
    moocs:[
        {
            type:Schema.Types.ObjectId,
            ref: "Moocs",
        }
    ],
    mar:[
        {
            type:Schema.Types.ObjectId,
            ref: "Mar",
        }
    ],
    totalMar:{
        type:Number,
        default: 0,
    },
    totalMoocs:{
        type:Number,
        default: 0,
    },
    isVerfied:{
        type:Boolean,
        default: false,
    },
    
    
},{timestamps:true});

//Hash password before saving
userSchema.pre<IUser>('save', async function(next){
if(!this.isModified('password')){
    next();
}
this.password = await bcrypt.hash(this.password, 10);
next();
});

// signin acess and refresh token 
userSchema.methods.SignAcessToken = function (){
    return jwt.sign({id:this._id}, process.env.ACCESS_TOKEN || '',{
        expiresIn:"5m",
    });
}

userSchema.methods.SignRefreshToken = function (){
    return jwt.sign({id:this._id}, process.env.REFRESH_TOKEN || '',{
        expiresIn:"5m",
    });
}

//compare password
 userSchema.methods.comparePassword = async function (
    enteredPassword: string
): Promise<boolean>{
    return await bcrypt.compare(enteredPassword, this.password);
};

const userModel: Model<IUser> =mongoose.model("User",userSchema);

export default userModel;