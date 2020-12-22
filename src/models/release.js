import { mongoose, db } from '../mongoose'
import esClient from '../elasticClient'
import mongoosastic from 'mongoosastic'

const Schema = mongoose.Schema

const ReleaseSchema = new Schema({
  track_group_id: {
    type: String // release uuid
  },
  title: {
    type: String,
    es_indexed: true
  },
  creator_id: {
    type: Number
  },
  display_artist: {
    es_boost: 2.0,
    type: String,
    es_indexed: true
  },
  release_date: {
    type: Date, // new releases with minimum match should be boosted
    es_indexed: true
  },
  about: {
    type: String,
    es_indexed: true
  },
  composers: {
    type: [String],
    es_indexed: true
  },
  performers: {
    type: [String],
    es_indexed: true
  },
  tags: {
    type: [String],
    es_indexed: true
  }
}, {
  strict: true,
  minimize: false,
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
})

ReleaseSchema.plugin(mongoosastic, {
  esClient: esClient
})

const Release = db.model('Release', ReleaseSchema, 'Releases')

export default Release
