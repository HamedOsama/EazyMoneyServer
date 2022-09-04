const Router = require('express');
const usersRoutes = require('./api/v1/users.routes')
const productsRoutes = require('./api/v1/products.routes')
const adminRoutes = require('./api/v1/admin.routes')
const routes = Router();
routes.use('/users', usersRoutes);
routes.use('/products', productsRoutes);
routes.use('/admin', adminRoutes);
module.exports = routes;
