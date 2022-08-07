const express = require('express')
const routes = express.Router()
const productsController = require('../../../controllers/products.controller')
// const usersController = require('../../../controllers/users.controller')
const auth = require('../../../middleware/auh')

// routes
routes.route('/get-all').get(productsController.getAll)
routes.use(auth)
routes.use(productsController.Uploads.single('avatar')).route('/create').post(productsController.createProduct)
module.exports = routes