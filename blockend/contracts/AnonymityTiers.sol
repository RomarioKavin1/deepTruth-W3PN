// SPDX-License-Identifier: MIT
pragma solidity ^0.8.25;

import "@fhenixprotocol/cofhe-contracts/FHE.sol";

contract AnonymityTiers {
    using FHE for euint256;
    using FHE for ebool;

    // Events
    event AnonymousRecordCreated(string indexed uuid, address indexed user);
    event PseudonymousUpgrade(string indexed uuid, address indexed user);
    event IdentityUpgrade(string indexed uuid, address indexed user);

    // Data structures for the three tiers
    struct AnonymousData {
        euint256 worldProofCid;      // Encrypted CID for World ID proof
        uint256 timestamp;
        bool exists;
    }

    struct PseudonymousData {
        euint256 worldProofCid;      // Same as anonymous
        euint256 signatureCid;       // Encrypted CID for signature
        address userAddress;         // Public user address
        uint256 timestamp;
        bool exists;
    }

    struct IdentityData {
        euint256 worldProofCid;      // Same as previous tiers
        euint256 signatureCid;       // Same as pseudonymous
        euint256 selfProofCid;       // Encrypted CID for self-verification proof
        address userAddress;         
        uint256 timestamp;
        bool exists;
    }

    // Storage mappings
    mapping(string => AnonymousData) public anonymousRecords;
    mapping(string => PseudonymousData) public pseudonymousRecords;
    mapping(string => IdentityData) public identityRecords;
    
    // Track UUIDs by user for easy lookup
    mapping(address => string[]) public userUUIDs;
    
    // UUID counter for generating unique IDs
    uint256 private uuidCounter;

    modifier validUUID(string memory uuid) {
        require(bytes(uuid).length > 0, "Invalid UUID");
        _;
    }

    modifier onlyRecordOwner(string memory uuid) {
        require(
            pseudonymousRecords[uuid].userAddress == msg.sender || 
            identityRecords[uuid].userAddress == msg.sender,
            "Not record owner"
        );
        _;
    }

    constructor() {
        uuidCounter = 1;
    }

    // Generate a simple UUID
    function generateUUID() private returns (string memory) {
        string memory uuid = string(abi.encodePacked("anon-", toString(uuidCounter)));
        uuidCounter++;
        return uuid;
    }
    
    // Helper function to convert uint to string
    function toString(uint256 value) internal pure returns (string memory) {
        if (value == 0) {
            return "0";
        }
        uint256 temp = value;
        uint256 digits;
        while (temp != 0) {
            digits++;
            temp /= 10;
        }
        bytes memory buffer = new bytes(digits);
        while (value != 0) {
            digits -= 1;
            buffer[digits] = bytes1(uint8(48 + uint256(value % 10)));
            value /= 10;
        }
        return string(buffer);
    }

    // Tier 1: Anonymous - Store encrypted World ID proof CID
    function createAnonymousRecord(
        InEuint256 memory encryptedWorldProofCid
    ) external returns (string memory uuid) {
        // Convert input to encrypted type
        euint256 worldCid = FHE.asEuint256(encryptedWorldProofCid);
        
        // Set permissions
        FHE.allowThis(worldCid);
        FHE.allowSender(worldCid);
        
        // Generate UUID
        uuid = generateUUID();
        
        // Store anonymous record
        anonymousRecords[uuid] = AnonymousData({
            worldProofCid: worldCid,
            timestamp: block.timestamp,
            exists: true
        });
        
        emit AnonymousRecordCreated(uuid, msg.sender);
        return uuid;
    }

    // Tier 2: Pseudonymous - Create with world CID and signature CID
    function createPseudonymousRecord(
        InEuint256 memory encryptedWorldProofCid,
        InEuint256 memory encryptedSignatureCid
    ) external returns (string memory uuid) {
        // Convert inputs to encrypted types
        euint256 worldCid = FHE.asEuint256(encryptedWorldProofCid);
        euint256 signatureCid = FHE.asEuint256(encryptedSignatureCid);
        
        // Set permissions
        FHE.allowThis(worldCid);
        FHE.allowThis(signatureCid);
        FHE.allowSender(worldCid);
        FHE.allowSender(signatureCid);
        
        // Generate UUID
        uuid = generateUUID();
        
        // Create pseudonymous record
        pseudonymousRecords[uuid] = PseudonymousData({
            worldProofCid: worldCid,
            signatureCid: signatureCid,
            userAddress: msg.sender,
            timestamp: block.timestamp,
            exists: true
        });
        
        // Track user's UUIDs
        userUUIDs[msg.sender].push(uuid);
        
        emit PseudonymousUpgrade(uuid, msg.sender);
        return uuid;
    }

    // Tier 3: Identity - Create with world CID, signature CID, and self-verification CID
    function createIdentityRecord(
        InEuint256 memory encryptedWorldProofCid,
        InEuint256 memory encryptedSignatureCid,
        InEuint256 memory encryptedSelfProofCid
    ) external returns (string memory uuid) {
        // Convert inputs to encrypted types
        euint256 worldCid = FHE.asEuint256(encryptedWorldProofCid);
        euint256 signatureCid = FHE.asEuint256(encryptedSignatureCid);
        euint256 selfProofCid = FHE.asEuint256(encryptedSelfProofCid);
        
        // Set permissions
        FHE.allowThis(worldCid);
        FHE.allowThis(signatureCid);
        FHE.allowThis(selfProofCid);
        FHE.allowSender(worldCid);
        FHE.allowSender(signatureCid);
        FHE.allowSender(selfProofCid);
        
        // Generate UUID
        uuid = generateUUID();
        
        // Create identity record
        identityRecords[uuid] = IdentityData({
            worldProofCid: worldCid,
            signatureCid: signatureCid,
            selfProofCid: selfProofCid,
            userAddress: msg.sender,
            timestamp: block.timestamp,
            exists: true
        });
        
        // Track user's UUIDs
        userUUIDs[msg.sender].push(uuid);
        
        emit IdentityUpgrade(uuid, msg.sender);
        return uuid;
    }

    // Query functions with proper FHE permissions
    function getAnonymousRecord(string memory uuid) 
        external 
        view 
        validUUID(uuid) 
        returns (
            euint256 worldProofCid,
            uint256 timestamp,
            bool exists
        ) 
    {
        AnonymousData memory record = anonymousRecords[uuid];
        require(record.exists, "Record not found");
        
        return (
            record.worldProofCid,
            record.timestamp,
            record.exists
        );
    }

    function getPseudonymousRecord(string memory uuid) 
        external 
        view 
        validUUID(uuid) 
        returns (
            euint256 worldProofCid,
            euint256 signatureCid,
            address userAddress,
            uint256 timestamp,
            bool exists
        ) 
    {
        PseudonymousData memory record = pseudonymousRecords[uuid];
        require(record.exists, "Record not found");
        
        return (
            record.worldProofCid,
            record.signatureCid,
            record.userAddress,
            record.timestamp,
            record.exists
        );
    }

    function getIdentityRecord(string memory uuid) 
        external 
        view 
        validUUID(uuid) 
        returns (
            euint256 worldProofCid,
            euint256 signatureCid,
            euint256 selfProofCid,
            address userAddress,
            uint256 timestamp,
            bool exists
        ) 
    {
        IdentityData memory record = identityRecords[uuid];
        require(record.exists, "Record not found");
        
        return (
            record.worldProofCid,
            record.signatureCid,
            record.selfProofCid,
            record.userAddress,
            record.timestamp,
            record.exists
        );
    }

    // Utility functions
    function getUserUUIDs(address user) external view returns (string[] memory) {
        return userUUIDs[user];
    }

    function checkRecordTier(string memory uuid) external view returns (uint8 tier) {
        if (identityRecords[uuid].exists) return 3;
        if (pseudonymousRecords[uuid].exists) return 2;
        if (anonymousRecords[uuid].exists) return 1;
        return 0; // Doesn't exist
    }
} 