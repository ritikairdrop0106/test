import React, { useState } from 'react'
import Papa from 'papaparse'
import Table from 'react-bootstrap/Table'
import Button from 'react-bootstrap/Button'
import { waitForTransactionReceipt, writeContract } from '@wagmi/core'
import { useAccount, useConfig, useWriteContract } from 'wagmi'
import { formatUnits, isAddress, parseUnits } from 'ethers'
import { MULTISENDER_ABI } from '../../config/multisender.abi'
import { notification } from 'antd'
import { erc20Abi } from 'viem'
function SenderTable({ tokenAddress, tokenInfo }) {
  const [data, setData] = useState([])
  const [errors, setErrors] = useState([])
  const [isValid, setIsValid] = useState(false)
  const { isConnected } = useAccount()
  const config = useConfig()
  const [api, contextHolder] = notification.useNotification()
  const multisenderAddress = '0x329E9d993520f526040646008D8f17eEE7509c65'
  // CSV file upload handler
  const handleFileUpload = (e) => {
    const file = e.target.files[0]

    if (file && file.type !== 'text/csv') {
      setErrors(['Please upload a valid CSV file.'])
      setData([])
      setIsValid(false)
      return
    }

    Papa.parse(file, {
      header: false,
      skipEmptyLines: true,
      complete: (result) => {
        const parsedData = result.data.map((row) => ({
          address: row[0],
          amount: parseFloat(row[1]),
        }))
        validateData(parsedData)
      },
      error: (error) => {
        setErrors(['Error parsing CSV file: ' + error.message])
        setData([])
        setIsValid(false)
      },
    })
  }

  // Validate data from CSV
  const validateData = (parsedData) => {
    const addressSet = new Set()
    const validationErrors = []

    parsedData.forEach(({ address, amount }, index) => {
      // Check for valid Ethereum address format
      if (!isAddress(address)) {
        validationErrors.push(`Row ${index + 1}: Invalid Ethereum address`)
      }

      // Check for duplicate addresses
      if (addressSet.has(address)) {
        validationErrors.push(`Row ${index + 1}: Duplicate address`)
      } else {
        addressSet.add(address)
      }

      // Check for positive amount
      if (isNaN(amount) || amount <= 0) {
        validationErrors.push(`Row ${index + 1}: Invalid or negative amount`)
      }
    })

    setErrors(validationErrors)
    setData(parsedData)
    setIsValid(validationErrors.length === 0)
  }

  // Mock transfer function

  const {
    writeContractAsync: approveWriteContractAsync,
    isPending: approveIsPending,
  } = useWriteContract({})

  const {
    writeContractAsync: transferWriteContractAsync,
    isPending,
  } = useWriteContract()

  const handleTransfer = async () => {
    if (isValid) {
      try {
        const targets = data.map((item) => item.address)
        const decimals = tokenInfo?.decimals

        // Sum the amounts before converting to the smallest unit
        const totalAmount = data.reduce((sum, item) => sum + item.amount, 0)
        console.log(totalAmount)
        // Convert the total sum to the smallest unit
        const totalAmountInSmallestUnit = parseUnits(
          String(totalAmount),
          decimals,
        )
        // Convert each amount to the smallest unit (optional)
        const amounts = data.map((item) =>
          parseUnits(String(item.amount), decimals),
        )
        console.log(multisenderAddress, totalAmountInSmallestUnit)

        const result = await approveWriteContractAsync({
          address: tokenAddress,
          abi: erc20Abi,
          functionName: 'approve',
          args: [
            multisenderAddress,
            '0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF',
          ],
        })

        const trx = await waitForTransactionReceipt(config, {
          hash: result,
        })

        const transferTx = await transferWriteContractAsync({
          address: multisenderAddress,
          abi: MULTISENDER_ABI, // Multisender ABI for multisend contract
          functionName: 'multisendToken',
          args: [tokenAddress, false, targets, amounts],
        })

        // Success message
        api.success({
          message: 'Transfer successful',
        })
      } catch (error) {
        // Error handling
        api.error({
          message: 'Error during transfer',
          description: error.message || error,
        })
        console.error('Error during transfer:', error)
      }
    }
  }

  return (
    <div>
      {contextHolder}
      <h2>Upload CSV for Token Transfer</h2>
      <input type="file" accept=".csv" onChange={handleFileUpload} />

      {errors.length > 0 && (
        <div className="error-messages">
          <h3>Validation Errors:</h3>
          <ul
            style={{
              color: 'red',
            }}
          >
            {errors.map((error, index) => (
              <li key={index}>{error}</li>
            ))}
          </ul>
        </div>
      )}

      <Table striped bordered hover>
        <thead>
          <tr>
            <th>Address</th>
            <th>Amount</th>
          </tr>
        </thead>
        <tbody>
          {data.map(({ address, amount }, index) => (
            <tr key={index}>
              <td>{address}</td>
              <td>{amount}</td>
            </tr>
          ))}
        </tbody>
      </Table>

      <p>
        Download a{' '}
        <a href="/public/wallets.csv" download>
          sample CSV file
        </a>{' '}
        for reference.
      </p>

      {!isConnected ? (
        <Button
          onClick={() => {
            alert('Please connect wallet before the transfer token')
          }}
          disabled={!isConnected}
        >
          Connect Wallet
        </Button>
      ) : (
        <Button
          onClick={handleTransfer}
          disabled={!isValid || isPending || approveIsPending}
        >
          Transfer Tokens
        </Button>
      )}
    </div>
  )
}

export default SenderTable
