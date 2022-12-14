const mongoose = require('mongoose')
const User = require('./user')
const validator = require('validator')
const timestamps = require('mongoose-timestamp')
const Withdrawals = mongoose.Schema({
  buyerId: {
    type: mongoose.Types.ObjectId,
    ref: User
  },
  transactionId: {
    type: Number,
    trim: true
  },
  withdrawnAmount: {
    type: Number,
    required: true,
    trim: true
  },
  totalBalance: {
    type: Number,
    required: true
  },
  balanceAfterWithdrawn: {
    type: Number,
    required: true
  },
  payment_method: {
    type: String,
    required: true,
    enum: ['vodafone cash', 'orange cash', 'we cash', 'etsalat cash']
  },
  payment_method_num: {
    type: String,
    required: true,
    trim: true,
    validate(value) {
      if (!validator.isMobilePhone(value))
        throw new Error("Phone is invalid")
    }
  }
})
Withdrawals.plugin(timestamps)
const Withdrawal = mongoose.model('withdrawals', Withdrawals)
module.exports = Withdrawal