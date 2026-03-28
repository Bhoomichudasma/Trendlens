const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      match: /.+\@.+\..+/,
      index: true,
    },
    password: {
      type: String,
      // Optional if using OAuth
      minlength: 6,
    },
    name: {
      type: String,
      required: true,
    },
    profilePicture: String,

    // OAuth Links
    googleId: {
      type: String,
      sparse: true, // Allow multiple null values for non-Google users
    },
    googleEmail: String,

    // Account Status
    isVerified: {
      type: Boolean,
      default: false,
    },
    verificationToken: String,
    verificationExpiry: Date,

    // Preferences
    preferences: {
      emailAlerts: { type: Boolean, default: true },
      darkMode: { type: Boolean, default: true },
      defaultCategory: { type: String, default: 'other' },
    },

    // Timestamps
    lastLogin: Date,
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

// Hash password before saving (only if password exists & was modified)
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  if (!this.password) return next(); // Skip if no password (OAuth user)

  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Method to compare password
userSchema.methods.comparePassword = async function (candidatePassword) {
  if (!this.password) return false; // OAuth user has no password
  return bcrypt.compare(candidatePassword, this.password);
};

// Method to get safe user object (exclude password)
userSchema.methods.toJSON = function () {
  const user = this.toObject();
  delete user.password;
  delete user.verificationToken;
  delete user.verificationExpiry;
  return user;
};

module.exports = mongoose.model('User', userSchema);
