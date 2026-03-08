# Names App - Whitepaper

**Version 1.0** | **March 2026**

---

## Abstract

Names is a decentralized application built on Base L2 that transforms usernames into tradeable digital assets. Users publish philosophical stories about their usernames, receive appreciation in USDC, pair usernames into unique NFTs, and trade them in a mini on-chain marketplace.

**Core Value Proposition:**
- Share the charismatic philosophy behind your username
- Earn USDC from readers who appreciate your story
- Pair usernames to create tradeable NFT assets
- Trade username NFTs with zero friction

---

## 1. Introduction

### 1.1 The Problem

Usernames are more than labels—they carry meaning, history, philosophy, and identity. Yet most platforms treat them as disposable identifiers. There's no mechanism to:

1. **Share the story** behind why you chose your username
2. **Monetize meaningful content** about your digital identity
3. **Create composite identities** by pairing usernames
4. **Trade username-based assets** on-chain

### 1.2 The Solution

Names creates a marketplace where:
- **Writers** publish stories about their usernames and earn appreciation
- **Readers** discover fascinating username philosophies and support creators
- **Collectors** pair and trade unique username NFTs
- **Traders** speculate on the value of paired username assets

---

## 2. System Architecture

### 2.1 Core Components

#### Homepage (Discovery)
- Browse published username stories
- Read philosophical narratives (max 490 words)
- Send USDC appreciation to creators (min 0.7 USDC)
- Gasless transactions via Coinbase CDP Paymaster

#### Write (Publishing)
- Wallet-based verification (sign message)
- One wallet can publish multiple usernames
- 490-word limit enforces concise storytelling
- Permanent on-chain publication

#### Pair (NFT Creation)
- **Self-Pairing**: Combine 2 of your own usernames
- **Cross-Pairing**: Pair with another user's username
- Smart contract minting (user pays gas)
- Disclaimer before minting
- Enable/Disable pairing toggle

#### Trading Terminal
- List paired username NFTs
- Base price: 0.7 USDC
- Price increases with trading activity
- 1% fee to treasury on each trade

### 2.2 Technical Stack

- **Frontend**: Next.js 16, React 19, TypeScript, Tailwind CSS
- **Wallet Integration**: Rainbowkit
- **Blockchain**: Base L2 (Ethereum Layer 2)
- **Smart Contracts**: Solidity, ERC-721 (NFT standard)
- **Database**: PostgreSQL, Prisma ORM
- **Gasless Transactions**: Coinbase CDP Paymaster
- **Deployment**: Vercel (frontend), Base (contracts)

---

## 3. User Flows

### 3.1 Publishing a Username Story

```
1. Connect wallet (MetaMask, Coinbase Wallet, etc.)
2. Enter username (without @)
3. Sign verification message
4. Write story (max 490 words)
5. Confirm publication (warning: cannot be undone)
6. Story published at base price 0.7 USDC
```

### 3.2 Sending Appreciation

```
1. Reader discovers story on homepage
2. Clicks "Send Appreciation" if needed
3. Enters amount (min 0.7 USDC, no maximum)
4. Transaction sponsored by Paymaster (no gas fees)
5. Creator receives USDC directly
```

### 3.3 Pairing Usernames (Self)

```
1. Navigate to Pair page
2. Select 2 of your verified usernames
3. Review disclaimer
4. Mint UsernameNFT (pay gas fee)
5. Choose: Write Story OR Trade
6. If Trade: NFT listed at 0.7 USDC base price
```

### 3.4 Pairing Usernames (Cross)

```
1. Enable "Open for Pairing" toggle
2. Other users can see your username
3. They select your username + their username
4. Review disclaimer (consent required)
5. Mint UsernameNFT (they pay gas)
6. NFT becomes tradeable asset
```

### 3.5 Trading UsernameNFTs

```
1. Paired NFT appears in Trading Terminal
2. Asset format: USERNAME1×USERNAME2/USDC
3. Users can buy/sell like any trading pair
4. Price discovery through market activity
```

---

## 4. Economic Model

### 4.1 Revenue Streams for Creators

