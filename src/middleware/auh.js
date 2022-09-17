const jwt = require('jsonwebtoken')
const { User } = require('../model/user')
// const User = re
const auth = async (req, res, next) => {
    try {
        // console.log(req)
        const token = req?.header('Authorization')?.replace('Bearer ', '')
        const decode = jwt.verify(token, 'EazyMoney')
        console.log(1)
        const user = await User.findOne({ _id: decode._id, tokens: token })
        // console.log(token)
        // console.log(user)
        if (!user)
            throw new Error('Wrong Token')
        req.user = user
        req.token = token
        next()
    }
    catch (e) {
        res.status(401).send(e.message)
    }

}
module.exports = auth