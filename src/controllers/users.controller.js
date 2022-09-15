const config = require('../../config');
const sendgrid = require('@sendgrid/mail')
const multer = require('multer');
const jwt = require('jsonwebtoken')
const bcryptjs = require('bcryptjs')
const { User } = require('../model/user');
const auth = require('../middleware/auh');
const { json } = require('express');
const ServerError = require('../interface/Error');
const { sendgridApiKey, sendgridEmail } = config

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
    // console.log(e)
    // next(new ServerError(400, e.message))
    e.statusCode = 400
    next(e)
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
    e.statusCode = 401;
    next(e);
    // next(ServerError.badRequest(401, e.message))
    // res.status(401).send(e.message);
  }
};
const updateUser = async (req, res, next) => {
  try {
    // console.log(req.body.password);
    const updates = Object.keys(req.body);
    const notAllowedUpdates = ['status', 'role', 'tokens', 'password', 'updatedAt', '_id', 'createdAt', 'resetLink',];
    // const isValid = updates.every(el => !notAllowedUpdates.includes(el));
    const inValidUpdates = updates.filter(el => notAllowedUpdates.includes(el))
    console.log(inValidUpdates)
    // console.log(isValid);
    // console.log(updates);
    if (inValidUpdates.length > 0) {
      next(ServerError.badRequest(401, `not allowed to update (${inValidUpdates.join(', ')})`))
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
    if (req.file) req.user.image = req.file.filename;
    await req.user.save();
    res.status(200).json({
      ok: true,
      code: 200,
      message: 'succeeded',
      body: req.user,
    })
  } catch (e) {
    // e.statusCode = 400
    next(e)
    // next(ServerError.badRequest(500, e.message))
    // res.status(500).send(e.message);
  }
};
const getUser = async (req, res, next) => {
  try {
    // const userId = req.params.id
    // if (!userId)
    //   return next(ServerError.badRequest(400, 'please send id'))
    // const user = await User.User.findById(userId)
    // if (!user) {
    //   return next(ServerError.badRequest(400, 'unable to find any user match this ID'))
    // }
    if (!req.user) {
      return next(ServerError.badRequest(401, "token is not valid"));
    }
    console.log(req.user)
    res.status(200).json({
      ok: true,
      code: 200,
      message: 'succeeded',
      body: req.user,
    })
  } catch (e) {
    // e.statusCode = 400
    next(e)
    // next(ServerError.badRequest(500, e.message))
    // res.status.apply(500).send(e.message);
  }
};
const changePassword = async (req, res, next) => {
  try {
    if (!req.user)
      return next(ServerError.badRequest(400, "token is not valid"));
    const user = req.user;
    const password = req.body.password;
    const newPassword = req.body.newPassword;
    const isMatched = user.validatePassword(password);
    if (!isMatched)
      return next(ServerError.badRequest(400, "wrong password"));
    user.password = newPassword;
    await user.save()
    res.status(200).json({
      ok: true,
      code: 200,
      message: 'password has been updated successfully',
    })
  } catch (e) {
    // next(ServerError.badRequest(500, e.message))
    next(e)
    // res.status.apply(500).send(e.message);
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
    // next(ServerError.badRequest(500, e.message))
    next(e)
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
    // e.statusCode = 400
    next(e)
    // next(ServerError.badRequest(500, e.message))
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
    // e.statusCode = 400
    next(e)
    // next(ServerError.badRequest(500, e.message))
    // res.status(500).send(e.message);
  }
};

const resetPassword = async (req, res, next) => {
  try {
    const resetLink = req.params.token
    const newPassword = req.body.password
    if (!newPassword) {
      return next(ServerError.badRequest(401, 'please send password'))
    }
    if (resetLink) {
      jwt.verify(resetLink, 'resetPassword', async function (err, decoded) {
        if (err) {
          return next(ServerError.badRequest(401, 'token is not correct'))
        }
        const user = await User.findOne({ resetLink: resetLink })
        if (!user) {
          return next(ServerError.badRequest(401, 'token is not correct'))
        }
        await user.updateOne({ password: newPassword }, {
          new: true,
          runValidators: true,
        }, async (err, data) => {
          if (err) {
            next(ServerError.badRequest(401, e.message))
          }
          else if (data) {
            console.log(user.password)
            console.log()
            user.password = newPassword;
            user.resetLink = ''
            await user.save()
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
    }
  } catch (e) {
    // e.statusCode = 400
    next(e)
    // next(ServerError.badRequest(500, e.message))
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
      // const SENDGRID_API_KEY = "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"
      sendgrid.setApiKey(sendgridApiKey)
      const data = {
        to: email,
        from: sendgridEmail,
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
    // e.statusCode = 400
    next(e)
    // next(ServerError.badRequest(500, e.message))
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
    // e.statusCode = 400
    next(e)
    // next(ServerError.badRequest(500, e.message))
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
    // e.statusCode = 400
    next(e)
    // next(ServerError.badRequest(500, e.message))
    // console.log(e);
    // res.status(500).send(e);
  }
};
module.exports = {
  signup,
  getUser,
  login,
  logout,
  logoutAll,
  changePassword,
  getAll,
  getAllBuyers,
  getAllSellers,
  updateUser,
  resetPassword,
  forgetPassword,
  Uploads,
};
