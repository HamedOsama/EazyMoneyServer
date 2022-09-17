const Order = require('../model/order')
const { User } = require('../model/user')
const Product = require('../model/product')
const ServerError = require('../interface/Error')
const ApiFeatures = require('../utils/ApiFeatures');

const createOrder = async (req, res, next) => {
  try {
    if (req.user.role !== 'buyer' && req.user.status !== 'active') {
      return next(ServerError.badRequest(403, 'not authorized'))
    }
    if (req.body.newPrice <= req.body.sellPrice) {
      return next(ServerError.badRequest(400, 'sellPrice not valid'))
    }
    const productId = req.body.productId
    const product = await Product.findById({ _id: productId })
    if (!product)
      return next(ServerError.badRequest(400, 'invalid product id'))
    // const ordersProperties = product.properties.filter(el => el._id.toString() === req.body.orderItems[0].propertyId)
    const validateQuantity = req?.body?.orderItems?.every(el => el.quantity > 0)
    if (!validateQuantity)
      return next(ServerError.badRequest(400, 'quantity must be positive number'))

    let checkForProperties = 0;
    let checkForStock = 0;
    req?.body?.orderItems?.forEach(orderItem => {
      console.log(orderItem.propertyId)
      const checker = product.properties.find(el => el?._id?.toString() === orderItem?.propertyId)
      const stockChecker = product.properties.find(el => el?._id?.toString() === orderItem?.propertyId && el.amount >= orderItem.quantity)
      // console.log
      if (checker)
        checkForProperties++;
      if (stockChecker)
        checkForStock++;
    })
    console.log(checkForProperties)
    if (checkForProperties !== req.body.orderItems.length)
      return next(ServerError.badRequest(400, 'invalid property id'))
    if (checkForStock !== req.body.orderItems.length)
      return next(ServerError.badRequest(400, 'stock is low'))

    const shippingPrice = product.shipping_price[req.body.city]
    const totalPrice = req.body.newPrice + shippingPrice;
    // console.log(totalPrice);
    // console.log(req.body.totalPrice);
    if (req.body.shippingPrice !== shippingPrice)
      return next(ServerError.badRequest(400, 'invalid shipping price'))
    if (req.body.totalPrice !== totalPrice)
      return next(ServerError.badRequest(400, 'invalid total price'))
    const order = new Order({
      ...req.body,
      sellerId: product.seller,
      buyerId: req.user._id,
      shippingPrice,
      totalPrice,
      websiteTax: product.sellPrice - product.originalPrice,
      buyerCommission: req.body.newPrice - product.sellPrice
    })
    // var array = Object.entries(product.shipping_price)
    //    if(order.sellPrice!=product.sellPrice)
    //    return res.send('sell price incorrect please enter the correct one')
    // if (order.newPrice < order.sellPrice)
    //   return res.send('new price unable to smaller than sell price')
    // order. buyerCommission=order.shippingPrice+order.newPrice
    await order.save()
    res.status(200).send(order)
  } catch (e) {
    next(e)
  }
}

module.exports = { createOrder }