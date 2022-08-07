const multer = require('multer');
const Product = require('../model/product');
const auth = require('../middleware/auh');
const User = require('../model/user');

const Uploads = multer({
  fileFilter(req, file, cb) {
    if (!file.originalname.match(/\.(jpg|jpeg|png|jfif)$/))
      return cb(new Error('please upload image !'));
    cb(null, true);
  },
});

const createProduct = async (req, res) => {
  try {
    if (req.user.role != 'seller') {
      throw new Error('unable to add product');
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
    res.status(200).json({
      status: 200,
      message: 'Product added successfully.',
      product,
    });
  } catch (e) {
    res.status(500).send(e.message);
  }
};

const getAll = async (req, res) => {
  try {
    const product = await Product.find({});
    res.status(200).json({
      status: 200,
      message: 'Product retrieved successfully.',
      product,
    });
  } catch (e) {
    res.status.apply(500).send(e.message);
  }
};
const getAllCat=async(req,res)=>{
  try{
      const categories=[]
      const product=await Product.find({})
      product.forEach(el=>{
        if(!categories.includes(el.category))
        categories.push(el.category)
      })
      res.status(200).json({
        status: 200,
        message: 'Category retrieved successfully.',
        categories,
      });
  }
  catch(e){
    res.apply(500).send(e.messsage)
  }
}
const getProductById=async(req,res)=>{
  try{
    const id=req.params.id
    const product=await Product.findById(id)
    res.status(200).json({
      status: 200,
      message: 'Product retrieved successfully.',
      product,
    });
  }
  catch(e){
    res.apply(500).send(e.messsage)
  }
}
const getByCatName=async(req,res)=>{
  try{
    const catName=req.params.cat
    const product =await Product.find({category:catName})
    res.status(200).json({
      status: 200,
      message: 'Product retrieved successfully.',
      product,
    });
  }
  catch(e){
    res.apply(500).send(e.messsage)
  }
}
const getByProductName=async(req,res)=>{
  try{
    const productName=req.params.name
    const product= await Product.find({name:productName})
    res.status(200).json({
      status: 200,
      message: 'Product retrieved successfully.',
      product,
    });
  }
  catch(e){
    res.apply(500).send(e.messsage)
  }
}
const getBySelletId=async(req,res)=>{
  try{
    const sellerId=req.params.seller
    const product = await Product.find({seller:sellerId})
    res.status(200).json({
      status: 200,
      message: 'Product retrieved successfully.',
      product,
    });
  }
  catch(e){
    res.apply(500).send(e.messsage)
  }
}
const upudateProduct=async(req,res)=>{
  try{
    const productId=req.params.id
    const product= await Product.findOneAndUpdate({_id:productId,seller:req.user._id},req.body,{
     new:true,
     runValidators:true
 })
     if(!product){
     res.status(404).send('unable to found')
 }
    await product.save()
    res.status(200).json({
      status: 200,
      message: 'Product updated successfully.',
      product,
    });
  }
  catch(e){
    res.apply(500).send(e.messsage)
  }
}
const deleteProduct=async(req,res)=>{
  try{
    const productId=req.params.id
    const product= await Product.findOneAndDelete({_id:productId,seller:req.user._id})
    await product.save()
    res.status(200).json({
      status: 200,
      message: 'Product Deleted successfully.'
     
    });
  }
  catch(e){
    res.apply(500).send(e.messsage)
  }
}
const sellergetOwn=async(req,res)=>{
  try{
    await req.user.populate('products')
    res.status(200).json({
      status: 200,
      message: 'Product retrived successfully.',
      //req.user.products,
    });
  }
  catch(e){
    res.apply(500).send(e.messsage)
  }
}
module.exports = { createProduct, 
  getAll,
  getAllCat,
  getProductById,
  getByCatName,
  getByProductName,
  getBySelletId,
  upudateProduct,
  deleteProduct,
  sellergetOwn
  , Uploads };
 

