// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

import {Test, console2} from "forge-std/Test.sol";
import {DePayForwarderV2} from "../contracts/DePayForwarderV2.sol";
import {DePayRouterV2} from "../contracts/DePayRouterV2.sol";

contract DePayRouterV2Test is Test {
    DePayForwarderV2 public forwarder;
    DePayRouterV2 public router;

    function setUp() public {
        forwarder = new DePayForwarderV2();
        router = new DePayRouterV2(address(0), address(forwarder));
    }

    function test_enable() public {
        router.enable(0x3fC91A3afd70395Cd496C647d5a6CC9D4B2b7FAD, true);
        assert(router.exchanges(0x3fC91A3afd70395Cd496C647d5a6CC9D4B2b7FAD) == true);
    }
}
