# AnonymityTiers Contract - Fhenix FHE Implementation

A Fully Homomorphic Encryption (FHE) smart contract implementing three tiers of anonymity for secure data storage on the Fhenix blockchain.

## Overview

The AnonymityTiers contract provides a privacy-preserving solution for storing user data with three distinct levels of anonymity:

### 🔐 Tier 1: Anonymous

- **Data Stored**: World ID proof, nullifier hash, merkle root (all encrypted)
- **Privacy Level**: Complete anonymity - no linkable identity information
- **Use Case**: Basic verification without identity disclosure

### 👤 Tier 2: Pseudonymous

- **Data Stored**: Everything from Anonymous + user address (public) + signed message (encrypted)
- **Privacy Level**: Pseudonymous - address is public but other data remains encrypted
- **Use Case**: Reputation systems, pseudonymous participation

### 🆔 Tier 3: Identity

- **Data Stored**: Everything from Pseudonymous + name proof, age proof, nationality proof (all encrypted)
- **Privacy Level**: Full identity verification with encrypted proofs
- **Use Case**: KYC compliance, age verification, nationality verification

## Key Features

✅ **UUID-Based Retrieval**: Each record gets a unique UUID for data retrieval  
✅ **Progressive Upgrading**: Start with anonymous and upgrade to higher tiers  
✅ **Encrypted Storage**: All sensitive data stored using Fhenix FHE  
✅ **Access Control**: Proper permission management using FHE ACL  
✅ **Gas Optimization**: Reuses encrypted constants for efficiency  
✅ **Frontend Integration**: Complete cofhejs integration for encryption/decryption

## Contract Architecture

### Data Structures

```solidity
struct AnonymousData {
    euint256 proof;           // World ID proof (encrypted)
    euint256 nullifierHash;   // Nullifier hash (encrypted)
    euint256 merkleRoot;      // Merkle root (encrypted)
    ebool isValid;            // Validity flag (encrypted)
}

struct PseudonymousData {
    AnonymousData anonymous;   // All anonymous data
    address userAddress;       // Public address
    euint256 signedMessage;    // Signed message (encrypted)
    ebool addressVerified;     // Address verification status (encrypted)
}

struct IdentityData {
    PseudonymousData pseudonymous; // All pseudonymous data
    euint256 nameProof;            // Name verification proof (encrypted)
    euint32 ageProof;              // Age verification proof (encrypted)
    euint256 nationalityProof;     // Nationality verification proof (encrypted)
    ebool identityVerified;        // Identity verification status (encrypted)
}
```

### Core Functions

#### Creation Functions

- `createAnonymousRecord()` - Create new anonymous record
- `createPseudonymousRecord()` - Create new pseudonymous record
- `createIdentityRecord()` - Create new identity record

#### Retrieval Functions

- `getAnonymousRecord(uuid)` - Retrieve anonymous data
- `getPseudonymousRecord(uuid)` - Retrieve pseudonymous data
- `getIdentityRecord(uuid)` - Retrieve identity data

#### Upgrade Functions

- `upgradeToPseudonymous(uuid, signedMessage)` - Upgrade anonymous to pseudonymous
- `upgradeToIdentity(uuid, nameProof, ageProof, nationalityProof)` - Upgrade pseudonymous to identity

## Frontend Integration

### Installation

```bash
npm install cofhejs ethers
```

### Basic Usage

```javascript
const { AnonymityTiersClient } = require("./AnonymityTiersExample.js");
const { ethers } = require("ethers");

// Setup
const provider = new ethers.JsonRpcProvider("http://127.0.0.1:42069");
const wallet = new ethers.Wallet("YOUR_PRIVATE_KEY", provider);
const client = new AnonymityTiersClient("CONTRACT_ADDRESS", provider, wallet);

// Initialize
await client.initialize();

// Create anonymous record
const uuid = await client.createAnonymousRecord(
  "worldIdProof",
  "nullifierHash",
  "merkleRoot"
);

// Retrieve and decrypt data
const data = await client.getAnonymousRecord(uuid);
console.log(data); // { proof: BigInt, nullifierHash: BigInt, merkleRoot: BigInt, isValid: true }
```

### Encryption Process

The client automatically handles:

