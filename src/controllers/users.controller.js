const multer = require('multer');
// const User = require('../model/user');
const { User, validatePassword } = require('../model/user');
const auth = require('../middleware/auh');
// User.log
const Uploads = multer({
  fileFilter(req, file, cb) {
    if (!file.originalname.match(/\.(jpg|jpeg|png|jfif)$/))
      return cb(new Error('please upload image !'));
    cb(null, true);
  },
});
const signup = async (req, res) => {
  try {
    const user = new User(req.body);
    const token = await user.generateToken();
    await user.save();
    res.status(201).send(user);
  } catch (e) {
    res.status(400).send(e.message);
  }
};
const login = async (req, res) => {
  try {
    const user = await User.Login(req.body.email, req.body.password);
    const token = await user.generateToken();
    res.json({
      okay: 200,
      message: 'succeeded',
      body: user,
      token,
    });
    // res.status(200).send(user)
  } catch (e) {
    res.status(401).send(e.message);
  }
};
const updateUser = async (req, res) => {
  try {
    // console.log(req.body.password);
    const Updates = Object.keys(req.body);
    const notAllowedUpdates = ['status', 'role', 'tokens'];
    const isValid = Updates.every((el) => !notAllowedUpdates.includes(el));
    // console.log(isValid);
    if (!isValid) {
      return res.status(400).send("Can't update");
    }
    // console.log(req.user);
    // console.log(req.body.password);
    const validation = await validatePassword(req.user, req.body.oldpassword);
    console.log(validation);
    if (!validation) throw new Error('wrong password');
    Updates.forEach((update) => {
      req.user[update] = req.body[update];
    });
    if (req.file) req.user.pic = req.file.buffer;
    await req.user.save();
    res.status(200).send(req.user);
  } catch (e) {
    res.status(500).send(e.message);
  }
};
const getAll = async (req, res) => {
  try {
    const user = await User.find({});
    res.status(200).send(user);
  } catch (e) {
    res.status.apply(500).send(e.message);
  }
};
const getAllBuyers = async (req, res) => {
  try {
    const user = await User.find({});
    const buyer = user.filter((el) => {
      return el.role == 'buyer';
    });
    res.status(200).send(buyer);
  } catch (e) {
    res.status(500).send(e.message);
  }
};
const getAllSellers = async (req, res) => {
  try {
    const user = await User.find({});
    const seller = user.filter((el) => {
      return el.role == 'seller';
    });
    res.status(200).send(seller);
  } catch (e) {
    res.status(500).send(e.message);
  }
};
const logout = async (req, res) => {
  try {
    req.user.tokens = req.user.tokens.filter((el) => {
      return el != req.token;
    });
    await req.user.save();
    res.status(200).send('logged out successfully');
  } catch (e) {
    res.status(500).send(e.message);
  }
};
const logoutAll = async (req, res) => {
  try {
    console.log(req.user);
    req.user.tokens = [];
    await req.user.save();
    res.status(200).send('logged out successfully');
  } catch (e) {
    console.log(e);
    res.status(500).send(e);
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
  Uploads,
};
