import Button from 'react-bootstrap/Button'
import { injected, useAccount, useConnect, useDisconnect } from 'wagmi'
import { notification } from 'antd'

const ConnectWallet = () => {
  const { isConnected, address, isConnecting } = useAccount()
  const { connectAsync } = useConnect()
  const { disconnectAsync } = useDisconnect()
  const [api, contextHolder] = notification.useNotification()

  return (
    <>
      {contextHolder}

      <Button
        className={isConnected ? 'btn btn-success' : 'btn btn-danger'}
        onClick={() => {
          if (isConnected) {
            disconnectAsync().then(() => {
              api.success({
                message: `Wallet is disconnected`,
              })
            })
          } else {
            connectAsync({
              connector: injected(),
            })
              .then(() => {
                api.success({
                  message: `Wallet is connected`,
                })
              })
              .catch((err) => {
                api.error({
                  message: 'Something went wrong',
                  description: err?.message,
                })
              })
          }
        }}
      >
        {isConnecting ? (
          <h3>Connecting...</h3>
        ) : (
          <h3>
            {isConnected
              ? `${address?.slice(0, 5)}...${address?.slice(-5)} Disconnect`
              : 'Connect Wallet'}
          </h3>
        )}
      </Button>
    </>
  )
}

export default ConnectWallet
