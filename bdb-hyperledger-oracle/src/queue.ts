import request from "request";
import BigchainDBModel from "./model/bigchaindbModel";

// config
require("dotenv").config();

const Bull = require("bull");
const queue = new Bull("queue", {
  redis: {
    port: 6379,
    host: process.env.HOST_REDIS
  },
  settings: {
    stalledInterval: 0
  }
});
const conncurency = 1;

const appInsights = require("applicationinsights");
appInsights.setup(process.env.APPINSIGHTS_KEY).start();

const logger = require("debug")("log");

// config
const bigchaindbModel = new BigchainDBModel(process.env.BDB_URL, process.env.BDB_APP_KEY, process.env.BDB_APP_ID);

export default class Queue {

  add(data) {
    console.log("Adding to queue", data);
    queue.add(data);
  }

  process() {
    console.debug("Processing thread started");
    queue.process(conncurency, async (job, done) => {
      console.log("Processing", job.data);
      // done();

      try {
        // find Asset from BigchainDB
        console.log("Getting data for " + job.data.query);
        appInsights.defaultClient.trackEvent({
          name: "OracleBDBQuery",
          properties: { assetId: job.data.query }
        });

        const assetData = await bigchaindbModel.getAssetData(job.data.query);

        if (!assetData) {
          throw new Error(`No Data available for query ${job.data.query}`);
        }
        console.log("Processing callback for " + job.data.query);

        appInsights.defaultClient.trackEvent({
          name: "OracleBDBData",
          properties: { assetId: job.data.query, data: assetData }
        });

        const result = this.processCallback(job.data.callback, assetData);

        appInsights.defaultClient.trackEvent({
          name: "OracleProcessCallback",
          properties: { assetId: job.data.query, callback: job.data.callback, data: assetData, result: result }
        });
        console.log("Processed callback for " + job.data.query);

        const body = {
          assetData: assetData,
          status: "processed",
          id: job.data.query
        };

        request.post({ url: process.env.CHAINCODE_URL + "/oracle/response", json: { data: body } }, function (reqError, response, body) {
          if (!reqError) {
            console.log("Result sent for " + job.data.query);
            done({ status: "success" });
          } else {
            console.log("Chaincode url not reached for " + job.data.query + ". Error: " + reqError);
            done({ status: "error" });
          }
        });
      }
      catch (error) {
        console.log("error", error);
        done({ status: "error" });
      }
    });
  }

  // invoke callback input function with fetched data from BigchainDB
  processCallback(callbackInStr, callbackInput) {
    const callbackFromStr = new Function("return " + callbackInStr)();
    const value = callbackFromStr(callbackInput);
    console.log(value);
    return value;
  }
}