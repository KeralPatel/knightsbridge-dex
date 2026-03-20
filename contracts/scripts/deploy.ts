import { ethers, network, run } from 'hardhat'

async function main() {
  const [deployer] = await ethers.getSigners()
  console.log(`\nDeploying on ${network.name} from ${deployer.address}`)

  const bal = await ethers.provider.getBalance(deployer.address)
  console.log(`Balance: ${ethers.formatEther(bal)} ETH\n`)

  // ─── Deploy LiquidityLocker ───────────────────────────────────────────────
  console.log('Deploying LiquidityLocker...')
  const LiquidityLocker = await ethers.getContractFactory('LiquidityLocker')
  const locker = await LiquidityLocker.deploy(deployer.address)
  await locker.waitForDeployment()
  const lockerAddress = await locker.getAddress()
  console.log(`LiquidityLocker deployed to: ${lockerAddress}`)

  // ─── Deploy TokenFactory ──────────────────────────────────────────────────
  console.log('\nDeploying TokenFactory...')
  const deployFee = ethers.parseEther('0.001')     // 0.001 ETH deploy fee
  const minLiquidity = ethers.parseEther('0.01')    // Min 0.01 ETH liquidity

  const TokenFactory = await ethers.getContractFactory('TokenFactory')
  const factory = await TokenFactory.deploy(
    lockerAddress,
    deployer.address,
    deployFee,
    minLiquidity
  )
  await factory.waitForDeployment()
  const factoryAddress = await factory.getAddress()
  console.log(`TokenFactory deployed to: ${factoryAddress}`)

  // ─── Summary ─────────────────────────────────────────────────────────────
  console.log('\n=== DEPLOYMENT COMPLETE ===')
  console.log(`Network:          ${network.name} (chainId: ${network.config.chainId})`)
  console.log(`LiquidityLocker:  ${lockerAddress}`)
  console.log(`TokenFactory:     ${factoryAddress}`)
  console.log('\nAdd these to .env.local:')

  const chainKey = network.name === 'base' ? 'BASE' : 'ETH'
  console.log(`NEXT_PUBLIC_TOKEN_FACTORY_${chainKey}=${factoryAddress}`)
  console.log(`NEXT_PUBLIC_LIQUIDITY_LOCKER_${chainKey}=${lockerAddress}`)

  // ─── Verify on Etherscan (non-local networks) ─────────────────────────────
  if (network.name !== 'hardhat' && network.name !== 'localhost') {
    console.log('\nWaiting 30s for block confirmations before verification...')
    await new Promise(resolve => setTimeout(resolve, 30000))

    try {
      await run('verify:verify', {
        address: lockerAddress,
        constructorArguments: [deployer.address],
      })
      await run('verify:verify', {
        address: factoryAddress,
        constructorArguments: [lockerAddress, deployer.address, deployFee, minLiquidity],
      })
      console.log('Contracts verified!')
    } catch (err) {
      console.error('Verification failed:', err)
    }
  }
}

main().catch((err) => { console.error(err); process.exit(1) })
