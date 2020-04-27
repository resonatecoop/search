import { mongoose, db } from '../mongoose'
import mexp from 'mongoose-elasticsearch-xp'
import elasticClient from '../elasticClient'

const Schema = mongoose.Schema

const TrackSchema = new Schema({
  id: Number,
  user: Number,
  title: {
    type: String,
    es_indexed: true
  },
  display_artist: {
    type: String,
    es_indexed: true
  },
  tags: {
    type: [],
    es_indexed: true
  }
}, {
  strict: true,
  minimize: false,
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
})

TrackSchema.plugin(mexp, {
  client: elasticClient,
  index: 'tracks',
  type: 'track'
})

const Track = db.model('Track', TrackSchema, 'Tracks')

const query = Track.find().populate('user')

Track
  .esSynchronize(query, '+resume')

export default Track