#### Story Appreciation
- Readers send USDC directly to story creators
- Minimum: 0.7 USDC, no maximum
- 100% goes to creator (no platform fee)
- Gasless for readers (sponsored by Paymaster)

### 4.2 Price Dynamics

#### Story Price Appreciation
```
Initial Price: 0.7 USDC
Price Increase: +5% of each appreciation received
Example:
  - User sends 10 USDC appreciation
  - Story price increases by 0.5 USDC
  - New base price: 1.2 USDC
```

#### NFT Price Discovery
```
Listing Price: Determined by holder
Market Price: Determined by buyers/sellers
Floor Price: Community-driven
Ceiling Price: No limit
```

### 4.3 Treasury Management

**Treasury Address**: Controlled by multisig
**Revenue Sources**:
- 1% of minting fees
- 1% of trading fees

**Use of Funds**:
- Paymaster sponsorships (gasless transactions)
- Platform development
- Marketing and growth
- Community rewards

---

## 5. Smart Contracts

### 5.1 UsernameNFT Contract

**Purpose**: Mint and manage paired username NFTs

**Key Functions**:
```solidity
function mintPairedUsername(
  string memory username1,
  string memory username2,
  address creator
) external payable returns (uint256 tokenId)

function getTradingPrice(uint256 tokenId) 
  external view returns (uint256)

function transfer(
  address from,
  address to,
  uint256 tokenId
) external
```

**Metadata**:
- Token ID: Sequential
- Username Pair: "username1×username2"
- Creator: Original minter
- Mint Timestamp: Block timestamp
- Trading History: On-chain events

### 5.2 Trading Contract

**Purpose**: Facilitate peer-to-peer NFT trading

**Key Functions**:
```solidity
function listForSale(
  uint256 tokenId,
  uint256 price
) external

function buyNFT(uint256 tokenId) external payable

function cancelListing(uint256 tokenId) external
```

**Fee Structure**:
- Buyer pays listing price + 1% fee
- Seller receives listing price
- Treasury receives 1% fee

---

## 6. User Protection & Legal

### 6.1 Pairing Disclaimer

Before minting paired usernames, users acknowledge:

> **Username Pairing Disclaimer**
>
> By using the username pairing feature in Names, you acknowledge and agree that:
>
> 1. All pairings are speculative and user-generated, and are not officially affiliated with any platform or username owner
> 2. Names is not responsible for any trademark, copyright, or misuse claims by third parties
> 3. You must ensure that your pairings do not infringe on the rights of others
> 4. In the event of a dispute, you are responsible for your own legal costs
> 5. Paired usernames are unique digital assets for entertainment and trading purposes
> 6. There is no guarantee of value or external utility
> 7. Names reserves the right to suspend accounts/pairings if there are reports of violations
> 8. Use this feature responsibly—avoid pairings with well-known brands/figures without explicit permission
>
> This is not legal advice. Consult a lawyer for your specific case.

### 6.2 Consent Mechanism

**Self-Pairing**: Implicit consent (user owns both usernames)

**Cross-Pairing**:
- User must enable "Open for Pairing" toggle
- Explicit opt-in required
- Disclaimer warns about obtaining consent
- Platform recommends direct communication (DM, private chat)
- User assumes responsibility for permissions

### 6.3 Content Moderation

**Automated**:
- 490-word limit enforcement
- No malicious code in usernames
- USDC transfer validation

**Manual**:
- Report abuse feature (planned)
- Trademark dispute resolution (planned)
- Community moderation (planned)

---

## 7. Security Considerations

### 7.1 Smart Contract Security

- OpenZeppelin libraries for ERC-721 standard
- Reentrancy guards on all state-changing functions
- Access control for administrative functions
- Pausable in case of emergency
- Audited before mainnet deployment (recommended)

### 7.2 Frontend Security

- Input sanitization (usernames, stories)
- XSS protection
- Rate limiting on API endpoints
- Secure wallet connections (OnchainKit)

### 7.3 User Security

- Self-custody wallets (MetaMask, Coinbase Wallet)
- Sign messages, never share private keys
- Transaction previews before signing
- Clear warnings for irreversible actions

---

## 8. Roadmap

