"use client"

import { ConnectButton } from "@rainbow-me/rainbowkit"

interface ConnectWalletButtonProps {
  className?: string
}

export function ConnectWalletButton({ className }: ConnectWalletButtonProps) {
  return (
    <ConnectButton.Custom>
      {({
        account,
        chain,
        openAccountModal,
        openChainModal,
        openConnectModal,
        authenticationStatus,
        mounted,
      }) => {
        // Ensure component is mounted (fixes hydration issues)
        const ready = mounted && authenticationStatus !== 'loading'
        const connected = ready && account && chain

        if (!ready) {
          return null
        }

        if (connected && chain.unsupported) {
          return (
            <button
              onClick={openChainModal}
              type="button"
              className={className || "inline-flex items-center gap-2 rounded-full bg-red-500/10 px-6 py-3 text-sm font-semibold text-red-600 hover:bg-red-500/20"}
            >
              Wrong network
            </button>
          )
        }

        if (!connected) {
          return (
            <button
              onClick={openConnectModal}
              type="button"
              className={className || "inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground hover:bg-primary/90"}
            >
              Connect Wallet
            </button>
          )
        }

        return (
          <div className="flex items-center gap-3">
            <button
              onClick={openChainModal}
              style={{
                display: chain.unsupported ? 'none' : 'auto',
              }}
              className="inline-flex items-center gap-2 rounded-lg bg-secondary px-3 py-2 text-xs font-semibold text-foreground hover:bg-secondary/80"
            >
              {chain.hasIcon && (
                <div
                  style={{
                    background: chain.iconBackground,
                    width: 12,
                    height: 12,
                    borderRadius: 999,
                    overflow: 'hidden',
                    marginRight: 4,
                  }}
                >
                  {chain.iconUrl && (
                    <img alt={chain.name} src={chain.iconUrl} style={{ width: 12, height: 12 }} />
                  )}
                </div>
              )}
              {chain.name}
            </button>

            <button
              onClick={openAccountModal}
              type="button"
              className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
            >
              {account.displayName}
              {account.displayBalance && ` (${account.displayBalance})`}
            </button>
          </div>
        )
      }}
    </ConnectButton.Custom>
  )
}
