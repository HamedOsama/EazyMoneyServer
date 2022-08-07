const mongoose = require('mongoose');
const connectDatabase = ()=>{
  // mongoose.connect('mongodb://127.0.0.1:27017/Eazy_Mony');
  mongoose.connect(`mongodb+srv://root:hamed123456@eazymoney.qyup23h.mongodb.net/?retryWrites=true&w=majority`)
}
module.exports = connectDatabase;