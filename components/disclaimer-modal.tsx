// components/disclaimer-modal.tsx - FIXED VERSION
"use client"

import { X, AlertTriangle } from "lucide-react"

interface DisclaimerModalProps {
  onAccept: () => void
  onCancel: () => void
  isLoading?: boolean
  disabled?: boolean
}

export function DisclaimerModal({ 
  onAccept, 
  onCancel, 
  isLoading = false,
  disabled = false 
}: DisclaimerModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
      <div className="w-full max-w-2xl max-h-[90vh] rounded-xl bg-card border-2 border-border overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border bg-secondary/30">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-yellow-500/10">
              <AlertTriangle className="h-5 w-5 text-yellow-500" />
            </div>
            <h2 className="text-lg font-bold text-foreground">
              Username Pairing Disclaimer
            </h2>
          </div>
          <button
            onClick={onCancel}
            disabled={isLoading}
            className="text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="prose prose-sm dark:prose-invert max-w-none">
            <p className="text-base text-muted-foreground leading-relaxed mb-4">
              By using the username pairing feature in Names app, you acknowledge and agree to the following terms:
            </p>

            <div className="space-y-4">
              {/* Section 1 */}
              <div className="rounded-lg border border-border bg-secondary/30 p-4">
                <h3 className="text-sm font-bold text-foreground mb-2">
                  1. Nature of Pairing
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  All username pairings are <strong>speculative and user-generated</strong>. 
                  They do NOT represent official affiliation with the original platforms 
                  (e.g., Base, Farcaster, Zora) or the actual username owners.
                </p>
              </div>

              {/* Section 2 */}
              <div className="rounded-lg border border-border bg-secondary/30 p-4">
                <h3 className="text-sm font-bold text-foreground mb-2">
                  2. No Liability for Infringement
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Names app is <strong>NOT responsible</strong> for any trademark claims, 
                  copyright violations, or misuse of names by third parties. You are solely 
                  responsible for ensuring your pairing does not infringe on others' rights.
                </p>
              </div>

              {/* Section 3 */}
              <div className="rounded-lg border border-border bg-secondary/30 p-4">
                <h3 className="text-sm font-bold text-foreground mb-2">
                  3. Legal Disputes
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  If any dispute arises regarding your paired username, 
                  <strong> you bear all legal costs and responsibilities</strong>. 
                  Names app will not intervene or provide legal defense.
                </p>
              </div>

              {/* Section 4 */}
              <div className="rounded-lg border border-border bg-secondary/30 p-4">
                <h3 className="text-sm font-bold text-foreground mb-2">
                  4. Digital Asset Nature
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Paired usernames are <strong>unique digital assets</strong> similar to NFTs, 
                  created for entertainment and trading purposes. They carry 
                  <strong> no guarantee of value or external utility</strong>.
                </p>
              </div>

              {/* Section 5 */}
              <div className="rounded-lg border border-border bg-secondary/30 p-4">
                <h3 className="text-sm font-bold text-foreground mb-2">
                  5. Account Suspension Rights
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Names app reserves the right to <strong>suspend accounts or pairings</strong> 
                  if violations are reported. This includes unauthorized use of 
                  brand names or famous individuals without explicit permission.
                </p>
              </div>

              {/* Section 6 */}
              <div className="rounded-lg border border-border bg-secondary/30 p-4">
                <h3 className="text-sm font-bold text-foreground mb-2">
                  6. Responsible Use
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Use this feature responsibly. <strong>Avoid pairing with brand names, 
                  trademarks, or celebrity usernames</strong> without explicit written consent 
                  from the rightful owner. Doing so may result in legal action against you.
                </p>
              </div>
            </div>

            {/* Legal Notice */}
            <div className="mt-6 rounded-lg border-2 border-yellow-500/30 bg-yellow-500/5 p-4">
              <div className="flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 text-yellow-500 shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-bold text-foreground mb-1">
                    This is NOT Legal Advice
                  </p>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    The information provided here is for informational purposes only. 
                    For specific legal concerns regarding your username pairing, 
                    please consult a qualified attorney in your jurisdiction.
                  </p>
                </div>
              </div>
            </div>

            {/* Gas Fee Notice */}
            <div className="mt-4 rounded-lg border border-border bg-accent/30 p-4">
              <p className="text-xs font-medium text-foreground mb-1">
                ⛽ Gas Fee Responsibility
              </p>
              <p className="text-xs text-muted-foreground leading-relaxed">
                When minting paired usernames, <strong>you pay all gas fees</strong> 
                directly from your wallet. Gasless paymaster only applies to story 
                appreciation, not to username pairing or trading.
              </p>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="border-t border-border bg-secondary/30 p-4">
          <div className="flex items-center gap-3">
            <button
              onClick={onCancel}
              disabled={isLoading}
              className="flex-1 rounded-lg border border-border bg-card py-3 text-sm font-semibold text-foreground hover:bg-secondary transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={onAccept}
              disabled={isLoading || disabled}
              className="flex-1 rounded-lg bg-primary py-3 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Processing...' : 'I Understand & Accept'}
            </button>
          </div>
          {disabled && (
            <p className="text-xs text-yellow-600 dark:text-yellow-400 text-center mt-2">
              ⚠️ Please select 2 accounts first
            </p>
          )}
          <p className="text-xs text-muted-foreground text-center mt-3">
            By accepting, you confirm you have read and understood this disclaimer
          </p>
        </div>
      </div>
    </div>
  )
}