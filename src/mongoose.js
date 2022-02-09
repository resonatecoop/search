import mongoose from 'mongoose'

mongoose.Promise = global.Promise

const mongodbUri = process.env.MONGO_URI || 'mongodb://localhost:27017/resonate'
const options = { useNewUrlParser: true, useUnifiedTopology: true }
const gracefulExit = function () {
  mongoose.connection.close(function () {
    console.log('Mongoose is disconnected through app termination')
    process.exit(0)
  })
}

const db = mongoose.connection

db.on('error', console.error.bind(console, 'Mongoose connection error:'))
db.once('open', () => console.log('Moogose connected.'))
db.on('disconnected', function () {
  console.log('Mongoose default connection disconnected')
})

process.on('SIGINT', gracefulExit).on('SIGTERM', gracefulExit)

try {
  options.server.socketOptions = options.replset.socketOptions = { keepAlive: 1 }
  mongoose.connect(mongodbUri, options)
} catch (err) {
  console.log('Sever initialization failed', err.message)
}

export default {
  db,
  mongoose
}
