const express = require('express');
const cluster = require('cluster');
const numCPUs = require('os').cpus().length;

const app = express();
app.use(express.json());

if (cluster.isMaster) {
  console.log(`Master ${process.pid} is running`);

  
  for (let i = 0; i < numCPUs; i++) {
    cluster.fork();
  }

  cluster.on('exit', (worker, code, signal) => {
    console.log(`worker ${worker.process.pid} died`);
  });
} else {
  require('./worker');
}