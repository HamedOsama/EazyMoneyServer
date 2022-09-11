const config = require('../../config');
const Admin = require('../model/admin')
const User = require('../model/user')
const Product = require('../model/product')
const multer = require('multer')
const ServerError = require('../interface/Error')
const Str = require('@supercharge/strings')
const sendgrid = require('@sendgrid/mail');
const e = require('express');
const jwt = require('jsonwebtoken')
const bcryptjs = require('bcryptjs');
const ApiFeatures = require('../utils/ApiFeatures');
const { sendgridApiKey, sendgridEmail } = config

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
    if (req.file)
      req.admin.pic = req.file.buffer
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
    const random = Str.random(10)
    await admin.updateOne({ LoginCode: random })
    // const SENDGRID_API_KEY = "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"
    console.log(sendgridApiKey)
    sendgrid.setApiKey(sendgridApiKey)
    const data = {
      to: req.body.email,
      from: sendgridEmail,
      subject: 'verify with this',
      html: ` <p>${random}</p> `
    }
    sendgrid.send(data)
      .then((response) => {
        res.status(200).json({
          ok: true,
          code: 200,
          message: 'succeeded',
          data: 'code has been sent to your email'
        })
      })
      .catch((error) => {
        return next(ServerError.badRequest(401, error.message))
      })
  }
  catch (e) {
    next(ServerError.badRequest(401, e.message))
  }
}
const verifyLoginCode = async (req, res, next) => {
  try {
    const code = req.body.code
    if (code.length !== 10)
      return next(ServerError.badRequest(400, 'code is not valid'))
    // const admin = await Admin.logIn(req.body.email, req.body.password)
    const adminWithLoginCode = await Admin.findOne({ LoginCode: code })
    if (!adminWithLoginCode)
      return next(ServerError.badRequest(400, 'code is not valid'))
    // if (admin.id !== adminWithLoginCode.id)
    // return next(ServerError.badRequest(400, 'not authenticated'))
    adminWithLoginCode.LoginCode = null;
    await adminWithLoginCode.save()
    const token = await adminWithLoginCode.getToken()

    // let sellers = 0, buyers = 0;
    // users.forEach(el => el.role === 'seller' ? sellers++ : buyers++);
    // const usersCount = users.length;



    // function fillMissing(data) {
    //   let months = []
    //   data.forEach(element => {
    //     months.push(element._id.month)
    //   });
    //   console.log(months);
    //   for (let index = 0; index < 12; index++) {
    //     if (months.includes(index + 1)) {
    //       continue
    //     } else {
    //       let col = {
    //         _id: {
    //           month: index + 1,
    //           year: "2022"
    //         },
    //         num: 0
    //       }
    //       data.push(col)

    //     }

    //   }
    //   data.sort((a, b) => {
    //     if (a._id['month'] < b._id['month']) {
    //       return -1;
    //     }
    //     if (a._id['month'] > b._id['month']) {
    //       return 1;
    //     }
    //     return 0;
    //   })
    //   return data

    // }
    // const productChart = await Product.aggregate([

    //   {
    //     $match: {}
    //   },

    //   {
    //     $group: {
    //       _id: {
    //         month: { $month: "$createdAt" },
    //         year: { $year: "$createdAt" },
    //       },
    //       count: { $sum: 1 }
    //     }
    //   },


    // ])
    // const result = fillMissing(productChart)


    const users = (await User.User.countDocuments());
    // const sellers = (await User.User.count({ role: 'seller' }));
    const sellers = (await User.User.countDocuments({ role: 'seller' }));
    const buyers = (await User.User.countDocuments({ role: 'buyer' }));
    const products = await Product.count({});
    const year = new Date().getFullYear()
    const productsChart = new Array(12).fill(0);
    const createdSellersChart = new Array(12).fill(0);
    const createdBuyersChart = new Array(12).fill(0);
    const blockedSellersChart = new Array(12).fill(0);
    const blockedBuyersChart = new Array(12).fill(0);
    const usersThisUser = (await User.User.find({
      createdAt: {
        $gte: new Date(`${year}-1`),
        $lte: new Date(`${year}-12`)
      }
    }));
    const productThisYear = await Product.find({
      createdAt: {
        $gte: new Date(`${year}-1`),
        $lte: new Date(`${year}-12`)
      }
    })
    usersThisUser.forEach(el => {
      const index = el.createdAt.getMonth();
      el.role === 'seller' ? createdSellersChart[index]++ : createdBuyersChart[index]++;
      if (el.status === 'not-active')
        el.role === 'seller' ? blockedSellersChart[index]++ : blockedBuyersChart[index]++;
    })
    productThisYear.forEach(el => {
      const index = el.createdAt.getMonth();
      productsChart[index]++;
    })
    res.status(200).json({
      ok: true,
      code: 200,
      message: 'succeeded',
      data: {
        admin: adminWithLoginCode,
        users,
        sellers,
        buyers,
        products,
        createdSellersChart,
        createdBuyersChart,
        blockedSellersChart,
        blockedBuyersChart,
        productsChart,
        // result
        // productThisYear,
        // productsChart,
        // productsChart,
        // usersChart
      },
      token
    })
  }
  catch (e) {
    next(ServerError.badRequest(401, e.message))
    // res.status(500).send(e.message)
  }
}

