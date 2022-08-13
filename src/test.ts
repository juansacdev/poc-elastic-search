import { defaultProvider } from '@aws-sdk/credential-provider-node'
import { Client, Connection } from '@opensearch-project/opensearch'
import aws4, { Credentials, Request } from 'aws4'
import 'dotenv/config'

export const AWS_REGION = 'us-east-1'
const AWS_ES_SERVICE = 'es'

function createAWSConnector(credentials: Credentials) {
  class AWSConnector extends Connection {
    constructor() {
      super()
    }

    buildRequestObject(params?: unknown) {
      const baseRequest = super.buildRequestObject(params)

      if (baseRequest.headers) {
        baseRequest.headers['host'] = baseRequest.hostname || ''
      }

      const request: Request = {
        ...baseRequest,
        host: baseRequest.host as string | undefined,
        hostname: baseRequest.hostname as string | undefined,
        path: baseRequest.path as string | undefined,
        region: AWS_REGION,
        service: AWS_ES_SERVICE
      }

      const signRequest = aws4.sign(request, credentials)

      return signRequest
    }
  }

  return {
    Connection: AWSConnector
  }
}

export async function getAWSElasticClient() {
  const credentials = await defaultProvider()()
  const { Connection } = createAWSConnector(credentials)

  const client = new Client({
    Connection,
    node: process.env.OPENSEARCH_HOST
  })

  return client
}

// ! ********************************************************************************************************

import {
  DeleteByQuery,
  Search,
  UpdateByQuery
} from '@opensearch-project/opensearch/api/requestParams'

interface BaseDoc {
  id: string
  index: string
}

interface InsertDoc<T> extends BaseDoc {
  doc: T
}
type UpdateDoc<T> = InsertDoc<T>

export class ElasticSearch {
  private client?: Client

  constructor(client?: Client) {
    this.client = client
  }

  // Singleton
  private async getClient() {
    if (!this.client) {
      let instance: Client

      if (process.env.NODE_ENV === 'development') {
        instance = new Client({
          node: process.env.OPENSEARCH_HOST
        })
      } else {
        const credentials = await defaultProvider()()
        const { Connection } = createAWSConnector(credentials)

        instance = new Client({
          Connection,
          node: process.env.OPENSEARCH_HOST
        })
      }

      this.client = instance

      return this.client
    }

    return this.client
  }

  get info() {
    return this.client
  }

  async isExistedDoc(data: BaseDoc) {
    const client = await this.getClient()
    const result = await client.exists({
      id: data.id,
      index: data.index
    })

    return result
  }

  // Create
  async insertOne<T>(data: InsertDoc<T>) {
    const client = await this.getClient()
    const result = await client.create<T, T>({
      id: data.id,
      index: data.index,
      body: data.doc
    })

    return result
  }

  // Read
  async getOneDocByIdWithMetadata<T>(data: BaseDoc) {
    const client = await this.getClient()
    const result = await client.get<T>({
      id: data.id,
      index: data.index
    })

    return result
  }

  // Read
  async getOneDocByIdWithoutMetadata<T>(data: BaseDoc) {
    const client = await this.getClient()
    const result = await client.getSource<T>({
      id: data.id,
      index: data.index
    })

    return result
  }

  // Get by query AKA `search`
  async search(options: Search) {
    const client = await this.getClient()
    const result = await client.search(options)
    return result
  }

  // Update one by id
  async updateOneDocById<T>(data: UpdateDoc<T>) {
    const client = await this.getClient()
    const result = await client.update<T, T>({
      id: data.id,
      index: data.index,
      body: data.doc
    })

    return result
  }

  // Update many by query
  async updateManyDocsByQuery<T>(data: UpdateByQuery<T>) {
    const client = await this.getClient()
    const result = await client.updateByQuery<T, T>(data)

    return result
  }

  // Delete one by id
  async deleteOneDocById<T>(data: BaseDoc) {
    const client = await this.getClient()
    const result = await client.delete<T>({
      id: data.id,
      index: data.index
    })

    return result
  }

  // Delete many by query
  async deleteManyDocsByQuery<T>(data: DeleteByQuery<T>) {
    const client = await this.getClient()
    const result = await client.deleteByQuery<T>(data)
    return result
  }
}

export interface User {
  name: string
  age: number
}

async function run() {
  const client = new ElasticSearch()

  // await Promise.all([
  //   client.insertOne<User>({
  //     id: '1',
  //     index: 'users',
  //     doc: {
  //       age: 30,
  //       name: 'Javier'
  //     }
  //   }),
  //   client.insertOne<User>({
  //     id: '2',
  //     index: 'users',
  //     doc: {
  //       age: 27,
  //       name: 'Dulce'
  //     }
  //   }),
  //   client.insertOne<User>({
  //     id: '3',
  //     index: 'users',
  //     doc: {
  //       age: 21,
  //       name: 'juanse'
  //     }
  //   })
  //   client.insertOne<User>({
  //     id: '4',
  //     index: 'users',
  //     doc: {
  //       age: 28,
  //       name: 'Gabriel'
  //     }
  //   })
  // ])

  // console.log('ElasticSearch Create Doc\n', doc)
  // const doc = await client.isExistedDoc({
  //   id: '3',
  //   index: 'users'
  // })
  // console.log('ElasticSearch isExistDoc Doc\n', doc)
  // const docWithMetaData = await client.getOneDocByIdWithMetadata<User>({
  //   id: '4',
  //   index: 'users'
  // })
  // console.log('ElasticSearch docWithMetaData Doc\n', docWithMetaData)
  // const docWithoutMetaData = await client.getOneDocByIdWithoutMetadata<User>({
  //   id: '4',
  //   index: 'users'
  // })
  // console.log('ElasticSearch docWithoutMetaData Doc\n', docWithoutMetaData)

  const doc = await client.search({
    index: 'users',
    body: {
      query: {
        simple_query_string: {
          query: 'juanse',
          fields: ['name']
        }
      }
    }
  })

  console.log('Doc\n', doc)
  console.log('Doc.body\n', doc.body)
  console.log('Doc.body.hits\n', doc.body.hits)
  console.log('Doc.body.hits.hits\n', doc.body.hits.hits)
}

run()
  .then(() => console.log('Running!\nChauuuu'))
  .catch(console.error)
