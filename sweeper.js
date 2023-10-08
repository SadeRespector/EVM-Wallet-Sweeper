
// 1. Import everything
const { Wallet, BigNumber, ethers, providers } = require ('ethers')
const { FlashbotsBundleProvider, FlashbotsBundleResolution } = require('@flashbots/ethers-provider-bundle')
const ethers_provider_bundle_1 = require("@flashbots/ethers-provider-bundle");


// 2. Setup a standard provider
const provider = new providers.JsonRpcProvider(
    //I run a local node, you'll probably use a service like infura
	'http://localhost:8546'
)
const wsProvider = new providers.WebSocketProvider(
    //I run a local node, you'll probably use a service like infura
	'ws://localhost:8546'
)

// 3. this is the compromised wallet private key you want to sweep
const authSigner = new Wallet(
    
	'',
	provider
)

//mainnnet endpoints
let endpoints = [
    "https://relay.flashbots.net",
    "http://builder0x69.io/",
    "https://rpc.beaverbuild.org/",
    "https://eth-builder.com/",
    "https://relay.ultrasound.money/",
    "https://agnostic-relay.net/",
    "https://rsync-builder.xyz/",
];
// goerli test endpoints
// let endpoints = ["https://relay-goerli.flashbots.net",
//                
// ]

const sweep = async (transaction) => {
    //send a budle request to all relays to maximize chances of inclusion
    for(relayer of endpoints ){
        const flashbotsProvider = await FlashbotsBundleProvider.create(
            provider,
            authSigner,
            relayer,
        )

    const GWEI = BigNumber.from(10).pow(9)
	const PRIORITY_FEE = GWEI.mul(31)
	const blockNumber = await provider.getBlockNumber()
    const block = await provider.getBlock(blockNumber)
    const maxBaseFeeInFutureBlock = FlashbotsBundleProvider.getMaxBaseFeeInFutureBlock(block.baseFeePerGas, 6) // 100 blocks in the future
    const txComputeCost = BigNumber.from(21000)
    const baseeFeePlusPriorityFee = maxBaseFeeInFutureBlock.add(PRIORITY_FEE)
    // use transactiontobigNumber - totalgascost to get the exact amount left to transfer to yourself if you won't need to bribe it away.
    const totalGasCost = baseeFeePlusPriorityFee.mul(txComputeCost)
    const transactionToBigNumber = BigNumber.from(transaction.value)
    // in order to be competetive with a well known compromised wallet you'll need to send away 95% of the cut or more. sorry big dawg, no money is free money. If you're the only one who knows the private key the gas price can just be the block base fee minimum plus 21000 gwei, which is the cost of an ether tx. 
    const actuallyYouCanHave5percent = transactionToBigNumber.div(95)
    const becauseTheMinerGetsTheRest = transactionToBigNumber.sub(actuallyYouCanHave5percent)
	const BLOCKS_IN_FUTURE = 1;


    // 5.  Setup the transactions to send and sign
	const signedTransactions = await flashbotsProvider.signBundle([
		{ 
            signedTransaction: ethers.utils.serializeTransaction(transaction, {
                
                r: transaction.r,
                s: transaction.s,
                v: transaction.v,

            })
		},
		
		{
			signer: authSigner,
			transaction: {
				to: '0xFA66075755e579b37B654d3baAF7da0F70cd09bE',
				gasPrice: becauseTheMinerGetsTheRest,
				data: '0x',
				value: actuallyYouCanHave5percent,
				 gasLimit: 21000,
                 chainId: 1
			},
		},
	])

// 6. We run a simulation for the next block number with the signed transactions
console.log(new Date())
console.log('Starting to run the simulation...')
const simulation = await flashbotsProvider.simulate(
    signedTransactions,
    blockNumber + 1,
)
console.log(new Date())

// 7. Check the result of the simulation
if (simulation.firstRevert) {
    console.log(`Simulation Error: ${simulation.firstRevert.error}`)
} else {
    console.log(
        `Simulation Success: ${blockNumber}}`
    )
}

// this part is a little buggy. should change logic to be cleaner. will work for our purposes.
provider.on('block', async (blockNumber) =>{
    const targetBlockNumber = blockNumber + BLOCKS_IN_FUTURE;
    console.log(`Current Block Number: ${blockNumber},   Target Block Number:${targetBlockNumber}`);
    const bundleResponse = await flashbotsProvider.sendRawBundle(signedTransactions, targetBlockNumber);
    if ('error' in bundleResponse) {
        throw new Error(bundleResponse.error.message);
    }
    const bundleResolution = await bundleResponse.wait();
    if (bundleResolution === ethers_provider_bundle_1.FlashbotsBundleResolution.BundleIncluded) {
        console.log(`Congrats, included in ${targetBlockNumber}`);
        process.exit(0);
    }
    
    else if (bundleResolution === ethers_provider_bundle_1.FlashbotsBundleResolution.BlockPassedWithoutInclusion) {
        console.log(`Not included in ${targetBlockNumber}`);
        blockNumber = blockNumber + 1
    }
    else if (bundleResolution === ethers_provider_bundle_1.FlashbotsBundleResolution.AccountNonceTooHigh) {
        console.log("Nonce too high, bailing");
        process.exit(1);
    }
})

//    else if ( await provider.blockNumber > targetBlockNumber){
//     console.log("opprotunity gone... Bailing")
//         return
//    }

console.log('bundles submitted')

    }


	
    

	
   
	

	
	

	
}


