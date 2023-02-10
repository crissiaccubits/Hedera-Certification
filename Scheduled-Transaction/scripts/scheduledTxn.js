const {
  TransferTransaction,
  Client,
  ScheduleCreateTransaction,
  ScheduleDeleteTransaction,
  ScheduleSignTransaction,
  ScheduleInfoQuery,
  PrivateKey,
  Hbar,
  AccountId,
  ScheduleId,
  Timestamp,
} = require('@hashgraph/sdk');
require('dotenv').config();

//Grab your Hedera testnet account ID and private key from your .env file
const {
  CLIENT_ID,
  CLIENT_PRIVATE_KEY,
  ACCOUNT_1_ID,
  ACCOUNT_1_PRIVATE_KEY,
  ACCOUNT_2_ID,
  ACCOUNT_3_PRIVATE_KEY,
} = process.env;

const main = async () => {
  //Creating Schedule
  console.log(`\nCreating Schedule ********`);
  const scheduleId = await createScheduleTxn();

  //Querying Schedule Transaction
  console.log(`\nQuery Schedule Transaction********`);
  await queryScheduledTxn(scheduleId);

  //Deleteing Schedule transaction
  console.log(`\nDeleteing Schedule Transaction********`);
  await deleteScheduleTxn(scheduleId);

  //Querying Schedule Transaction
  console.log(`\nQuery Schedule Transaction********`);
  await queryScheduledTxn(scheduleId);

  //Submitting Signature
  console.log(`\nSubmitting Signature********`);
  await submitSignatureTxn(scheduleId);

  //Querying Schedule Transaction
  console.log(`\nQuery Schedule Transaction********`);
  await queryScheduledTxn(scheduleId);
  process.exit();
};

//To create client object
const getClient = async () => {
  // If we weren't able to grab it, we should throw a new error
  if (CLIENT_ID == null || CLIENT_PRIVATE_KEY == null) {
    throw new Error(
      'Environment variables CLIENT_ID and CLIENT_PRIVATE_KEY must be present'
    );
  }

  // Create our connection to the Hedera network
  return Client.forTestnet().setOperator(CLIENT_ID, CLIENT_PRIVATE_KEY);
};

const createScheduleTxn = async () => {
  const client = await getClient();

  //Create a transaction to schedule
  const transaction = new TransferTransaction()
    .addHbarTransfer(AccountId.fromString(ACCOUNT_1_ID), Hbar.fromString('-2'))
    .addHbarTransfer(AccountId.fromString(ACCOUNT_2_ID), Hbar.fromString('2'));

  //Schedule a transaction
  const scheduledTxn = new ScheduleCreateTransaction()
    .setScheduledTransaction(transaction)
    .setScheduleMemo('Scheduled Transaction From Account 1 to Account 2')
    .setAdminKey(PrivateKey.fromString(ACCOUNT_3_PRIVATE_KEY))
    .freezeWith(client);

  //Submitting transaction
  const signedTransaction = await scheduledTxn.sign(
    PrivateKey.fromString(ACCOUNT_3_PRIVATE_KEY)
  );

  const txResponse = await signedTransaction.execute(client);
  const receipt = await txResponse.getReceipt(client);
  console.log(
    `Creating and executing transaction ${txResponse.transactionId.toString()} status: ${
      receipt.status
    }`
  );

  //Get the schedule ID
  const scheduleId = receipt.scheduleId;
  console.log('The schedule ID is ' + scheduleId);
  return scheduleId;
};

const queryScheduledTxn = async (scheduleId) => {
  const client = await getClient();
  //Create the query
  const info = await new ScheduleInfoQuery().setScheduleId(scheduleId).execute(client);

  //Consoling the information
  console.log('\n\nScheduled Transaction Info -');
  console.log('ScheduleId :', new ScheduleId(info.scheduleId).toString());
  console.log('Memo : ', info.scheduleMemo);
  console.log('Created by : ', new AccountId(info.creatorAccountId).toString());
  console.log('Payed by : ', new AccountId(info.payerAccountId).toString());
  console.log('Expiration time : ', new Timestamp(info.expirationTime).toDate());
  if (
    new Timestamp(info.executed).toDate().getTime() ===
    new Date('1970-01-01T00:00:00.000Z').getTime()
  ) {
    console.log('The transaction has not been executed yet.\n\n');
  } else {
    console.log('Time of execution : ', new Timestamp(info.executed).toDate(), '\n\n');
  }
};

const deleteScheduleTxn = async (scheduleId) => {
  const client = await getClient();

  //Create the transaction and sign with the admin key
  const transaction = new ScheduleDeleteTransaction()
    .setScheduleId(scheduleId)
    .freezeWith(client);

  //Submitting transaction
  const signedTransaction = await transaction.sign(
    PrivateKey.fromString(ACCOUNT_3_PRIVATE_KEY)
  );

  const txResponse = await signedTransaction.execute(client);
  const receipt = await txResponse.getReceipt(client);
  console.log(`Delete Scheduled Transaction status: ${receipt.status}`);
};

const submitSignatureTxn = async (scheduleId) => {
  try {
    const client = await getClient();
    // Get the schedule transaction
    const transaction = new ScheduleSignTransaction({
      scheduleId,
    }).freezeWith(client);
    // Sign the transaction with required key
    const signTx = await transaction.sign(PrivateKey.fromString(ACCOUNT_1_PRIVATE_KEY));
    const txResponse = await signTx.execute(client);
    const receipt = await txResponse.getReceipt(client);
    console.log(`Schedule Transaction ${scheduleId} status is ${receipt.status}`);
  } catch (error) {
    console.log(`Failed to execute transaction ${error.message}`);
  }
};

main();
