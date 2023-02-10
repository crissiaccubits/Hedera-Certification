const { Client, AccountBalanceQuery } = require('@hashgraph/sdk');
require('dotenv').config();

const { NO_OF_ACCOUNTS, CLIENT_ID, CLIENT_PRIVATE_KEY, MY_ACCOUNT_ID } = process.env;

async function main() {
  await getBalance();
  process.exit(1);
}

const getBalance = async () => {
  const client = await getClient();
  // Create the query
  const query = new AccountBalanceQuery().setAccountId(MY_ACCOUNT_ID);

  // Sign with the client operator account private key and submit to a Hedera network
  const accountBalance = await query.execute(client);

  if (accountBalance) {
    console.log(
      `The account balance for account ${MY_ACCOUNT_ID} is ${accountBalance.hbars} HBar`
    );

    console.log('All account Info:');
    console.log(JSON.stringify(accountBalance));
  }
};

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
