// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {AccessControl} from "@openzeppelin/contracts/access/AccessControl.sol";
import {Pausable} from "@openzeppelin/contracts/utils/Pausable.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

contract MonadBlitzEscrow is AccessControl, Pausable, ReentrancyGuard {
    bytes32 public constant PAYOUT_OPERATOR_ROLE = keccak256("PAYOUT_OPERATOR_ROLE");

    enum SaleState {
        None,
        Funded,
        Approved,
        Paid,
        Cancelled
    }

    struct Sale {
        address business;
        address seller;
        uint256 amount;
        SaleState state;
        uint64 nonce;
    }

    mapping(bytes32 => Sale) public sales;

    event SaleFunded(bytes32 indexed saleId, address indexed business, address indexed seller, uint256 amount);
    event SaleApproved(bytes32 indexed saleId, address indexed operator);
    event SalePaid(bytes32 indexed saleId, address indexed seller, uint256 amount, uint64 nonce);
    event SaleRefunded(bytes32 indexed saleId, address indexed business, uint256 amount);

    error InvalidSaleState(SaleState expected, SaleState actual);
    error ZeroAmount();
    error ZeroAddress();
    error TransferFailed();
    error UnauthorizedRefund();

    constructor(address admin, address payoutOperator) {
        if (admin == address(0) || payoutOperator == address(0)) revert ZeroAddress();
        _grantRole(DEFAULT_ADMIN_ROLE, admin);
        _grantRole(PAYOUT_OPERATOR_ROLE, payoutOperator);
    }

    function depositForSale(bytes32 saleId, address seller) external payable whenNotPaused {
        if (msg.value == 0) revert ZeroAmount();
        if (seller == address(0)) revert ZeroAddress();

        Sale storage sale = sales[saleId];
        if (sale.state != SaleState.None) {
            revert InvalidSaleState(SaleState.None, sale.state);
        }

        sale.business = msg.sender;
        sale.seller = seller;
        sale.amount = msg.value;
        sale.state = SaleState.Funded;

        emit SaleFunded(saleId, msg.sender, seller, msg.value);
    }

    function approveSale(bytes32 saleId) external onlyRole(PAYOUT_OPERATOR_ROLE) whenNotPaused {
        Sale storage sale = sales[saleId];
        if (sale.state != SaleState.Funded) {
            revert InvalidSaleState(SaleState.Funded, sale.state);
        }

        sale.state = SaleState.Approved;
        emit SaleApproved(saleId, msg.sender);
    }

    function release(bytes32 saleId) public onlyRole(PAYOUT_OPERATOR_ROLE) nonReentrant whenNotPaused {
        Sale storage sale = sales[saleId];
        if (sale.state != SaleState.Approved) {
            revert InvalidSaleState(SaleState.Approved, sale.state);
        }

        sale.state = SaleState.Paid;
        sale.nonce += 1;
        uint256 amount = sale.amount;
        sale.amount = 0;

        (bool sent,) = payable(sale.seller).call{value: amount}("");
        if (!sent) revert TransferFailed();

        emit SalePaid(saleId, sale.seller, amount, sale.nonce);
    }

    function approveAndRelease(bytes32 saleId) external onlyRole(PAYOUT_OPERATOR_ROLE) nonReentrant whenNotPaused {
        Sale storage sale = sales[saleId];
        if (sale.state == SaleState.Funded) {
            sale.state = SaleState.Approved;
            emit SaleApproved(saleId, msg.sender);
        }
        if (sale.state != SaleState.Approved) {
            revert InvalidSaleState(SaleState.Approved, sale.state);
        }

        sale.state = SaleState.Paid;
        sale.nonce += 1;
        uint256 amount = sale.amount;
        sale.amount = 0;

        (bool sent,) = payable(sale.seller).call{value: amount}("");
        if (!sent) revert TransferFailed();

        emit SalePaid(saleId, sale.seller, amount, sale.nonce);
    }

    function refund(bytes32 saleId) external nonReentrant whenNotPaused {
        Sale storage sale = sales[saleId];
        if (sale.state != SaleState.Funded) {
            revert InvalidSaleState(SaleState.Funded, sale.state);
        }

        bool isAdmin = hasRole(DEFAULT_ADMIN_ROLE, msg.sender);
        if (!(isAdmin || msg.sender == sale.business)) revert UnauthorizedRefund();

        sale.state = SaleState.Cancelled;
        uint256 amount = sale.amount;
        sale.amount = 0;

        (bool sent,) = payable(sale.business).call{value: amount}("");
        if (!sent) revert TransferFailed();

        emit SaleRefunded(saleId, sale.business, amount);
    }

    function pause() external onlyRole(DEFAULT_ADMIN_ROLE) {
        _pause();
    }

    function unpause() external onlyRole(DEFAULT_ADMIN_ROLE) {
        _unpause();
    }
}
