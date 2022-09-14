const multer = require('multer')
const path = require('path')
const Uploads = multer({
  fileFilter(req, file, cb) {
    if (!file.originalname.match(/.(jpg|jpeg|png|jfif)$/))
      return cb(new Error('please upload image !'))
    cb(null, true)
  },
  storage: multer.diskStorage({
    destination: (req, file, cb) => {
      const fullPath = path.join(__dirname, '../uploads')
      cb(null, fullPath)
    },
    filename: (req, file, cb) => {
      console.log(req.body);
      const fileName = Date.now().toString() + "" + file.originalname
      cb(null, fileName)
    }
  }),
})

module.exports = Uploads;