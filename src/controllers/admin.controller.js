const Admin = require('../model/admin')
const User = require('../model/user')
const Product = require('../model/product')
const multer = require('multer')
const ServerError = require('../interface/Error')

const Uploads = multer({
  fileFilter(req, file, cb) {
    if (!file.originalname.match(/\.(jpg|jpeg|png|jfif)$/))
      return cb(new Error('please upload image !'))
    cb(null, true)
  }
})
const addAdmin = async (req, res, next) => {
  try {
    const admin = new Admin(req.body)
    const token = await admin.getToken()
    await admin.save()
    res.status(201).json({
      ok: true,
      code: 201,
      message: 'succeeded',
      data: admin,
      token
    })
  }
  catch (e) {
    next(ServerError.badRequest(400, e.message))
    // res.status(500).send(e.message)
  }
}

const login = async (req, res, next) => {
  try {
    const admin = await Admin.logIn(req.body.email, req.body.password)
    const token = await admin.getToken()
    const users = (await User.User.count({}));
    const sellers = (await User.User.count({ role: 'seller' }));
    const buyers = (await User.User.count({ role: 'buyer' }));
    // let sellers = 0, buyers = 0;
    // users.forEach(el => el.role === 'seller' ? sellers++ : buyers++);
    // const usersCount = users.length;
    const products = await Product.count({});
    const usersChart = await User.User.aggregate([
      {
        $addFields: {
          createdAt: {
            $cond: {
              if: {
                $eq: [
                  {
                    $type: "$createdAt"
                  },
                  "date"
                ]
              },
              "then": "$createdAt",
              "else": null
            }
          }
        }
      },
      {
        $addFields: {
          __alias_0: {
            year: {
              $year: "$createdAt"
            },
            "month": {
              "$subtract": [
                {
                  "$month": "$createdAt"
                },
                1
              ]
            }
          }
        }
      },
      {
        $group: {
          _id: {
            __alias_0: "$__alias_0"
          },
          "__alias_1": {
            $sum: {
              $cond: [
                {
                  $ne: [
                    {
                      $type: "$createdAt"
                    },
                    "missing"
                  ]
                },
                1,
                0
              ]
            }
          }
        }
      },
      {
        $project: {
          _id: 0,
          __alias_0: "$_id.__alias_0",
          __alias_1: 1
        }
      },
      {
        $project: {
          x: "$__alias_0",
          y: "$__alias_1",
          _id: 0
        }
      },
      {
        $sort: {
          "x.year": 1,
          "x.month": 1
        }
      },
      {
        $limit: 5000
      }
    ])
    res.status(200).json({
      ok: true,
      code: 200,
      message: 'succeeded',
      data: {
        admin,
        users,
        sellers,
        buyers,
        products,
        usersChart
      },
      token
    })
  }
  catch (e) {
    next(ServerError.badRequest(401, e.message))
    // res.status(500).send(e.message)
  }
}

const logout = async (req, res, next) => {
  try {
    req.admin.token = req.admin.token.filter(el => {
      return el != req.token
    })
    await req.admin.save()
    res.status(200).json({
      ok: true,
      code: 200,
      message: 'succeeded',
    })
  }
  catch (e) {
    next(ServerError.badRequest(401, e.message))
    // res.status(500).send(e.message)
  }
}

const logoutAllDevices = async (req, res, next) => {
  try {
    req.admin.token = []
    await req.admin.save()
    res.status(200).json({
      ok: true,
      code: 200,
      message: 'succeeded',
    })
  }
  catch (e) {
    next(ServerError.badRequest(401, e.message))
    // res.status(500).send(e.message)
  }
}

const addUser = async (req, res, next) => {
  try {
    const user = new User(req.body)
    const token = await user.generateToken()
    await user.save()
    res.status(201).json({
      ok: true,
      code: 201,
      message: 'succeeded',
      data: user,
      token
    })
  }
  catch (e) {
    next(ServerError.badRequest(400, e.message))
    // res.status(400).send(e.message)
  }
}
const updateUser = async (req, res, next) => {
  try {
    const userID = req.params.id
    const user = await User.findById({ _id: userID })
    if (!user)
      return next(ServerError.badRequest(400, 'user not found'))
    // res.status(404).send('unable to found')
    const Updates = Object.keys(req.body)
    Updates.forEach((update) => { user[update] = req.body[update] })
    if (req.file)
      user.pic = req.file.buffer

    await user.save()
    res.status(200).json({
      ok: true,
      code: 200,
      message: 'succeeded',
      data: user,
    })
  }
  catch (e) {
    next(ServerError.badRequest(500, e.message))
    // res.status(500).send(e.message)
  }
}

const getAllUsers = async (req, res, next) => {
  try {
    const users = await User.find({})
    res.status(200).json({
      ok: true,
      code: 200,
      message: 'succeeded',
      data: users,
    })
  }
  catch (e) {
    next(ServerError.badRequest(500, e.message))
    // res.status(500).send(e.message)
  }
}

const getAllBuyers = async (req, res, next) => {
  try {
    const user = await User.find({})
    const buyers = user.filter(el => { return el.role == 'buyer' })
    res.status(200).json({
      ok: true,
      code: 200,
      message: 'succeeded',
      data: buyers
    })
  }
  catch (e) {
    next(ServerError.badRequest(500, e.message))
    // res.status(500).send(e.message)
  }
}

const getAllSellers = async (req, res, next) => {
  try {
    const user = await User.find({})
    const sellers = user.filter(el => { return el.role == 'seller' })
    res.status(200).json({
      ok: true,
      code: 200,
      message: 'succeeded',
      data: sellers
    })
  }
  catch (e) {
    next(ServerError.badRequest(500, e.message))
    // res.status(500).send(e.message)
  }
}

