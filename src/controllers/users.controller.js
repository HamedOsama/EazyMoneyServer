const sendgrid = require('@sendgrid/mail')
const multer = require('multer');
const jwt = require('jsonwebtoken')
const bcryptjs = require('bcryptjs')
const { User, validatePassword } = require('../model/user');
const auth = require('../middleware/auh');
const { json } = require('express');
const ServerError = require('../interface/Error');
const Uploads = multer({
  fileFilter(req, file, cb) {
    if (!file.originalname.match(/\.(jpg|jpeg|png|jfif)$/))
      return cb(new Error('please upload image !'));
    cb(null, true);
  },
});
const signup = async (req, res, next) => {
  try {
    const user = new User(req.body);
    const token = await user.generateToken();
    await user.save();
    res.status(201).json({
      ok: true,
      code: 201,
      message: 'succeeded',
      data: user,
      token
    });
  } catch (e) {
    next(ServerError.badRequest(400, e.message))
  }
};
const login = async (req, res, next) => {
  try {
    const user = await User.Login(req.body.email, req.body.password);
    const token = await user.generateToken();
    res.json({
      ok: true,
      code: 200,
      message: 'succeeded',
      body: user,
      token,
    });
  } catch (e) {
    next(ServerError.badRequest(401, e.message))
    // res.status(401).send(e.message);
  }
};
const updateUser = async (req, res, next) => {
  try {
    // console.log(req.body.password);
    const updates = Object.keys(req.body);
    const notAllowedUpdates = ['status', 'role', 'tokens'];
    // const isValid = updates.every(el => !notAllowedUpdates.includes(el));
    const inValidUpdates = updates.filter(el => notAllowedUpdates.includes(el))
    console.log(inValidUpdates)
    // console.log(isValid);
    // console.log(updates);
    if (inValidUpdates.length > 0) {
      next(ServerError.badRequest(400, `not allowed to update (${inValidUpdates.join(', ')})`))
      // return res.status(400).send("Can't update");
    }
    // console.log(req.user);
    // console.log(req.body.password);
    // const validation = await validatePassword(req.user, req.body.oldpassword);
    // console.log(validation);
    // if (!validation) throw new Error('wrong password');
    updates.forEach((update) => {
      req.user[update] = req.body[update];
    });
    if (req.file) req.user.pic = req.file.buffer;
    await req.user.save();
    res.status(200).json({
      ok: true,
      code: 200,
      message: 'succeeded',
      body: req.user,
    })
  } catch (e) {
    next(ServerError.badRequest(500, e.message))
    // res.status(500).send(e.message);
  }
};
const getAll = async (req, res, next) => {
  try {
    const users = await User.find({});
    res.status(200).json({
      ok: true,
      code: 200,
      message: 'succeeded',
      body: users,
    })
  } catch (e) {
    next(ServerError.badRequest(500, e.message))
    // res.status.apply(500).send(e.message);
  }
};
const getAllBuyers = async (req, res, next) => {
  try {
    const buyers = await User.find({ role: 'buyer' });
    // const buyers = user.filter((el) => {
    // return el.role == 'buyer';
    // });
    res.status(200).json({
      ok: true,
      code: 200,
      message: 'succeeded',
      body: buyers,
    })
  } catch (e) {
    next(ServerError.badRequest(500, e.message))
    // res.status(500).send(e.message);
  }
};

const getAllSellers = async (req, res, next) => {
  try {
    const sellers = await User.find({ role: 'seller' });
    // const seller = user.filter((el) => {
    // return el.role == 'seller';
    // });
    res.status(200).json({
      ok: true,
      code: 200,
      message: 'succeeded',
      body: sellers,
    })
  } catch (e) {
    next(ServerError.badRequest(500, e.message))
    res.status(500).send(e.message);
  }
};

const resetPassword = async (req, res, next) => {
  // router.put('/resetpassword/:token', async (req, res,next) => {
  try {
    const resetLink = req.params.token
    if (resetLink) {
      jwt.verify(resetLink, 'resetPassword', async function (err, decoded) {
        if (err) {
          return next(ServerError.badRequest(401, err.message))
          // throw new Error(err)
          // return res.status(401).json({ error: 'Incorrect token or it is expired' })
        }
        const user = await User.findOneAndUpdate({ resetLink }, { ...req.body, resetLink: '' }, {
          new: true,
          runValidators: true
        })
        if (!user) {
          // return res.status(401).json({ error: 'Token not valid' })
          return next(ServerError.badRequest(401, 'token not valid'))
          // throw new Error('Token not valid')
        }
        console.log(user)
        // user.password = await bcryptjs.hash(user.password, 8)
        user.save()
        return res.status(200).json({
          ok: true,
          code: 200,
          message: 'succeeded',
          body: 'your password changed successfully',
        })
      })
    }
    else {
      // res.status(401).json({ error: 'Authentication error!' })
      return next(ServerError.badRequest(401, 'authentication error'))
      // throw new Error('Authentication error!')
    }
  } catch (e) {
    next(ServerError.badRequest(500, e.message))
    // res.status(500).send(e.message)
  }
}


// router.put('/user/forgetpass', async (req, res,next) => {
const forgetPassword = async (req, res, next) => {
  try {
    const email = req.body.email
    const url = 'http://localhost:3000'
    const user = User.findOne({ email }, (err, user) => {
      if (err || !user) {
        // return res.status(404).send('user with this email dose not exist')
        return next(ServerError.badRequest(400, 'no user found with this email'))
      }
      const token = jwt.sign({ _id: user._id }, 'resetPassword', { expiresIn: '20m' })
      // const SENDGRID_API_KEY = "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"
      const SENDGRID_API_KEY = "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"
      sendgrid.setApiKey(SENDGRID_API_KEY)
      const data = {
        to: email,
        from: 'eazymony6@gmail.com',
        subject: 'Account reset password Link',
        html: ` <h2>Please click on given Link to reset your password</h2>  
                    <p> ${url}/api/v1/users/auth/reset-password/${token} </p> 
              `
      }
      user.updateOne({ resetLink: token }, function (err, success) {
        if (err) {
          return next(ServerError.badRequest(400, 'something went wrong'))
          // return res.status(400).json({ err: 'reset password link error' })
        }
        else {
          sendgrid.send(data)
            .then((response) => {
              res.status(200).json({
                ok: true,
                code: 200,
                message: 'succeeded',
                body: 'email has been sent',
              })
            })
            .catch((err) => {
              return next(ServerError.badRequest(400, err.message))
              // res.json(error.message)
            })
        }
      })
    })
  }
  catch (e) {
    next(ServerError.badRequest(500, e.message))
    // res.status(500).send(e.message)
  }
}


const logout = async (req, res, next) => {
  try {
    req.user.tokens = req.user.tokens.filter((el) => {
      return el != req.token;
    });
    await req.user.save();
    res.status(200).json({
      ok: true,
      code: 200,
      message: 'succeeded',
    })
  } catch (e) {
    next(ServerError.badRequest(500, e.message))
    // res.status(500).send(e.message);
  }
};
const logoutAll = async (req, res, next) => {
  try {
    console.log(req.user);
    req.user.tokens = [];
    await req.user.save();
    res.status(200).json({
      ok: true,
      code: 200,
      message: 'succeeded',
    })
  } catch (e) {
    next(ServerError.badRequest(500, e.message))
    // console.log(e);
    // res.status(500).send(e);
  }
};
module.exports = {
  signup,
  login,
  logout,
  logoutAll,
  getAll,
  getAllBuyers,
  getAllSellers,
  updateUser,
  resetPassword,
  forgetPassword,
  Uploads,
};
