module.exports = {
  apps: [{
    name: 'industry-academia-research',
    script: 'server/server.ts',
    interpreter: 'node',
    interpreter_args: '--import tsx',
    cwd: 'C:\\Users\\Annbertie\\.trae-cn\\work\\6a5e14b87ee208e78ad84cd7\\industry-academia-research',
    env: {
      NODE_ENV: 'development'
    },
    instances: 1,
    autorestart: true,
    max_memory_restart: '500M',
    restart_delay: 3000,
    max_restarts: 10,
    min_uptime: '10s'
  }]
};
