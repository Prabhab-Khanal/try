const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
require("dotenv").config();

// Define User Schema
const userSchema = new mongoose.Schema({
  userName: { type: String, unique: true },
  password: String,
  email: String,
  loginHistory: [{
    dateTime: Date,
    userAgent: String
  }]
});

// Hash the password before saving the user to the database
userSchema.pre("save", async function (next) {
  if (this.isModified("password")) {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
  }
  next();
});

// Compare entered password with hashed password in the database
userSchema.methods.comparePassword = function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

// Export the User model
const User = mongoose.model("User", userSchema);

// Global variable to track if the DB is already connected
let isConnected = false;

// MongoDB connection
module.exports.initialize = function () {
  return new Promise((resolve, reject) => {
    // If already connected, avoid reconnecting
    if (isConnected) {
      console.log("MongoDB is already connected.");
      resolve();
      return;
    }

    // Establish a connection to MongoDB (only once)
    mongoose.connect(process.env.MONGODB, { useNewUrlParser: true, useUnifiedTopology: true })
      .then(() => {
        console.log("MongoDB connected successfully.");
        isConnected = true;
        resolve();
      })
      .catch((err) => {
        console.error("MongoDB connection error:", err);
        reject(err);
      });
  });
};

// Register new user
module.exports.registerUser = function (userData) {
  return new Promise((resolve, reject) => {
    if (userData.password !== userData.password2) {
      reject("Passwords do not match");
      return;
    }

    // Create a new user instance
    const newUser = new User(userData);
    
    newUser.save()
      .then(() => resolve())
      .catch((err) => {
        if (err.code === 11000) {
          reject("User Name already taken");
        } else {
          reject("Error creating the user: " + err);
        }
      });
  });
};

// Check login credentials
module.exports.checkUser = function (userData) {
  return new Promise((resolve, reject) => {
    User.findOne({ userName: userData.userName })
      .then((user) => {
        if (!user) {
          reject(`Unable to find user: ${userData.userName}`);
          return;
        }

        // Compare entered password with stored hashed password
        user.comparePassword(userData.password)
          .then((isMatch) => {
            if (!isMatch) {
              reject(`Incorrect password for user: ${userData.userName}`);
              return;
            }

            // Update login history
            if (user.loginHistory.length === 8) {
              user.loginHistory.pop(); // Remove the oldest entry if there are more than 8
            }

            user.loginHistory.unshift({
              dateTime: new Date().toString(),
              userAgent: userData.userAgent
            });

            user.save()
              .then(() => resolve(user))
              .catch((err) => reject("Error updating login history: " + err));
          })
          .catch(() => reject("Error comparing passwords"));
      })
      .catch(() => reject(`Unable to find user: ${userData.userName}`));
  });
};

// Export the model for use in other files
module.exports.User = User;