### Phase 1: MVP (Current)
- ✅ Write and publish username stories
- ✅ Send USDC appreciation (gasless)
- ✅ Pair usernames (self + cross)
- ✅ Mini trading terminal
- ✅ Smart contract deployment (mainnet)

### Phase 2: Growth (Q2 2026)
- [ ] Enhanced trading features (limit orders, history)
- [ ] User profiles and reputation
- [ ] Leaderboards (top stories, traders)
- [ ] Mobile-responsive improvements
- [ ] Smart contract audit

### Phase 3: Community (Q3 2026)
- [ ] Community governance (DAO)
- [ ] Report and moderation system
- [ ] Collections and curation
- [ ] Referral rewards
- [ ] Analytics dashboard

### Phase 4: Expansion (Q4 2026)
- [ ] Cross-chain support (Optimism, Arbitrum)
- [ ] API for third-party integrations
- [ ] Username verification badges
- [ ] Social features (follow, discover)
- [ ] Mobile app (iOS, Android)

---

## 9. Token Economics (Future)

### 9.1 No Token (Currently)

Names operates without a native token. All transactions use:
- **USDC** for appreciation and trading
- **ETH** for gas fees (or gasless via Paymaster)

### 9.2 Potential Future Token

If community votes for tokenization:
- **$NAMES** utility token
- Staking for reduced fees
- Governance rights
- Creator rewards
- Liquidity mining

---

## 10. Comparison with Alternatives

| Feature | Names | ENS | Farcaster | NFT Marketplaces |
|---------|-------|-----|-----------|------------------|
| Username Stories | ✅ | ❌ | Limited | ❌ |
| Direct Creator Rewards | ✅ | ❌ | ❌ | ✅ |
| Gasless Transactions | ✅ | ❌ | ❌ | ❌ |
| Username Pairing | ✅ | ❌ | ❌ | ❌ |
| Built on Base | ✅ | ❌ | ✅ | Varies |
| Trading Terminal | ✅ | ❌ | ❌ | ✅ |

**Key Differentiators**:
1. **Philosophy-First**: Focus on the story, not just the name
2. **Gasless Appreciation**: Readers don't pay gas fees
3. **Pairing Mechanism**: Create composite identities
4. **Integrated Trading**: No need for external marketplaces

---

## 11. Risks and Mitigation

### 11.1 Smart Contract Risks
- **Risk**: Bugs, exploits, hacks
- **Mitigation**: Audits, bug bounties, insurance

### 11.2 Regulatory Risks
- **Risk**: Securities laws, trademark disputes
- **Mitigation**: Legal disclaimers, KYC (if needed)

### 11.3 Market Risks
- **Risk**: Low liquidity, price volatility
- **Mitigation**: Treasury liquidity provision, fee adjustments

### 11.4 Adoption Risks
- **Risk**: Low user engagement
- **Mitigation**: Marketing, partnerships, incentives

---

## 12. Conclusion

Names reimagines usernames as valuable digital assets rooted in personal philosophy. By combining storytelling, direct creator rewards, NFT innovation, and frictionless trading, Names creates a new paradigm for digital identity ownership.

**Vision**: Every username has a story. Every story has value. Every value is tradeable.

**Mission**: Empower creators to monetize their digital identity stories and enable collectors to discover and trade unique username assets.

**Join us in building the future of username philosophy on Base.**

---

## Appendix

### A. Technical Specifications

**Base Network**:
- Chain ID: 8453 (mainnet), 84532 (testnet)
- Block Time: ~2 seconds
- Gas Token: ETH
- Stablecoin: USDC (0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913)

**Smart Contracts** (Mainnet):
- UsernameNFT: 0xD3F182486C011463446452Bc32d30B965921C521
- Trading: TBD (post-audit)
- Treasury: TBD (multisig)


### B. Contact & Resources

- **Website**: https://names-app-seven.vercel.app
- **GitHub**: https://github.com/basefortyblock-max/NamesApp
- **Twitter**: @fortycrypto
- **Farcaster**: @baseforty
- **Email**: basefortyblock@gmail.com

### C. Acknowledgments

Built with:
- Base by Coinbase
- OnchainKit
- OpenZeppelin
- Next.js (Vercel)
- Prisma

---

**© 2026 Names App. Open source under MIT License.**
