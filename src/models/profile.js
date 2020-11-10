import { mongoose, db } from '../mongoose'
import esClient from '../elasticClient'
import mongoosastic from 'mongoosastic'

const Schema = mongoose.Schema

const ProfileSchema = new Schema({
  user_id: Number, // user ID from wordpress
  kind: {
    type: String,
    enum: ['label', 'artist', 'band'],
    default: 'artist'
  },
  name: {
    type: String,
    es_indexed: true
  }
}, {
  strict: true,
  minimize: false,
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
})

ProfileSchema.plugin(mongoosastic, {
  esClient: esClient
})

const Profile = db.model('Profile', ProfileSchema, 'Profiles')

/*
const stream = Profile.synchronize()
let count = 0

stream.on('data', function (err, doc) {
  if (err) throw err
  count++
})

stream.on('close', function () {
  console.log('indexed ' + count + ' documents!')
})

stream.on('error', function (err) {
  console.log(err)
})
*/

export default Profile
