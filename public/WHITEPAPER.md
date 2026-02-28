# Names App - Whitepaper

**Philosophy Behind Your Username: A Decentralized Storytelling & Trading Platform**

Version 1.0  
February 2026

---

## Abstract

Names App is a decentralized application on Base L2 that transforms usernames into philosophical narratives and tradeable digital assets. By combining storytelling, verification, and on-chain trading, Names creates a unique ecosystem where username philosophy meets financial value.

This whitepaper outlines the technical architecture, economic model, and philosophical foundation of Names App.

---

## 1. Introduction

### 1.1 Problem Statement

In the digital age, usernames are our primary identity markers. Yet:
- Stories behind usernames are lost
- No platform values username philosophy
- Identity cannot be monetized
- Cross-platform identity fragmented

### 1.2 Solution

Names App solves this by:
- **Preserving** username stories on-chain
- **Valuing** philosophical narratives
- **Connecting** cross-platform identities
- **Enabling** monetization through trading

### 1.3 Core Innovation

The unique "paired username" mechanism:
```
username1 (Platform A) × username2 (Platform B) = Tradeable Asset
```

This creates scarcity, uniqueness, and value.

---

## 2. System Architecture

### 2.1 Technical Stack
```
┌─────────────────────────────────────────┐
│         Frontend (Next.js 16)           │
│  React 19 | TypeScript | Tailwind CSS   │
└─────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────┐
│      Blockchain Layer (Base L2)         │
│   Smart Contracts | USDC | OnchainKit   │
└─────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────┐
│      Database (Prisma + PostgreSQL)     │
│   Stories | Pairs | Verifications       │
└─────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────┐
│    External APIs (Verification)         │
│  Farcaster API | ENS | Base RPC         │
└─────────────────────────────────────────┘
```

### 2.2 Smart Contract Design

**UsernameNFT Contract:**
```solidity
contract UsernameNFT {
    // Core functions
    function mintPairedUsername(...) returns (uint256)
    function listForSale(uint256 tokenId, uint256 price)
    function buyPairedUsername(uint256 tokenId)
      
}
```

**Key Features:**
- ERC721 standard for NFTs
- Immutable ownership records
- Transparent pricing

### 2.3 Verification System

Three-tier verification:

**Base (Native):**
```typescript
Method: Sign-In with Ethereum (SIWE)
Security: Cryptographic signature
Cost: Gas only
```

**Farcaster (API):**
```typescript
Method: Warpcast public API
Verification: FID + username match
Cost: Free (public API)
```

**Zora (ENS):**
```typescript
Method: ENS resolution
Verification: Address ownership
Cost: Free (read-only)
```

---

## 3. Core Mechanisms

### 3.1 Write Mechanism

**Flow:**
```
User connects wallet
  ↓
Selects platform (Base/Farcaster/Zora)
  ↓
Enters username
  ↓
Verification process
  ↓
Writes story (max 490 words)
  ↓
Publishes on-chain
  ↓
Receives appreciation (USDC)
```

**Word Limit Philosophy: 7×7×10 = 490**
- **7**: Perfection and completeness
- **10**: Binary foundation (1 and 0)
- **490**: Optimal length for philosophical expression

**Constraints:**
- Cannot delete published stories
- One story per username
- Minimum quality threshold
- Real ownership verification required

### 3.2 Pair Mechanism

**Self-Pairing Only:**
```
Prerequisites:
- 2+ verified accounts
- Different platforms
- Wallet connected

Process:
1. Select Account 1 (e.g., Base)
2. Select Account 2 (e.g., Farcaster)
3. Preview: username1×username2
4. Accept disclaimer
5. Pay gas fee
6. Mint paired username NFT
7. Starting price: 0.7 USDC
```

**Example:**
```
User has:
-  Base username -> B1
-  Farcaster username ->F1

Pairs into:
- B1xF1 (Unique Asset)
```

**Security:**
- Both accounts must belong to user
- Verification checked on-chain
- Immutable once minted
- Disclaimer accepted

### 3.3 Trading Mechanism

**Listing:**
```typescript
function listForSale(tokenId, price) {
    require(price >= 0.7 USDC, "Below minimum");
    require(ownerOf(tokenId) == msg.sender);
    
    pairedUsername.forSale = true;
    pairedUsername.currentPrice = price;
}
```

**Buying:**
```typescript
function buyPairedUsername(tokenId) {
    // 1. Approve USDC spending
    USDC.approve(contract, price);
    
    // 2. Calculate fees
    platformFee = price * 1% = 0.01 USDC
    sellerAmount = price - platformFee
    
    // 3. Transfer USDC
    USDC.transfer(seller, sellerAmount);
    USDC.transfer(treasury, platformFee);
    
    // 4. Transfer NFT
    transferFrom(seller, buyer, tokenId);
}
```

**Market-Driven Pricing:**
```
Popular pairs: Can reach 100+ USDC
Average pairs: 1-10 USDC
New pairs: 0.7 USDC (floor)
```

---

## 5. User Journey

### 5.1 New User Onboarding

**Day 1: Discover**
```
1. Visit Names App
2. Read about concept
3. Connect wallet
4. Explore existing stories
```

**Day 2: Participate**
```
1. Verify username (Base/Farcaster/Zora)
2. Write first story
3. Publish on-chain
4. Receive first appreciation
```

**Day 3: Pair**
```
1. Verify second platform
2. Create paired username
3. Mint as NFT (pay gas)
4. List for trade (optional)
```

### 5.2 Power User Journey

**Week 1-4: Build**
- Write multiple stories
- Pair various usernames
- Build following
- Engage community

**Month 2+: Trade**
- Buy undervalued pairs
- Sell popular combinations
- Collect trading fees
- Earn passive income

