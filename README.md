# YieldCore

A decentralized finance (DeFi) platform built on blockchain, enabling users to lend, borrow, stake, and earn yield through transparent, secure, and community-driven financial services — all powered by Clarity smart contracts.

---

## Overview

YieldCore is a DeFi ecosystem comprising ten core smart contracts that work together to create a secure, transparent, and user-centric financial platform:

1. **Core Token Contract** – Issues and manages platform-native tokens for staking and rewards.
2. **Lending Pool Contract** – Facilitates peer-to-peer lending and borrowing with dynamic interest rates.
3. **Yield Farming Contract** – Enables users to stake tokens and earn yield from liquidity pools.
4. **Governance DAO Contract** – Allows token holders to vote on protocol upgrades and parameters.
5. **Stablecoin Swap Contract** – Supports decentralized trading of stablecoin pairs.
6. **Collateral Management Contract** – Manages collateral for loans and ensures over-collateralization.
7. **Reward Distribution Contract** – Automates distribution of staking and farming rewards.
8. **Price Oracle Contract** – Integrates real-time price feeds for accurate asset valuation.
9. **Treasury Contract** – Manages platform fees and fund allocation transparently.
10. **Flash Loan Contract** – Provides uncollateralized loans for arbitrage and liquidations.

---

## Features

- **Native core tokens** for staking, governance, and rewards
- **Peer-to-peer lending and borrowing** with dynamic interest rates
- **Yield farming** with multiple liquidity pools
- **Decentralized governance** for community-driven protocol decisions
- **Stablecoin swaps** for low-slippage trading
- **Secure collateral management** with automated liquidation
- **Automated reward distribution** for stakers and farmers
- **Real-time price feeds** via trusted oracles
- **Transparent treasury management** for protocol sustainability
- **Flash loans** for advanced DeFi strategies

---

## Smart Contracts

### Core Token Contract

- Mint, burn, and transfer platform-native tokens
- Staking mechanisms for governance and reward eligibility
- Token supply governance and inflation control

### Lending Pool Contract

- Deposit and withdraw assets for lending/borrowing
- Dynamic interest rate calculations based on pool utilization
- Liquidation triggers for under-collateralized loans

### Yield Farming Contract

- Stake tokens in liquidity pools to earn yield
- Support for multiple asset pairs (e.g., BTC/STX, USDC/STX)
- Automated reward calculation and distribution

### Governance DAO Contract

- Token-weighted voting for protocol upgrades
- Proposal creation, voting, and execution
- Configurable quorum and voting periods

### Stablecoin Swap Contract

- Low-slippage trading for stablecoin pairs
- Automated market maker (AMM) logic
- Fee collection for liquidity providers

### Collateral Management Contract

- Lock and release collateral for loans
- Over-collateralization enforcement
- Automated liquidation via oracle price feeds

### Reward Distribution Contract

- Distribute farming and staking rewards in core tokens
- Track user contributions and reward eligibility
- Anti-manipulation mechanisms for fair distribution

### Price Oracle Contract

- Fetch real-time asset prices from trusted data providers
- Secure integration with external APIs
- Price update triggers for loans and liquidations

### Treasury Contract

- Collect platform fees (e.g., lending and swap fees)
- Allocate funds for development, marketing, and community rewards
- Transparent transaction logging

### Flash Loan Contract

- Issue uncollateralized loans for short-term use
- Enforce repayment within a single transaction
- Support arbitrage and liquidation strategies

---

## Installation

1. Install [Clarinet CLI](https://docs.hiro.so/clarinet/getting-started) for Clarity development.
2. Clone this repository:
   ```bash
   git clone https://github.com/yourusername/yieldcore.git
   ```
3. Run tests:
   ```bash
   npm test
   ```
4. Deploy contracts:
   ```bash
   clarinet deploy
   ```

## Usage

Each smart contract operates independently but integrates with others for a complete DeFi experience. Refer to individual contract documentation for function calls, parameters, and usage examples.

## License

MIT License
