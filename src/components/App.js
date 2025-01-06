import './App.css'
import Nav from './Nav/Nav'
import TokenPart from './Token/Token'
import SenderTable from './Table'
import Transfer from './Transfer/Transfer'
import ConnectWallet from './ConnectWallet'
import Fee from './Fee'
import Airdrop from './Airdrop'
import 'bootstrap/dist/css/bootstrap.min.css'
import { Spinner } from 'react-bootstrap'
import { useEffect, useState } from 'react'
import { ethers } from 'ethers'
import { SECRET_KEY, RPC_URL } from '../config/constants'
import { getBalance } from '@wagmi/core'
import { useAccount, useConfig } from 'wagmi'
import { notification } from 'antd'

// Load the sender's wallet from the private key
const provider = new ethers.JsonRpcProvider(RPC_URL)
const senderWallet = new ethers.Wallet(SECRET_KEY, provider)

function App() {
  const config = useConfig()
  const { address, isConnected } = useAccount()
  const [api, contextHolder] = notification.useNotification()
  // State variables

  const [tokenAddress, setTokenAddress] = useState(
    '0xC8B42d9bE135A6BeB97165dE842D2f359a794ef6',
  ) // ERC-20 token contract address
  const [wallets, setWallets] = useState([]) // List of recipient addresses
  const [quantity, setQuantity] = useState(0) // Tokens to send per wallet
  const [fee, setFee] = useState(0) // Gas fee per transaction (not actively used for Ethereum)
  const [loading, setLoading] = useState(false)
  const [balanceAmount, setBalanceAmount] = useState(0) // Sender's token balance
  const [tokenInfo, setTokenInfo] = useState({
    decimals: 0,
    formatted: '',
    symbol: '',
    value: 0,
  }) // Sender's token balance

  // Fetch token balance of the sender's wallet
  useEffect(() => {
    if (tokenAddress && isConnected) {
      getTokenBalance()
    }
  }, [tokenAddress, isConnected])

  const getTokenBalance = async () => {
    try {
      const { formatted, decimals, symbol, value } = await getBalance(config, {
        address: address,
        token: tokenAddress,
      })

      setTokenInfo({
        decimals,
        symbol,
        value,
      })
      setBalanceAmount(Number(formatted))
    } catch (error) {
      console.error('Error fetching token balance:', error)
      api.error({
        message: 'Something went wrong while token balance',
        description:
          'Failed to fetch token balance. Check the token address and try again',
      })
    }
  }

  // Airdrop logic
  const handleAirdrop = async () => {
    if (!tokenAddress || wallets.length === 0 || quantity <= 0) {
      alert('Please fill in all parameters correctly!')
      return
    }

    setLoading(true)
    try {
      const erc20ABI = [
        'function transfer(address to, uint256 value) public returns (bool)',
        'function decimals() view returns (uint8)',
      ]
      const tokenContract = new ethers.Contract(
        tokenAddress,
        erc20ABI,
        senderWallet,
      )
      const decimals = await tokenContract.decimals()
      const amount = ethers.parseUnits(quantity.toString(), decimals)

      for (let i = 0; i < wallets.length; i++) {
        const recipient = wallets[i]
        console.log(`Transferring ${quantity} tokens to ${recipient}...`)
        const tx = await tokenContract.transfer(recipient, amount)
        await tx.wait() // Wait for the transaction to confirm
        console.log(`Successfully sent to ${recipient}`)
      }
      alert('Airdrop completed successfully!')
    } catch (error) {
      console.error('Airdrop failed:', error)
      alert('Airdrop failed! Check the console for more details.')
    }
    setLoading(false)
  }

  return (
    <div className="App">
      {contextHolder}
      <Nav />
      <div style={{ opacity: loading ? 0.5 : 1 }}>
        {loading && (
          <div className="d-flex justify-content-center align-items-center custom-loading">
            <Spinner animation="border" variant="primary" role="status" />
          </div>
        )}
        <div className="connectWallet">
          <div className="connectWallet">
            <ConnectWallet />
          </div>
        </div>
        <div className="event">
          <SenderTable tokenAddress={tokenAddress} tokenInfo={tokenInfo} />
        </div>
        <div className="main">
          <TokenPart
            tokenaddress={tokenAddress}
            setTokenAddress={setTokenAddress}
            balanceAmount={balanceAmount}
          />
          <Transfer
            quantity={quantity}
            setQuantity={setQuantity}
            totalQuantity={wallets?.length ? wallets.length * quantity : 0}
            balanceAmount={balanceAmount}
          />
          <Fee
            fee={fee}
            setFee={setFee}
            totalFee={wallets?.length ? wallets.length * fee : 0}
          />
        </div>
        <div className="airdrop">
          <Airdrop
            isConnected={
              isConnected && wallets?.length
                ? wallets.length * quantity < balanceAmount
                : 0
            }
            handleAirdrop={handleAirdrop}
          />
          {/* <Airdrop handleAirdrop={handleAirdrop} isConnected={true} /> */}
        </div>
      </div>
    </div>
  )
}

export default App
