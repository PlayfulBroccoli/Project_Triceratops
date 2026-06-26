module.exports = {
  apps: [
    {
      name: "triceratops",
      script: "node_modules/.bin/next",
      args: "start -p 3100",
      cwd: "/home/nick/Project_Triceratops",
      env: {
        PATH: "/home/nick/.hermes/node/bin:/usr/local/bin:/usr/bin:/bin",
        NODE_ENV: "production",
      },
      autorestart: true,
      max_memory_restart: "500M",
    },
  ],
};