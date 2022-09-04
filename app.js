const express = require('express')
const morgan = require('morgan')
const cors = require('cors')

const routes = require('./src/router/index')
const connectDatabase = require('./src/db/db')
const errorMiddleWare = require('./src/middleware/error.middleware');
const ServerError = require('./src/interface/Error');
// connecting to database
connectDatabase();

const app = express();
const port = 3000
app.use(cors())
app.use(express.json())

// security middleware
app.use(morgan('dev'))

// homepage
app.get('/', (req, res) => {
  res.send('hello world')
})

// api routes
app.use('/api/v1', routes)


app.use((req, res, next) => {
  // res.status(404).json({
  // message: 'page not found.'
  // })
  next(ServerError.badRequest(404, 'page not found'))
  // throw new Error('page not found')
})
app.use(errorMiddleWare);
//server listen
app.listen(port, () => console.log(`server running on: http://127.0.0.1:`))
