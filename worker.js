const express = require('express');
const Redis = require('ioredis');
const { Queue } = require('bullmq');
const fs = require('fs');

const app = express();
app.use(express.json());

const redis = new Redis();
const queues = {};

async function task(user_id) {
  console.log(`${user_id}-task completed at-${Date.now()}`);
  fs.appendFile('task_log.txt', `${user_id}-task completed at-${Date.now()}\n`, (err) => {
    if (err) {
      console.error(err);
    }
  });
}

app.post('/task', async (req, res) => {
  const user_id = req.body.user_id;
  const queue = queues[user_id] || new Queue(`task_queue_${user_id}`, {
    connection: redis,
    limiter: {
      max: 20, // 20 tasks per minute
      duration: 60000, // 1 minute
    },
  });
  queues[user_id] = queue;

  try {
    await queue.add(task, { user_id });
    res.status(202).send(`Task added to queue for user ${user_id}`);
  } catch (err) {
    console.error(err);
    res.status(429).send(`Rate limit exceeded for user ${user_id}`);
  }
});

app.listen(3000, () => {
  console.log('Server listening on port 3000');
});