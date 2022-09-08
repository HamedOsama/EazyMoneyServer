const express = require('express')
const router = express.Router()
const Admin = require('../model/admin')
const auth = require('../middelware/adminAuth')
const User = require('../model/user')
const Product = require('../model/product')
const sendgrid = require('@sendgrid/mail')
const Str = require('@supercharge/strings')
const multer = require('multer')
const bcryptjs = require('bcryptjs')

const Uploads = multer({
    fileFilter(req, file, cb) {
        if (!file.originalname.match(/\.(jpg|jpeg|png|jfif)$/))
            return cb(new Error('please upload image !'))
        cb(null, true)
    }
})



router.post('/admin/add', Uploads.single('avatar'), async (req, res) => {
    try {
        const admin = new Admin(req.body)
        const token = await admin.getToken()
        if (req.file)
            req.admin.pic = req.file.buffer
        await admin.save()
        res.status(200).send(admin)
    }
    catch (e) {
        res.status(500).send(e.message)
    }
})
router.post('/admin/logincode', async (req, res) => {
    try {
        const admin = await Admin.logIn(req.body.email, req.body.password)
        const random = Str.random(10)
        await admin.updateOne({ LoginCode: random })
        const SENDGRID_API_KEY = "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"
        sendgrid.setApiKey(SENDGRID_API_KEY)
        const data = {
            to: req.body.email,
            from: 'eazymony6@gmail.com',
            subject: 'Login Code',
            html: ` <p>${random}</p> `
        }
        sendgrid.send(data)
            .then((response) => {
                res.status(200).json({ response: 'email has been sent' })
            })
            .catch((error) => {
                res.json(error.message)
            })
    }
    catch (e) {
        res.status(500).send(e.message)
    }
})
router.post('/admin/login', async (req, res) => {
    try {
        const code = req.body.code
        const admin = await Admin.findOne({ LoginCode: code })
        if (!admin)
            res.status(400).send('code is wrong')
        await admin.getToken()
        res.status(200).send(admin)
    }
    catch (e) {
        res.status(500).send(e.message)
    }
})
router.patch('/admin/update', auth, Uploads.single('avatar'), async (req, res) => {
    try {
        const Update = Object.keys(req.body)
        Update.forEach(el => { req.admin[el] = req.body[el] })
        if (req.file)
            req.admin.pic = req.file.buffer

        await req.admin.save()
        res.status(200).send(req.admin)

    }
    catch (e) {
        res.status(500).send(e.message)
    }
})
router.delete('/admin/logout', auth, async (req, res) => {
    try {
        req.admin.token = req.admin.token.filter(el => {
            return el != req.token
        })
        await req.admin.save()
        res.status(200).send('succefully deleted')
    }
    catch (e) {
        res.status(500).send(e.message)
    }
})
router.delete('/admin/logoutall', auth, async (req, res) => {
    try {
        req.admin.token = []
        await req.admin.save()
        res.status(200).send('succefully deleted')
    }
    catch (e) {
        res.status(500).send(e.message)
    }
})
router.post('/admin/adduser', auth, async (req, res) => {
    try {
        const user = new User(req.body)
        const token = await user.generateToken()
        await user.save()
        res.status(200).send('succefully added')
    }
    catch (e) {
        res.status(400).send(e.message)
    }
})
router.patch('/admin/updateuser/:id', auth, Uploads.single('avatar'), async (req, res) => {
    try {
        const userID = req.params.id
        const user = await User.findById({ _id: userID })
        if (!user)
            res.status(404).send('unable to found')
        const Updates = Object.keys(req.body)
        Updates.forEach((update) => { user[update] = req.body[update] })
        if (req.file)
            user.pic = req.file.buffer

        await user.save()
        res.status(200).send(user)
    }
    catch (e) {
        res.status(500).send(e.message)
    }
})

