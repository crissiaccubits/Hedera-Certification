const {
  TokenCreateTransaction,
  Client,
  TokenType,
  TokenSupplyType,
  AccountBalanceQuery,
  PrivateKey,
  Wallet,
  AccountId,
  TransferTransaction,
  TokenAssociateTransaction,
  TokenInfoQuery,
  PublicKey,
  TokenGrantKycTransaction,
 
} = require('@hashgraph/sdk');
require('dotenv').config();

//Grab your Hedera testnet account ID and private key from your .env file
const {
  CLIENT_ID,
  CLIENT_PRIVATE_KEY,
  ACCOUNT_1_ID,
  ACCOUNT_1_PRIVATE_KEY,
  ACCOUNT_2_ID,
  ACCOUNT_2_PRIVATE_KEY,
  ACCOUNT_3_ID,
  ACCOUNT_3_PRIVATE_KEY,
} = process.env;


const supplyUser = new Wallet(ACCOUNT_2_ID, ACCOUNT_2_PRIVATE_KEY);

const adminUser = new Wallet(ACCOUNT_1_ID, ACCOUNT_1_PRIVATE_KEY);

const kycUser = new Wallet(ACCOUNT_1_ID, ACCOUNT_1_PRIVATE_KEY);

const treasuryUser = new Wallet(ACCOUNT_2_ID, ACCOUNT_2_PRIVATE_KEY);

let tokenId;

async function main() {
  //Token Creation
  console.log(`\nToken Creation********`);
  const tokenId = await createToken(ACCOUNT_1_PRIVATE_KEY,ACCOUNT_2_PRIVATE_KEY);

  //Print Token Details
  console.log(`\nToken Details********`);
  await tokenInfo(tokenId);

  //Token Association By Account3
  console.log(`\nToken Association********`);
  await assocTokens(tokenId, ACCOUNT_3_ID, ACCOUNT_3_PRIVATE_KEY);

  //Token Transfer
  console.log(`\nToken Transfer Before Granting Kyc********`);
  await transferToken(tokenId, ACCOUNT_2_ID, ACCOUNT_2_PRIVATE_KEY, ACCOUNT_3_ID, 1299);

  //Grant Kyc to Account 3
  console.log(`\nGranting Kyc********`);
  await grantKyc(tokenId, ACCOUNT_1_ID, ACCOUNT_1_PRIVATE_KEY, ACCOUNT_3_ID);

  //Token Transfer
  console.log(`\nToken Transfer After Granting Kyc********`);
  await transferToken(tokenId, ACCOUNT_2_ID, ACCOUNT_2_PRIVATE_KEY, ACCOUNT_3_ID, 1299);

  process.exit();
}

const createToken = async (adminKey,treasuryKey) => {
  const client = await getClient();

  //Create the token creation transaction
  const transaction = new TokenCreateTransaction()
    .setTokenName('Hedera Certificate Token ')
    .setTokenSymbol('HCT')
    .setTokenType(TokenType.FungibleCommon)
    .setTreasuryAccountId(treasuryUser.accountId)
    .setSupplyType(TokenSupplyType.Finite)
    .setInitialSupply(100000)
    .setMaxSupply(100000)
    .setDecimals(2)
    .setAdminKey(adminUser.publicKey)
    .setSupplyKey(supplyUser.publicKey)
    .setKycKey(kycUser.publicKey)
    .freezeWith(client);

  //Sign the transaction with the client, who is set as admin and treasury account
  const signTxAdmin = await transaction.sign(
    PrivateKey.fromString(adminKey)
  );

  const signTx = await signTxAdmin.sign(PrivateKey.fromString(treasuryKey));

  //Submit to a Hedera network
  const txResponse = await signTx.execute(client);

  //Get the receipt of the transaction
  const receipt = await txResponse.getReceipt(client);

  //Get the transaction consensus status
  console.log(`The token create transaction status is: ${receipt.status} \n`);

  //Get the token ID from the receipt
  tokenId = receipt.tokenId;

  console.log('The new token ID is ' + tokenId + '\n');
  return tokenId;
};

