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
  constructor(
    private client: Client = new Client({
      node: process.env.ELASTIC_SEARCH_NODE
    })
  ) {
    this.client = client
  }

  get clusterInfo() {
    const info = this.client.info()
    return info
  }

  get isRunning() {
    return this.client.ping()
  }

  async isExistedDoc(data: BaseDoc): Promise<boolean> {
    return this.client.exists({
      id: data.id,
      index: data.index
    })
  }

  // Create
  async insertOne<T>(data: InsertDoc<T>) {
    const doc = await this.client.create<T>({
      id: data.id,
      index: data.index,
      document: data.doc
    })
    return doc
  }

  // Read
  async getOneDocByWithMetadata<T>(data: BaseDoc) {
    const doc = await this.client.get<T>({
      id: data.id,
      index: data.index
    })

    return doc
  }

  // Read
  async getOneDocByIdWithoutMetadata<T>(data: BaseDoc) {
    const doc = await this.client.getSource<T>({
      id: data.id,
      index: data.index
    })

    return doc
  }

  // Get by query AKA `search`
  async search<T>(options: SearchOptions) {
    const result = await this.client.search<T>(options)
    return result
  }

  // Update
  async updateOneDocById<T>(data: UpdateDoc<T>) {
    const result = await this.client.update<T>({
      id: data.id,
      index: data.index,
      doc: data.doc
    })

    return result
  }

  // Update by query
  async updateManyDocsByQuery(index: string, query: Query) {
    const result = await this.client.updateByQuery({
      index,
      query
    })

    return result
  }

  // Delete
  async deleteOneDocById(data: BaseDoc) {
    const result = await this.client.delete({
      id: data.id,
      index: data.index
    })

    return result
  }

  // Delete by query
  async deleteManyDocsByQuery(index: string, query: Query) {
    const result = await this.client.deleteByQuery({
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
  // const client = new ElasticSearch()
  // const info = await client.clusterInfo
  // console.log('ElasticSearch Get clusterInfo\n', info)
  // const doc = await client.insertOne<User>({
  //   id: '2',
  //   index: 'users',
  //   doc: {
  //     age: 21,
  //     name: 'juanse'
  //   }
  // })
  // console.log('ElasticSearch Create Doc\n', doc)
  // const doc = await client.isExistDoc({
  //   id: '1',
  //   index: 'users'
  // })
  // console.log('ElasticSearch isExistDoc Doc\n', doc)
  // const docWithMetaData = await client.getOneDocWithMetadata<User>({
  //   id: '1',
  //   index: 'users'
  // })
  // console.log('ElasticSearch docWithMetaData Doc\n', docWithMetaData)
  // const docWithoutMetaData = await client.getOneDocWithoutMetadata<User>({
  //   id: '1',
  //   index: 'users'
  // })
  // console.log('ElasticSearch docWithoutMetaData Doc\n', docWithoutMetaData)
}

run()
  .then(() => console.log('Running!'))
  .catch(console.error)
