const ServerError = require("../interface/Error");

const errorMiddleWare = (err, req, res, next) => {
  // console.log(err)
  // const err = JSON.parse(err);
  // console.log(err)
  // if(err instanceof ServerError)
  const status = err.code || 500;
  const message = err.message || 'something went wrong';
  res.status(status).json({
    ok: false,
    status,
    message
  })
}
module.exports = errorMiddleWare;