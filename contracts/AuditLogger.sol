// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

contract AuditLogger {

    // ── Types ────────────────────────────────────────────────────────────────

    enum ActionType {
        REQUEST_INITIATED,  // 0
        CONSENT_GRANTED,    // 1
        CONSENT_DENIED,     // 2
        DATA_SHARED         // 3
    }

    struct AuditLog {
        bytes32    patientIdHash;        // salted HMAC-SHA256 — never the raw ID
        string     requestingHospital;
        string     respondingHospital;
        uint256    timestamp;
        ActionType action;
        string     requestId;            // MongoDB _id for cross-referencing
    }

    // ── State ────────────────────────────────────────────────────────────────

    address public owner;
    mapping(address => bool) public authorizedHospitals;
    AuditLog[] private logs;

    // ── Events ───────────────────────────────────────────────────────────────

    event LogCreated(
        uint256 indexed logIndex,
        bytes32 indexed patientIdHash,
        string  requestingHospital,
        ActionType action,
        uint256 timestamp
    );

    event HospitalAuthorized(address indexed hospital);
    event HospitalRevoked(address indexed hospital);

    // ── Modifiers ────────────────────────────────────────────────────────────

    modifier onlyOwner() {
        require(msg.sender == owner, "AuditLogger: not owner");
        _;
    }

    modifier onlyAuthorized() {
        require(authorizedHospitals[msg.sender], "AuditLogger: not an authorized hospital");
        _;
    }

    // ── Constructor ──────────────────────────────────────────────────────────

    constructor() {
        owner = msg.sender;
        // Auto-authorize the deployer so backend can log immediately after deploy
        authorizedHospitals[msg.sender] = true;
        emit HospitalAuthorized(msg.sender);
    }

    // ── Admin ────────────────────────────────────────────────────────────────

    function authorizeHospital(address hospital) external onlyOwner {
        authorizedHospitals[hospital] = true;
        emit HospitalAuthorized(hospital);
    }

    function revokeHospital(address hospital) external onlyOwner {
        authorizedHospitals[hospital] = false;
        emit HospitalRevoked(hospital);
    }

    // ── Logging functions ────────────────────────────────────────────────────

    function logRequest(
        bytes32        _patientIdHash,
        string calldata _requestingHospital,
        string calldata _respondingHospital,
        string calldata _requestId
    ) external onlyAuthorized returns (uint256) {
        return _push(_patientIdHash, _requestingHospital, _respondingHospital,
                     ActionType.REQUEST_INITIATED, _requestId);
    }

    function logConsent(
        bytes32        _patientIdHash,
        string calldata _requestingHospital,
        string calldata _respondingHospital,
        bool            granted,
        string calldata _requestId
    ) external onlyAuthorized returns (uint256) {
        ActionType action = granted ? ActionType.CONSENT_GRANTED : ActionType.CONSENT_DENIED;
        return _push(_patientIdHash, _requestingHospital, _respondingHospital, action, _requestId);
    }

    function logDataTransfer(
        bytes32        _patientIdHash,
        string calldata _requestingHospital,
        string calldata _respondingHospital,
        string calldata _requestId
    ) external onlyAuthorized returns (uint256) {
        return _push(_patientIdHash, _requestingHospital, _respondingHospital,
                     ActionType.DATA_SHARED, _requestId);
    }

    // ── Read ─────────────────────────────────────────────────────────────────

    function getLog(uint256 index) external view returns (AuditLog memory) {
        require(index < logs.length, "AuditLogger: index out of bounds");
        return logs[index];
    }

    function getLogsCount() external view returns (uint256) {
        return logs.length;
    }

    // ── Internal ─────────────────────────────────────────────────────────────

    function _push(
        bytes32    _hash,
        string memory _req,
        string memory _res,
        ActionType _action,
        string memory _id
    ) internal returns (uint256 index) {
        logs.push(AuditLog({
            patientIdHash:      _hash,
            requestingHospital: _req,
            respondingHospital: _res,
            timestamp:          block.timestamp,
            action:             _action,
            requestId:          _id
        }));
        index = logs.length - 1;
        emit LogCreated(index, _hash, _req, _action, block.timestamp);
    }
}
