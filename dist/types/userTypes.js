"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.signinData = exports.signupData = void 0;
const zod_1 = require("zod");
exports.signupData = zod_1.z.object({
    email: zod_1.z.email(),
    password: zod_1.z
        .string()
        .min(8, "minimum 8 characters are required")
        .max(15, "maximum 15 characters are allowed")
        .regex(/^(?=.*[A-Za-z])(?=.*\d).+$/, "must include letters & numbers"),
    Role: zod_1.z.enum(["ADMIN", "CUSTOMER"]).optional(),
    name: zod_1.z.string()
});
exports.signinData = zod_1.z.object({
    email: zod_1.z.email(),
    password: zod_1.z
        .string()
        .min(8, "minimum 8 characters are required")
        .max(15, "maximum 15 characters are allowed")
        .regex(/^(?=.*[A-Za-z])(?=.*\d).+$/, "must include letters & numbers")
});
//# sourceMappingURL=userTypes.js.map