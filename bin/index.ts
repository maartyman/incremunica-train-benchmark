import { StreamingStore } from '@incremunica/incremental-rdf-streaming-store';
import { QueryEngine } from '@incremunica/query-sparql-incremental';

async function run(): Promise<void> {
  const store = new StreamingStore();
  const engine = new QueryEngine();

  const bindingStream = await engine.queryBindings(
    'SELECT * WHERE {?s ?p ?o}',
    {
      sources: [ store ],
    },
  );
  bindingStream.on('data', binding => {
    console.log(binding.toString());
  });
  bindingStream.on('end', () => {
    console.log('done');
  });

  setTimeout(() => {
    bindingStream.close();
  }, 1_000);
}

run().then(() => {
  console.log('Finished');
}).catch(error => {
  throw error;
});