1. **Data Encryption**: Convert plaintext to encrypted FHE types
2. **Transaction Submission**: Send encrypted data to contract
3. **UUID Generation**: Receive unique identifier for data retrieval
4. **Data Decryption**: Unseal encrypted data using cofhejs

### Complete Workflow Example

```javascript
// 1. Create anonymous record
const anonymousUuid = await client.createAnonymousRecord(
  "proof",
  "nullifier",
  "merkle"
);

// 2. Upgrade to pseudonymous
await client.upgradeToPseudonymous(anonymousUuid, "signedMessage");

// 3. Upgrade to identity
await client.upgradeToIdentity(
  anonymousUuid,
  "nameProof",
  25,
  "nationalityProof"
);

// 4. Retrieve full identity data
const identityData = await client.getIdentityRecord(anonymousUuid);
```

## Security Features

### Access Control

- Only record owners can retrieve their data
- Proper FHE permissions using `FHE.allowThis()` and `FHE.allowSender()`
- Each encrypted value has controlled access

### Privacy Guarantees

- **Anonymous Tier**: No linkable identity information stored
- **Pseudonymous Tier**: Only address is public, all proofs encrypted
- **Identity Tier**: All identity proofs remain encrypted, only verifiable through FHE operations

### Best Practices Implemented

- ✅ Encrypted constants reused for gas efficiency
- ✅ No code branching on encrypted data
- ✅ Proper input type conversion (`InEuint256` → `euint256`)
- ✅ Comprehensive permission management
- ✅ Asynchronous decryption support

## Deployment

### Prerequisites

- Fhenix development environment
- `@fhenixprotocol/cofhe-contracts` installed
- Local Fhenix node running (for testing)

### Deploy Script Example

```javascript
const { ethers } = require("hardhat");

async function deploy() {
  const AnonymityTiers = await ethers.getContractFactory("AnonymityTiers");
  const contract = await AnonymityTiers.deploy();
  await contract.deployed();

  console.log("AnonymityTiers deployed to:", contract.address);
  return contract.address;
}
```

## Gas Optimization

The contract implements several gas optimization techniques:

1. **Encrypted Constants**: `ZERO` and `ONE` encrypted once in constructor
2. **Efficient Storage**: Hierarchical data structures prevent duplication
3. **Batch Operations**: Multiple values encrypted in single operations
4. **Clean Storage**: Old data deleted during upgrades

## Error Handling

The contract includes comprehensive error handling:

```solidity
require(recordTiers[uuid] == TierLevel.ANONYMOUS, "Record is not anonymous tier");
require(recordOwners[uuid] == msg.sender, "Unauthorized access");
```

Frontend client includes Result-pattern error handling following cofhejs best practices.

## Testing

Example test cases to implement:

```javascript
describe("AnonymityTiers", () => {
  it("should create anonymous record with encrypted data");
  it("should only allow owner to retrieve data");
  it("should upgrade tiers correctly");
  it("should handle permission management properly");
  it("should decrypt data correctly in frontend");
});
```

## Integration Examples

### World ID Integration

```javascript
// After World ID verification
const { proof, nullifier_hash, merkle_root } = worldIdResponse;
const uuid = await client.createAnonymousRecord(
  proof,
  nullifier_hash,
  merkle_root
);
```

### Address Verification

```javascript
// For pseudonymous tier
const signedMessage = await wallet.signMessage("Address verification");
await client.upgradeToPseudonymous(uuid, signedMessage);
```

### KYC Integration

```javascript
// For identity tier with KYC proofs
await client.upgradeToIdentity(
  uuid,
  kycNameProof,
  userAge,
  kycNationalityProof
);
```

## Troubleshooting

### Common Issues

1. **Encryption Errors**: Ensure cofhejs is properly initialized
2. **Permission Errors**: Check FHE access control setup
3. **Network Issues**: Verify Fhenix node connectivity
4. **Gas Issues**: Use proper gas estimation for FHE operations

### Debug Tips

- Use the provided logging in the client
- Check encryption state callbacks
- Verify permit creation for decryption
- Monitor transaction receipts for events

## Contributing

1. Follow Fhenix FHE best practices
2. Maintain proper access control
3. Add comprehensive tests
4. Update documentation for new features

## License

MIT License - See LICENSE file for details

---

**Note**: This contract is designed for the Fhenix blockchain with FHE capabilities. Ensure you're using a compatible development environment and have the necessary FHE dependencies installed.
