import express from "express"
// import {authRouter} from "./auth/authRoutes";


export const app = express();

app.use(express.json());

app.use('/api/auth', authRouter);