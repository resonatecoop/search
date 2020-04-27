import { mongoose, db } from '../mongoose'
import mexp from 'mongoose-elasticsearch-xp'
import elasticClient from '../elasticClient'

const Schema = mongoose.Schema

const ArtistSchema = new Schema({
  id: Number,
  name: {
    type: String,
    es_indexed: true
  }
}, {
  strict: true,
  minimize: false,
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
})

ArtistSchema.plugin(mexp, {
  client: elasticClient,
  index: 'artists',
  type: 'artist'
})

const Artist = db.model('Artist', ArtistSchema, 'Artists')

Artist
  .esSynchronize()

export default Artist
