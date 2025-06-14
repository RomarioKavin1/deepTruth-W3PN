// SPDX-License-Identifier: MIT
pragma solidity ^0.8.25;

contract AnonymityTiersMock {
    // Tier levels
    enum TierLevel { ANONYMOUS, PSEUDONYMOUS, IDENTITY }
    
    // Simplified structures without FHE
    struct WorldIdProof {
        uint256 proof;              // World ID proof string
        uint256 nullifierHash;      // Nullifier hash
        uint256 merkleRoot;         // Merkle root
        uint256 verificationType;   // verification_level: "orb"/"device"
        uint256 credentialType;     // credential_type: "orb"/"device"
        bool isValid;               // Validity flag
    }
    
    struct SelfProof {
        uint256 userId;             // Self user ID
        uint256 nullifier;          // Self nullifier
        uint256 nameHash;           // Hash of verified name
        uint256 nationalityHash;    // Hash of verified nationality
        uint32 age;                 // Verified age
        bool isValid;               // Validity flag
    }
    
    // Data structures for each tier
    struct AnonymousData {
        WorldIdProof worldId;        // World ID verification proof
        bool isActive;               // Record active status
        uint32 createdAt;            // Creation timestamp
    }
    
    struct PseudonymousData {
        AnonymousData anonymousData;     // All anonymous data
        address userAddress;         // Public address
        uint256 signedMessage;       // Address verification message
        bool addressVerified;        // Address verification status
        uint32 upgradedAt;           // Upgrade timestamp
    }
    
    struct IdentityData {
        PseudonymousData pseudonymousData; // All pseudonymous data
        SelfProof selfVerification;   // Self passport verification
        bool identityVerified;        // Full identity verification status
        uint32 verifiedAt;            // Verification timestamp
    }
    
    // Storage mappings
    mapping(uint256 => AnonymousData) private anonymousRecords;
    mapping(uint256 => PseudonymousData) private pseudonymousRecords;
    mapping(uint256 => IdentityData) private identityRecords;
    mapping(uint256 => TierLevel) public recordTiers;
    mapping(uint256 => address) public recordOwners;
    
    // Nullifier tracking to prevent reuse
    mapping(uint256 => bool) private usedWorldIdNullifiers;
    mapping(uint256 => bool) private usedSelfNullifiers;
    
    // UUID counter for generating unique IDs
    uint256 private uuidCounter;
    
    // Events
    event RecordCreated(uint256 indexed uuid, TierLevel tier, address indexed owner);
    event RecordUpdated(uint256 indexed uuid, TierLevel tier);
    event NullifierUsed(uint256 indexed nullifierHash, string proofType);
    
    constructor() {
        uuidCounter = 1;
    }
    
    // ==================== ANONYMOUS TIER ====================
    
    function createAnonymousRecord(
        uint256 _proof,
        uint256 _nullifierHash,
        uint256 _merkleRoot,
        uint256 _verificationType,
        uint256 _credentialType
    ) external returns (uint256 uuid) {
        uuid = _generateUUID();
        
        // Store the data (simplified without FHE)
        anonymousRecords[uuid] = AnonymousData({
            worldId: WorldIdProof({
                proof: _proof,
                nullifierHash: _nullifierHash,
                merkleRoot: _merkleRoot,
                verificationType: _verificationType,
                credentialType: _credentialType,
                isValid: true
            }),
            isActive: true,
            createdAt: uint32(block.timestamp)
        });
        
        // Record metadata
        recordTiers[uuid] = TierLevel.ANONYMOUS;
        recordOwners[uuid] = msg.sender;
        
        emit RecordCreated(uuid, TierLevel.ANONYMOUS, msg.sender);
        return uuid;
    }
    
    function getAnonymousRecord(uint256 uuid) external view returns (
        uint256 proof,
        uint256 nullifierHash,
        uint256 merkleRoot,
        uint256 verificationType,
        uint256 credentialType,
        bool isValid,
        bool isActive,
        uint32 createdAt
    ) {
        require(recordTiers[uuid] == TierLevel.ANONYMOUS, "Record is not anonymous tier");
        require(recordOwners[uuid] == msg.sender, "Unauthorized access");
        
        AnonymousData storage data = anonymousRecords[uuid];
        return (
            data.worldId.proof,
            data.worldId.nullifierHash,
            data.worldId.merkleRoot,
            data.worldId.verificationType,
            data.worldId.credentialType,
            data.worldId.isValid,
            data.isActive,
            data.createdAt
        );
    }
    
    // ==================== PSEUDONYMOUS TIER ====================
    
    function createPseudonymousRecord(
        uint256 _proof,
        uint256 _nullifierHash,
        uint256 _merkleRoot,
        uint256 _verificationType,
        uint256 _credentialType,
        uint256 _signedMessage
    ) external returns (uint256 uuid) {
        uuid = _generateUUID();
        
        // Store the data
        pseudonymousRecords[uuid] = PseudonymousData({
            anonymousData: AnonymousData({
                worldId: WorldIdProof({
                    proof: _proof,
                    nullifierHash: _nullifierHash,
                    merkleRoot: _merkleRoot,
                    verificationType: _verificationType,
                    credentialType: _credentialType,
                    isValid: true
                }),
                isActive: true,
                createdAt: uint32(block.timestamp)
            }),
            userAddress: msg.sender,
            signedMessage: _signedMessage,
            addressVerified: true,
            upgradedAt: uint32(block.timestamp)
        });
        
        // Record metadata
        recordTiers[uuid] = TierLevel.PSEUDONYMOUS;
        recordOwners[uuid] = msg.sender;
        
        emit RecordCreated(uuid, TierLevel.PSEUDONYMOUS, msg.sender);
        return uuid;
    }
    
    // ==================== IDENTITY TIER ====================
    
    function createIdentityRecord(
        uint256 _proof,
        uint256 _nullifierHash,
        uint256 _merkleRoot,
        uint256 _verificationType,
        uint256 _credentialType,
        uint256 _signedMessage,
        uint256 _selfUserId,
        uint256 _selfNullifier,
        uint256 _nameHash,
        uint256 _nationalityHash,
        uint32 _age
    ) external returns (uint256 uuid) {
        uuid = _generateUUID();
        
        // Store the data
        identityRecords[uuid] = IdentityData({
            pseudonymousData: PseudonymousData({
                anonymousData: AnonymousData({
                    worldId: WorldIdProof({
                        proof: _proof,
                        nullifierHash: _nullifierHash,
                        merkleRoot: _merkleRoot,
                        verificationType: _verificationType,
                        credentialType: _credentialType,
                        isValid: true
                    }),
                    isActive: true,
                    createdAt: uint32(block.timestamp)
                }),
                userAddress: msg.sender,
                signedMessage: _signedMessage,
                addressVerified: true,
                upgradedAt: uint32(block.timestamp)
            }),
            selfVerification: SelfProof({
                userId: _selfUserId,
                nullifier: _selfNullifier,
                nameHash: _nameHash,
                nationalityHash: _nationalityHash,
                age: _age,
                isValid: true
            }),
            identityVerified: true,
            verifiedAt: uint32(block.timestamp)
        });
        
        // Record metadata
        recordTiers[uuid] = TierLevel.IDENTITY;
        recordOwners[uuid] = msg.sender;
        
        emit RecordCreated(uuid, TierLevel.IDENTITY, msg.sender);
        return uuid;
    }
    
    // ==================== UTILITY FUNCTIONS ====================
    
    function _generateUUID() private returns (uint256) {
        return uuidCounter++;
    }
    
    function getTotalRecords() external view returns (uint256) {
        return uuidCounter - 1;
    }
    
    function getRecordInfo(uint256 uuid) external view returns (TierLevel tier, address owner) {
        require(uuid > 0 && uuid < uuidCounter, "Record does not exist");
        return (recordTiers[uuid], recordOwners[uuid]);
    }
    
    // Progress through tiers
    function upgradeToIdentity(
        uint256 uuid,
        uint256 _selfUserId,
        uint256 _selfNullifier,
        uint256 _nameHash,
        uint256 _nationalityHash,
        uint32 _age
    ) external {
        require(recordOwners[uuid] == msg.sender, "Unauthorized");
        require(recordTiers[uuid] == TierLevel.PSEUDONYMOUS, "Can only upgrade from pseudonymous");
        
        PseudonymousData storage pseudo = pseudonymousRecords[uuid];
        
        identityRecords[uuid] = IdentityData({
            pseudonymousData: pseudo,
            selfVerification: SelfProof({
                userId: _selfUserId,
                nullifier: _selfNullifier,
                nameHash: _nameHash,
                nationalityHash: _nationalityHash,
                age: _age,
                isValid: true
            }),
            identityVerified: true,
            verifiedAt: uint32(block.timestamp)
        });
        
        recordTiers[uuid] = TierLevel.IDENTITY;
        emit RecordUpdated(uuid, TierLevel.IDENTITY);
    }
} 