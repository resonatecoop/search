import mongoose from 'mongoose'

const mongodbUri = process.env.MONGO_URI || 'mongodb://localhost:27017/resonate'
const options = { useNewUrlParser: true, useUnifiedTopology: true }

mongoose.Promise = global.Promise

mongoose.connect(mongodbUri, options)

const db = mongoose.connection
db.on('error', console.error.bind(console, 'Mongoose connection error:'))
db.once('open', () => console.log('Moogose connected.'))

export default {
  db,
  mongoose
}
