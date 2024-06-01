import { createClient, RedisClientType } from "redis";

const client: RedisClientType = createClient();

interface Submission {
  userId: string;
  code: string;
  problemId: string;
}

interface Response {
  status: string;
  output: string;
}

function dummyEvaluation(code: string, problemId: string): Response {
  return { status: "success", output: "Dummy output for submission" };
}

async function processQueue() {
  // infinitly loop to keep the worker running and check for new submissions
  while (true) {
    const submission = await client.lPop("submissions");
    if (submission) {
      const { userId, code, problemId }: Submission = JSON.parse(submission);
      const result = dummyEvaluation(code, problemId);

      const response = {
        userId,
        response: result,
      };

      // here i have two options either publish to an single channel and all websockets will check is it there userId response or not next option is to publish to a channel with userId and all websockets will subscribe to their own userId channel
      await client.publish("submission_responses", JSON.stringify(response));
    }
  }
}

// Connect to Redis and start processing
async function startWorker() {
  try {
    await client.connect();
    console.log("Worker connected to Redis");
    await processQueue();
  } catch (error) {
    console.error("Error while connecting to Redis:", error);
  }
}

startWorker();
