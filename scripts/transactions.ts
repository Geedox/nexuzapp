import { config } from "dotenv";
import { createKeypair, createSuiClient } from "./game-room-tests/utils";
import { SuiTransactionBlockResponse } from "@mysten/sui.js/client";
import { writeFile } from "fs/promises";
import { execSync } from "child_process";

config();
const main = async () => {
    const client = createSuiClient();
    const adminkeyPair = createKeypair(process.env.VITE_PRIVATE_KEY as string, "Admin");
    const address = adminkeyPair.address;

    // Set time range: 10:40 AM to 11:00 AM today (October 11, 2025)
    const today = new Date('2025-10-11');
    const startTime = new Date(today.setHours(10, 40, 0, 0)).getTime();
    const endTime = new Date(today.setHours(11, 0, 0, 0)).getTime();
    const maxPages = 15;
    const allTransactions: SuiTransactionBlockResponse[] = [];
    let hasNextPage = true;
    let page = 0;
    let cursor: string | null | undefined = null;

    console.log(`Querying transactions from ${new Date(startTime)} to ${new Date(endTime)}`);
    while (hasNextPage && page < maxPages) {
        const transactions1 = await client.queryTransactionBlocks({
            filter: {
                ToAddress: address,
            },
            order: "descending",
            cursor: cursor,
            options: {
                showBalanceChanges: true,
                showEffects: true,
                showEvents: true,
                showInput: true,
            }
        });
        console.log(`Data length ${transactions1.data.length}`)
        allTransactions.push(...transactions1.data);
        hasNextPage = transactions1.hasNextPage;
        cursor = transactions1.nextCursor;
        page++;
    }

    // Filter by timestamp
    const filteredTransactions = allTransactions.filter(tx => {
        const txTime = tx.timestampMs ? parseInt(tx.timestampMs) : 0;
        return txTime >= startTime && txTime <= endTime;
    });

    const mapTransactions = filteredTransactions.map(tx => ({
        events: tx.events?.[0].parsedJson,
        timestampMs: tx.timestampMs ? new Date(parseInt(tx.timestampMs)).toISOString() : null,
        balanceChanges: JSON.stringify(tx.balanceChanges, null, 2),
    }))

    console.log(`Found ${filteredTransactions.length} transactions in the time range`);
    await writeFile("to_transactions.json", JSON.stringify(mapTransactions, null, 2));
    execSync('cursor to_transactions.json');
}

main();