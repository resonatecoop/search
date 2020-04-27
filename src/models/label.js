import { mongoose, db } from '../mongoose'
import mexp from 'mongoose-elasticsearch-xp'
import elasticClient from '../elasticClient'

const Schema = mongoose.Schema

const LabelSchema = new Schema({
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

LabelSchema.plugin(mexp, {
  client: elasticClient,
  index: 'labels',
  type: 'label'
})

const Label = db.model('Label', LabelSchema, 'Labels')

Label
  .esSynchronize()

export default Label
