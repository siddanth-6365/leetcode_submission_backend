"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const redis_1 = require("redis");
const client = (0, redis_1.createClient)();
function dummyEvaluation(code, problemId) {
    return { status: "success", output: "Dummy output for submission" };
}
function processQueue() {
    return __awaiter(this, void 0, void 0, function* () {
        // infinitly loop to keep the worker running and check for new submissions
        while (true) {
            const submission = yield client.lPop("submissions");
            if (submission) {
                const { userId, code, problemId } = JSON.parse(submission);
                const result = dummyEvaluation(code, problemId);
                const response = {
                    userId,
                    response: result,
                };
                // here i have two options either publish to an single channel and all websockets will check is it there userId response or not next option is to publish to a channel with userId and all websockets will subscribe to their own userId channel
                yield client.publish("submission_responses", JSON.stringify(response));
            }
        }
    });
}
// Connect to Redis and start processing
function startWorker() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            yield client.connect();
            console.log("Worker connected to Redis");
            yield processQueue();
        }
        catch (error) {
            console.error("Error while connecting to Redis:", error);
        }
    });
}
startWorker();
