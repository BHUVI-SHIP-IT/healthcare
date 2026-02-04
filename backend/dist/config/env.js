"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.env = void 0;
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const required = ["JWT_SECRET", "DATABASE_URL"];
required.forEach((key) => {
    if (!process.env[key]) {
        throw new Error(`Missing required env var: ${key}`);
    }
});
exports.env = {
    port: Number(process.env.PORT || 4000),
    jwtSecret: process.env.JWT_SECRET,
    jwtExpiresIn: process.env.JWT_EXPIRES_IN || "1h",
};
