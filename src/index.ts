import { Client } from '@elastic/elasticsearch'

const client = new Client({
  node: 'http://localhost:9200'
})

client
  .info({ human: true, pretty: true })
  .then(value => console.log('info - value', value))

interface User {
  name: string
  age: number
}

async function run() {
  // await client.create<User>({
  //   id: '1',
  //   index: 'users',
  //   document: {
  //     age: 2,
  //     name: 'juanse'
  //   }
  // })

  const user = await client.get<User>({
    index: 'users',
    id: '1'
  })

  console.log(user._source)
}

run()
  .then(() => console.log('Running!'))
  .catch(console.log)