router.get('/admin/getalluser', auth, async (req, res) => {
    try {
        const user = await User.find({})
        res.status(200).send(user)
    }
    catch (e) {
        res.status(500).send(e.message)
    }
})
router.get("/admin/getbuyer", auth, async (req, res) => {
    try {
        const user = await User.find({})
        const buyer = user.filter(el => { return el.role == 'buyer' })
        res.status(200).send(buyer)


    }
    catch (e) {
        res.status(500).send(e.message)
    }
})
router.get("/admin/getseller", auth, async (req, res) => {
    try {
        const user = await User.find({})
        const seller = user.filter(el => { return el.role == 'seller' })
        res.status(200).send(seller)


    }
    catch (e) {
        res.status(500).send(e.message)
    }
})
router.delete('/admin/userlogoutall/:id', auth, async (req, res) => {
    try {
        const userID = req.params.id
        const user = await User.findById({ _id: userID })
        user.tokens = []
        await user.save()
        res.status(200).send()
    }
    catch (e) {
        res.status(500).send(e.message)
    }
})
router.get('/admin/getspecficuser/:id', auth, async (req, res) => {
    try {

        const userId = req.params.id
        const user = await User.findById(userId)
        if (!user) {
            res.status(404).send("unable to found any user match this ID")
        }

        res.status(200).send(user)
    }
    catch (e) {
        res.status(400).send(e.message)
    }
})
router.post('/admin/addproduct', auth, Uploads.single('avatar'), async (req, res) => {
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


        res.status(200).send(product)


    }
    catch (e) {
        res.status(500).send(e.message)
    }
})
router.get('/admin/getallcat', auth, async (req, res) => {
    try {
        const categories = []
        const product = await Product.find({})
        product.forEach(el => {
            if (!categories.includes(el.category))
                categories.push(el.category)
        })
        res.status(200).send(categories)
    }
    catch (e) {
        res.status(500).send(e.messsage)
    }
})
router.get('/admin/getallpro', auth, async (req, res) => {
    try {

        const limitValue = req.query.limit || 10;
        const skipValue = req.query.skip || 0;
        const product = await Product.find()
            .limit(limitValue).skip(skipValue);
        res.status(200).send(product);
    }
    catch (e) {
        res.status(500).send(e.messsage)
    }
})
router.get('/admin/product/getbyid/:id', async (req, res) => {
    try {
        const id = req.params.id
        const product = await Product.findById(id)
        if (!product) {
            res.status(404).send('unable to found')
        }
        res.status(200).send(product)
    }
    catch (e) {
        res.status(500).send(e.message)
    }
})
router.get('/admin/product/getbycat/:cat', auth, async (req, res) => {
    try {
        const catName = req.params.cat
        const product = await Product.find({ category: { $regex: new RegExp(catName, "i") } })


        res.status(200).send(product)
    }
    catch (e) {
        res.status(500).send(e.message)
    }
})
router.get('/admin/product/getbyname/:name', auth, async (req, res) => {
    try {
        const productName = req.params.name
        const product = await Product.find({ name: { $regex: new RegExp(productName, "i") } })

        res.status(200).send(product)

    }
    catch (e) {
        res.status(500).send(e.message)
    }
})

router.patch('/admin/product/update/:id', auth, async (req, res) => {
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
            res.status(404).send('unable to found')
        }
        await product.save()
        res.status(200).send(product)
    }
    catch (e) {
        res.status(500).send(e.message)
    }
})
router.get('/admin/getsellerofproduct/:id', auth, async (req, res) => {
    try {
        const productId = req.params.id
        const product = await Product.findById({ _id: productId })
        if (!product)
            res.status(404).send('unable to found')
        const seller = await User.findById({ _id: product.seller })
        res.status(200).send(seller)

    }
    catch (e) {
        res.status(500).send(e.message)
    }
})
router.delete('/admin/product/delete/:id', auth, async (req, res) => {
    try {
        const productId = req.params.id
        const product = await Product.findOneAndDelete({ _id: productId })


        res.status(200).send('deleted succsfully')
    }
    catch (e) {
        res.status(500).send(e.message)
    }
})

router.put('/admin/forgetpass', async (req, res) => {
    try {
        const email = req.body.email
        const admin = await Admin.findOne({ email })
        if (!admin) {
            return res.status(404).send('admin with this email dose not exist')
        }
        await admin.updateOne({ resetpassword: 'true' })
        res.status(200).send('can you reset password')
    }
    catch (e) {
        res.status(500).send(e.message)
    }
})
router.put('/admin/resetpass', async (req, res) => {
    try {

        const admin = await Admin.findOne({ resetpassword: 'true' }, { ...req.body, resetpassword: '' }, {
            new: true,
            runValidators: true
        })
        admin.password = await bcryptjs.hash(admin.password, 8)
        await admin.save()
        res.status(200).send('updated succefuly')

    }
    catch (e) {
        res.status(500).send(e.message)
    }
})
router.get('/admin/getById/:id', auth, async (req, res) => {
    try {
        const adminId = req.params.id
        const admin = await Admin.findById({ _id: adminId })
        if (!admin) {
            res.status(404).send("unable to found")
        }

        if (admin.token != req.token) {
            res.status(401).send("Not Athourized")
        }
        res.status(200).send(admin)
    }
    catch (e) {
        res.status(500).send(e.message)
    }
})
module.exports = router