const {
  Client,
  ContractExecuteTransaction,
  PrivateKey,
  ContractCreateFlow,
  ContractFunctionParameters,
  ContractDeleteTransaction,
} = require('@hashgraph/sdk');
const { hethers } = require('@hashgraph/hethers');
require('dotenv').config();
const contractJSON = require('../artifacts/contracts/certificationC3.sol/CertificationC3.json');

const abicoder = new hethers.utils.AbiCoder();

//Grab your Hedera testnet account ID and private key from your .env file
const { ACCOUNT_1_PRIVATE_KEY, ACCOUNT_1_ID } = process.env;

async function main() {
  //Creating Contract
  console.log(`\nCreating Contract********`);

  //Executing Contract
  const contractId = await deployContract();
  console.log(`\nExecuting function1**********`);
  await funcExec(contractId);

  //Deleting Contract
  console.log(`\nDeleteing Contract*********`);
  await deleteContract(contractId, ACCOUNT_1_ID);

  //Executing Contract
  console.log(`\nExecuting function1**********`);
  await funcExec(contractId);
  process.exit();
}

const deployContract = async () => {
  const client = await getClient();

  //Extracting bytecode from compiled code
  const bytecode = contractJSON.bytecode;

  //Create the transaction
  const contractCreation = new ContractCreateFlow()
    .setContractMemo('CertificationC3.sol')
    .setGas(100000)
    .setBytecode(bytecode)
    .setAdminKey(PrivateKey.fromString(ACCOUNT_1_PRIVATE_KEY));

  //Sign the transaction with the client operator key and submit to a Hedera network
  const txResponse = await contractCreation.execute(client);

  //Get the receipt of the transaction
  const receipt = await txResponse.getReceipt(client);

  //Get the new contract ID
  const contractId = receipt.contractId;

  console.log('The contract ID is ' + contractId);
  return contractId;
};
const funcExec = async (contractId) => {
  try {
    const client = await getClient();

    //Create the transaction to call function1
    const firstFunctionExecution = new ContractExecuteTransaction()
      //Set the ID of the contract
      .setContractId(contractId)
      //Set the gas for the contract call
      .setGas(100000)
      //Set the contract function to call
      .setFunction(
        'function1',
        new ContractFunctionParameters().addUint16(5).addUint16(6)
      );

    //Submit the transaction to a Hedera network and store the response
    const submitFirstFunctionExec = await firstFunctionExecution.execute(client);

    const record = await submitFirstFunctionExec.getRecord(client);

    const encodedResult1 = '0x' + record.contractFunctionResult.bytes.toString('hex');

    const result1 = abicoder.decode(['uint16'], encodedResult1);

    console.log('Function 1 Output :', result1[0]);
  } catch (err) {
    //Logging the error
    console.error('\nThe transaction errored with message ' + err.status.toString());
    console.error('\nError:' + err.toString());
  }
};
const deleteContract = async (contractId, accountId) => {
  const client = await getClient();
  //Create the transaction to update the contract message
  const deleteContractExec = await new ContractDeleteTransaction()
    //Set the ID of the contract
    .setContractId(contractId)
    .setTransferAccountId(accountId)
    //Submit the transaction to a Hedera network and store the response
    .execute(client);

  //Get the receipt of the transaction
  const deleteContractTxnReceipt = await deleteContractExec.getReceipt(client);

  //Get the transaction consensus status
  const transactionStatus = deleteContractTxnReceipt.status;

  console.log('The delete transaction consensus status is ' + transactionStatus);
};

//To create client object
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

main();