const logoutUserFromAllDevices = async (req, res, next) => {
  try {
    const userID = req.params.id
    const user = await User.findById({ _id: userID })
    user.tokens = []
    await user.save()
    res.status(200).json({
      ok: true,
      code: 200,
      message: 'succeeded',
    })
  }
  catch (e) {
    next(ServerError.badRequest(401, e.message))
    // res.status(500).send(e.message)
  }
}


const getUser = async (req, res, next) => {
  try {

    const userId = req.params.id
    const user = await User.findById(userId)
    if (!user) {
      return next(ServerError.badRequest(400, 'unable to find any user match this ID'))
      // res.status(404).send("unable to found any user match this ID")
    }

    res.status(200).json({
      ok: true,
      code: 200,
      message: 'succeeded',
      data: user
    })
  }
  catch (e) {
    next(ServerError.badRequest(500, e.message))
    // res.status(400).send(e.message)
  }
}

const addProduct = async (req, res, next) => {
  try {
    const product = new Product(req.body)
    if (req.file) {
      product.image = req.file.buffer
    }
    const sum = product.properties.reduce((accumulator, object) => {
      return accumulator + object.amount;
    }, 0);

    product.total_amount = sum
    await product.save()

    res.status(201).json({
      ok: true,
      code: 201,
      message: 'succeeded',
      data: product
    })

  }
  catch (e) {
    next(ServerError.badRequest(500, e.message))
    // res.status(500).send(e.message)
  }
}


const getAllCategories = async (req, res, next) => {
  try {
    const categories = []
    const product = await Product.find({})
    product.forEach(el => {
      if (!categories.includes(el.category))
        categories.push(el.category)
    })
    res.status(200).json({
      ok: true,
      code: 200,
      message: 'succeeded',
      data: categories
    })
  }
  catch (e) {
    next(ServerError.badRequest(500, e.message))
    // res.status(500).send(e.message)
  }
}

const getAllProducts = async (req, res, next) => {
  try {

    const limitValue = req.query.limit || 10;
    const skipValue = req.query.skip || 0;
    const products = await Product.find()
      .limit(limitValue).skip(skipValue);
    res.status(200).json({
      ok: true,
      code: 200,
      message: 'succeeded',
      data: products
    })
  }
  catch (e) {
    next(ServerError.badRequest(500, e.message))
    // res.status(500).send(e.message)
  }
}

const getProductById = async (req, res, next) => {
  try {
    const id = req.params.id
    const product = await Product.findById(id)
    if (!product) {
      return next(ServerError.badRequest(400, 'product not found'))
      // res.status(404).send('unable to found')
    }
    res.status(200).json({
      ok: true,
      code: 200,
      message: 'succeeded',
      data: product
    })
  }
  catch (e) {
    next(ServerError.badRequest(500, e.message))
    // res.status(500).send(e.message)
  }
}

const getProductsByCategory = async (req, res, next) => {
  try {
    const catName = req.params.cat
    const products = await Product.find({ category: { $regex: new RegExp(catName, "i") } })

    res.status(200).json({
      ok: true,
      code: 200,
      message: 'succeeded',
      data: products
    })
  }
  catch (e) {
    next(ServerError.badRequest(500, e.message))
    // res.status(500).send(e.message)
  }
}

const getProductsByName = async (req, res, next) => {
  try {
    const productName = req.params.name
    const products = await Product.find({ name: { $regex: new RegExp(productName, "i") } })

    res.status(200).json({
      ok: true,
      code: 200,
      message: 'succeeded',
      data: products
    })

  }
  catch (e) {
    next(ServerError.badRequest(500, e.message))
    // res.status(500).send(e.message)
  }
}


const updateProduct = async (req, res, next) => {
  try {
    const productId = req.params.id
    const product = await Product.findOneAndUpdate({ _id: productId }, req.body, {
      new: true,
      runValidators: true
    })

    const sum = product.properties.reduce((accumulator, object) => {
      return accumulator + object.amount;
    }, 0);

    product.total_amount = sum

    if (!product) {
      return next(ServerError.badRequest(400, 'product not found'))
      // res.status(404).send('unable to found')
    }
    await product.save()
    res.status(200).json({
      ok: true,
      code: 200,
      message: 'succeeded',
      data: product
    })
  }
  catch (e) {
    next(ServerError.badRequest(500, e.message))
    // res.status(500).send(e.message)
  }
}

const getSellerOfProduct = async (req, res, next) => {
  try {
    const productId = req.params.id
    const product = await Product.findById({ _id: productId })
    if (!product)
      return next(ServerError.badRequest(400, 'user not found'))
    // res.status(404).send('unable to found')
    const seller = await User.findById({ _id: product.seller })
    res.status(200).json({
      ok: true,
      code: 200,
      message: 'succeeded',
      data: seller
    })

  }
  catch (e) {
    next(ServerError.badRequest(500, e.message))
    // res.status(500).send(e.message)
  }
}
const deleteProduct = async (req, res, next) => {
  try {
    const productId = req.params.id
    const product = await Product.findOneAndDelete({ _id: productId })

    res.status(200).json({
      ok: true,
      code: 200,
      message: 'succeeded'
    })
  }
  catch (e) {
    next(ServerError.badRequest(500, e.message))
    // res.status(500).send(e.message)
  }
}
module.exports = {
  Uploads,
  addAdmin,
  login,
  logout,
  logoutAllDevices,
  addUser,
  getAllUsers,
  getAllBuyers,
  getAllSellers,
  getUser,
  updateUser,
  logoutUserFromAllDevices,
  addProduct,
  getAllProducts,
  getProductById,
  getProductsByCategory,
  getProductsByName,
  getAllCategories,
  updateProduct,
  getSellerOfProduct,
  deleteProduct,
}