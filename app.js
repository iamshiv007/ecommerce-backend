const express = require('express')
const dotenv = require('dotenv').config()
const app = express()
const bodyParser = require("body-parser")
const cloudinary = require("cloudinary").v2
const cookieParser = require('cookie-parser')
const cors = require('cors')
const fileUpload = require("express-fileupload")

app.use(express.json())
app.use(bodyParser.urlencoded({ extended: true }))
app.use(cookieParser())
app.use(cors({
    origin: [process.env.FRONTEND_URL],
    credentials: true
}))
app.use(fileUpload())

// // Handling Uncaught Exception
// process.on("uncaughtException", (err) => {
//     console.log(`Error: ${err.message}`)
//     console.log('Shutting down the server due to Uncaught Exception')
//     process.exit(1)
// })

// Configuration 
cloudinary.config({
    cloud_name: process.env.CLOUD_NAME,
    api_key: process.env.API_KEY,
    api_secret: process.env.API_SECRET
});


/** Routes import */
const router = require('./routes/router')
app.use('/api/v1', router)

// // Middleware for error handling
// const errroMiddleware = require('./middleware/error')
// app.use(errroMiddleware)

const port = process.env.PORT || 7000

const server = app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`)
})

/** Database connection */
const connect = require('./db')
connect()


// // Unhandled Promise Rejection
// process.on("unhandledRejection", (err) => {
//     console.log(`Error: ${err.message}`)
//     console.log('Shutting down the server due to Unhandled Promise Rejection')

//     server.close(() => {
//         process.exit(1)
//     })
// })

// text server
app.get('/', (req, res) => {
    res.send("Server Tested")
})

