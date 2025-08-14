import mongoose from 'mongoose';
import { Products } from '../app/modules/products/products.model'; // Import the Mongoose model

const addIsFeaturedField = async () => {
  try {
    // Connect to your MongoDB database
    await mongoose.connect('mongodb://localhost:27017/your-database-name');

    console.log('Connected to MongoDB');

    // Add the isFeatured field to all products
    const result = await Products.updateMany(
      { isFeatured: { $exists: false } }, // Find products where isFeatured does not exist
      { $set: { isFeatured: false } } // Set isFeatured to false for all existing products
    );

    console.log(`Updated ${result.modifiedCount} products with the isFeatured field`);

    // Disconnect from the database
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  } catch (error) {
    console.error('Error during migration:', error);
  }
};

// Run the migration
addIsFeaturedField();