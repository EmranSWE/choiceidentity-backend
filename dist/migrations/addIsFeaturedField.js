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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const products_model_1 = require("../app/modules/products/products.model"); // Import the Mongoose model
const addIsFeaturedField = () => __awaiter(void 0, void 0, void 0, function* () {
    try {
        // Connect to your MongoDB database
        yield mongoose_1.default.connect('mongodb://localhost:27017/your-database-name');
        console.log('Connected to MongoDB');
        // Add the isFeatured field to all products
        const result = yield products_model_1.Products.updateMany({ isFeatured: { $exists: false } }, // Find products where isFeatured does not exist
        { $set: { isFeatured: false } } // Set isFeatured to false for all existing products
        );
        console.log(`Updated ${result.modifiedCount} products with the isFeatured field`);
        // Disconnect from the database
        yield mongoose_1.default.disconnect();
        console.log('Disconnected from MongoDB');
    }
    catch (error) {
        console.error('Error during migration:', error);
    }
});
// Run the migration
addIsFeaturedField();
