const express = require('express')
const routes = express.Router()
const adminController = require('../../../controllers/admin.controller')

const auth = require('../../../middleware/adminAuth')

// routes do not need for authentication
routes.route('/login').post(adminController.login)
routes.route('/authenticate-login-code').post(adminController.verifyLoginCode)
// routes.route('/login').post(adminController.verifyLoginCode)

routes.route('/add').post(adminController.Uploads.single('avatar'), adminController.getAdminData)
routes.route('/forget-password').put(adminController.forgetPassword)
routes.route('/reset-password/:token').put(adminController.resetPassword)
// routes.use(auth)
// routes need for authentication
// admin controllers
routes.route('/get-data').get(auth, adminController.getAdminData)
routes.route('/logout').delete(auth, adminController.logout)
routes.route('/logout-all').delete(auth, adminController.logoutAllDevices)
//users
routes.route('/users/add').post(auth, adminController.addUser)
routes.route('/users/user/:id').get(auth, adminController.getUser)
routes.route('/users/all').get(auth, adminController.getAllUsers)
routes.route('/users/buyers').get(auth, adminController.getAllBuyers)
routes.route('/users/sellers').get(auth, adminController.getAllSellers)
routes.route('/users/logout').delete(auth, adminController.logoutUserFromAllDevices)
//products
routes.route('/products/categories/all').get(auth, adminController.getAllCategories)
routes.route('/products/all').get(auth, adminController.getAllProducts)
routes.route('/products/product/:id').get(auth, adminController.getProductById)
routes.route('/products/product/:cat').get(auth, adminController.getProductsByCategory)
routes.route('/products/product/:name').get(auth, adminController.getProductsByName)
routes.route('/products/product/seller/:id').get(auth, adminController.getSellerOfProduct)
routes.route('/products/product/:id').patch(auth, adminController.updateProduct)
routes.route('/products/product/:id').delete(auth, adminController.deleteProduct)


// change buffer to photo
routes.use(adminController.Uploads.single('avatar'))
//users
routes.route('/users/update/:id').patch(auth, adminController.updateUser)
//products
routes.route('/products/add').post(auth, adminController.addProduct)

module.exports = routes