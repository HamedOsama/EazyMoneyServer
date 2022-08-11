const express = require('express')
const routes = express.Router()
const productsController = require('../../../controllers/products.controller')
// const usersController = require('../../../controllers/users.controller')
const auth = require('../../../middleware/auh')

// routes
routes.route('/get-all').get(productsController.getAll)
routes.route('/get-all-categories').get(productsController.getAllCat)
routes.route('/:id').get(productsController.getProductById)
routes.route('/name/:name').get(productsController.getProductsByName)
routes.route('/category/:category').get(productsController.getProductsByCategory)
routes.route('/seller/:seller').get(productsController.getProductsBySellerID)

routes.use(auth)
routes.route('/:id')
  .delete(productsController.deleteProduct)
  .patch(productsController.updateProduct)
routes.use(productsController.Uploads.single('avatar')).route('/create').post(productsController.createProduct)
module.exports = routes