const getAdminData = async (req, res, next) => {
  try {
    // const adminId = req.params.id
    // if (adminId.length != 24) {
    // return next(ServerError.badRequest(400, "id is not valid"));
    // }
    // const admin = await Admin.findById({ _id: adminId })
    if (!req.admin) {
      return next(ServerError.badRequest(400, "token is not valid"));
    }
    // console.log(req.admin.id)
    // console.log(admin.id)
    // if (req.admin.id !== admin.id) {
    // return next(ServerError.badRequest(403, "Not Authorized"));
    // }
    const users = (await User.User.countDocuments());
    // const sellers = (await User.User.count({ role: 'seller' }));
    const sellers = (await User.User.countDocuments({ role: 'seller' }));
    const buyers = (await User.User.countDocuments({ role: 'buyer' }));
    const products = await Product.count({});
    const year = new Date().getFullYear()
    const productsChart = new Array(12).fill(0);
    const createdSellersChart = new Array(12).fill(0);
    const createdBuyersChart = new Array(12).fill(0);
    const blockedSellersChart = new Array(12).fill(0);
    const blockedBuyersChart = new Array(12).fill(0);
    const usersThisUser = (await User.User.find({
      createdAt: {
        $gte: new Date(`${year}-1`),
        $lte: new Date(`${year}-12`)
      }
    }));
    const productThisYear = await Product.find({
      createdAt: {
        $gte: new Date(`${year}-1`),
        $lte: new Date(`${year}-12`)
      }
    })
    usersThisUser.forEach(el => {
      const index = el.createdAt.getMonth();
      el.role === 'seller' ? createdSellersChart[index]++ : createdBuyersChart[index]++;
      if (el.status === 'not-active')
        el.role === 'seller' ? blockedSellersChart[index]++ : blockedBuyersChart[index]++;
    })
    productThisYear.forEach(el => {
      const index = el.createdAt.getMonth();
      productsChart[index]++;
    })
    res.status(200).json({
      ok: true,
      code: 200,
      message: 'succeeded',
      data: req.admin,
      users,
      sellers,
      buyers,
      products,
      productsChart,
      createdSellersChart,
      createdBuyersChart,
      blockedSellersChart,
      blockedBuyersChart,

    })
  }
  catch (e) {
    next(ServerError.badRequest(500, e.message));
  }
}


const forgetPassword = async (req, res, next) => {
  try {
    const email = req.body.email
    if (!email) {
      return next(ServerError.badRequest(400, 'please put email parameter in body'))
    }
    const url = 'http://localhost:3000'
    const admin = Admin.findOne({ email }, (err, admin) => {
      if (err || !admin) {
        return next(ServerError.badRequest(400, 'email is not valid'))
        // return res.status(404).send('admin with this email dose not exist')
      }
      const token = jwt.sign({ _id: admin._id }, 'adminPassword', { expiresIn: '20m' })

      // const SENDGRID_API_KEY = "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"
      sendgrid.setApiKey(sendgridApiKey)
      const data = {
        to: email,
        from: {
          name: 'easy money',
          email: sendgridEmail
        },
        subject: 'Account reset password Link',
        html: ` <h2>Please click on given Link to reset your password</h2>  
                    <p> ${url}/auth/reset-password/${token} </p> 
              `
      }
      admin.updateOne({ resetpassword: token }, function (err, success) {
        if (err) {
          return next(ServerError.badRequest(500, 'please try again'))
          // return res.status(400).json({ err: 'reset password link error' })
        }
        else {
          sendgrid.send(data)

            .then((response) => {
              res.status(200).json(
                {
                  ok: true,
                  code: 200,
                  message: 'succeeded',
                  data: 'email has been sent'
                }
              )
            })
            .catch((error) => {
              next(ServerError.badRequest(500, error.message))
              // res.json(error.message)
            })
        }
      })
    })
  }
  catch (e) {
    next(ServerError.badRequest(500, e.message))

    // res.status(400).send(e.message)
  }
}

