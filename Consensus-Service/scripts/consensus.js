const {
  Client,
  TopicCreateTransaction,
  TopicMessageSubmitTransaction,
  TopicMessageQuery,
} = require('@hashgraph/sdk');
require('dotenv').config();

//Grab your Hedera testnet account ID and private key from your .env file
const { ACCOUNT_1_PRIVATE_KEY, ACCOUNT_1_ID } = process.env;

//Main function
const main = async () => {
  console.log(`\nTopic Creation******`);
  // create a new topic to submit message
  const topicId = await createTopic();

  //Creating a delay before subscribing
  await new Promise((resolve) => setTimeout(resolve, 5000));

  console.log(`\nTopic Subscribing******`);
  //Subscribing to the topic
  await subscribeTopic(topicId.toString());

  //Calculate current time
  const currentTime = new Date().toUTCString();

  console.log(`\nSubmitting message******`);
  //Submitting message to the topic
  await submitMsg(topicId, currentTime);

  //Querying topic
  await queryTopic(topicId);
};

//To create a topic and return the topic ID
const createTopic = async () => {
  const client = await getClient();

  //Create a new topic
  let txResponse = await new TopicCreateTransaction().execute(client);

  //Get the receipt of the transaction
  let receipt = await txResponse.getReceipt(client);

  console.log(`Topic ${receipt.topicId} created`);

  //Grab the new topic ID from the receipt
  return receipt.topicId;
};

//To subscribe a topic and console the incoming messages
const subscribeTopic = async (topicId) => {
  const client = await getClient();

  //Create the query to subscribe to a topic
  new TopicMessageQuery()
    .setTopicId(topicId)
    .setStartTime(0)
    .subscribe(client, null, (message) => {
      let messageAsString = Buffer.from(message.contents, 'utf8').toString();
      console.log(`${message.consensusTimestamp.toDate()} Received: ${messageAsString}`);
    });
};

//To submit a message to the topic
const submitMsg = async (topicId, message) => {
  const client = await getClient();

  // Send one message
  const sendResponse = await new TopicMessageSubmitTransaction({
    topicId,
    message,
  }).execute(client);

  //Get the receipt of the transaction
  const getReceipt = await sendResponse.getReceipt(client);

  //Get the status of the transaction
  const transactionStatus = getReceipt.status;
  console.log('The message transaction status: ' + transactionStatus.toString());

  return true;
};

//To create a topic and return the topic ID
const queryTopic = async (topicId) => {
  const client = await getClient();
  //Create the query to subscribe to a topic  //1674642787.359447003 //1674641787.359447003
  new TopicMessageQuery()
    .setTopicId(topicId)
    .setStartTime()
    .setEndTime()
    .subscribe(client, (message) =>
      console.log(Buffer.from(message.contents, 'utf8').toString())
    );
};

//To create Hedera Client object
const getClient = async () => {
  // If we weren't able to grab it, we should throw a new error
  if (ACCOUNT_1_ID == null || ACCOUNT_1_PRIVATE_KEY == null) {
    throw new Error(
      'Environment variables ACCOUNT_1_ID and ACCOUNT_1_PRIVATE_KEY must be present'
    );
  }

  // Create our connection to the Hedera network
  return Client.forTestnet().setOperator(ACCOUNT_1_ID, ACCOUNT_1_PRIVATE_KEY);
};

//Initial function invocation
main();
