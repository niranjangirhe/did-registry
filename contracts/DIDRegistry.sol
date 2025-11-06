// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

contract DIDRegistry {
    // Mapping from DID to alias
    mapping(string => string) private didToAlias;

    // Mapping from alias to DID
    mapping(string => string) private aliasToDid;

    // Event emitted when a mapping is set
    event MappingSet(string indexed did, string indexed didname);

    /**
     * @dev Sets a mapping between a DID and an alias
     * @param did The Decentralized Identifier
     * @param didname The alias to map to the DID
     * @notice Reverts if DID is already mapped to another alias or if alias is already mapped to another DID
     */
    function setMapping(string memory did, string memory didname) public {
        // Check if DID is already mapped to another alias
        require(
            bytes(didToAlias[did]).length == 0,
            "DIDRegistry: DID is already mapped to another alias"
        );

        // Check if alias is already mapped to another DID
        require(
            bytes(aliasToDid[didname]).length == 0,
            "DIDRegistry: Alias is already mapped to another DID"
        );

        // Set both mappings
        didToAlias[did] = didname;
        aliasToDid[didname] = did;

        emit MappingSet(did, didname);
    }

    /**
     * @dev Gets the alias for a given DID
     * @param did The Decentralized Identifier
     * @return The alias mapped to the DID, or empty string if not mapped
     */
    function getAlias(string memory did) public view returns (string memory) {
        return didToAlias[did];
    }

    /**
     * @dev Gets the DID for a given alias
     * @param didname The alias
     * @return The DID mapped to the alias, or empty string if not mapped
     */
    function getDid(string memory didname) public view returns (string memory) {
        return aliasToDid[didname];
    }

    /**
     * @dev Checks if an alias is taken and if a DID is mapped
     * @param didname The alias to check
     * @param did The DID to check
     * @return aliasTaken True if the alias is already mapped to a DID, false otherwise
     * @return didMapped True if the DID is already mapped to an alias, false otherwise
     */
    function checkMapping(
        string memory didname,
        string memory did
    ) public view returns (bool aliasTaken, bool didMapped) {
        aliasTaken = bytes(aliasToDid[didname]).length > 0;
        didMapped = bytes(didToAlias[did]).length > 0;
    }
}