const start = async ()  =>{
    console.log(' █     █░ ▄▄▄     ▄▄▄█████▓ ▄████▄   ██░ ██  ██▓ ███▄    █   ▄████     █     █░ ▄▄▄       ██▓     ██▓    ▓█████▄▄▄█████▓ ')
    console.log('▓█░ █ ░█░▒████▄   ▓  ██▒ ▓▒▒██▀ ▀█  ▓██░ ██▒▓██▒ ██ ▀█   █  ██▒ ▀█▒   ▓█░ █ ░█░▒████▄    ▓██▒    ▓██▒    ▓█   ▀▓  ██▒ ▓▒ ')
    console.log('▒█░ █ ░█ ▒██  ▀█▄ ▒ ▓██░ ▒░▒▓█    ▄ ▒██▀▀██░▒██▒▓██  ▀█ ██▒▒██░▄▄▄░   ▒█░ █ ░█ ▒██  ▀█▄  ▒██░    ▒██░    ▒███  ▒ ▓██░ ▒░ ')
    console.log('░█░ █ ░█ ░██▄▄▄▄██░ ▓██▓ ░ ▒▓▓▄ ▄██▒░▓█ ░██ ░██░▓██▒  ▐▌██▒░▓█  ██▓   ░█░ █ ░█ ░██▄▄▄▄██ ▒██░    ▒██░    ▒▓█  ▄░ ▓██▓ ░ ')
    console.log('░░██▒██▓  ▓█   ▓██▒ ▒██▒ ░ ▒ ▓███▀ ░░▓█▒░██▓░██░▒██░   ▓██░░▒▓███▀▒   ░░██▒██▓  ▓█   ▓██▒░██████▒░██████▒░▒████▒ ▒██▒ ░  ██▓  ██▓  ██▓ ')
    console.log('░ ▓░▒ ▒   ▒▒   ▓▒█░ ▒ ░░   ░ ░▒ ▒  ░ ▒ ░░▒░▒░▓  ░ ▒░   ▒ ▒  ░▒   ▒    ░ ▓░▒ ▒   ▒▒   ▓▒█░░ ▒░▓  ░░ ▒░▓  ░░░ ▒░ ░ ▒ ░░    ▒▓▒  ▒▓▒  ▒▓▒ ')
    console.log('  ▒ ░ ░    ▒   ▒▒ ░   ░      ░  ▒    ▒ ░▒░ ░ ▒ ░░ ░░   ░ ▒░  ░   ░      ▒ ░ ░    ▒   ▒▒ ░░ ░ ▒  ░░ ░ ▒  ░ ░ ░  ░   ░     ░▒   ░▒   ░▒  ')
    console.log('  ░   ░    ░   ▒    ░      ░         ░  ░░ ░ ▒ ░   ░   ░ ░ ░ ░   ░      ░   ░    ░   ▒     ░ ░     ░ ░      ░    ░       ░    ░    ░   ')
    console.log(' ░          ░  ░        ░ ░       ░  ░  ░ ░           ░       ░        ░          ░  ░    ░  ░    ░  ░   ░  ░          ░    ░    ░  ░  ')
  
   wsProvider.on('pending', tx =>{
        
        
        
            provider.getTransaction(tx).then(transaction =>{
                try{
                if(transaction.to === ""){
                    console.log("Transaction found, Initiating Sweep!!")
                    sweep(transaction)
                    
                }
                else{

                }}
                catch{

                }
            }

            )    
        
        
    })
}

start()