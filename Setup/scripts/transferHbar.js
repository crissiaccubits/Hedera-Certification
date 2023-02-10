const {
    Client,
    AccountBalanceQuery,
    TransferTransaction,
    Hbar
} = require("@hashgraph/sdk");
require("dotenv").config();

const { NO_OF_ACCOUNTS, CLIENT_ID, CLIENT_PRIVATE_KEY, MY_ACCOUNT_ID } = process.env;

async function main() {
    await transferHbar();
    process.exit(1);
  }

  const transferHbar = async () => {

    const client = await getClient();

    // Create the transfer transaction
    const transaction = new TransferTransaction()
    .addHbarTransfer(CLIENT_ID, new Hbar(-100))
    .addHbarTransfer(MY_ACCOUNT_ID, new Hbar(100));
    
    console.log(`Doing transfer from ${CLIENT_ID} to ${MY_ACCOUNT_ID}`);
    
    // Sign with the client operator key and submit the transaction to a Hedera network
    const txId = await transaction.execute(client);

    // console.log(JSON.stringify(txId));

    // Request the receipt of the transaction
    const receipt = await txId.getReceipt(client);

    // console.log(JSON.stringify(receipt));

    // Get the transaction consensus status
    const transactionStatus = receipt.status;

    console.log("The transaction consensus status is " + transactionStatus);

    // Create the balance fetch queries
    const queryMine = new AccountBalanceQuery().setAccountId(CLIENT_ID);
    const queryOther = new AccountBalanceQuery().setAccountId(MY_ACCOUNT_ID);

    const accountBalanceMine = await queryMine.execute(client);
    const accountBalanceOther = await queryOther.execute(client);

    console.log(`My account balance ${accountBalanceMine.hbars} HBar, other account balance ${accountBalanceOther.hbars}`);
}

//To get account balance
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
  
  main();
