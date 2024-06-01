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
  console.log(`Evaluating code for problem ${problemId}`);
  return {
    status: "success",
    output: `Dummy output for submission of ${problemId}`,
  };
}

async function processQueue() {
  console.log("Worker started");
  try {
    while (true) {
      const submission = await client.lPop("submissions");

      if (submission) {
        const { userId, code, problemId }: Submission = JSON.parse(submission);
        const result = dummyEvaluation(code, problemId);
        console.log(
          `Processed submission for user ${userId} with result :`,
          result
        );
        const response = {
          userId,
          response: result,
        };

        await client.publish("submission_responses", JSON.stringify(response));
      }
    }
  } catch (error) {
    console.error("Error while processing submission:", error);
  }
}

async function demo() {
  console.log("demo");
}

// Connect to Redis and start processing
async function startWorker() {
  try {
    await client.connect();

    await demo();
    await processQueue();
    console.log("Worker connected to Redis");
  } catch (error) {
    console.error("Error while connecting to Redis:", error);
  }
}

startWorker();
