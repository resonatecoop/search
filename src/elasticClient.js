import es from 'elasticsearch'

const client = new es.Client({
  host: process.env.ELASTIC_HOST || 'localhost:9200',
  log: process.env.ELASTIC_LOG || 'trace',
  apiVersion: process.env.ELASTIC_VERSION || '7.6'
})

export default client
