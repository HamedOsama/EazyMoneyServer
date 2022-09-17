const express = require('express')
const routes = express.Router()
const ordersController = require('../../../controllers/order.controller')
const auth = require('../../../middleware/auh')

routes.route('/add').post(auth, ordersController.createOrder)

module.exports = routes