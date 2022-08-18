import { Client, estypes } from '@elastic/elasticsearch'
import 'dotenv/config'

type Query = estypes.QueryDslQueryContainer
type SearchOptions = estypes.SearchRequest

interface BaseDoc {
  id: string
  index: string
}

export interface InsertDoc<T> extends BaseDoc {
  doc: T
}

type UpdateDoc<T> = InsertDoc<T>

export class ElasticSearch {
  private client?: Client

  constructor(client?: Client) {
    this.client = client
  }

  private getClient() {
    if (!this.client) {
      let instance: Client

      if (process.env.NODE_ENV === 'development') {
        instance = new Client({
          node: process.env.ELASTICSEARCH_HOST || 'http://localhost:9200'
        })
      } else {
        instance = new Client({
          node: process.env.ELASTICSEARCH_HOST,
          auth: {
            username: process.env.ELASTICSEARCH_USERNAME ?? '',
            password: process.env.ELASTICSEARCH_PASSWORD ?? ''
          }
        })
      }

      this.client = instance

      return this.client
    }

    return this.client
  }

  get clusterInfo() {
    const client = this.getClient()
    const info = client.info()
    return info
  }

  get isRunning() {
    const client = this.getClient()
    return client.ping()
  }

  async isExistedDoc(data: BaseDoc): Promise<boolean> {
    const client = this.getClient()
    return client.exists({
      id: data.id,
      index: data.index
    })
  }

  // Create
  async insertOne<T>(data: InsertDoc<T>) {
    const client = this.getClient()
    const doc = await client.create<T>({
      id: data.id,
      index: data.index,
      document: data.doc
    })
    return doc
  }

  // Read
  async getOneDocByIdWithMetadata<T>(data: BaseDoc) {
    const client = this.getClient()
    const doc = await client.get<T>({
      id: data.id,
      index: data.index
    })

    return doc
  }

  // Read
  async getOneDocByIdWithoutMetadata<T>(data: BaseDoc) {
    const client = this.getClient()
    const doc = await client.getSource<T>({
      id: data.id,
      index: data.index
    })

    return doc
  }

  // Get by query AKA `search`
  async search<T>(options: SearchOptions) {
    const client = this.getClient()
    const result = await client.search<T>(options)
    return result
  }

  // Update
  async updateOneDocById<T>(data: UpdateDoc<T>) {
    const client = this.getClient()
    const result = await client.update<T>({
      id: data.id,
      index: data.index,
      doc: data.doc
    })

    return result
  }

  // Update by query
  async updateManyDocsByQuery(index: string, query: Query) {
    const client = this.getClient()
    const result = await client.updateByQuery({
      index,
      query
    })

    return result
  }

  // Delete
  async deleteOneDocById(data: BaseDoc) {
    const client = this.getClient()
    const result = await client.delete({
      id: data.id,
      index: data.index
    })

    return result
  }

  // Delete by query
  async deleteManyDocsByQuery(index: string, query: Query) {
    const client = this.getClient()
    const result = await client.deleteByQuery({
      index,
      query
    })

    return result
  }
}

// interface User {
//   name: string
//   age: number
// }

async function run() {
  const client = new ElasticSearch()
  const info = await client.clusterInfo
  console.log('ElasticSearch Get clusterInfo\n', info)
}

run()
  .then(() => console.log('Running!'))
  .catch(console.error)