---

## 6. Security & Compliance

### 6.1 Smart Contract Security

**Best Practices:**
- OpenZeppelin libraries
- Reentrancy guards
- Access control patterns
- Event logging

**Audit Status:**
- Code review: Complete
- Security patterns: Implemented
- Test coverage: 90%+
- Mainnet deployment: Verified

### 6.2 User Safety

**Disclaimer System:**
- Legal protection built-in
- User accepts responsibility
- No platform liability
- Clear terms of use

**Key Points:**
1. No official affiliation
2. User bears legal costs
3. Digital asset nature
4. Suspension rights reserved
5. Responsible use required
6. Gas fees paid by user

### 6.3 Data Privacy

**On-Chain Data:**
- Wallet addresses (public)
- Usernames (public)
- Stories (public)
- Trading history (public)

**Off-Chain Data:**
- Email: Not collected
- Personal info: Not stored
- IP addresses: Not logged
- Analytics: Anonymous only

---

## 7. Roadmap

### Phase 1: MVP (Current)
- ✅ Write stories
- ✅ Username verification
- ✅ Pair usernames
- ✅ Basic trading
- ✅ Smart contract deployed

### Phase 2: Enhancement (Q2 2026)
- [ ] Advanced trading features
- [ ] User profiles
- [ ] Story collections
- [ ] Social features
- [ ] Mobile responsive optimization

### Phase 3: Scale (Q3 2026)
- [ ] Leaderboards
- [ ] Referral system
- [ ] API access
- [ ] Developer tools
- [ ] Partnership integrations

### Phase 4: Ecosystem (Q4 2026)
- [ ] Governance token
- [ ] DAO formation
- [ ] Community grants
- [ ] Cross-chain expansion
- [ ] Mobile native apps

---

## 8. Market Analysis

### 8.1 Target Audience

**Primary:**
- Web3 enthusiasts
- Content creators
- NFT collectors
- Base ecosystem users

**Secondary:**
- Digital identity researchers
- Philosophy enthusiasts
- Traders and speculators
- Cross-platform users

### 8.2 Competitive Landscape

**Direct Competitors:**
- None (unique niche)

**Indirect Competitors:**
- Medium (storytelling)
- ENS (identity)
- NFT marketplaces (trading)
- Social networks (engagement)

**Differentiation:**
- Combines storytelling + trading
- Philosophy-focused
- Base-native
- Cross-platform identity

---

## 9. Token Economics (Future)

**Note:** No token currently. Future considerations:

**Potential $NAMES Token:**
```
Utility:
- Governance rights
- Platform fee discounts
- Premium features access
- Creator rewards

Distribution:
- Community: 40%
- Team: 20%
- Treasury: 20%
- Liquidity: 10%
- Advisors: 10%

Vesting:
- Team: 4 years, 1-year cliff
- Advisors: 2 years
- Community: Gradual unlock
```

---

## 10. Risk Factors

### 10.1 Technical Risks

**Smart Contract Bugs:**
- Mitigation: Audits, testing, gradual rollout
- Severity: High
- Probability: Low

**Blockchain Congestion:**
- Mitigation: L2 usage (Base)
- Severity: Medium
- Probability: Low

### 10.2 Market Risks

**Low Adoption:**
- Mitigation: Marketing, partnerships
- Severity: High
- Probability: Medium

**Regulatory Changes:**
- Mitigation: Legal compliance, adaptability
- Severity: Medium
- Probability: Low

### 10.3 Operational Risks

**Platform Sustainability:**
- Mitigation: Multiple revenue streams
- Severity: Medium
- Probability: Low

**Competition:**
- Mitigation: First-mover advantage, unique features
- Severity: Medium
- Probability: Medium

---

## 11. Team & Governance

### 11.1 Current Structure

**Builder:**
- Solo founder/developer
- Full-stack implementation
- Community-driven

**Future:**
- Expand core team
- Advisory board
- Community moderators
- DAO governance

### 11.2 Governance Model

**Current: Centralized**
- Builder makes decisions
- Community feedback valued
- Transparent development

**Future: Decentralized**
- Token-based voting
- Community proposals
- On-chain execution
- Treasury management

---

## 12. Conclusion

Names App represents a unique intersection of philosophy, identity, and economics in the Web3 space. By valuing username stories and enabling trading, we create a new paradigm for digital identity monetization.

### Key Takeaways:

1. **Philosophical Foundation:** 7×7×10 = 490 words limit
2. **Self-Pairing Mechanism:** Unique digital asset creation
3. **Base Ecosystem:** Native L2 advantages
4. **Economic Sustainability:** Multiple revenue streams
5. **User Empowerment:** Creators earn from their stories

### Vision

To become the definitive platform where username philosophy meets value, enabling millions to share their digital identity stories and trade them as meaningful assets.

---

## References

- Base Documentation: https://docs.base.org
- Farcaster Protocol: https://docs.farcaster.xyz
- Zora Network: https://docs.zora.co
- OnchainKit: https://onchainkit.xyz
- ERC721 Standard: https://eips.ethereum.org/EIPS/eip-721

---

## Appendix A: Technical Specifications

**Smart Contract:**
- Network: Base Mainnet (Chain ID: 8453)
- Contract Address: [Deployed Address]
- Language: Solidity 0.8.20
- Standard: ERC721 (NFT)

**Frontend:**
- Framework: Next.js 16
- Language: TypeScript
- Styling: Tailwind CSS 4
- Wallet: OnchainKit

**Database:**
- ORM: Prisma 7
- Database: PostgreSQL
- Hosting: Vercel

---

**For more information, visit: https://names-app-seven.vercel.app**

**Contact: Twitter @fortycrypto**

---

*Names App - Where Philosophy Meets Value* 🎭