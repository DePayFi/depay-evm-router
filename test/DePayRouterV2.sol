// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

import {Test, console2} from "forge-std/Test.sol";
import {DePayForwarderV3} from "../contracts/DePayForwarderV3.sol";
import {DePayRouterV3} from "../contracts/DePayRouterV3.sol";

contract DePayRouterV3Test is Test {
    DePayForwarderV3 public forwarder;
    DePayRouterV3 public router;

    function setUp() public {
        forwarder = new DePayForwarderV3();
        router = new DePayRouterV3(address(0), address(forwarder));
    }

    function test_enable() public {
        router.enable(0x3fC91A3afd70395Cd496C647d5a6CC9D4B2b7FAD, true);
        assert(router.exchanges(0x3fC91A3afd70395Cd496C647d5a6CC9D4B2b7FAD) == true);
    }
}
