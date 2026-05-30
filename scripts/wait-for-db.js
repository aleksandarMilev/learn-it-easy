const { Client } = require('pg');

const MAX_RETRIES = 20;
const DELAY_MS = 1_000;

(async function waitForDb() {
  for (let i = 1; i <= MAX_RETRIES; i++) {
    const client = new Client({
      host: 'localhost',
      port: 5_432,
      user: 'postgres',
      password: 'postgres',
      database: 'postgres',
    });

    try {
      await client.connect();
      await client.end();

      console.log('Database is ready');

      return;
    } catch (error) {
      console.log(`Waiting for database... (${i}/${MAX_RETRIES})`);
      await new Promise((resolve) => setTimeout(resolve, DELAY_MS));
    }
  }

  console.error('Database did not become ready in time');
  process.exit(1);
})();
