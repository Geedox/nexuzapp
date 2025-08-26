# Game Room Smart Contract Documentation

## Overview

The `game_room` module is a Sui Move smart contract that manages competitive gaming rooms where players can join, compete, and win prizes. The contract handles room creation, player management, prize distribution, and game lifecycle management.

## Contract Address

- **Module**: `game_room::game_room`
- **Admin Address**: `@admin`

## Constants

### Error Codes

- `ERoomFull` (1): Room has reached maximum player capacity
- `ERoomNotFound` (2): Specified room does not exist
- `EInsufficientEntryFee` (3): Payment amount is less than required entry fee
- `ENotRoomCreator` (4): Caller is not the room creator
- `ERoomNotInWaitingState` (5): Room is not in waiting state for the requested operation
- `ERoomCancelled` (7): Room has been cancelled
- `ERoomCompleted` (8): Game has already been completed
- `EPlayerNotInRoom` (9): Player is not a participant in the room
- `EInsufficientPlayers` (10): Not enough players to start the game
- `EInvalidWinnerCount` (11): Number of winners doesn't match the split rule
- `EInvalidRoomCode` (12): Private room code is incorrect
- `EInsufficientSponsorAmount` (13): Sponsor payment is insufficient
- `EAlreadyInRoom` (14): Player is already in the room

### Room Status Constants

- `STATUS_WAITING`: Room is waiting for players
- `STATUS_ONGOING`: Game is in progress
- `STATUS_COMPLETED`: Game has finished
- `STATUS_CANCELLED`: Room has been cancelled

### Platform Configuration

- `PLATFORM_FEE_PERCENTAGE`: 7% platform fee
- `FEE_DENOMINATOR`: 100 (for percentage calculations)

## Core Functions

### Room Creation

#### `create_room_with_usdc`

Creates a new game room with USDC payment.

**Parameters:**

- `store: &mut GameRoomStore` - Reference to the game room store
- `name: String` - Room name
- `game_id: String` - Game identifier
- `entry_fee: u64` - Entry fee amount
- `currency: String` - Currency (must be "USDC")
- `max_players: u64` - Maximum players allowed
- `is_private: bool` - Whether room is private
- `room_code: String` - Private room access code
- `is_sponsored: bool` - Whether room is sponsored
- `sponsor_amount: u64` - Sponsor contribution amount
- `winner_split_rule: String` - Prize distribution rule
- `start_time: u64` - Scheduled start time
- `end_time: u64` - Scheduled end time
- `clock: &Clock` - Clock reference for timestamps
- `payment: Coin<USDC>` - USDC payment coin
- `ctx: &mut TxContext` - Transaction context

**Returns:**

- `(address, Coin<USDC>)` - Tuple of room ID and change amount

**What it does:**

- Validates currency is USDC
- Checks payment sufficiency (entry fee or sponsor amount)
- Creates room with creator as first participant
- Adds payment to treasury
- Emits RoomCreated event
- Returns room ID and any change from payment

### Room Management

#### `join_room`

Allows a player to join an existing game room.

**Parameters:**

- `store: &mut GameRoomStore` - Reference to the game room store
- `room_id: address` - Room ID to join
- `room_code: String` - Private room code (if applicable)
- `entry_fee_payment: Coin<USDC>` - USDC payment for entry fee
- `clock: &Clock` - Clock reference
- `ctx: &mut TxContext` - Transaction context

**Returns:**

- `(address, Coin<USDC>)` - Tuple of participant ID and change amount

**What it does:**

- Validates room exists and is joinable
- Checks private room code if applicable
- Verifies room capacity and status
- Creates participant record
- Adds entry fee to prize pool and treasury
- Emits PlayerJoined event
- Returns participant ID and change

#### `leave_room`

Allows a player to leave a room (admin-sponsored transaction).

**Parameters:**

- `store: &mut GameRoomStore` - Reference to the game room store
- `player: address` - Player address leaving
- `room_id: address` - Room ID
- `clock: &Clock` - Clock reference
- `ctx: &mut TxContext` - Transaction context

**Returns:**

- `Coin<USDC>` - Refund amount (if applicable)

**What it does:**

- Removes player from participant list
- Updates room player count
- Marks participant as inactive
- Refunds entry fee if not sponsored
- Emits PlayerLeft event
- Returns refund coin

#### `cancel_room`

Allows room creator to cancel a room (admin-sponsored transaction).

**Parameters:**

- `store: &mut GameRoomStore` - Reference to the game room store
- `sender: address` - Sender address (must be creator)
- `room_id: address` - Room ID to cancel
- `clock: &Clock` - Clock reference
- `ctx: &mut TxContext` - Transaction context

**Returns:**

- `Coin<USDC>` - Creator's refund amount

**What it does:**

- Validates caller is room creator
- Checks room is in waiting state
- Marks room as cancelled
- Refunds all participants
- Emits RoomCancelled event
- Returns creator's refund

### Game Lifecycle

#### `start_game`

Starts a game in a waiting room.

**Parameters:**

- `store: &mut GameRoomStore` - Reference to the game room store
- `room_id: address` - Room ID to start
- `clock: &Clock` - Clock reference
- `ctx: &mut TxContext` - Transaction context

**Returns:**

- None

