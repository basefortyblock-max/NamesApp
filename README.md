# Names App - Philosophy Behind Your Username

**Share, earn, and trade username philosophies on Base**

---

## 🎯 What is Names?

Names is a decentralized application on Base L2 where **usernames become valuable digital assets**. Share the philosophical story behind your username, receive USDC appreciation, pair usernames into tradeable NFTs, and trade them on-chain.

### Core Features

✨ **Write** — Publish the philosophy behind your username (max 490 words)  
💰 **Earn** — Receive USDC appreciation from readers (gasless for them!)  
🔗 **Pair** — Combine usernames into unique NFT assets  
📈 **Trade** — Buy and sell paired username NFTs

---

## 🚀 Quick Start

### For Users

1. **Visit**: https://names-app-seven.vercel.app
2. **Connect Wallet**: MetaMask, Coinbase Wallet, or WalletConnect
3. **Write**: Share your username philosophy
4. **Earn**: Receive appreciation from readers

### For Developers

```bash
# Clone repository
git clone https://github.com/basefortyblock-max/NamesApp.git
cd NamesApp

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local
# Edit .env.local with your credentials

# Set up database
npx prisma generate
npx prisma db push

# Run development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## 📝 How It Works

### 1. Write Your Philosophy

```
Connect Wallet → Enter Username → Sign Message → Write Story (490 words max) → Publish
```

- **One wallet, unlimited usernames**: Publish stories for multiple usernames
- **Wallet verification**: Simple signature verification (no platform-specific OAuth)
- **Permanent publication**: Stories cannot be deleted once published
- **Base price**: All stories start at 0.7 USDC

### 2. Receive Appreciation

```
Reader discovers story → Sends USDC (min 0.7) → No gas fees (Paymaster) → You earn!
```

- **Gasless for readers**: Coinbase CDP Paymaster sponsors transactions
- **Direct payments**: USDC goes straight to your wallet
- **Price appreciation**: Story value increases by 5% of each appreciation
- **No platform fee**: 100% of appreciation goes to you

### 3. Pair Usernames

```
Select 2 usernames → Review disclaimer → Mint NFT → Choose: Write Story OR Trade
```

**Self-Pairing**: Combine 2 of your own usernames  
**Cross-Pairing**: Pair with another user's username (consent required)

- **You pay gas**: Smart contract minting requires gas fees
- **Enable/Disable**: Toggle whether others can pair with your username
- **Disclaimer**: Important legal notice before minting
- **NFT Format**: username1×username2 (e.g., "SatoshiDreamer×CryptoPoet")

### 4. Trade NFTs

```
List NFT → Set Price → Buyer purchases → 1% fee to treasury → Profit!
```

- **Base price**: 0.7 USDC minimum
- **Price discovery**: Free market determines value
- **Trading pairs**: USERNAME/USDC format
---

## 🏗️ Architecture

### Tech Stack

- **Frontend**: Next.js 16, React 19, TypeScript, Tailwind CSS
- **Wallet**: RainbowKit (Coinbase), wagmi v2, viem
- **Blockchain**: Base L2 (Ethereum)
- **Smart Contracts**: Solidity, ERC-721 (NFT)
- **Database**: PostgreSQL, Prisma ORM
- **Gasless**: Coinbase CDP Paymaster
- **Deployment**: Vercel (frontend), Base (contracts)

### Smart Contracts

**UsernameNFT** (ERC-721):
- Mint paired username NFTs
- Transfer ownership
- Query metadata

**Trading**:
- List NFTs for sale
- Execute trades

**Deployed Contracts**:
- Mainnet: 0xD3F182486C011463446452Bc32d30B965921C521

---

## 💰 Economic Model

### Revenue for Creators

| Action | Revenue | Fee |
|--------|---------|-----|
| Story Appreciation | 100% to creator | 0% |
| NFT Minting | 99% to creator | 1% to treasury |
| NFT Trading | 99% to seller | 1% to treasury |

### Gasless Transactions

- **Send Appreciation**: ✅ Gasless (sponsored by Paymaster)
- **Publish Story**: ✅ Gasless (on-chain storage minimal)
- **Mint NFT**: ❌ User pays gas (smart contract interaction)
- **Trade NFT**: ❌ User pays gas (smart contract interaction)

---

## 🛡️ Security

### Smart Contract Security
- OpenZeppelin libraries (battle-tested)
- Reentrancy guards
- Access control
- Pausable contracts
- Audit planned before mainnet launch

### User Protection
- **Disclaimer before minting**: Users acknowledge risks
- **Consent mechanism**: Cross-pairing requires opt-in
- **No private keys stored**: Self-custody wallets only
- **Transaction previews**: Clear warnings before signing

### Legal Disclaimers

> ⚠️ **Important**: Paired usernames are for entertainment and trading purposes. Not affiliated with any platform. Users are responsible for ensuring they don't infringe trademarks or copyrights.

---

## 📖 Documentation

- **Whitepaper**: [WHITEPAPER.md](./WHITEPAPER.md)

---

## 🗺️ Roadmap

### ✅ Phase 1: MVP (Current)
- Write and publish username stories
- Send USDC appreciation (gasless)
- Pair usernames (self + cross)
- Mini trading terminal

### 🔄 Phase 2: Growth (Q2 2026)
- Enhanced trading features
- User profiles and reputation
- Leaderboards
- Mobile-responsive improvements
- Smart contract audit

### 📅 Phase 3: Community (Q3 2026)
- Community governance (DAO)
- Report and moderation system
- Collections and curation
- Referral rewards
- Analytics dashboard

### 🎯 Phase 4: Expansion (Q4 2026)
- Cross-chain support
- API for third-party integrations
- Username verification badges
- Social features
- Mobile app (iOS, Android)

---

## 🤝 Contributing

We welcome contributions! Please:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 📄 License

MIT License - see [LICENSE](./LICENSE) file for details

---

## 🙏 Acknowledgments

Built on:
- [Base](https://base.org) by Coinbase
- [OnchainKit](https://onchainkit.xyz)
- [OpenZeppelin](https://openzeppelin.com)
- [Next.js](https://nextjs.org) by Vercel
- [Prisma](https://prisma.io)

Special thanks to the Base community for support and feedback.

---

## 📞 Support

- **Website**: https://names-app-seven.vercel.app
- **GitHub Issues**: [Report a bug](https://github.com/basefortyblock-max/NamesApp/issues)
- **Twitter**: [@fortycrypto](https://twitter.com/fortycrypto)
- **Discord**: Coming soon

---

**Start sharing your username philosophy today! 🎭**

Connect → Verify → Write → Earn → Trade
