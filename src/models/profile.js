import { mongoose, db } from '../mongoose'
import mexp from 'mongoose-elasticsearch-xp'
import elasticClient from '../elasticClient'

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

ProfileSchema.plugin(mexp, {
  client: elasticClient,
  index: 'profiles',
  type: 'profile'
})

const Profile = db.model('Profile', ProfileSchema, 'Profiles')

Profile
  .esSynchronize()

export default Profile
