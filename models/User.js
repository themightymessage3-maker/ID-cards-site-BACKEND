const mongoose = require('mongoose');

const AddressSchema = new mongoose.Schema({
  name: { type: String, trim: true },
  street: { type: String, trim: true },
  city: { type: String, trim: true },
  state: { type: String, trim: true },
  zip: { type: String, trim: true },
  country: { type: String, trim: true },
  phone: { type: String, trim: true },
  email: { type: String, trim: true }
}, { _id: false });

const UserSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true
  },
  password: {
    type: String,
    required: true
  },
  firstName: {
    type: String,
    trim: true,
    default: ''
  },
  lastName: {
    type: String,
    trim: true,
    default: ''
  },
  displayName: {
    type: String,
    trim: true,
    default: ''
  },
  billingAddress: {
    type: AddressSchema,
    default: () => ({})
  },
  shippingAddress: {
    type: AddressSchema,
    default: () => ({})
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  isAdmin: {
    type: Boolean,
    default: false
  }
});

module.exports = mongoose.model('User', UserSchema);
