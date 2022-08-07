const config =  require('./config');
const express = require('express')
const morgan = require('morgan')
const cors = require('cors')
const routes = require('./src/router/index')
// require('./src/db/db')
const connectDatabase = require('./src/db/db')

// connecting to database
connectDatabase();

const app = express();
const port = config.port || 3000
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

app.listen(port, () => console.log(`server running on: http://127.0.0.1:${port}`))