**What it does:**

- Validates caller is room creator
- Checks room is in waiting state
- Verifies minimum player count
- Changes status to ongoing
- Records actual start time
- Emits RoomStarted event

#### `complete_game`

Completes a game and distributes prizes.

**Parameters:**

- `store: &mut GameRoomStore` - Reference to the game room store
- `room_id: address` - Room ID to complete
- `winner_addresses: vector<address>` - List of winner addresses
- `scores: vector<u64>` - List of winner scores
- `clock: &Clock` - Clock reference
- `ctx: &mut TxContext` - Transaction context

**Returns:**

- None

**What it does:**

- Marks room as completed
- Calculates platform fee (7%)
- Distributes prizes based on winner split rule
- Updates participant records
- Transfers prizes to winners
- Emits GameCompleted event

### Query Functions

#### `fetch_room`

Retrieves room details by ID.

**Parameters:**

- `store: &GameRoomStore` - Reference to the game room store
- `room_id: address` - Room ID to fetch

**Returns:**

- `&GameRoom` - Reference to room data

**What it does:**

- Validates room exists
- Returns room data reference

#### `get_room_participants`

Gets all participants in a room.

**Parameters:**

- `store: &GameRoomStore` - Reference to the game room store
- `room_id: address` - Room ID

**Returns:**

- `&Table<address, GameRoomParticipant>` - Reference to participants table

**What it does:**

- Returns table of all room participants

#### `get_room_details`

Gets room details (alias for fetch_room).

**Parameters:**

- `store: &GameRoomStore` - Reference to the game room store
- `room_id: address` - Room ID

**Returns:**

- `&GameRoom` - Reference to room data

#### `get_game_room_rules`

Gets game room rules and configuration.

**Parameters:**

- `store: &GameRoomStore` - Reference to the game room store
- `room_id: address` - Room ID

**Returns:**

- `(&String, &String, u64, u64, &String)` - Tuple of (split rule, currency, entry fee, max players, status)

#### `get_total_rooms`

Gets total number of rooms created.

**Parameters:**

- `store: &GameRoomStore` - Reference to the game room store

**Returns:**

- `u64` - Total room count

#### `is_player_in_room`

Checks if a player is in a specific room.

**Parameters:**

- `store: &GameRoomStore` - Reference to the game room store
- `room_id: address` - Room ID
- `player: address` - Player address

**Returns:**

- `bool` - True if player is active in room

#### `get_participant_details`

Gets participant details for a specific player.

**Parameters:**

- `store: &GameRoomStore` - Reference to the game room store
- `room_id: address` - Room ID
- `player: address` - Player address

**Returns:**

- `&GameRoomParticipant` - Reference to participant data

## Winner Split Rules

The contract supports several prize distribution rules:

- **winner_takes_all**: 100% to 1st place
- **top_2**: 60% to 1st, 40% to 2nd
- **top_3**: 50% to 1st, 30% to 2nd, 20% to 3rd
- **top_4**: 40% to 1st, 30% to 2nd, 20% to 3rd, 10% to 4th
- **top_5**: 30% to 1st, 25% to 2nd, 20% to 3rd, 15% to 4th, 10% to 5th
- **top_10**: Progressive distribution from 20% down to 7%

## Events

The contract emits several events for tracking:

- **RoomCreated**: When a new room is created
- **PlayerJoined**: When a player joins a room
- **PlayerLeft**: When a player leaves a room
- **RoomStarted**: When a game starts
- **GameCompleted**: When a game finishes
- **RoomCancelled**: When a room is cancelled

## Security Features

- Only room creators can start games
- Only room creators can cancel rooms
- Private rooms require access codes
- Platform fees are automatically collected
- Entry fees are held in treasury until distribution
- Admin-sponsored transactions for sensitive operations

## Testing Support

The contract includes test-only helper functions for unit testing:

- `init_store_for_testing`
- `new_clock_for_testing`
- `new_tx_context_for_testing`
- `mint_usdc_for_testing`
- `join_room_as` (for testing with specific player addresses)
- `leave_room_as` (for testing with specific player addresses)
- `set_room_creator_for_testing`

## Usage Examples

### Creating a Room

```move
let (room_id, change) = create_room_with_usdc(
    &mut store,
    "My Game Room",
    "game_123",
    1000000, // 1 USDC (6 decimals)
    "USDC",
    10,
    false,
    "",
    false,
    0,
    "top_3",
    start_time,
    end_time,
    &clock,
    payment,
    ctx
);
```

### Joining a Room

```move
let (participant_id, change) = join_room(
    &mut store,
    room_id,
    "",
    entry_fee_payment,
    &clock,
    ctx
);
```

### Starting a Game

```move
start_game(&mut store, room_id, &clock, ctx);
```

### Completing a Game

```move
complete_game(
    &mut store,
    room_id,
    vector[winner1, winner2, winner3],
    vector[100, 80, 60],
    &clock,
    ctx
);
```

## Notes

- All monetary amounts are in USDC with 6 decimal places
- Timestamps are in milliseconds
- The contract only accepts USDC for payments
- Platform fees are automatically deducted from prize pools
- Room cancellation is only possible in waiting state
- Games can only be started by room creators
- Prize distribution is automatic based on configured rules
