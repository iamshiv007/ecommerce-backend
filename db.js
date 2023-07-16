const mongoose = require('mongoose')

const connect = () => {
    try {
        mongoose.set("strictQuery", true)

        mongoose.connect(process.env.MONGO_URI)
        console.log("Database connected")
    } catch (error) {
        console.log(error)
    }
}

module.exports = connect