import { config } from "dotenv";
config();
import { testRoomCreationJoinCancelRefund } from "./test-1-cancel-refund";
import { testRoomCreationJoinLeaveCancel } from "./test-2-leave-cancel";
import { testSponsoredRoomJoinLeave } from "./test-3-sponsored-leave";
import { testSponsoredRoomCancellation } from "./test-4-sponsored-cancel";
import { testGameCompletionNoWinners } from "./test-5-no-winners";
import { testGameCompletionSingleWinner } from "./test-6-single-winner";
import { testGameCompletionTop2Winners } from "./test-7-top-2-winners";
import { testSponsoredGameRoomNoWinner } from "./test-8-sponsored-no-winner";
import { TestResult } from "./utils";

/**
 * Main test runner for the Game Room Lifecycle Testing Suite
 * 
 * This script can run all tests sequentially or individual tests
 * based on command line arguments.
 */

interface TestFunction {
  name: string;
  function: () => Promise<any>;
  description: string;
}

const allTests: TestFunction[] = [
  {
    name: "test-1",
    function: testRoomCreationJoinCancelRefund,
    description: "Room Creation → Join → Cancel → Refund"
  },
  {
    name: "test-2",
    function: testRoomCreationJoinLeaveCancel,
    description: "Room Creation → Join → Leave → Cancel"
  },
  {
    name: "test-3",
    function: testSponsoredRoomJoinLeave,
    description: "Sponsored Room → Join → Leave"
  },
  {
    name: "test-4",
    function: testSponsoredRoomCancellation,
    description: "Sponsored Room Cancellation"
  },
  {
    name: "test-5",
    function: testGameCompletionNoWinners,
    description: "Game Completion with No Winners"
  },
  {
    name: "test-6",
    function: testGameCompletionSingleWinner,
    description: "Game Completion with Single Winner"
  },
  {
    name: "test-7",
    function: testGameCompletionTop2Winners,
    description: "Game Completion with Top 2 Winners"
  },
  {
    name: "test-8",
    function: testSponsoredGameRoomNoWinner,
    description: "Sponsored Game Room with No Winner"
  }
];

/**
 * Run a single test by name
 */
async function runSingleTest(testName: string): Promise<TestResult | null> {
  const test = allTests.find(t => t.name === testName);
  if (!test) {
    console.error(`Test '${testName}' not found. Available tests:`);
    allTests.forEach(t => console.log(`  ${t.name}: ${t.description}`));
    return null;
  }

  console.log(`\n${'='.repeat(80)}`);
  console.log(`Running ${test.name}: ${test.description}`);
  console.log(`${'='.repeat(80)}`);

  try {
    await test.function();
    return { testName: test.name, passed: true };
  } catch (error) {
    console.error(`\nTest ${test.name} failed:`, error);
    return { testName: test.name, passed: false, error: error.message };
  }
}

/**
 * Run all tests sequentially
 */
async function runAllTests(): Promise<TestResult[]> {
  console.log(`\n${'='.repeat(80)}`);
  console.log("GAME ROOM LIFECYCLE TESTING SUITE");
  console.log("Running all tests sequentially...");
  console.log(`${'='.repeat(80)}`);

  const results: TestResult[] = [];

  for (const test of allTests) {
    console.log(`\n${'='.repeat(80)}`);
    console.log(`Running ${test.name}: ${test.description}`);
    console.log(`${'='.repeat(80)}`);

    try {
      await test.function();
      results.push({ testName: test.name, passed: true });
    } catch (error) {
      console.error(`\nTest ${test.name} failed:`, error);
      results.push({ testName: test.name, passed: false, error: error.message });
    }

    // Add a small delay between tests
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  return results;
}

/**
 * Print test results summary
 */
function printResultsSummary(results: TestResult[]): void {
  console.log(`\n${'='.repeat(80)}`);
  console.log("TEST RESULTS SUMMARY");
  console.log(`${'='.repeat(80)}`);

  const passed = results.filter(r => r.passed).length;
  const failed = results.filter(r => !r.passed).length;
  const total = results.length;

  console.log(`\nOverall Results:`);
  console.log(`  Total Tests: ${total}`);
  console.log(`  Passed: ${passed} ✓`);
  console.log(`  Failed: ${failed} ✗`);
  console.log(`  Success Rate: ${((passed / total) * 100).toFixed(1)}%`);

  if (passed === total) {
    console.log(`\n🎉 ALL TESTS PASSED! 🎉`);
  } else {
    console.log(`\n❌ Some tests failed. Check the logs above for details.`);
  }

  console.log(`\nDetailed Results:`);
  results.forEach(result => {
    const status = result.passed ? '✓ PASSED' : '✗ FAILED';
    const error = result.error ? ` - ${result.error}` : '';
    console.log(`  ${result.testName}: ${status}${error}`);
  });

  console.log(`\n${'='.repeat(80)}`);
}

/**
 * Print usage information
 */
function printUsage(): void {
  console.log(`
Game Room Lifecycle Testing Suite

Usage:
  pnpm test:game-room [test-name]  - Run specific test or all tests

Available Tests:
${allTests.map(t => `  ${t.name}: ${t.description}`).join('\n')}

Examples:
  pnpm test:game-room              - Run all tests
  pnpm test:game-room test-1      - Run only test 1
  pnpm test:game-room test-3      - Run only test 3

Environment Variables Required:
  VITE_KEY_1 - Primary test key (room creator)
  VITE_KEY_2 - Secondary test key (room joiner)
  SUI_NETWORK - Network to use (mainnet/testnet, default: mainnet)
  SUI_RPC_URL - Custom RPC URL (optional)

Notes:
  - All tests use 0.01 USDC entry fees to minimize costs
  - Tests run sequentially with delays between operations
  - Each test validates balance changes and transaction success
  - Failed tests can be re-run individually
`);
}

/**
 * Main function
 */
async function main(): Promise<void> {
  const args = process.argv.slice(2);

  if (args.includes('--help') || args.includes('-h')) {
    printUsage();
    return;
  }

  try {
    if (args.length === 0) {
      // Run all tests
      const results = await runAllTests();
      printResultsSummary(results);

      // Exit with appropriate code
      const allPassed = results.every(r => r.passed);
      process.exit(allPassed ? 0 : 1);
    } else {
      // Run specific test
      const testName = args[0];
      const result = await runSingleTest(testName);

      if (result) {
        printResultsSummary([result]);
        process.exit(result.passed ? 0 : 1);
      } else {
        process.exit(1);
      }
    }
  } catch (error) {
    console.error("Test runner failed:", error);
    process.exit(1);
  }
}

// Run if this file is executed directly
// if (import.meta.url === `file://${process.argv[1]}`) {
main().catch(error => {
  console.error("Fatal error:", error);
  process.exit(1);
});
// }

export { runAllTests, runSingleTest, allTests }; 