const resetPassword = async (req, res, next) => {
  try {
    const resetLink = req.params.token
    const newPassword = req.body.password
    if (!newPassword) {
      return next(ServerError.badRequest(401, 'please send password'))
    }
    if (resetLink) {
      jwt.verify(resetLink, 'adminPassword', async function (err, decoded) {
        if (err) {
          return next(ServerError.badRequest(401, 'token is not correct'))
          // return res.status(401).json({ error: 'Incorrect token or it is expired' })
        }
        const admin = await Admin.findOne({ resetpassword: resetLink })
        if (!admin) {
          return next(ServerError.badRequest(401, 'token is not correct'))
          // res.status(401).send('unable to found')
        }


        // const hashedPass = bcryptjs.hashSync(newPassword, 8);
        // console.log(hashedPass);
        // admin.password = newPassword;
        // admin.resetpassword = ''
        // await admin.save();


        // res.json(
        //   {
        //     ok: true,
        //     code: 200,
        //     message: 'succeeded',
        //     data: 'your password is successfully changed'
        //   }
        // )
        // // const hashedPassword =
        await admin.updateOne({ password: newPassword }, {
          new: true,
          runValidators: true,
        }, async (err, data) => {
          if (err) {
            next(ServerError.badRequest(401, e.message))
            // return res.send(err.message)
          }
          // else if (!newPassword) {
          // next(ServerError.badRequest(401, e.message))
          // return res.send('please send your new password')
          // }
          else if (data) {
            console.log(admin.password)
            console.log()
            admin.password = newPassword;
            // console.log(admin.password)
            admin.resetpassword = ''
            await admin.save()
            // const match = await bcryptjs.compare(newPassword, admin.password);
            // console.log(match)
            res.json(
              {
                ok: true,
                code: 200,
                message: 'succeeded',
                data: 'your password is successfully changed'
              }
            )
          }
        })

      })
    }
    else {
      next(ServerError.badRequest(401, 'Authentication error!'))
      // res.status(401).json({ error: 'Authentication error!' })
    }
  }
  catch (e) {
    next(ServerError.badRequest(401, e.message))
    // res.status(400).send(e.message)
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
    const users = await ApiFeatures.pagination(
      User.User.find({}),
      req.query
    )
    const totalLength = await User.User.find({});
    res.status(200).json({
      ok: true,
      code: 200,
      message: 'succeeded',
      data: users,
      totalLength,
    })
  }
  catch (e) {
    next(ServerError.badRequest(500, e.message))
    // res.status(500).send(e.message)
  }
}

const getAllBuyers = async (req, res, next) => {
  try {
    // const user = await User.find({})
    // const buyers = user.filter(el => { return el.role == 'buyer' })
    const buyers = await ApiFeatures.pagination(
      User.User.find({ role: 'buyer' }),
      req.query
    )
    const totalLength = await User.User.find({ role: 'buyer' });
    res.status(200).json({
      ok: true,
      code: 200,
      message: 'succeeded',
      data: buyers,
      totalLength
    })
  }
  catch (e) {
    next(ServerError.badRequest(500, e.message))
    // res.status(500).send(e.message)
  }
}

const getAllSellers = async (req, res, next) => {
  try {
    // const user = await User.find({})
    // const sellers = user.filter(el => { return el.role == 'seller' })
    const sellers = await ApiFeatures.pagination(
      User.User.find({ role: 'seller' }),
      req.query
    )
    const totalLength = await User.User.find({ role: 'seller' });
    res.status(200).json({
      ok: true,
      code: 200,
      message: 'succeeded',
      data: sellers,
      totalLength
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
    if (!userID)
      return next(ServerError.badRequest(400, 'please send id'))
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
    if (!userID)
      return next(ServerError.badRequest(400, 'please send id'))
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

    // const limitValue = req.query.limit || 10;
    // const skipValue = req.query.skip || 0;
    // const products = await Product.find()
    //   .limit(limitValue).skip(skipValue);
    // console.log(req.query)
    const products = await ApiFeatures.pagination(
      Product.find({}),
      req.query
    )
    const totalLength = await Product.countDocuments();
    res.status(200).json({
      ok: true,
      code: 200,
      message: 'succeeded',
      data: products,
      totalLength,
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
    // const products = await Product.find({ category: { $regex: new RegExp(catName, "i") } })

    const products = await ApiFeatures.pagination(
      Product.find({ category: { $regex: new RegExp(catName, "i") } }),
      req.query
    )
    const totalLength = await Product.countDocuments();
    res.status(200).json({
      ok: true,
      code: 200,
      message: 'succeeded',
      data: products,
      totalLength
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
    // const products = await Product.find({ name: { $regex: new RegExp(productName, "i") } })
    const products = await ApiFeatures.pagination(
      Product.find({ name: { $regex: new RegExp(catName, "i") } }),
      req.query
    )
    const totalLength = await Product.countDocuments();

    res.status(200).json({
      ok: true,
      code: 200,
      message: 'succeeded',
      data: products,
      totalLength
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
  getAdminData,
  login,
  verifyLoginCode,
  logout,
  logoutAllDevices,
  forgetPassword,
  resetPassword,
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