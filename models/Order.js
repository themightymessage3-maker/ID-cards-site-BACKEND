const mongoose = require('mongoose');

const orderItemSchema = new mongoose.Schema({
    cardName: { type: String, required: true },
    quantity: { type: Number, required: true },
    price: { type: Number, required: true },
    // Add other product details from the cart
    firstName: String,
    middleName: String,
    lastName: String,
    gender: String,
    eyeColor: String,
    hairColor: String,
    height: String,
    weight: String,
    birthday: String,
    streetAddress: String,
    city: String,
    zipCode: String,
    issueDate: String,
    driverLicense: String,
    restrictions: String,
    organDonor: String,
    duplicateQty: String,
});

const orderSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    orderNumber: {
        type: String,
        required: true,
        unique: true
    },
    date: {
        type: Date,
        default: Date.now
    },
    status: {
        type: String,
        default: 'On Hold'
    },
    total: {
        type: Number,
        required: true
    },
    items: [orderItemSchema],
    shippingAddress: {
        name: String,
        street: String,
        city: String,
        state: String,
        zip: String,
        country: String,
    },
    billingAddress: {
        name: String,
        street: String,
        city: String,
        state: String,
        zip: String,
        country: String,
        phone: String,
        email: String,
    }
});

module.exports = mongoose.model('Order', orderSchema);
