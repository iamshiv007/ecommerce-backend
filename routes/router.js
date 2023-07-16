const router = require('express').Router()

// Product 
const product = require('./productRoute')
router.use('/', product)
const user = require("./userRoute")
router.use('/', user)
const order = require('./orderRoute')
router.use('/', order)
const payment = require('./paymentRoute')
router.use('/', payment)

module.exports =  router