const assocTokens = async (tokenId, account, pvtKey) => {
  const client = await getClient();

  //Create the token associate transaction
  //and sign with the receiver private key of the token
  const associateBuyerTx = await new TokenAssociateTransaction()
    .setAccountId(account)
    .setTokenIds([tokenId])
    .freezeWith(client)
    .sign(PrivateKey.fromString(pvtKey));

  //Submit the transaction to a Hedera network
  const associateUserTxSubmit = await associateBuyerTx.execute(client);

  //Request the receipt of the transaction
  const associateUserRx = await associateUserTxSubmit.getReceipt(client);

  //Get the transaction consensus status
  console.log(`Token association with the other account: ${associateUserRx.status} \n`);
};

const transferToken = async (tokenId, sender, senderPvtKey, receiver, amount) => {
  const client = await getClient();

  //Create the transfer transaction
  try {
    const transaction = new TransferTransaction()
      .addTokenTransfer(tokenId, sender, -amount)
      .addTokenTransfer(tokenId, receiver, amount)
      .freezeWith(client);

    //Sign with the supply private key of the token
    const signTx = await transaction.sign(PrivateKey.fromString(senderPvtKey));

    //Submit the transaction to a Hedera network
    const txResponse = await signTx.execute(client);

    //Request the receipt of the transaction
    const receipt = await txResponse.getReceipt(client);

    //Get the transaction consensus status
    const transactionStatus = receipt.status;
    console.log('The transaction consensus status ' + transactionStatus.toString());
    console.log('The transaction Id ' + txResponse.transactionId.toString());

    await queryBalance(sender, tokenId);
    await queryBalance(receiver, tokenId);
  } catch (err) {
    //Logging the error
    console.error('\nThe transaction errored with message ' + err.status.toString());
    console.error('\nError:' + err.toString());
  }
};

const grantKyc = async (tokenId, user, userPvtKey, anotherAccountId) => {
  const client = await getClient();

  //Create the pause transaction
  const transaction = await new TokenGrantKycTransaction()
    .setAccountId(anotherAccountId)
    .setTokenId(tokenId)
    .freezeWith(client);

  //Sign with the supply private key of the token
  const signTx = await transaction.sign(PrivateKey.fromString(userPvtKey));

  //Submit the transaction to a Hedera network
  const txResponse = await signTx.execute(client);

  //Request the receipt of the transaction
  const receipt = await txResponse.getReceipt(client);

  //Get the transaction consensus status
  const transactionStatus = receipt.status;

  console.log(
    'The grant Kyc transaction consensus status ' + transactionStatus.toString()
  );
  // await queryBalance(user, tokenId);
};

const tokenInfo = async (tokenId) => {
  const client = await getClient();

  console.log(`Searching for the token ${tokenId}`);

  //Returns the info for the specified TOKEN_ID
  const ftInfos = await new TokenInfoQuery().setTokenId(tokenId).execute(client);

  console.log('The name of the token is: ' + ftInfos.name);
  console.log('The symbol of the token is: ' + ftInfos.symbol);
  console.log('The totalsupply of the token is: ' + ftInfos.totalSupply);
  console.log('Current owner: ' + new AccountId(ftInfos.treasuryAccountId).toString());
  console.log('Current admin: ' + new PublicKey(ftInfos.adminKey).toString());
};

const queryBalance = async (user, tokenId) => {
  const client = await getClient();

  //Create the query
  const balanceQuery = new AccountBalanceQuery().setAccountId(user);

  //Sign with the client operator private key and submit to a Hedera network
  const tokenBalance = await balanceQuery.execute(client);

  console.log(
    `- Balance of account ${user}: ${tokenBalance.tokens._map.get(
      tokenId.toString()
    )} unit(s) of token ${tokenId}`
  );
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

main();
