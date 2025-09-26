import { Role } from "@prisma/client";
import { z } from "zod";

export const signupData = z.object({
    email: z.email(),
    password: z
    .string()
    .min(8, "minimum 8 characters are required")
    .max(15, "maximum 15 characters are allowed")
    .regex(/^(?=.*[A-Za-z])(?=.*\d).+$/, "must include letters & numbers"),
    
    Role : z.enum(["ADMIN", "CUSTOMER"]).optional(),
    name: z.string()
});

export const signinData = z.object({
    email: z.email(),
    password: z
    .string()
    .min(8, "minimum 8 characters are required")
    .max(15, "maximum 15 characters are allowed")
    .regex(/^(?=.*[A-Za-z])(?=.*\d).+$/, "must include letters & numbers")
})