// SPDX-License-Identifier: MIT
pragma solidity ^0.8.25;

contract AnonymityTiersBasic {
    // Events
    event AnonymousRecordCreated(string indexed uuid, address indexed user);
    event PseudonymousUpgrade(string indexed uuid, address indexed user);
    event IdentityUpgrade(string indexed uuid, address indexed user);

    // Data structures for the three tiers
    struct AnonymousData {
        string worldProofCid;      // Plain text CID for World ID proof
        uint256 timestamp;
        bool exists;
    }

    struct PseudonymousData {
        string worldProofCid;      // Same as anonymous
        string signatureCid;       // Plain text CID for signature
        address userAddress;       // Public user address
        uint256 timestamp;
        bool exists;
    }

    struct IdentityData {
        string worldProofCid;      // Same as previous tiers
        string signatureCid;       // Same as pseudonymous
        string selfProofCid;       // Plain text CID for self-verification proof
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

    // Tier 1: Anonymous - Store plain text World ID proof
    function createAnonymousRecord(
        string memory worldProofCid
    ) external returns (string memory uuid) {
        require(bytes(worldProofCid).length > 0, "World proof CID cannot be empty");
        
        // Generate UUID
        uuid = generateUUID();
        
        // Store anonymous record
        anonymousRecords[uuid] = AnonymousData({
            worldProofCid: worldProofCid,
            timestamp: block.timestamp,
            exists: true
        });
        
        emit AnonymousRecordCreated(uuid, msg.sender);
        return uuid;
    }

    // Tier 2: Pseudonymous - Create with world CID and signature CID
    function createPseudonymousRecord(
        string memory worldProofCid,
        string memory signatureCid
    ) external returns (string memory uuid) {
        require(bytes(worldProofCid).length > 0, "World proof CID cannot be empty");
        require(bytes(signatureCid).length > 0, "Signature CID cannot be empty");
        
        // Generate UUID
        uuid = generateUUID();
        
        // Create pseudonymous record
        pseudonymousRecords[uuid] = PseudonymousData({
            worldProofCid: worldProofCid,
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
        string memory worldProofCid,
        string memory signatureCid,
        string memory selfProofCid
    ) external returns (string memory uuid) {
        require(bytes(worldProofCid).length > 0, "World proof CID cannot be empty");
        require(bytes(signatureCid).length > 0, "Signature CID cannot be empty");
        require(bytes(selfProofCid).length > 0, "Self proof CID cannot be empty");
        
        // Generate UUID
        uuid = generateUUID();
        
        // Create identity record
        identityRecords[uuid] = IdentityData({
            worldProofCid: worldProofCid,
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

    // Query functions
    function getAnonymousRecord(string memory uuid) 
        external 
        view 
        validUUID(uuid) 
        returns (
            string memory worldProofCid,
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
            string memory worldProofCid,
            string memory signatureCid,
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
            string memory worldProofCid,
            string memory signatureCid,
            string memory selfProofCid,
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

    // Additional utility functions for the basic version
    
    // Get all anonymous record UUIDs (for testing/demo purposes)
    function getAllAnonymousUUIDs() external view returns (string[] memory) {
        // Note: This is not gas-efficient for large datasets
        // In production, you'd want to implement pagination
        string[] memory uuids = new string[](uuidCounter);
        uint256 count = 0;
        
        for (uint256 i = 1; i < uuidCounter; i++) {
            string memory uuid = string(abi.encodePacked("anon-", toString(i)));
            if (anonymousRecords[uuid].exists) {
                uuids[count] = uuid;
                count++;
            }
        }
        
        // Resize array to actual count
        string[] memory result = new string[](count);
        for (uint256 i = 0; i < count; i++) {
            result[i] = uuids[i];
        }
        
        return result;
    }

    // Get total number of records by tier
    function getRecordCounts() external view returns (uint256 anonymousCount, uint256 pseudonymousCount, uint256 identityCount) {
        for (uint256 i = 1; i < uuidCounter; i++) {
            string memory uuid = string(abi.encodePacked("anon-", toString(i)));
            if (identityRecords[uuid].exists) {
                identityCount++;
            } else if (pseudonymousRecords[uuid].exists) {
                pseudonymousCount++;
            } else if (anonymousRecords[uuid].exists) {
                anonymousCount++;
            }
        }
    }

    // Update functions (only for record owners)
    function updatePseudonymousRecord(
        string memory uuid,
        string memory newSignatureCid
    ) external onlyRecordOwner(uuid) {
        require(pseudonymousRecords[uuid].exists, "Record not found");
        require(bytes(newSignatureCid).length > 0, "Signature CID cannot be empty");
        
        pseudonymousRecords[uuid].signatureCid = newSignatureCid;
    }

    function updateIdentityRecord(
        string memory uuid,
        string memory newSignatureCid,
        string memory newSelfProofCid
    ) external onlyRecordOwner(uuid) {
        require(identityRecords[uuid].exists, "Record not found");
        require(bytes(newSignatureCid).length > 0, "Signature CID cannot be empty");
        require(bytes(newSelfProofCid).length > 0, "Self proof CID cannot be empty");
        
        identityRecords[uuid].signatureCid = newSignatureCid;
        identityRecords[uuid].selfProofCid = newSelfProofCid;
    }
} 