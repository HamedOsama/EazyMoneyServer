const Router = require('express');
const usersRoutes = require('./api/v1/users.routes')
const productsRoutes = require('./api/v1/products.routes')
const ordersRoutes = require('./api/v1/order.routes')
const withdrawalRoutes = require('./api/v1/withdrawal.routes')
const adminRoutes = require('./api/v1/admin.routes')
const routes = Router();
routes.use('/users', usersRoutes);
routes.use('/products', productsRoutes);
routes.use('/order', ordersRoutes);
routes.use('/admin', adminRoutes);
routes.use('/user', withdrawalRoutes);
module.exports = routes;
