import { isAuthenticate } from './../middleware/auth';
import express from 'express';
import { activateUser, getUserInfo, loginUser, logoutUser, registrationUser, updateAccessToken, updatePassword, updateUserInfo } from '../controllers/user.controller';


const userRouter = express.Router();

userRouter.post('/registration', registrationUser);

userRouter.post('/activate-user', activateUser);

userRouter.post('/login', loginUser);

userRouter.get('/logout', isAuthenticate,logoutUser);

userRouter.get("/refresh", updateAccessToken);

userRouter.get("/me", isAuthenticate,getUserInfo);

userRouter.put("/update-user-info", isAuthenticate, updateUserInfo);

userRouter.put("/update-user-password", isAuthenticate, updatePassword);


export default userRouter;