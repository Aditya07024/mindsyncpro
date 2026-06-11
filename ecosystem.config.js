module.exports = {
  apps: [
    {
      name: 'mymindtherapyfriend-backend',
      script: 'node',
      args: '-r ./register.js dist/server.js',
      cwd: './backend',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      env: {
        NODE_ENV: 'production',
        PORT: 5000
      }
    },
    {
      name: 'mymindtherapyfriend-frontend',
      script: 'node',
      args: 'start.js',
      cwd: './frontend',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '500M',
      env: {
        PORT: 3000
      }
    }
  ]
};
