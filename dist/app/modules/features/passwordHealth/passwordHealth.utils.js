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
Object.defineProperty(exports, "__esModule", { value: true });
exports.getTierAndColor = exports.calculatePasswordStrength = exports.getBreachedPasswords = void 0;
// Check if password is in HaveIBeenPwned
const getBreachedPasswords = (passwordHash) => __awaiter(void 0, void 0, void 0, function* () {
    // Cannot get plain password: hash only
    return 0; // fail-safe for hashed password
});
exports.getBreachedPasswords = getBreachedPasswords;
// Simple strength estimation for hashed password (placeholder)
const calculatePasswordStrength = (passwordHash) => {
    // Because we only have hashed password, estimate based on length of original password if stored separately
    return 80; // dummy score, will refine if plain password is known temporarily during change
};
exports.calculatePasswordStrength = calculatePasswordStrength;
// Determine tier + color
const getTierAndColor = (score) => {
    if (score >= 80)
        return { tier: 'High', color: 'green' };
    if (score >= 50)
        return { tier: 'Medium', color: 'yellow' };
    return { tier: 'Low', color: 'red' };
};
exports.getTierAndColor = getTierAndColor;
