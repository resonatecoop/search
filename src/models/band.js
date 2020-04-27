import { mongoose, db } from '../mongoose'
import mexp from 'mongoose-elasticsearch-xp'
import elasticClient from '../elasticClient'

const Schema = mongoose.Schema

const BandSchema = new Schema({
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

BandSchema.plugin(mexp, {
  client: elasticClient,
  index: 'bands',
  type: 'band'
})

const Band = db.model('Band', BandSchema, 'Bands')

Band
  .esSynchronize()

export default Band
