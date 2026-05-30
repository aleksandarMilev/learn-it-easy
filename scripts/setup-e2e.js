const { execSync } = require('child_process');

const isCI = process.env.CI === 'true';

if (!isCI) {
  console.log('Starting Docker services...');

  execSync(
    'docker compose --env-file ../../.env.dev -f ../../docker-compose.dev.yml up -d postgres redis',
    { stdio: 'inherit', cwd: __dirname + '/..' },
  );

  console.log('Waiting for database...');

  execSync('dotenv -e ../../.env.ci -- node ../../scripts/wait-for-db.js', {
    stdio: 'inherit',
    cwd: __dirname + '/../apps/server',
  });
} else {
  console.log('CI environment detected, skipping Docker startup');
}

console.log('Running migrations...');

execSync('dotenv -e ../../.env.ci -- prisma migrate deploy', {
  stdio: 'inherit',
  cwd: __dirname + '/../apps/server',
});
