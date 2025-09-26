"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const userTypes_1 = require("../types/userTypes");
const db_1 = require("../db");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const JWT_PASSWORD = process.env.JWT_PASSWORD || "secreat";
const userRouter = (0, express_1.Router)();
userRouter.post('/register', async (req, res) => {
    const parsedData = userTypes_1.signupData.safeParse(req.body);
    if (!parsedData.success) {
        res.status(411).json({
            message: "incorrect inputs"
        });
        return;
    }
    const userExists = await db_1.prismaClient.user.findFirst({
        where: {
            email: parsedData.data.email
        }
    });
    if (userExists) {
        return res.status(500).json({
            message: "user already exists"
        });
    }
    const user = await db_1.prismaClient.user.create({
        data: {
            email: parsedData.data.email,
            password: parsedData.data.password,
            name: parsedData.data.name
        }
    });
    const userId = user.id;
    const token = jsonwebtoken_1.default.sign({
        userId
    }, JWT_PASSWORD);
    return res.status(201).json({
        token: token
    });
});
userRouter.post('/login', async (req, res) => {
    const parsedData = userTypes_1.signinData.safeParse(req.body);
    if (!parsedData.success) {
        res.status(411).json({
            message: "incorrect inputs"
        });
        return;
    }
    const user = await db_1.prismaClient.user.findFirst({
        where: {
            email: parsedData.data.email,
            password: parsedData.data.password
        }
    });
    if (!user) {
        res.status(403).json({
            message: "user doesn't exist"
        });
        return;
    }
    const id = user.id;
    const token = jsonwebtoken_1.default.sign({ id }, JWT_PASSWORD);
    res.status(200).json({
        token: token
    });
});
exports.default = userRouter;
//# sourceMappingURL=authRoutes.js.map