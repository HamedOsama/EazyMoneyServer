const mongoose = require('mongoose')
const timestamps = require('mongoose-timestamp')
const { User } = require('./user')
const validator = require('validator')

const productSchema = mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true,
        minLength: 5
    },
    image: {
        type: Buffer,
        // required:true
    },
    price: {
        type: Number,
        required: true,
        maxLength: [8, "Price cannot exceed 8 characters"]
    },
    description: {
        type: String,
        required: true,
        trim: true
    },
    properties: [{
        color: {
            type: String,
            required: true
        },
        size: {
            type: String,
            required: true
        },
        amount: {
            type: Number,
            required: true
        }
    }],
    total_amount: {
        type: Number,
        default: 0,
        maxLength: [5, "Stock cannot exceed 5 characters"]
    },
    rate: {
        type: Number,
        default: 0
    },
    category: {
        type: String,
        required: true
    },
    seller: {
        type: mongoose.Types.ObjectId,
        ref: User
    },
    numOfReviews: {
        type: Number,
        default: 0
    },
    reviews: [{
        name: {
            type: String,
            required: true,
        },
        rating: {
            type: Number,
            required: true,
        },
        comment: {
            type: String,
        }
    }],
    // createdAt: {
    //     type: Date,
    //     default: Date.now
    // }
})
productSchema.plugin(timestamps)
const Product = mongoose.model('products', productSchema)
module.exports = Product