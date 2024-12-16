import mongoose from 'mongoose';
import bcrypt from 'bcryptjs'; // For hashing passwords
import crypto from 'crypto';

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
    },
    profilePicture: {
      type: String, // URL or path to the image
    },
    password: {
      type: String,
      required: true,
      select: false, // Prevent password from being returned by default
    },
    phoneNumber: {
      type: String,
      
    },
    role: {
      type: String,
      enum: ['admin', 'supervisor', 'agent'],
      default: 'agent',
    },
    organization: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Organization',
    },
    greetedBy: {
      type: mongoose.Schema.Types.ObjectId, // Tracks the ID of the user who greeted
      ref: 'User',
      default: null,
    },
    byHelloTeam: {
      type: Boolean, // Tracks if the greeting was triggered by "Hello Team"
      default: false,
    },
    isZingtreeAgent: {
      type: Boolean, 
      default: false,
    },
    address: {
      street: {
        type: String,
      },
      city: {
        type: String,
      },
      state: {
        type: String,
      },
      postalCode: {
        type: String,
      },
      country: {
        type: String,
      },
    },
    dateOfBirth: {
      type: Date, // Stores the user's date of birth
    },
    gender: {
      type: String,
      enum: ['male', 'female', 'non-binary', 'prefer not to say'],
    },
  },
  {
    timestamps: true, // Enables createdAt and updatedAt fields
  }
);

// Hash password before saving
userSchema.pre('save', async function (next) {
  if (this.isModified('password')) {
    const salt = await bcrypt.genSalt(10); // Generate a salt
    this.password = await bcrypt.hash(this.password, salt); // Hash the password with the salt
  }
  next();
});

// Instance method to compare provided password with the stored hashed password
userSchema.methods.comparePassword = async function (enteredPassword) {
  return bcrypt.compare(enteredPassword, this.password);
};

const User = mongoose.model('User', userSchema);
export default User;
