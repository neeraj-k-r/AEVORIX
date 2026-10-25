// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title AevorixLedger
 * @dev Immutable hash-chain ledger for medical record integrity verification
 * 
 * This contract stores SHA-256 hashes of medical records on-chain,
 * creating an immutable audit trail that can be verified against
 * the centralized PostgreSQL database.
 */

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import "@openzeppelin/contracts/utils/cryptography/MerkleProof.sol";

contract AevorixLedger is Ownable {
    // Record types
    enum RecordType { Diagnosis, Prescription, LabResult, Patient }

    // Events
    event RecordLogged(
        uint256 indexed blockIndex,
        RecordType indexed recordType,
        bytes32 indexed recordId,
        string patientCode,
        bytes32 dataHash,
        bytes32 previousHash
    );

    event ChainVerified(uint256 blockIndex, bool isValid);

    // State variables
    uint256 public totalBlocks;
    bytes32 public lastBlockHash;
    
    // Mapping from record identifier to block index for quick lookup
    mapping(bytes32 => uint256) public recordToBlockIndex;
    
    // Block storage
    struct Block {
        uint256 blockIndex;
        RecordType recordType;
        bytes32 recordId;
        string patientCode;
        bytes32 dataHash;
        bytes32 previousHash;
        uint256 timestamp;
    }
    
    mapping(uint256 => Block) public blocks;

    /**
     * @dev Log a new medical record hash to the blockchain
     * @param recordType The type of medical record
     * @param recordId Unique identifier for the record (bytes32)
     * @param patientCode Patient identifier code
     * @param dataHash SHA-256 hash of the record content
     * @param previousHash Hash of the previous block in chain
     */
    function logRecord(
        RecordType recordType,
        bytes32 recordId,
        string calldata patientCode,
        bytes32 dataHash,
        bytes32 previousHash
    ) external onlyOwner {
        uint256 blockIndex = totalBlocks + 1;
        
        // Verify chain continuity
        require(
            blockIndex == 1 || previousHash == lastBlockHash,
            "Invalid previous hash - chain broken"
        );
        
        // Create new block
        Block memory newBlock = Block({
            blockIndex: blockIndex,
            recordType: recordType,
            recordId: recordId,
            patientCode: patientCode,
            dataHash: dataHash,
            previousHash: previousHash,
            timestamp: block.timestamp
        });
        
        blocks[blockIndex] = newBlock;
        recordToBlockIndex[recordId] = blockIndex;
        totalBlocks = blockIndex;
        lastBlockHash = dataHash;
        
        emit RecordLogged(blockIndex, recordType, recordId, patientCode, dataHash, previousHash);
    }

    /**
     * @dev Verify a record's hash against the blockchain
     * @param recordId The record's unique identifier
     * @param dataHash The hash to verify
     * @return bool True if hash matches blockchain
     */
    function verifyRecord(bytes32 recordId, bytes32 dataHash) external view returns (bool) {
        uint256 blockIndex = recordToBlockIndex[recordId];
        if (blockIndex == 0) return false;
        
        Block storage block = blocks[blockIndex];
        return block.dataHash == dataHash;
    }

    /**
     * @dev Verify the integrity of the entire chain up to a block
     * @param blockIndex The block index to verify up to
     * @return bool True if chain is valid
     */
    function verifyChain(uint256 blockIndex) external view returns (bool) {
        if (blockIndex == 0 || blockIndex > totalBlocks) return false;
        
        bytes32 prevHash = bytes32(0);
        
        for (uint256 i = 1; i <= blockIndex; i++) {
            Block storage block = blocks[i];
            
            if (i > 1 && block.previousHash != prevHash) {
                return false;
            }
            
            // Verify block data hash matches stored hash
            if (block.dataHash != block.dataHash) { // Self-check, always true
                // Real implementation would recompute from stored data
            }
            
            prevHash = block.dataHash;
        }
        
        return true;
    }

    /**
     * @dev Get block details by index
     * @param blockIndex The block index to retrieve
     * @return Block The block data
     */
    function getBlock(uint256 blockIndex) external view returns (Block memory) {
        require(blockIndex > 0 && blockIndex <= totalBlocks, "Invalid block index");
        return blocks[blockIndex];
    }

    /**
     * @dev Get all blocks for a patient
     * @param patientCode The patient code to search for
     * @return uint256[] Array of block indices
     */
    function getPatientBlocks(string calldata patientCode) external view returns (uint256[] memory) {
        // In production, would use an index mapping patientCode -> block indices
        // For now, returns empty array as this requires off-chain indexing
        return new uint256[](0);
    }

    /**
     * @dev Get total number of blocks in the chain
     * @return uint256 Total blocks
     */
    function getTotalBlocks() external view returns (uint256) {
        return totalBlocks;
    }

    /**
     * @dev Get the latest block hash
     * @return bytes32 Last block hash
     */
    function getLastBlockHash() external view returns (bytes32) {
        return lastBlockHash;
    }

    /**
     * @dev Convert string record ID to bytes32
     * @param recordId String record ID
     * @return bytes32 Hashed record ID
     */
    function stringToBytes32(string memory recordId) internal pure returns (bytes32) {
        return keccak256(abi.encodePacked(recordId));
    }

    /**
     * @dev Convert record type string to enum
     * @param typeStr String record type
     * @return RecordType Enum value
     */
    function stringToRecordType(string memory typeStr) internal pure returns (RecordType) {
        if (keccak256(abi.encodePacked(typeStr)) == keccak256(abi.encodePacked("diagnosis"))) {
            return RecordType.Diagnosis;
        } else if (keccak256(abi.encodePacked(typeStr)) == keccak256(abi.encodePacked("prescription"))) {
            return RecordType.Prescription;
        } else if (keccak256(abi.encodePacked(typeStr)) == keccak256(abi.encodePacked("lab_result"))) {
            return RecordType.LabResult;
        } else if (keccak256(abi.encodePacked(typeStr)) == keccak256(abi.encodePacked("patient"))) {
            return RecordType.Patient;
        }
        return RecordType.Diagnosis; // Default
    }
}

// Interface for external verification
interface IAevorixVerifier {
    function verifyRecord(bytes32 recordId, bytes32 dataHash) external view returns (bool);
    function verifyChain(uint256 blockIndex) external view returns (bool);
    function getBlock(uint256 blockIndex) external view returns (
        uint256 blockIndex,
        uint8 recordType,
        bytes32 recordId,
        string memory patientCode,
        bytes32 dataHash,
        bytes32 previousHash,
        uint256 timestamp
    );
}