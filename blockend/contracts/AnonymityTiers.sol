// SPDX-License-Identifier: MIT
pragma solidity ^0.8.25;

import "@fhenixprotocol/cofhe-contracts/FHE.sol";

contract AnonymityTiers {
    // Encrypted constants for efficiency (gas saver)
    euint32 private ZERO;
    euint32 private ONE;
    
    // Tier levels
    enum TierLevel { ANONYMOUS, PSEUDONYMOUS, IDENTITY }
    
    // World ID proof structure (matches frontend test-verify page)
    struct WorldIdProof {
        euint256 proof;              // World ID proof string (encrypted)
        euint256 nullifierHash;      // Nullifier hash (encrypted)
        euint256 merkleRoot;         // Merkle root (encrypted)
        euint256 verificationType;   // verification_level: "orb"/"device" (encrypted)
        euint256 credentialType;     // credential_type: "orb"/"device" (encrypted)
        ebool isValid;               // Validity flag (encrypted)
    }
    
    // Self proof structure (matches frontend self-verify API response)
    struct SelfProof {
        euint256 userId;             // Self user ID (encrypted)
        euint256 nullifier;          // Self nullifier (encrypted)
        euint256 nameHash;           // Hash of verified name (encrypted)
        euint256 nationalityHash;    // Hash of verified nationality (encrypted)
        euint32 age;                 // Verified age (encrypted)
        ebool isValid;               // Validity flag (encrypted)
    }
    
    // Encrypted data structures for each tier
    struct AnonymousData {
        WorldIdProof worldId;        // World ID verification proof
        ebool isActive;              // Record active status (encrypted)
        euint32 createdAt;           // Creation timestamp (encrypted)
    }
    
    struct PseudonymousData {
        AnonymousData anonymousData;     // All anonymous data
        address userAddress;         // Public address (only public field)
        euint256 signedMessage;      // Address verification message (encrypted)
        ebool addressVerified;       // Address verification status (encrypted)
        euint32 upgradedAt;          // Upgrade timestamp (encrypted)
    }
    
    struct IdentityData {
        PseudonymousData pseudonymousData; // All pseudonymous data
        SelfProof selfVerification;   // Self passport verification
        ebool identityVerified;       // Full identity verification status (encrypted)
        euint32 verifiedAt;           // Verification timestamp (encrypted)
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
        // Initialize encrypted constants for gas efficiency
        ZERO = FHE.asEuint32(0);
        ONE = FHE.asEuint32(1);
        
        // Allow contract to access these constants
        FHE.allowThis(ZERO);
        FHE.allowThis(ONE);
        
        uuidCounter = 1;
    }
    
    // ==================== ANONYMOUS TIER ====================
    
    function createAnonymousRecord(
        InEuint256 memory _proof,
        InEuint256 memory _nullifierHash,
        InEuint256 memory _merkleRoot,
        InEuint256 memory _verificationType,
        InEuint256 memory _credentialType
    ) external returns (uint256 uuid) {
        uuid = _generateUUID();
        
        // Convert inputs to encrypted types
        euint256 proof = FHE.asEuint256(_proof);
        euint256 nullifierHash = FHE.asEuint256(_nullifierHash);
        euint256 merkleRoot = FHE.asEuint256(_merkleRoot);
        euint256 verificationType = FHE.asEuint256(_verificationType);
        euint256 credentialType = FHE.asEuint256(_credentialType);
        ebool isValid = FHE.asEbool(true);
        ebool isActive = FHE.asEbool(true);
        euint32 createdAt = FHE.asEuint32(uint32(block.timestamp));
        
        // Store the data
        anonymousRecords[uuid] = AnonymousData({
            worldId: WorldIdProof({
                proof: proof,
                nullifierHash: nullifierHash,
                merkleRoot: merkleRoot,
                verificationType: verificationType,
                credentialType: credentialType,
                isValid: isValid
            }),
            isActive: isActive,
            createdAt: createdAt
        });
        
        // Set access permissions
        _setAnonymousPermissions(uuid);
        
        // Record metadata
        recordTiers[uuid] = TierLevel.ANONYMOUS;
        recordOwners[uuid] = msg.sender;
        
        emit RecordCreated(uuid, TierLevel.ANONYMOUS, msg.sender);
        return uuid;
    }
    
    function getAnonymousRecord(uint256 uuid) external view returns (
        euint256 proof,
        euint256 nullifierHash,
        euint256 merkleRoot,
        euint256 verificationType,
        euint256 credentialType,
        ebool isValid,
        ebool isActive,
        euint32 createdAt
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
        InEuint256 memory _proof,
        InEuint256 memory _nullifierHash,
        InEuint256 memory _merkleRoot,
        InEuint256 memory _verificationType,
        InEuint256 memory _credentialType,
        InEuint256 memory _signedMessage
    ) external returns (uint256 uuid) {
        uuid = _generateUUID();
        
        // Convert inputs to encrypted types
        euint256 proof = FHE.asEuint256(_proof);
        euint256 nullifierHash = FHE.asEuint256(_nullifierHash);
        euint256 merkleRoot = FHE.asEuint256(_merkleRoot);
        euint256 verificationType = FHE.asEuint256(_verificationType);
        euint256 credentialType = FHE.asEuint256(_credentialType);
        euint256 signedMessage = FHE.asEuint256(_signedMessage);
        ebool isValid = FHE.asEbool(true);
        ebool isActive = FHE.asEbool(true);
        ebool addressVerified = FHE.asEbool(true);
        euint32 createdAt = FHE.asEuint32(uint32(block.timestamp));
        euint32 upgradedAt = FHE.asEuint32(uint32(block.timestamp));
        
        // Store the data
        pseudonymousRecords[uuid] = PseudonymousData({
            anonymousData: AnonymousData({
                worldId: WorldIdProof({
                    proof: proof,
                    nullifierHash: nullifierHash,
                    merkleRoot: merkleRoot,
                    verificationType: verificationType,
                    credentialType: credentialType,
                    isValid: isValid
                }),
                isActive: isActive,
                createdAt: createdAt
            }),
            userAddress: msg.sender,
            signedMessage: signedMessage,
            addressVerified: addressVerified,
            upgradedAt: upgradedAt
        });
        
        // Set access permissions
        _setPseudonymousPermissions(uuid);
        
        // Record metadata
        recordTiers[uuid] = TierLevel.PSEUDONYMOUS;
        recordOwners[uuid] = msg.sender;
        
        emit RecordCreated(uuid, TierLevel.PSEUDONYMOUS, msg.sender);
        return uuid;
    }
    
    function getPseudonymousRecord(uint256 uuid) external view returns (
        euint256 proof,
        euint256 nullifierHash,
        euint256 merkleRoot,
        euint256 verificationType,
        euint256 credentialType,
        ebool worldIdValid,
        address userAddress,
        euint256 signedMessage,
        ebool addressVerified,
        euint32 createdAt,
        euint32 upgradedAt
    ) {
        require(recordTiers[uuid] == TierLevel.PSEUDONYMOUS, "Record is not pseudonymous tier");
        require(recordOwners[uuid] == msg.sender, "Unauthorized access");
        
        PseudonymousData storage data = pseudonymousRecords[uuid];
        return (
            data.anonymousData.worldId.proof,
            data.anonymousData.worldId.nullifierHash,
            data.anonymousData.worldId.merkleRoot,
            data.anonymousData.worldId.verificationType,
            data.anonymousData.worldId.credentialType,
            data.anonymousData.worldId.isValid,
            data.userAddress,
            data.signedMessage,
            data.addressVerified,
            data.anonymousData.createdAt,
            data.upgradedAt
        );
    }
    
    // ==================== IDENTITY TIER ====================
    
    function createIdentityRecord(
        InEuint256 memory _proof,
        InEuint256 memory _nullifierHash,
        InEuint256 memory _merkleRoot,
        InEuint256 memory _verificationType,
        InEuint256 memory _credentialType,
        InEuint256 memory _signedMessage,
        InEuint256 memory _selfUserId,
        InEuint256 memory _selfNullifier,
        InEuint256 memory _nameHash,
        InEuint256 memory _nationalityHash,
        InEuint32 memory _age
    ) external returns (uint256 uuid) {
        uuid = _generateUUID();
        
        // Convert inputs to encrypted types
        euint256 proof = FHE.asEuint256(_proof);
        euint256 nullifierHash = FHE.asEuint256(_nullifierHash);
        euint256 merkleRoot = FHE.asEuint256(_merkleRoot);
        euint256 verificationType = FHE.asEuint256(_verificationType);
        euint256 credentialType = FHE.asEuint256(_credentialType);
        euint256 signedMessage = FHE.asEuint256(_signedMessage);
        euint256 selfUserId = FHE.asEuint256(_selfUserId);
        euint256 selfNullifier = FHE.asEuint256(_selfNullifier);
        euint256 nameHash = FHE.asEuint256(_nameHash);
        euint256 nationalityHash = FHE.asEuint256(_nationalityHash);
        euint32 age = FHE.asEuint32(_age);
        
        ebool isValid = FHE.asEbool(true);
        ebool isActive = FHE.asEbool(true);
        ebool addressVerified = FHE.asEbool(true);
        ebool identityVerified = FHE.asEbool(true);
        ebool selfValid = FHE.asEbool(true);
        euint32 createdAt = FHE.asEuint32(uint32(block.timestamp));
        euint32 upgradedAt = FHE.asEuint32(uint32(block.timestamp));
        euint32 verifiedAt = FHE.asEuint32(uint32(block.timestamp));
        
        // Store the data
        identityRecords[uuid] = IdentityData({
            pseudonymousData: PseudonymousData({
                anonymousData: AnonymousData({
                    worldId: WorldIdProof({
                        proof: proof,
                        nullifierHash: nullifierHash,
                        merkleRoot: merkleRoot,
                        verificationType: verificationType,
                        credentialType: credentialType,
                        isValid: isValid
                    }),
                    isActive: isActive,
                    createdAt: createdAt
                }),
                userAddress: msg.sender,
                signedMessage: signedMessage,
                addressVerified: addressVerified,
                upgradedAt: upgradedAt
            }),
            selfVerification: SelfProof({
                userId: selfUserId,
                nullifier: selfNullifier,
                nameHash: nameHash,
                nationalityHash: nationalityHash,
                age: age,
                isValid: selfValid
            }),
            identityVerified: identityVerified,
            verifiedAt: verifiedAt
        });
        
        // Set access permissions
        _setIdentityPermissions(uuid);
        
        // Record metadata
        recordTiers[uuid] = TierLevel.IDENTITY;
        recordOwners[uuid] = msg.sender;
        
        emit RecordCreated(uuid, TierLevel.IDENTITY, msg.sender);
        return uuid;
    }
    
    function getIdentityRecord(uint256 uuid) external view returns (
        euint256 worldIdProof,
        euint256 worldIdNullifier,
        euint256 merkleRoot,
        euint256 verificationType,
        euint256 credentialType,
        ebool worldIdValid,
        address userAddress,
        euint256 signedMessage,
        ebool addressVerified,
        euint256 selfUserId,
        euint256 selfNullifier,
        euint256 nameHash,
        euint256 nationalityHash,
        euint32 age,
        ebool selfValid,
        ebool identityVerified,
        euint32 verifiedAt
    ) {
        require(recordTiers[uuid] == TierLevel.IDENTITY, "Record is not identity tier");
        require(recordOwners[uuid] == msg.sender, "Unauthorized access");
        
        IdentityData storage data = identityRecords[uuid];
        return (
            data.pseudonymousData.anonymousData.worldId.proof,
            data.pseudonymousData.anonymousData.worldId.nullifierHash,
            data.pseudonymousData.anonymousData.worldId.merkleRoot,
            data.pseudonymousData.anonymousData.worldId.verificationType,
            data.pseudonymousData.anonymousData.worldId.credentialType,
            data.pseudonymousData.anonymousData.worldId.isValid,
            data.pseudonymousData.userAddress,
            data.pseudonymousData.signedMessage,
            data.pseudonymousData.addressVerified,
            data.selfVerification.userId,
            data.selfVerification.nullifier,
            data.selfVerification.nameHash,
            data.selfVerification.nationalityHash,
            data.selfVerification.age,
            data.selfVerification.isValid,
            data.identityVerified,
            data.verifiedAt
        );
    }
    
    // ==================== UTILITY FUNCTIONS ====================
    
    function _generateUUID() private returns (uint256) {
        uint256 uuid = uuidCounter;
        uuidCounter++;
        return uuid;
    }
    
    function _setAnonymousPermissions(uint256 uuid) private {
        AnonymousData storage data = anonymousRecords[uuid];
        
        // World ID proof permissions
        FHE.allowThis(data.worldId.proof);
        FHE.allowThis(data.worldId.nullifierHash);
        FHE.allowThis(data.worldId.merkleRoot);
        FHE.allowThis(data.worldId.verificationType);
        FHE.allowThis(data.worldId.credentialType);
        FHE.allowThis(data.worldId.isValid);
        FHE.allowSender(data.worldId.proof);
        FHE.allowSender(data.worldId.nullifierHash);
        FHE.allowSender(data.worldId.merkleRoot);
        FHE.allowSender(data.worldId.verificationType);
        FHE.allowSender(data.worldId.credentialType);
        FHE.allowSender(data.worldId.isValid);
        
        // Record metadata permissions
        FHE.allowThis(data.isActive);
        FHE.allowThis(data.createdAt);
        FHE.allowSender(data.isActive);
        FHE.allowSender(data.createdAt);
    }
    
    function _setPseudonymousPermissions(uint256 uuid) private {
        PseudonymousData storage data = pseudonymousRecords[uuid];
        
        // Anonymous data permissions
        FHE.allowThis(data.anonymousData.worldId.proof);
        FHE.allowThis(data.anonymousData.worldId.nullifierHash);
        FHE.allowThis(data.anonymousData.worldId.merkleRoot);
        FHE.allowThis(data.anonymousData.worldId.verificationType);
        FHE.allowThis(data.anonymousData.worldId.credentialType);
        FHE.allowThis(data.anonymousData.worldId.isValid);
        FHE.allowThis(data.anonymousData.isActive);
        FHE.allowThis(data.anonymousData.createdAt);
        FHE.allowSender(data.anonymousData.worldId.proof);
        FHE.allowSender(data.anonymousData.worldId.nullifierHash);
        FHE.allowSender(data.anonymousData.worldId.merkleRoot);
        FHE.allowSender(data.anonymousData.worldId.verificationType);
        FHE.allowSender(data.anonymousData.worldId.credentialType);
        FHE.allowSender(data.anonymousData.worldId.isValid);
        FHE.allowSender(data.anonymousData.isActive);
        FHE.allowSender(data.anonymousData.createdAt);
        
        // Pseudonymous data permissions
        FHE.allowThis(data.signedMessage);
        FHE.allowThis(data.addressVerified);
        FHE.allowThis(data.upgradedAt);
        FHE.allowSender(data.signedMessage);
        FHE.allowSender(data.addressVerified);
        FHE.allowSender(data.upgradedAt);
    }
    
    function _setIdentityPermissions(uint256 uuid) private {
        IdentityData storage data = identityRecords[uuid];
        
        // Anonymous data permissions
        FHE.allowThis(data.pseudonymousData.anonymousData.worldId.proof);
        FHE.allowThis(data.pseudonymousData.anonymousData.worldId.nullifierHash);
        FHE.allowThis(data.pseudonymousData.anonymousData.worldId.merkleRoot);
        FHE.allowThis(data.pseudonymousData.anonymousData.worldId.verificationType);
        FHE.allowThis(data.pseudonymousData.anonymousData.worldId.credentialType);
        FHE.allowThis(data.pseudonymousData.anonymousData.worldId.isValid);
        FHE.allowThis(data.pseudonymousData.anonymousData.isActive);
        FHE.allowThis(data.pseudonymousData.anonymousData.createdAt);
        FHE.allowSender(data.pseudonymousData.anonymousData.worldId.proof);
        FHE.allowSender(data.pseudonymousData.anonymousData.worldId.nullifierHash);
        FHE.allowSender(data.pseudonymousData.anonymousData.worldId.merkleRoot);
        FHE.allowSender(data.pseudonymousData.anonymousData.worldId.verificationType);
        FHE.allowSender(data.pseudonymousData.anonymousData.worldId.credentialType);
        FHE.allowSender(data.pseudonymousData.anonymousData.worldId.isValid);
        FHE.allowSender(data.pseudonymousData.anonymousData.isActive);
        FHE.allowSender(data.pseudonymousData.anonymousData.createdAt);
        
        // Pseudonymous data permissions
        FHE.allowThis(data.pseudonymousData.signedMessage);
        FHE.allowThis(data.pseudonymousData.addressVerified);
        FHE.allowThis(data.pseudonymousData.upgradedAt);
        FHE.allowSender(data.pseudonymousData.signedMessage);
        FHE.allowSender(data.pseudonymousData.addressVerified);
        FHE.allowSender(data.pseudonymousData.upgradedAt);
        
        // Self verification permissions
        FHE.allowThis(data.selfVerification.userId);
        FHE.allowThis(data.selfVerification.nullifier);
        FHE.allowThis(data.selfVerification.nameHash);
        FHE.allowThis(data.selfVerification.nationalityHash);
        FHE.allowThis(data.selfVerification.age);
        FHE.allowThis(data.selfVerification.isValid);
        FHE.allowSender(data.selfVerification.userId);
        FHE.allowSender(data.selfVerification.nullifier);
        FHE.allowSender(data.selfVerification.nameHash);
        FHE.allowSender(data.selfVerification.nationalityHash);
        FHE.allowSender(data.selfVerification.age);
        FHE.allowSender(data.selfVerification.isValid);
        
        // Identity data permissions
        FHE.allowThis(data.identityVerified);
        FHE.allowThis(data.verifiedAt);
        FHE.allowSender(data.identityVerified);
        FHE.allowSender(data.verifiedAt);
    }
    
    // ==================== ADMIN FUNCTIONS ====================
    
    function getRecordInfo(uint256 uuid) external view returns (
        TierLevel tier,
        address owner
    ) {
        return (recordTiers[uuid], recordOwners[uuid]);
    }
    
    function getTotalRecords() external view returns (uint256) {
        return uuidCounter - 1;
    }
    
    // ==================== UPGRADE FUNCTIONS ====================
    
    function upgradeToPseudonymous(
        uint256 uuid,
        InEuint256 memory _signedMessage
    ) external {
        require(recordTiers[uuid] == TierLevel.ANONYMOUS, "Can only upgrade from anonymous");
        require(recordOwners[uuid] == msg.sender, "Unauthorized");
        
        AnonymousData storage anonymousData = anonymousRecords[uuid];
        euint256 signedMessage = FHE.asEuint256(_signedMessage);
        ebool addressVerified = FHE.asEbool(true);
        euint32 upgradedAt = FHE.asEuint32(uint32(block.timestamp));
        
        // Create pseudonymous record
        pseudonymousRecords[uuid] = PseudonymousData({
            anonymousData: anonymousData,
            userAddress: msg.sender,
            signedMessage: signedMessage,
            addressVerified: addressVerified,
            upgradedAt: upgradedAt
        });
        
        // Update permissions
        FHE.allowThis(signedMessage);
        FHE.allowThis(addressVerified);
        FHE.allowThis(upgradedAt);
        FHE.allowSender(signedMessage);
        FHE.allowSender(addressVerified);
        FHE.allowSender(upgradedAt);
        
        // Update tier
        recordTiers[uuid] = TierLevel.PSEUDONYMOUS;
        
        // Clean up old data
        delete anonymousRecords[uuid];
        
        emit RecordUpdated(uuid, TierLevel.PSEUDONYMOUS);
    }
    
    function upgradeToIdentity(
        uint256 uuid,
        InEuint256 memory _selfUserId,
        InEuint256 memory _selfNullifier,
        InEuint256 memory _nameHash,
        InEuint256 memory _nationalityHash,
        InEuint32 memory _age
    ) external {
        require(recordTiers[uuid] == TierLevel.PSEUDONYMOUS, "Can only upgrade from pseudonymous");
        require(recordOwners[uuid] == msg.sender, "Unauthorized");
        
        PseudonymousData storage pseudonymousData = pseudonymousRecords[uuid];
        euint256 selfUserId = FHE.asEuint256(_selfUserId);
        euint256 selfNullifier = FHE.asEuint256(_selfNullifier);
        euint256 nameHash = FHE.asEuint256(_nameHash);
        euint256 nationalityHash = FHE.asEuint256(_nationalityHash);
        euint32 age = FHE.asEuint32(_age);
        ebool selfValid = FHE.asEbool(true);
        ebool identityVerified = FHE.asEbool(true);
        euint32 verifiedAt = FHE.asEuint32(uint32(block.timestamp));
        
        // Create identity record
        identityRecords[uuid] = IdentityData({
            pseudonymousData: pseudonymousData,
            selfVerification: SelfProof({
                userId: selfUserId,
                nullifier: selfNullifier,
                nameHash: nameHash,
                nationalityHash: nationalityHash,
                age: age,
                isValid: selfValid
            }),
            identityVerified: identityVerified,
            verifiedAt: verifiedAt
        });
        
        // Update permissions
        FHE.allowThis(selfUserId);
        FHE.allowThis(selfNullifier);
        FHE.allowThis(nameHash);
        FHE.allowThis(nationalityHash);
        FHE.allowThis(age);
        FHE.allowThis(selfValid);
        FHE.allowThis(identityVerified);
        FHE.allowThis(verifiedAt);
        FHE.allowSender(selfUserId);
        FHE.allowSender(selfNullifier);
        FHE.allowSender(nameHash);
        FHE.allowSender(nationalityHash);
        FHE.allowSender(age);
        FHE.allowSender(selfValid);
        FHE.allowSender(identityVerified);
        FHE.allowSender(verifiedAt);
        
        // Update tier
        recordTiers[uuid] = TierLevel.IDENTITY;
        
        // Clean up old data
        delete pseudonymousRecords[uuid];
        
        emit RecordUpdated(uuid, TierLevel.IDENTITY);
    }
    
    // ==================== NULLIFIER CHECKING ====================
    
    function checkWorldIdNullifier(uint256 nullifierHash) external view returns (bool) {
        return usedWorldIdNullifiers[nullifierHash];
    }
    
    function checkSelfNullifier(uint256 nullifierHash) external view returns (bool) {
        return usedSelfNullifiers[nullifierHash];
    }
} 