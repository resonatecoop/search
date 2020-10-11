import { mongoose, db } from '../mongoose'
import esClient from '../elasticClient'
import mongoosastic from 'mongoosastic'

const Schema = mongoose.Schema

const TrackSchema = new Schema({
  track_id: {
    type: Number,
    es_indexed: true
  },
  title: {
    type: String,
    es_indexed: true
  },
  display_artist: {
    es_boost: 2.0,
    type: String,
    es_indexed: true
  },
  album: {
    type: String,
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

TrackSchema.plugin(mongoosastic, {
  esClient: esClient
})

const Track = db.model('Track', TrackSchema, 'Tracks')

const stream = Track.synchronize()
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

export default Track
