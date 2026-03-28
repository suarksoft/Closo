// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

interface IEscrow {
    function release(bytes32 saleId) external;
}

contract ReentrantSeller {
    IEscrow public immutable escrow;
    bytes32 public immutable saleId;
    bool public attempted;
    bool public reentered;

    constructor(address escrowAddress, bytes32 testSaleId) {
        escrow = IEscrow(escrowAddress);
        saleId = testSaleId;
    }

    receive() external payable {
        attempted = true;
        (bool success,) = address(escrow).call(
            abi.encodeWithSelector(IEscrow.release.selector, saleId)
        );
        reentered = success;
    }
}
