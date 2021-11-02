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
    es_boost: 2.0,
    es_indexed: true
  },
  twitter_handle: {
    type: String,
    es_boost: 2.0,
    es_indexed: true
  },
  label: {
    type: String,
    es_indexed: true
  },
  bio: {
    type: String,
    es_indexed: true
  },
  city: {
    type: String,
    es_indexed: true
  },
  country: {
    type: String,
    es_indexed: true
  },
  tags: {
    type: [String],
    es_indexed: true
  },
  last_activity: {
    type: Date,
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

export default Profile
