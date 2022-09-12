const dotenv = require('dotenv');
dotenv.config();
const { PORT, SENDGRID_EMAIL, SENDGRID_API_KEY } = process.env
module.exports = { port: PORT, sendgridApiKey: SENDGRID_API_KEY, sendgridEmail: SENDGRID_EMAIL }