const multer = require('multer');
const Product = require('../model/product');
const auth = require('../middleware/auh');
const User = require('../model/user');
const ServerError = require('../interface/Error');

const Uploads = multer({
  fileFilter(req, file, cb) {
    if (!file.originalname.match(/\.(jpg|jpeg|png|jfif)$/))
      return cb(new Error('please upload image !'));
    cb(null, true);
  },
});


const createProduct = async (req, res, next) => {
  try {
    if (req.user.role != 'seller') {
      return next(ServerError.badRequest(403, 'Error, Must be seller to add product'))
      // throw new Error('Error, Must be seller to add product');
    }
    const product = new Product({ ...req.body, seller: req.user._id });
    if (req.file) {
      product.image = req.file.buffer;
    }
    const sum = product.properties.reduce((accumulator, object) => {
      return accumulator + object.amount;
    }, 0);
    product.total_amount = sum;
    await product.save();
    res.status(201).json({
      ok: true,
      code: 201,
      message: 'succeeded',
      body: product,
    });
  } catch (e) {
    next(ServerError.badRequest(500, e.message))
    // res.status(500).send(e.message);
  }
};

const getAll = async (req, res, next) => {
  try {
    const products = await Product.find({});
    res.status(200).json({
      ok: true,
      code: 200,
      message: 'succeeded',
      body: products,
    });
  } catch (e) {
    next(ServerError.badRequest(500, e.message))
    // res.status.status(500).send(e.message);
  }
};
const getAllCat = async (req, res, next) => {
  try {
    const categories = [];
    const product = await Product.find({});
    product.forEach((el) => {
      if (!categories.includes(el.category)) categories.push(el.category);
    });
    res.status(200).json({
      ok: true,
      code: 200,
      message: 'succeeded',
      body: categories,
    });
  } catch (e) {
    next(ServerError.badRequest(500, e.message))
    // res.status(500).send(e.message);
  }
};
const getProductById = async (req, res, next) => {
  try {
    const id = req.params.id;
    const product = await Product.findById(id);
    res.status(200).json({
      ok: true,
      code: 200,
      message: 'succeeded',
      body: product,
    });
  } catch (e) {
    next(ServerError.badRequest(500, e.message))
    // res.status(500).send(e.message);
  }
};
const getProductsByCategory = async (req, res, next) => {
  try {
    const catName = req.params.category;
    const products = await Product.find({ category: new RegExp(catName, 'i') });
    res.status(200).json({
      ok: true,
      code: 200,
      message: 'succeeded',
      body: products,
    });
  } catch (e) {
    next(ServerError.badRequest(500, e.message))
    // res.status(500).send(e.message);
  }
};
const getProductsByName = async (req, res, next) => {
  try {
    const productName = req.params.name;
    // old way
    // const product = await Product.find({ name: productName });
    const products = await Product.find({ name: { $regex: new RegExp(productName, "i") } });
    res.status(200).json({
      ok: true,
      code: 200,
      message: 'succeeded',
      body: products,
    });
  } catch (e) {
    next(ServerError.badRequest(500, e.message))
    // res.status(500).send(e.message);
  }
};
const getProductsBySellerID = async (req, res, next) => {
  try {
    const sellerId = req.params.seller;
    console.log(req.params)
    const products = await Product.find({ seller: sellerId });
    res.status(200).json({
      ok: true,
      code: 200,
      message: 'succeeded',
      body: products,
    });
  } catch (e) {
    next(ServerError.badRequest(500, e.message))
    // res.status(500).send(e.message);
  }
};
const updateProduct = async (req, res, next) => {
  try {
    const productId = req.params.id;
    if (req.body.seller)
      throw new Error('sellerId cannot update!');
    const product = await Product.findOneAndUpdate(
      { _id: productId, seller: req.user._id },
      req.body,
      {
        new: true,
        runValidators: true,
      }
    );
    if (!product) {
      return next(ServerError.badRequest(400, 'product not found'))
      // throw new Error('cannot find product')
    }
    const sum = product.properties.reduce((acc, el) => {
      return acc + el.amount
    }, 0)
    product.total_amount = sum;
    await product.save();
    res.status(200).json({
      ok: true,
      code: 200,
      message: 'succeeded',
      body: product,
    });
  } catch (e) {
    next(ServerError.badRequest(500, e.message))
    // res.status(500).send(e.message);
  }
};
const deleteProduct = async (req, res, next) => {
  try {
    const productId = req.params.id;
    const product = await Product.findOneAndDelete({
      _id: productId,
      seller: req.user._id,
    });
    if (!product)
      return next(ServerError.badRequest(400, 'invalid id'))
    // throw new Error('Invalid ID')
    // await Product.save();
    res.status(200).json({
      ok: true,
      code: 200,
      message: 'succeeded',
    });
  } catch (e) {
    next(ServerError.badRequest(500, e.message))
    // res.status(500).send(e.message);
  }
};
const sellerGetOwn = async (req, res, next) => {
  try {
    console.log(12)
    await req.user.populate('products');
    res.status(200).json({
      status: 200,
      message: 'succeeded',
      data: req.user.products,
    });
  } catch (e) {
    next(ServerError.badRequest(500, e.message))
    // res.status(500).send(e.message);
  }
};
module.exports = {
  createProduct,
  getAll,
  getAllCat,
  getProductById,
  getProductsByCategory,
  getProductsByName,
  getProductsBySellerID,
  updateProduct,
  deleteProduct,
  sellerGetOwn,
  Uploads,
};
