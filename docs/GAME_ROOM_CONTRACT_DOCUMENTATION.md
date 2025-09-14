<a name="game_room_game_room"></a>

# Module `game_room::game_room`

Module: game_room

- [Struct `GameRoom`](#game_room_game_room_GameRoom)
- [Struct `CompletionSignature`](#game_room_game_room_CompletionSignature)
- [Struct `GameRoomParticipant`](#game_room_game_room_GameRoomParticipant)
- [Struct `RoomManagerCap`](#game_room_game_room_RoomManagerCap)
- [Struct `RoomCreated`](#game_room_game_room_RoomCreated)
- [Struct `PlayerJoined`](#game_room_game_room_PlayerJoined)
- [Struct `PlayerLeft`](#game_room_game_room_PlayerLeft)
- [Struct `RoomStarted`](#game_room_game_room_RoomStarted)
- [Struct `GameCompleted`](#game_room_game_room_GameCompleted)
- [Struct `RoomCancelled`](#game_room_game_room_RoomCancelled)
- [Struct `SignatureCollected`](#game_room_game_room_SignatureCollected)
- [Struct `GameRoomStore`](#game_room_game_room_GameRoomStore)
- [Constants](#@Constants_0)
- [Function `init_for_coin`](#game_room_game_room_init_for_coin)
- [Function `create_room`](#game_room_game_room_create_room)
- [Function `fetch_room`](#game_room_game_room_fetch_room)
- [Function `join_room`](#game_room_game_room_join_room)
- [Function `leave_room`](#game_room_game_room_leave_room)
- [Function `cancel_room`](#game_room_game_room_cancel_room)
- [Function `get_room_participants`](#game_room_game_room_get_room_participants)
- [Function `get_room_details`](#game_room_game_room_get_room_details)
- [Function `collect_completion_signature`](#game_room_game_room_collect_completion_signature)
- [Function `complete_game`](#game_room_game_room_complete_game)
- [Function `start_game`](#game_room_game_room_start_game)
- [Function `get_game_room_rules`](#game_room_game_room_get_game_room_rules)
- [Function `room_exists`](#game_room_game_room_room_exists)
- [Function `get_total_rooms`](#game_room_game_room_get_total_rooms)
- [Function `is_player_in_room`](#game_room_game_room_is_player_in_room)
- [Function `get_participant_details`](#game_room_game_room_get_participant_details)
- [Function `get_signature_status`](#game_room_game_room_get_signature_status)
- [Function `has_signed`](#game_room_game_room_has_signed)

<pre><code><b>use</b> <a href="../dependencies/std/address.md#std_address">std::address</a>;
<b>use</b> <a href="../dependencies/std/ascii.md#std_ascii">std::ascii</a>;
<b>use</b> <a href="../dependencies/std/bcs.md#std_bcs">std::bcs</a>;
<b>use</b> <a href="../dependencies/std/option.md#std_option">std::option</a>;
<b>use</b> <a href="../dependencies/std/string.md#std_string">std::string</a>;
<b>use</b> <a href="../dependencies/std/type_name.md#std_type_name">std::type_name</a>;
<b>use</b> <a href="../dependencies/std/vector.md#std_vector">std::vector</a>;
<b>use</b> <a href="../dependencies/sui/accumulator.md#sui_accumulator">sui::accumulator</a>;
<b>use</b> <a href="../dependencies/sui/address.md#sui_address">sui::address</a>;
<b>use</b> <a href="../dependencies/sui/bag.md#sui_bag">sui::bag</a>;
<b>use</b> <a href="../dependencies/sui/balance.md#sui_balance">sui::balance</a>;
<b>use</b> <a href="../dependencies/sui/clock.md#sui_clock">sui::clock</a>;
<b>use</b> <a href="../dependencies/sui/coin.md#sui_coin">sui::coin</a>;
<b>use</b> <a href="../dependencies/sui/config.md#sui_config">sui::config</a>;
<b>use</b> <a href="../dependencies/sui/deny_list.md#sui_deny_list">sui::deny_list</a>;
<b>use</b> <a href="../dependencies/sui/dynamic_field.md#sui_dynamic_field">sui::dynamic_field</a>;
<b>use</b> <a href="../dependencies/sui/dynamic_object_field.md#sui_dynamic_object_field">sui::dynamic_object_field</a>;
<b>use</b> <a href="../dependencies/sui/event.md#sui_event">sui::event</a>;
<b>use</b> <a href="../dependencies/sui/hex.md#sui_hex">sui::hex</a>;
<b>use</b> <a href="../dependencies/sui/object.md#sui_object">sui::object</a>;
<b>use</b> <a href="../dependencies/sui/party.md#sui_party">sui::party</a>;
<b>use</b> <a href="../dependencies/sui/table.md#sui_table">sui::table</a>;
<b>use</b> <a href="../dependencies/sui/transfer.md#sui_transfer">sui::transfer</a>;
<b>use</b> <a href="../dependencies/sui/tx_context.md#sui_tx_context">sui::tx_context</a>;
<b>use</b> <a href="../dependencies/sui/types.md#sui_types">sui::types</a>;
<b>use</b> <a href="../dependencies/sui/url.md#sui_url">sui::url</a>;
<b>use</b> <a href="../dependencies/sui/vec_map.md#sui_vec_map">sui::vec_map</a>;
<b>use</b> <a href="../dependencies/sui/vec_set.md#sui_vec_set">sui::vec_set</a>;
</code></pre>

<a name="game_room_game_room_GameRoom"></a>

## Struct `GameRoom`

<pre><code><b>public</b> <b>struct</b> <a href="../game_room/game_room.md#game_room_game_room_GameRoom">GameRoom</a> <b>has</b> key, store
</code></pre>

<details>
<summary>Fields</summary>

<dl>
<dt>
<code>id: <a href="../dependencies/sui/object.md#sui_object_UID">sui::object::UID</a></code>
</dt>
<dd>
</dd>
<dt>
<code>name: <a href="../dependencies/std/string.md#std_string_String">std::string::String</a></code>
</dt>
<dd>
</dd>
<dt>
<code>game_id: <a href="../dependencies/std/string.md#std_string_String">std::string::String</a></code>
</dt>
<dd>
</dd>
<dt>
<code>entry_fee: u64</code>
</dt>
<dd>
</dd>
<dt>
<code>currency: <a href="../dependencies/std/string.md#std_string_String">std::string::String</a></code>
</dt>
<dd>
</dd>
<dt>
<code>max_players: u64</code>
</dt>
<dd>
</dd>
<dt>
<code>current_players: u64</code>
</dt>
<dd>
</dd>
<dt>
<code>is_private: bool</code>
</dt>
<dd>
</dd>
<dt>
<code>room_code: <a href="../dependencies/std/string.md#std_string_String">std::string::String</a></code>
</dt>
<dd>
</dd>
<dt>
<code>is_sponsored: bool</code>
</dt>
<dd>
</dd>
<dt>
<code>is_special: bool</code>
</dt>
<dd>
</dd>
<dt>
<code>sponsor_amount: u64</code>
</dt>
<dd>
</dd>
<dt>
<code>winner_split_rule: <a href="../dependencies/std/string.md#std_string_String">std::string::String</a></code>
</dt>
<dd>
</dd>
<dt>
<code>status: <a href="../dependencies/std/string.md#std_string_String">std::string::String</a></code>
</dt>
<dd>
</dd>
<dt>
<code>start_time: u64</code>
</dt>
<dd>
</dd>
<dt>
<code>end_time: u64</code>
</dt>
<dd>
</dd>
<dt>
<code>total_prize_pool: u64</code>
</dt>
<dd>
</dd>
<dt>
<code>platform_fee_collected: u64</code>
</dt>
<dd>
</dd>
<dt>
<code>created_at: u64</code>
</dt>
<dd>
</dd>
<dt>
<code>updated_at: u64</code>
</dt>
<dd>
</dd>
<dt>
<code>creator: <b>address</b></code>
</dt>
<dd>
</dd>
<dt>
<code>participant_vector: vector&lt;<b>address</b>&gt;</code>
</dt>
<dd>
</dd>
<dt>
<code>participants: <a href="../dependencies/sui/table.md#sui_table_Table">sui::table::Table</a>&lt;<b>address</b>, <a href="../game_room/game_room.md#game_room_game_room_GameRoomParticipant">game_room::game_room::GameRoomParticipant</a>&gt;</code>
</dt>
<dd>
</dd>
<dt>
<code>min_players_to_start: u64</code>
</dt>
<dd>
</dd>
<dt>
<code>actual_start_time: u64</code>
</dt>
<dd>
</dd>
<dt>
<code>actual_end_time: u64</code>
</dt>
<dd>
</dd>
<dt>
<code>signatures: <a href="../dependencies/sui/table.md#sui_table_Table">sui::table::Table</a>&lt;<b>address</b>, <a href="../game_room/game_room.md#game_room_game_room_CompletionSignature">game_room::game_room::CompletionSignature</a>&gt;</code>
</dt>
<dd>
</dd>
<dt>
<code>required_signatures: u64</code>
</dt>
<dd>
</dd>
<dt>
<code>collected_signatures: u64</code>
</dt>
<dd>
</dd>
</dl>

</details>

<a name="game_room_game_room_CompletionSignature"></a>

## Struct `CompletionSignature`

<pre><code><b>public</b> <b>struct</b> <a href="../game_room/game_room.md#game_room_game_room_CompletionSignature">CompletionSignature</a> <b>has</b> key, store
</code></pre>

<details>
<summary>Fields</summary>

<dl>
<dt>
<code>id: <a href="../dependencies/sui/object.md#sui_object_UID">sui::object::UID</a></code>
</dt>
<dd>
</dd>
<dt>
<code>room_id: <b>address</b></code>
</dt>
<dd>
</dd>
<dt>
<code>signer: <b>address</b></code>
</dt>
<dd>
</dd>
<dt>
<code>signature_data: vector&lt;u8&gt;</code>
</dt>
<dd>
</dd>
<dt>
<code>signed_at: u64</code>
</dt>
<dd>
</dd>
<dt>
<code>is_creator: bool</code>
</dt>
<dd>
</dd>
</dl>

</details>

<a name="game_room_game_room_GameRoomParticipant"></a>

## Struct `GameRoomParticipant`

<pre><code><b>public</b> <b>struct</b> <a href="../game_room/game_room.md#game_room_game_room_GameRoomParticipant">GameRoomParticipant</a> <b>has</b> key, store
</code></pre>

<details>
<summary>Fields</summary>

<dl>
<dt>
<code>id: <a href="../dependencies/sui/object.md#sui_object_UID">sui::object::UID</a></code>
</dt>
<dd>
</dd>
<dt>
<code>player_id: <b>address</b></code>
</dt>
<dd>
</dd>
<dt>
<code>score: u64</code>
</dt>
<dd>
</dd>
<dt>
<code>wallet_address: <b>address</b></code>
</dt>
<dd>
</dd>
<dt>
<code>entry_fee_paid: u64</code>
</dt>
<dd>
</dd>
<dt>
<code>entry_fee_transaction_id: <a href="../dependencies/sui/object.md#sui_object_UID">sui::object::UID</a></code>
</dt>
<dd>
</dd>
<dt>
<code>payout_transaction_id: <a href="../dependencies/sui/object.md#sui_object_UID">sui::object::UID</a></code>
</dt>
<dd>
</dd>
<dt>
<code>payout_amount: u64</code>
</dt>
<dd>
</dd>
<dt>
<code>joined_at: u64</code>
</dt>
<dd>
</dd>
<dt>
<code>is_active: bool</code>
</dt>
<dd>
</dd>
<dt>
<code>left_at: u64</code>
</dt>
<dd>
</dd>
<dt>
<code>is_winner: bool</code>
</dt>
<dd>
</dd>
<dt>
<code>earnings: u64</code>
</dt>
<dd>
</dd>
</dl>

</details>

<a name="game_room_game_room_RoomManagerCap"></a>

## Struct `RoomManagerCap`

<pre><code><b>public</b> <b>struct</b> <a href="../game_room/game_room.md#game_room_game_room_RoomManagerCap">RoomManagerCap</a> <b>has</b> key, store
</code></pre>

<details>
<summary>Fields</summary>

<dl>
<dt>
<code>id: <a href="../dependencies/sui/object.md#sui_object_UID">sui::object::UID</a></code>
</dt>
<dd>
</dd>
</dl>

</details>

<a name="game_room_game_room_RoomCreated"></a>

## Struct `RoomCreated`

<pre><code><b>public</b> <b>struct</b> <a href="../game_room/game_room.md#game_room_game_room_RoomCreated">RoomCreated</a> <b>has</b> <b>copy</b>, drop
</code></pre>

<details>
<summary>Fields</summary>

<dl>
<dt>
<code>room_id: <b>address</b></code>
</dt>
<dd>
</dd>
<dt>
<code>creator: <b>address</b></code>
</dt>
<dd>
</dd>
<dt>
<code>name: <a href="../dependencies/std/string.md#std_string_String">std::string::String</a></code>
</dt>
<dd>
</dd>
<dt>
<code>entry_fee: u64</code>
</dt>
<dd>
</dd>
<dt>
<code>max_players: u64</code>
</dt>
<dd>
</dd>
<dt>
<code>is_sponsored: bool</code>
</dt>
<dd>
</dd>
<dt>
<code>is_private: bool</code>
</dt>
<dd>
</dd>
</dl>

</details>

<a name="game_room_game_room_PlayerJoined"></a>

## Struct `PlayerJoined`

<pre><code><b>public</b> <b>struct</b> <a href="../game_room/game_room.md#game_room_game_room_PlayerJoined">PlayerJoined</a> <b>has</b> <b>copy</b>, drop
</code></pre>

<details>
<summary>Fields</summary>

<dl>
<dt>
<code>room_id: <b>address</b></code>
</dt>
<dd>
</dd>
<dt>
<code>player: <b>address</b></code>
</dt>
<dd>
</dd>
<dt>
<code>entry_fee_paid: u64</code>
</dt>
<dd>
</dd>
</dl>

</details>

<a name="game_room_game_room_PlayerLeft"></a>

## Struct `PlayerLeft`

<pre><code><b>public</b> <b>struct</b> <a href="../game_room/game_room.md#game_room_game_room_PlayerLeft">PlayerLeft</a> <b>has</b> <b>copy</b>, drop
</code></pre>

<details>
<summary>Fields</summary>

<dl>
<dt>
<code>room_id: <b>address</b></code>
</dt>
<dd>
</dd>
<dt>
<code>player: <b>address</b></code>
</dt>
<dd>
</dd>
<dt>
<code>refund_amount: u64</code>
</dt>
<dd>
</dd>
</dl>

</details>

<a name="game_room_game_room_RoomStarted"></a>

## Struct `RoomStarted`

<pre><code><b>public</b> <b>struct</b> <a href="../game_room/game_room.md#game_room_game_room_RoomStarted">RoomStarted</a> <b>has</b> <b>copy</b>, drop
</code></pre>

<details>
<summary>Fields</summary>

<dl>
<dt>
<code>room_id: <b>address</b></code>
</dt>
<dd>
</dd>
<dt>
<code>start_time: u64</code>
</dt>
<dd>
</dd>
<dt>
<code>player_count: u64</code>
</dt>
<dd>
</dd>
</dl>

</details>

<a name="game_room_game_room_GameCompleted"></a>

## Struct `GameCompleted`

<pre><code><b>public</b> <b>struct</b> <a href="../game_room/game_room.md#game_room_game_room_GameCompleted">GameCompleted</a> <b>has</b> <b>copy</b>, drop
</code></pre>

<details>
<summary>Fields</summary>

<dl>
<dt>
<code>room_id: <b>address</b></code>
</dt>
<dd>
</dd>
<dt>
<code>winners: vector&lt;<b>address</b>&gt;</code>
</dt>
<dd>
</dd>
<dt>
<code>total_prize_pool: u64</code>
</dt>
<dd>
</dd>
<dt>
<code>platform_fee: u64</code>
</dt>
<dd>
</dd>
</dl>

</details>

<a name="game_room_game_room_RoomCancelled"></a>

## Struct `RoomCancelled`

<pre><code><b>public</b> <b>struct</b> <a href="../game_room/game_room.md#game_room_game_room_RoomCancelled">RoomCancelled</a> <b>has</b> <b>copy</b>, drop
</code></pre>

<details>
<summary>Fields</summary>

<dl>
<dt>
<code>room_id: <b>address</b></code>
</dt>
<dd>
</dd>
<dt>
<code>creator: <b>address</b></code>
</dt>
<dd>
</dd>
<dt>
<code>refund_amount: u64</code>
</dt>
<dd>
</dd>
</dl>

</details>

<a name="game_room_game_room_SignatureCollected"></a>

## Struct `SignatureCollected`

<pre><code><b>public</b> <b>struct</b> <a href="../game_room/game_room.md#game_room_game_room_SignatureCollected">SignatureCollected</a> <b>has</b> <b>copy</b>, drop
</code></pre>

<details>
<summary>Fields</summary>

<dl>
<dt>
<code>room_id: <b>address</b></code>
</dt>
<dd>
</dd>
<dt>
<code>signer: <b>address</b></code>
</dt>
<dd>
</dd>
<dt>
<code>is_creator: bool</code>
</dt>
<dd>
</dd>
<dt>
<code>total_signatures: u64</code>
</dt>
<dd>
</dd>
<dt>
<code>collected_signatures: u64</code>
</dt>
<dd>
</dd>
</dl>

</details>

<a name="game_room_game_room_GameRoomStore"></a>

## Struct `GameRoomStore`

<pre><code><b>public</b> <b>struct</b> <a href="../game_room/game_room.md#game_room_game_room_GameRoomStore">GameRoomStore</a>&lt;<b>phantom</b> T&gt; <b>has</b> key, store
</code></pre>

<details>
<summary>Fields</summary>

<dl>
<dt>
<code>id: <a href="../dependencies/sui/object.md#sui_object_UID">sui::object::UID</a></code>
</dt>
<dd>
</dd>
<dt>
<code>room_manager_cap: <a href="../game_room/game_room.md#game_room_game_room_RoomManagerCap">game_room::game_room::RoomManagerCap</a></code>
</dt>
<dd>
</dd>
<dt>
<code>rooms: <a href="../dependencies/sui/table.md#sui_table_Table">sui::table::Table</a>&lt;<b>address</b>, <a href="../game_room/game_room.md#game_room_game_room_GameRoom">game_room::game_room::GameRoom</a>&gt;</code>
</dt>
<dd>
</dd>
<dt>
<code>room_counter: u64</code>
</dt>
<dd>
</dd>
<dt>
<code>treasury: <a href="../dependencies/sui/balance.md#sui_balance_Balance">sui::balance::Balance</a>&lt;T&gt;</code>
</dt>
<dd>
</dd>
</dl>

</details>

<a name="@Constants_0"></a>

## Constants

<a name="game_room_game_room_ERoomFull"></a>

<pre><code><b>const</b> <a href="../game_room/game_room.md#game_room_game_room_ERoomFull">ERoomFull</a>: u64 = 1;
</code></pre>

<a name="game_room_game_room_ERoomNotFound"></a>

<pre><code><b>const</b> <a href="../game_room/game_room.md#game_room_game_room_ERoomNotFound">ERoomNotFound</a>: u64 = 2;
</code></pre>

<a name="game_room_game_room_EInsufficientEntryFee"></a>

<pre><code><b>const</b> <a href="../game_room/game_room.md#game_room_game_room_EInsufficientEntryFee">EInsufficientEntryFee</a>: u64 = 3;
</code></pre>

<a name="game_room_game_room_ENotRoomCreator"></a>

<pre><code><b>const</b> <a href="../game_room/game_room.md#game_room_game_room_ENotRoomCreator">ENotRoomCreator</a>: u64 = 4;
</code></pre>

<a name="game_room_game_room_ERoomNotInWaitingState"></a>

<pre><code><b>const</b> <a href="../game_room/game_room.md#game_room_game_room_ERoomNotInWaitingState">ERoomNotInWaitingState</a>: u64 = 5;
</code></pre>

<a name="game_room_game_room_ERoomCancelled"></a>

<pre><code><b>const</b> <a href="../game_room/game_room.md#game_room_game_room_ERoomCancelled">ERoomCancelled</a>: u64 = 7;
</code></pre>

<a name="game_room_game_room_ERoomCompleted"></a>

<pre><code><b>const</b> <a href="../game_room/game_room.md#game_room_game_room_ERoomCompleted">ERoomCompleted</a>: u64 = 8;
</code></pre>

<a name="game_room_game_room_EPlayerNotInRoom"></a>

<pre><code><b>const</b> <a href="../game_room/game_room.md#game_room_game_room_EPlayerNotInRoom">EPlayerNotInRoom</a>: u64 = 9;
</code></pre>

<a name="game_room_game_room_EInsufficientPlayers"></a>

<pre><code><b>const</b> <a href="../game_room/game_room.md#game_room_game_room_EInsufficientPlayers">EInsufficientPlayers</a>: u64 = 10;
</code></pre>

<a name="game_room_game_room_EInvalidWinnerCount"></a>

<pre><code><b>const</b> <a href="../game_room/game_room.md#game_room_game_room_EInvalidWinnerCount">EInvalidWinnerCount</a>: u64 = 11;
</code></pre>

<a name="game_room_game_room_EInvalidRoomCode"></a>

<pre><code><b>const</b> <a href="../game_room/game_room.md#game_room_game_room_EInvalidRoomCode">EInvalidRoomCode</a>: u64 = 12;
</code></pre>

<a name="game_room_game_room_EInsufficientSponsorAmount"></a>

<pre><code><b>const</b> <a href="../game_room/game_room.md#game_room_game_room_EInsufficientSponsorAmount">EInsufficientSponsorAmount</a>: u64 = 13;
</code></pre>

<a name="game_room_game_room_EAlreadyInRoom"></a>

<pre><code><b>const</b> <a href="../game_room/game_room.md#game_room_game_room_EAlreadyInRoom">EAlreadyInRoom</a>: u64 = 14;
</code></pre>

<a name="game_room_game_room_EInsufficientSignatures"></a>

<pre><code><b>const</b> <a href="../game_room/game_room.md#game_room_game_room_EInsufficientSignatures">EInsufficientSignatures</a>: u64 = 15;
</code></pre>

<a name="game_room_game_room_EAlreadySigned"></a>

<pre><code><b>const</b> <a href="../game_room/game_room.md#game_room_game_room_EAlreadySigned">EAlreadySigned</a>: u64 = 16;
</code></pre>

<a name="game_room_game_room_ENotAuthorizedToSign"></a>

<pre><code><b>const</b> <a href="../game_room/game_room.md#game_room_game_room_ENotAuthorizedToSign">ENotAuthorizedToSign</a>: u64 = 17;
</code></pre>

<a name="game_room_game_room_STATUS_WAITING"></a>

<pre><code><b>const</b> <a href="../game_room/game_room.md#game_room_game_room_STATUS_WAITING">STATUS_WAITING</a>: vector&lt;u8&gt; = vector[119, 97, 105, 116, 105, 110, 103];
</code></pre>

<a name="game_room_game_room_STATUS_ONGOING"></a>

<pre><code><b>const</b> <a href="../game_room/game_room.md#game_room_game_room_STATUS_ONGOING">STATUS_ONGOING</a>: vector&lt;u8&gt; = vector[111, 110, 103, 111, 105, 110, 103];
</code></pre>

<a name="game_room_game_room_STATUS_COMPLETED"></a>

<pre><code><b>const</b> <a href="../game_room/game_room.md#game_room_game_room_STATUS_COMPLETED">STATUS_COMPLETED</a>: vector&lt;u8&gt; = vector[99, 111, 109, 112, 108, 101, 116, 101, 100];
</code></pre>

<a name="game_room_game_room_STATUS_CANCELLED"></a>

<pre><code><b>const</b> <a href="../game_room/game_room.md#game_room_game_room_STATUS_CANCELLED">STATUS_CANCELLED</a>: vector&lt;u8&gt; = vector[99, 97, 110, 99, 101, 108, 108, 101, 100];
</code></pre>

<a name="game_room_game_room_PLATFORM_FEE_PERCENTAGE"></a>

<pre><code><b>const</b> <a href="../game_room/game_room.md#game_room_game_room_PLATFORM_FEE_PERCENTAGE">PLATFORM_FEE_PERCENTAGE</a>: u64 = 7;
</code></pre>

<a name="game_room_game_room_ROOM_CREATOR_FEE_PERCENTAGE"></a>

<pre><code><b>const</b> <a href="../game_room/game_room.md#game_room_game_room_ROOM_CREATOR_FEE_PERCENTAGE">ROOM_CREATOR_FEE_PERCENTAGE</a>: u64 = 2;
</code></pre>

<a name="game_room_game_room_FEE_DENOMINATOR"></a>

<pre><code><b>const</b> <a href="../game_room/game_room.md#game_room_game_room_FEE_DENOMINATOR">FEE_DENOMINATOR</a>: u64 = 100;
</code></pre>

<a name="game_room_game_room_ADMIN_ADDRESS"></a>

<pre><code><b>const</b> <a href="../game_room/game_room.md#game_room_game_room_ADMIN_ADDRESS">ADMIN_ADDRESS</a>: <b>address</b> = 0x32572830354edf43effe74bb5f67e3fa6aa99bbc0133b9152fce5e30f45ca841;
</code></pre>

<a name="game_room_game_room_init_for_coin"></a>

## Function `init_for_coin`

<pre><code><b>public</b> <b>fun</b> <a href="../game_room/game_room.md#game_room_game_room_init_for_coin">init_for_coin</a>&lt;T&gt;(ctx: &<b>mut</b> <a href="../dependencies/sui/tx_context.md#sui_tx_context_TxContext">sui::tx_context::TxContext</a>)
</code></pre>

<details>
<summary>Implementation</summary>

<pre><code><b>public</b> <b>fun</b> <a href="../game_room/game_room.md#game_room_game_room_init_for_coin">init_for_coin</a>&lt;T&gt;(ctx: &<b>mut</b> TxContext) {
    <b>let</b> room_manager_cap = <a href="../game_room/game_room.md#game_room_game_room_RoomManagerCap">RoomManagerCap</a> { id: object::new(ctx) };
    <b>let</b> store = <a href="../game_room/game_room.md#game_room_game_room_GameRoomStore">GameRoomStore</a>&lt;T&gt; {
        id: object::new(ctx),
        room_manager_cap,
        rooms: table::new(ctx),
        room_counter: 0,
        treasury: balance::zero&lt;T&gt;(),
    };
    transfer::share_object(store);
}
</code></pre>

</details>

<a name="game_room_game_room_create_room"></a>

## Function `create_room`

Create a new game room by paying with any coin type and returns the room id

<pre><code><b>public</b> <b>fun</b> <a href="../game_room/game_room.md#game_room_game_room_create_room">create_room</a>&lt;T&gt;(store: &<b>mut</b> <a href="../game_room/game_room.md#game_room_game_room_GameRoomStore">game_room::game_room::GameRoomStore</a>&lt;T&gt;, name: <a href="../dependencies/std/string.md#std_string_String">std::string::String</a>, game_id: <a href="../dependencies/std/string.md#std_string_String">std::string::String</a>, entry_fee: u64, currency: <a href="../dependencies/std/string.md#std_string_String">std::string::String</a>, max_players: u64, is_private: bool, room_code: <a href="../dependencies/std/string.md#std_string_String">std::string::String</a>, is_sponsored: bool, is_special: bool, sponsor_amount: u64, winner_split_rule: <a href="../dependencies/std/string.md#std_string_String">std::string::String</a>, start_time: u64, end_time: u64, clock: &<a href="../dependencies/sui/clock.md#sui_clock_Clock">sui::clock::Clock</a>, payment: <a href="../dependencies/sui/coin.md#sui_coin_Coin">sui::coin::Coin</a>&lt;T&gt;, ctx: &<b>mut</b> <a href="../dependencies/sui/tx_context.md#sui_tx_context_TxContext">sui::tx_context::TxContext</a>): (<b>address</b>, <a href="../dependencies/sui/coin.md#sui_coin_Coin">sui::coin::Coin</a>&lt;T&gt;)
</code></pre>

<details>
<summary>Implementation</summary>

<pre><code><b>public</b> <b>fun</b> <a href="../game_room/game_room.md#game_room_game_room_create_room">create_room</a>&lt;T&gt;(
    store: &<b>mut</b> <a href="../game_room/game_room.md#game_room_game_room_GameRoomStore">GameRoomStore</a>&lt;T&gt;,
    name: String,
    game_id: String,
    entry_fee: u64,
    currency: String,
    max_players: u64,
    is_private: bool,
    room_code: String,
    is_sponsored: bool,
    is_special: bool,
    sponsor_amount: u64,
    winner_split_rule: String,
    start_time: u64,
    end_time: u64,
    clock: &Clock,
    <b>mut</b> payment: Coin&lt;T&gt;,
    ctx: &<b>mut</b> TxContext,
): (<b>address</b>, Coin&lt;T&gt;) {
    <b>let</b> current_time = clock::timestamp_ms(clock);
    <b>let</b> creator = tx_context::sender(ctx);
    // Validate payment amounts
    <b>if</b> (is_sponsored) {
        <b>assert</b>!(coin::value(&payment) &gt;= sponsor_amount, <a href="../game_room/game_room.md#game_room_game_room_EInsufficientSponsorAmount">EInsufficientSponsorAmount</a>);
    } <b>else</b> {
        <b>assert</b>!(coin::value(&payment) &gt;= entry_fee, <a href="../game_room/game_room.md#game_room_game_room_EInsufficientEntryFee">EInsufficientEntryFee</a>);
    };
    <b>let</b> initial_pool = <b>if</b> (is_sponsored) { sponsor_amount } <b>else</b> { entry_fee };
    <b>let</b> creator_participant = <a href="../game_room/game_room.md#game_room_game_room_GameRoomParticipant">GameRoomParticipant</a> {
        id: object::new(ctx),
        player_id: creator,
        score: 0,
        wallet_address: creator,
        entry_fee_paid: <b>if</b> (is_sponsored) { 0 } <b>else</b> { entry_fee },
        entry_fee_transaction_id: object::new(ctx),
        payout_transaction_id: object::new(ctx),
        payout_amount: 0,
        joined_at: current_time,
        is_active: <b>true</b>,
        left_at: 0,
        is_winner: <b>false</b>,
        earnings: 0,
    };
    // initialize a table
    <b>let</b> <b>mut</b> participants_table = table::new(ctx);
    table::add(&<b>mut</b> participants_table, creator, creator_participant);
    <b>let</b> room_name_bytes = string::into_bytes(name);
    <b>let</b> room_name_for_event = string::utf8(room_name_bytes);
    <b>let</b> name = string::utf8(string::into_bytes(room_name_for_event));
    <b>let</b> room = <a href="../game_room/game_room.md#game_room_game_room_GameRoom">GameRoom</a> {
        id: object::new(ctx),
        name,
        game_id,
        entry_fee,
        currency,
        max_players,
        current_players: 1,
        is_private,
        room_code,
        is_sponsored,
        is_special,
        sponsor_amount,
        winner_split_rule,
        status: string::utf8(<a href="../game_room/game_room.md#game_room_game_room_STATUS_WAITING">STATUS_WAITING</a>),
        start_time,
        end_time,
        total_prize_pool: initial_pool,
        platform_fee_collected: 0,
        created_at: current_time,
        updated_at: current_time,
        creator: creator,
        participant_vector: vector::singleton(creator),
        participants: participants_table,
        min_players_to_start: 1,
        actual_start_time: 0,
        actual_end_time: 0,
        required_signatures: <b>if</b> (is_special) { 2 } <b>else</b> { 0 },
        collected_signatures: 0,
        signatures: table::new(ctx),
    };
    <b>let</b> room_id = object::uid_to_address(&room.id);
    // create participant <b>for</b> creator
    table::add(&<b>mut</b> store.rooms, room_id, room);
    store.room_counter = store.room_counter + 1;
    // <b>move</b> <b>entry</b> fee/sponsor into treasury; compute change to <b>return</b>
    <b>let</b> change: Coin&lt;T&gt;;
    <b>if</b> (!is_sponsored) {
        <b>if</b> (coin::value(&payment) &gt; entry_fee) {
            <b>let</b> taken = coin::split(&<b>mut</b> payment, entry_fee, ctx);
            <b>let</b> treasury_ref = &<b>mut</b> store.treasury;
            coin::put(treasury_ref, taken);
            change = payment;
        } <b>else</b> {
            <b>let</b> treasury_ref = &<b>mut</b> store.treasury;
            coin::put(treasury_ref, payment);
            change = coin::zero&lt;T&gt;(ctx);
        };
    } <b>else</b> {
        <b>if</b> (coin::value(&payment) &gt; sponsor_amount) {
            <b>let</b> taken = coin::split(&<b>mut</b> payment, sponsor_amount, ctx);
            <b>let</b> treasury_ref = &<b>mut</b> store.treasury;
            coin::put(treasury_ref, taken);
            change = payment;
        } <b>else</b> {
            <b>let</b> treasury_ref = &<b>mut</b> store.treasury;
            coin::put(treasury_ref, payment);
            change = coin::zero&lt;T&gt;(ctx);
        };
    };
    event::emit(<a href="../game_room/game_room.md#game_room_game_room_RoomCreated">RoomCreated</a> {
        room_id,
        creator: creator,
        name: room_name_for_event,
        is_sponsored,
        entry_fee,
        max_players,
        is_private,
    });
    (room_id, change)
}
</code></pre>

</details>

<a name="game_room_game_room_fetch_room"></a>

## Function `fetch_room`

Fetch room details by room ID

<pre><code><b>public</b> <b>fun</b> <a href="../game_room/game_room.md#game_room_game_room_fetch_room">fetch_room</a>&lt;T&gt;(store: &<a href="../game_room/game_room.md#game_room_game_room_GameRoomStore">game_room::game_room::GameRoomStore</a>&lt;T&gt;, room_id: <b>address</b>): &<a href="../game_room/game_room.md#game_room_game_room_GameRoom">game_room::game_room::GameRoom</a>
</code></pre>

<details>
<summary>Implementation</summary>

<pre><code><b>public</b> <b>fun</b> <a href="../game_room/game_room.md#game_room_game_room_fetch_room">fetch_room</a>&lt;T&gt;(store: &<a href="../game_room/game_room.md#game_room_game_room_GameRoomStore">GameRoomStore</a>&lt;T&gt;, room_id: <b>address</b>): &<a href="../game_room/game_room.md#game_room_game_room_GameRoom">GameRoom</a> {
    <b>assert</b>!(table::contains(&store.rooms, room_id), <a href="../game_room/game_room.md#game_room_game_room_ERoomNotFound">ERoomNotFound</a>);
    table::borrow(&store.rooms, room_id)
}
</code></pre>

</details>

<a name="game_room_game_room_join_room"></a>

## Function `join_room`

Join room after paying the required entry fee

<pre><code><b>public</b> <b>fun</b> <a href="../game_room/game_room.md#game_room_game_room_join_room">join_room</a>&lt;T&gt;(store: &<b>mut</b> <a href="../game_room/game_room.md#game_room_game_room_GameRoomStore">game_room::game_room::GameRoomStore</a>&lt;T&gt;, room_id: <b>address</b>, room_code: <a href="../dependencies/std/string.md#std_string_String">std::string::String</a>, entry_fee_payment: <a href="../dependencies/sui/coin.md#sui_coin_Coin">sui::coin::Coin</a>&lt;T&gt;, clock: &<a href="../dependencies/sui/clock.md#sui_clock_Clock">sui::clock::Clock</a>, ctx: &<b>mut</b> <a href="../dependencies/sui/tx_context.md#sui_tx_context_TxContext">sui::tx_context::TxContext</a>): (<b>address</b>, <a href="../dependencies/sui/coin.md#sui_coin_Coin">sui::coin::Coin</a>&lt;T&gt;)
</code></pre>

<details>
<summary>Implementation</summary>

<pre><code><b>public</b> <b>fun</b> <a href="../game_room/game_room.md#game_room_game_room_join_room">join_room</a>&lt;T&gt;(
    store: &<b>mut</b> <a href="../game_room/game_room.md#game_room_game_room_GameRoomStore">GameRoomStore</a>&lt;T&gt;,
    room_id: <b>address</b>,
    room_code: String,
    <b>mut</b> entry_fee_payment: Coin&lt;T&gt;,
    clock: &Clock,
    ctx: &<b>mut</b> TxContext,
): (<b>address</b>, Coin&lt;T&gt;) {
    <b>let</b> room = table::borrow_mut(&<b>mut</b> store.rooms, room_id);
    // Check <b>if</b> room is private and code matches
    <b>if</b> (room.is_private) {
        <b>assert</b>!(
            string::as_bytes(&room.room_code) == string::as_bytes(&room_code),
            <a href="../game_room/game_room.md#game_room_game_room_EInvalidRoomCode">EInvalidRoomCode</a>,
        );
    };
    // Check <b>if</b> room is full
    <b>assert</b>!(room.current_players &lt; room.max_players, <a href="../game_room/game_room.md#game_room_game_room_ERoomFull">ERoomFull</a>);
    <b>let</b> canceled: vector&lt;u8&gt; = <a href="../game_room/game_room.md#game_room_game_room_STATUS_CANCELLED">STATUS_CANCELLED</a>;
    <b>let</b> complete: vector&lt;u8&gt; = <a href="../game_room/game_room.md#game_room_game_room_STATUS_COMPLETED">STATUS_COMPLETED</a>;
    // Check <b>if</b> room is not cancelled or completed
    <b>assert</b>!(string::as_bytes(&room.status) != canceled, <a href="../game_room/game_room.md#game_room_game_room_ERoomCancelled">ERoomCancelled</a>);
    <b>assert</b>!(string::as_bytes(&room.status) != complete, <a href="../game_room/game_room.md#game_room_game_room_ERoomCompleted">ERoomCompleted</a>);
    // Check <b>if</b> <b>entry</b> fee is sufficient (unless sponsored)
    <b>if</b> (!room.is_sponsored) {
        <b>assert</b>!(coin::value(&entry_fee_payment) &gt;= room.entry_fee, <a href="../game_room/game_room.md#game_room_game_room_EInsufficientEntryFee">EInsufficientEntryFee</a>);
    };
    <b>let</b> current_time = clock::timestamp_ms(clock);
    <b>let</b> player = tx_context::sender(ctx);
    // Prevent duplicate joins
    <b>assert</b>!(!table::contains(&room.participants, player), <a href="../game_room/game_room.md#game_room_game_room_EAlreadyInRoom">EAlreadyInRoom</a>);
    // Create participant
    <b>let</b> participant = <a href="../game_room/game_room.md#game_room_game_room_GameRoomParticipant">GameRoomParticipant</a> {
        id: object::new(ctx),
        player_id: player,
        score: 0,
        wallet_address: player,
        entry_fee_paid: <b>if</b> (room.is_sponsored) { 0 } <b>else</b> { room.entry_fee },
        entry_fee_transaction_id: object::new(ctx),
        payout_transaction_id: object::new(ctx),
        payout_amount: 0,
        joined_at: current_time,
        is_active: <b>true</b>,
        left_at: 0,
        is_winner: <b>false</b>,
        earnings: 0,
    };
    <b>let</b> participant_id = object::uid_to_address(&participant.id);
    // Add to room
    room.current_players = room.current_players + 1;
    room.updated_at = current_time;
    vector::push_back(&<b>mut</b> room.participant_vector, player);
    // Add to global participants table
    table::add(&<b>mut</b> room.participants, player, participant);
    // Add <b>entry</b> fee to prize pool and treasury <b>if</b> not sponsored; compute change
    <b>let</b> change: Coin&lt;T&gt;;
    <b>if</b> (!room.is_sponsored) {
        <b>if</b> (coin::value(&entry_fee_payment) &gt; room.entry_fee) {
            <b>let</b> taken = coin::split(&<b>mut</b> entry_fee_payment, room.entry_fee, ctx);
            <b>let</b> treasury_ref = &<b>mut</b> store.treasury;
            coin::put(treasury_ref, taken);
            change = entry_fee_payment;
        } <b>else</b> {
            <b>let</b> treasury_ref = &<b>mut</b> store.treasury;
            coin::put(treasury_ref, entry_fee_payment);
            change = coin::zero&lt;T&gt;(ctx);
        };
        room.total_prize_pool = room.total_prize_pool + room.entry_fee;
    } <b>else</b> {
        // No <b>entry</b> fee required; <b>return</b> entire provided coin <b>as</b> change (or zero <b>if</b> caller passed zero)
        change = entry_fee_payment;
    };
    event::emit(<a href="../game_room/game_room.md#game_room_game_room_PlayerJoined">PlayerJoined</a> {
        room_id,
        player,
        entry_fee_paid: <b>if</b> (room.is_sponsored) { 0 } <b>else</b> { room.entry_fee },
    });
    (participant_id, change)
}
</code></pre>

</details>

<a name="game_room_game_room_leave_room"></a>

## Function `leave_room`

Leave room - transaction sponsored by admin

<pre><code><b>public</b> <b>fun</b> <a href="../game_room/game_room.md#game_room_game_room_leave_room">leave_room</a>&lt;T&gt;(store: &<b>mut</b> <a href="../game_room/game_room.md#game_room_game_room_GameRoomStore">game_room::game_room::GameRoomStore</a>&lt;T&gt;, room_id: <b>address</b>, clock: &<a href="../dependencies/sui/clock.md#sui_clock_Clock">sui::clock::Clock</a>, ctx: &<b>mut</b> <a href="../dependencies/sui/tx_context.md#sui_tx_context_TxContext">sui::tx_context::TxContext</a>): <a href="../dependencies/sui/coin.md#sui_coin_Coin">sui::coin::Coin</a>&lt;T&gt;
</code></pre>

<details>
<summary>Implementation</summary>

<pre><code><b>public</b> <b>fun</b> <a href="../game_room/game_room.md#game_room_game_room_leave_room">leave_room</a>&lt;T&gt;(
    store: &<b>mut</b> <a href="../game_room/game_room.md#game_room_game_room_GameRoomStore">GameRoomStore</a>&lt;T&gt;,
    room_id: <b>address</b>,
    clock: &Clock,
    ctx: &<b>mut</b> TxContext,
): Coin&lt;T&gt; {
    <b>let</b> player = tx_context::sender(ctx);
    <b>let</b> room = table::borrow_mut(&<b>mut</b> store.rooms, room_id);
    // Check <b>if</b> room is in waiting state
    <b>let</b> waiting: vector&lt;u8&gt; = <a href="../game_room/game_room.md#game_room_game_room_STATUS_WAITING">STATUS_WAITING</a>;
    <b>assert</b>!(string::as_bytes(&room.status) == waiting, <a href="../game_room/game_room.md#game_room_game_room_ERoomNotInWaitingState">ERoomNotInWaitingState</a>);
    // Remove player from participant_vector <b>if</b> present
    <b>let</b> <b>mut</b> i = 0;
    <b>let</b> <b>mut</b> found = <b>false</b>;
    <b>let</b> vector_length = vector::length(&room.participant_vector);
    <b>if</b> (vector::borrow(&room.participant_vector, vector_length - 1) == &player) {
        vector::pop_back(&<b>mut</b> room.participant_vector);
    }
    <b>else</b>{
        <b>while</b> (i &lt; vector_length && !found) {
            <b>if</b> (vector::borrow(&room.participant_vector, i) == &player) {
                vector::remove(&<b>mut</b> room.participant_vector, i);
                found = <b>true</b>;
            } <b>else</b> {
                i = i + 1;
            };
        };
    };
    room.current_players = room.current_players - 1;
    room.updated_at = clock::timestamp_ms(clock);
    // Update participant status
    <b>let</b> participant = table::borrow_mut(&<b>mut</b> room.participants, player);
    <b>assert</b>!(participant.is_active, <a href="../game_room/game_room.md#game_room_game_room_EPlayerNotInRoom">EPlayerNotInRoom</a>);
    participant.is_active = <b>false</b>;
    participant.left_at = clock::timestamp_ms(clock);
    // Refund <b>entry</b> fee <b>if</b> not sponsored
    <b>let</b> refund_amount = <b>if</b> (room.is_sponsored) { 0 } <b>else</b> { room.entry_fee };
    <b>if</b> (refund_amount &gt; 0) {
        room.total_prize_pool = room.total_prize_pool - refund_amount;
    };
    <b>let</b> treasury_ref = &<b>mut</b> store.treasury;
    <b>let</b> refund = coin::take(treasury_ref, refund_amount, ctx);
    event::emit(<a href="../game_room/game_room.md#game_room_game_room_PlayerLeft">PlayerLeft</a> {
        room_id,
        player,
        refund_amount,
    });
    refund
}
</code></pre>

</details>

<a name="game_room_game_room_cancel_room"></a>

## Function `cancel_room`

Cancel room (creator only) - transaction sponsored by admin

<pre><code><b>public</b> <b>fun</b> <a href="../game_room/game_room.md#game_room_game_room_cancel_room">cancel_room</a>&lt;T&gt;(store: &<b>mut</b> <a href="../game_room/game_room.md#game_room_game_room_GameRoomStore">game_room::game_room::GameRoomStore</a>&lt;T&gt;, room_id: <b>address</b>, clock: &<a href="../dependencies/sui/clock.md#sui_clock_Clock">sui::clock::Clock</a>, ctx: &<b>mut</b> <a href="../dependencies/sui/tx_context.md#sui_tx_context_TxContext">sui::tx_context::TxContext</a>): <a href="../dependencies/sui/coin.md#sui_coin_Coin">sui::coin::Coin</a>&lt;T&gt;
</code></pre>

<details>
<summary>Implementation</summary>

<pre><code><b>public</b> <b>fun</b> <a href="../game_room/game_room.md#game_room_game_room_cancel_room">cancel_room</a>&lt;T&gt;(
    store: &<b>mut</b> <a href="../game_room/game_room.md#game_room_game_room_GameRoomStore">GameRoomStore</a>&lt;T&gt;,
    room_id: <b>address</b>,
    clock: &Clock,
    ctx: &<b>mut</b> TxContext,
): Coin&lt;T&gt; {
    <b>let</b> room = table::borrow_mut(&<b>mut</b> store.rooms, room_id);
    <b>let</b> sender = tx_context::sender(ctx);
    // Check <b>if</b> caller is creator
    <b>assert</b>!(room.creator == sender, <a href="../game_room/game_room.md#game_room_game_room_ENotRoomCreator">ENotRoomCreator</a>);
    // Check <b>if</b> room is in waiting state
    <b>let</b> waiting: vector&lt;u8&gt; = <a href="../game_room/game_room.md#game_room_game_room_STATUS_WAITING">STATUS_WAITING</a>;
    <b>assert</b>!(string::as_bytes(&room.status) == waiting, <a href="../game_room/game_room.md#game_room_game_room_ERoomNotInWaitingState">ERoomNotInWaitingState</a>);
    <b>let</b> current_time = clock::timestamp_ms(clock);
    room.status = string::utf8(<a href="../game_room/game_room.md#game_room_game_room_STATUS_CANCELLED">STATUS_CANCELLED</a>);
    room.updated_at = current_time;
    // Calculate and execute refunds
    <b>let</b> total_refund = <b>if</b> (room.is_sponsored) {
        room.total_prize_pool
    } <b>else</b> {
        room.entry_fee * room.current_players
    };
    <b>let</b> treasury_ref = &<b>mut</b> store.treasury;
    <b>let</b> creator_refund = <b>if</b> (room.is_sponsored) {
        // Refund sponsor funds to the creator (caller). Return <b>as</b> coin to avoid self-transfer
        coin::take(treasury_ref, total_refund, ctx)
    } <b>else</b> {
        // Refund each participant their <b>entry</b> fee from treasury.
        <b>let</b> <b>mut</b> i = 0;
        <b>while</b> (i &lt; vector::length(&room.participant_vector)) {
            <b>let</b> recipient = *vector::borrow(&room.participant_vector, i);
            <b>if</b> (recipient != room.creator) {
                <b>let</b> c = coin::take(treasury_ref, room.entry_fee, ctx);
                transfer::public_transfer(c, recipient);
            };
            i = i + 1;
        };
        // Prepare the creator's refund to be returned to caller to avoid self-transfer
        coin::take(treasury_ref, room.entry_fee, ctx)
    };
    // Zero out prize pool on cancellation
    room.total_prize_pool = 0;
    event::emit(<a href="../game_room/game_room.md#game_room_game_room_RoomCancelled">RoomCancelled</a> {
        room_id,
        creator: tx_context::sender(ctx),
        refund_amount: total_refund,
    });
    creator_refund
}
</code></pre>

</details>

<a name="game_room_game_room_get_room_participants"></a>

## Function `get_room_participants`

Get room participants

<pre><code><b>public</b> <b>fun</b> <a href="../game_room/game_room.md#game_room_game_room_get_room_participants">get_room_participants</a>&lt;T&gt;(store: &<a href="../game_room/game_room.md#game_room_game_room_GameRoomStore">game_room::game_room::GameRoomStore</a>&lt;T&gt;, room_id: <b>address</b>): &<a href="../dependencies/sui/table.md#sui_table_Table">sui::table::Table</a>&lt;<b>address</b>, <a href="../game_room/game_room.md#game_room_game_room_GameRoomParticipant">game_room::game_room::GameRoomParticipant</a>&gt;
</code></pre>

<details>
<summary>Implementation</summary>

<pre><code><b>public</b> <b>fun</b> <a href="../game_room/game_room.md#game_room_game_room_get_room_participants">get_room_participants</a>&lt;T&gt;(
    store: &<a href="../game_room/game_room.md#game_room_game_room_GameRoomStore">GameRoomStore</a>&lt;T&gt;,
    room_id: <b>address</b>,
): &Table&lt;<b>address</b>, <a href="../game_room/game_room.md#game_room_game_room_GameRoomParticipant">GameRoomParticipant</a>&gt; {
    <b>let</b> room = table::borrow(&store.rooms, room_id);
    &room.participants
}
</code></pre>

</details>

<a name="game_room_game_room_get_room_details"></a>

## Function `get_room_details`

Get room details

<pre><code><b>public</b> <b>fun</b> <a href="../game_room/game_room.md#game_room_game_room_get_room_details">get_room_details</a>&lt;T&gt;(store: &<a href="../game_room/game_room.md#game_room_game_room_GameRoomStore">game_room::game_room::GameRoomStore</a>&lt;T&gt;, room_id: <b>address</b>): &<a href="../game_room/game_room.md#game_room_game_room_GameRoom">game_room::game_room::GameRoom</a>
</code></pre>

<details>
<summary>Implementation</summary>

<pre><code><b>public</b> <b>fun</b> <a href="../game_room/game_room.md#game_room_game_room_get_room_details">get_room_details</a>&lt;T&gt;(store: &<a href="../game_room/game_room.md#game_room_game_room_GameRoomStore">GameRoomStore</a>&lt;T&gt;, room_id: <b>address</b>): &<a href="../game_room/game_room.md#game_room_game_room_GameRoom">GameRoom</a> {
    table::borrow(&store.rooms, room_id)
}
</code></pre>

</details>

<a name="game_room_game_room_collect_completion_signature"></a>

## Function `collect_completion_signature`

Collect completion signature

<pre><code><b>public</b> <b>fun</b> <a href="../game_room/game_room.md#game_room_game_room_collect_completion_signature">collect_completion_signature</a>&lt;T&gt;(store: &<b>mut</b> <a href="../game_room/game_room.md#game_room_game_room_GameRoomStore">game_room::game_room::GameRoomStore</a>&lt;T&gt;, room_id: <b>address</b>, signature_data: vector&lt;u8&gt;, clock: &<a href="../dependencies/sui/clock.md#sui_clock_Clock">sui::clock::Clock</a>, ctx: &<b>mut</b> <a href="../dependencies/sui/tx_context.md#sui_tx_context_TxContext">sui::tx_context::TxContext</a>)
</code></pre>

<details>
<summary>Implementation</summary>

<pre><code><b>public</b> <b>fun</b> <a href="../game_room/game_room.md#game_room_game_room_collect_completion_signature">collect_completion_signature</a>&lt;T&gt;(
    store: &<b>mut</b> <a href="../game_room/game_room.md#game_room_game_room_GameRoomStore">GameRoomStore</a>&lt;T&gt;,
    room_id: <b>address</b>,
    signature_data: vector&lt;u8&gt;,
    clock: &Clock,
    ctx: &<b>mut</b> TxContext,
) {
    <b>let</b> room = table::borrow_mut(&<b>mut</b> store.rooms, room_id);
    <b>let</b> signer = tx_context::sender(ctx);
    <b>let</b> current_time = clock::timestamp_ms(clock);
    // Only special rooms require signatures
    <b>assert</b>!(room.is_special, <a href="../game_room/game_room.md#game_room_game_room_EInvalidRoomCode">EInvalidRoomCode</a>); // Reusing error code <b>for</b> simplicity
    // Check <b>if</b> signer is authorized (creator or participant)
    <b>let</b> is_creator = room.creator == signer;
    <b>let</b> is_participant = table::contains(&room.participants, signer);
    <b>assert</b>!(is_creator || is_participant, <a href="../game_room/game_room.md#game_room_game_room_ENotAuthorizedToSign">ENotAuthorizedToSign</a>);
    // Check <b>if</b> already signed
    <b>assert</b>!(!table::contains(&room.signatures, signer), <a href="../game_room/game_room.md#game_room_game_room_EAlreadySigned">EAlreadySigned</a>);
    // Create signature record
    <b>let</b> signature = <a href="../game_room/game_room.md#game_room_game_room_CompletionSignature">CompletionSignature</a> {
        id: object::new(ctx),
        room_id,
        signer,
        signature_data,
        signed_at: current_time,
        is_creator,
    };
    // Add signature to room
    table::add(&<b>mut</b> room.signatures, signer, signature);
    room.collected_signatures = room.collected_signatures + 1;
    event::emit(<a href="../game_room/game_room.md#game_room_game_room_SignatureCollected">SignatureCollected</a> {
        room_id,
        signer,
        is_creator,
        total_signatures: room.required_signatures,
        collected_signatures: room.collected_signatures,
    });
}
</code></pre>

</details>

<a name="game_room_game_room_complete_game"></a>

## Function `complete_game`

Complete game and determine winners - transaction sponsored by admin

<pre><code><b>public</b> <b>fun</b> <a href="../game_room/game_room.md#game_room_game_room_complete_game">complete_game</a>&lt;T&gt;(store: &<b>mut</b> <a href="../game_room/game_room.md#game_room_game_room_GameRoomStore">game_room::game_room::GameRoomStore</a>&lt;T&gt;, room_id: <b>address</b>, winner_addresses: vector&lt;<b>address</b>&gt;, scores: vector&lt;u64&gt;, clock: &<a href="../dependencies/sui/clock.md#sui_clock_Clock">sui::clock::Clock</a>, ctx: &<b>mut</b> <a href="../dependencies/sui/tx_context.md#sui_tx_context_TxContext">sui::tx_context::TxContext</a>)
</code></pre>

<details>
<summary>Implementation</summary>

<pre><code><b>public</b> <b>fun</b> <a href="../game_room/game_room.md#game_room_game_room_complete_game">complete_game</a>&lt;T&gt;(
    store: &<b>mut</b> <a href="../game_room/game_room.md#game_room_game_room_GameRoomStore">GameRoomStore</a>&lt;T&gt;,
    room_id: <b>address</b>,
    winner_addresses: vector&lt;<b>address</b>&gt;,
    scores: vector&lt;u64&gt;,
    clock: &Clock,
    ctx: &<b>mut</b> TxContext,
) {
    <b>let</b> room = table::borrow_mut(&<b>mut</b> store.rooms, room_id);
    <b>if</b> (room.is_special) {
        <b>assert</b>!(room.collected_signatures &gt;= room.required_signatures, <a href="../game_room/game_room.md#game_room_game_room_EInsufficientSignatures">EInsufficientSignatures</a>);
         // Verify we have at least one creator signature and one participant signature
        <b>let</b> <b>mut</b> has_creator_signature = <b>false</b>;
        <b>let</b> <b>mut</b> has_participant_signature = <b>false</b>;
        <b>let</b> participant_vector = &room.participant_vector;
        <b>let</b> participants_len = vector::length(participant_vector);
        <b>let</b> <b>mut</b> i = 0;
        <b>while</b> (i &lt; participants_len) {
            <b>let</b> participant_addr = *vector::borrow(participant_vector, i);
            <b>if</b> (table::contains(&room.signatures, participant_addr)) {
                <b>let</b> signature = table::borrow(&room.signatures, participant_addr);
                <b>if</b> (signature.is_creator) {
                    has_creator_signature = <b>true</b>;
                } <b>else</b> {
                    has_participant_signature = <b>true</b>;
                };
            };
            i = i + 1;
        };
        <b>assert</b>!(has_creator_signature, <a href="../game_room/game_room.md#game_room_game_room_EInsufficientSignatures">EInsufficientSignatures</a>);
        <b>assert</b>!(has_participant_signature, <a href="../game_room/game_room.md#game_room_game_room_EInsufficientSignatures">EInsufficientSignatures</a>);
    };
    <b>let</b> current_time = clock::timestamp_ms(clock);
    room.status = string::utf8(<a href="../game_room/game_room.md#game_room_game_room_STATUS_COMPLETED">STATUS_COMPLETED</a>);
    room.actual_end_time = current_time;
    room.updated_at = current_time;
    // Check <b>if</b> there are any winners
    <b>let</b> winners_len = vector::length(&winner_addresses);
    <b>if</b> (winners_len == 0) {
        // No winners - refund all participants without platform fee
        room.platform_fee_collected = 0;
        // Get all participants and refund their <b>entry</b> fees
        <b>let</b> participant_vector = &room.participant_vector;
        <b>let</b> participants_len = vector::length(participant_vector);
        <b>if</b> (room.is_sponsored) {
            <b>let</b> treasury_ref = &<b>mut</b> store.treasury;
            <b>let</b> creator_refund = room.total_prize_pool;
            // Refund sponsor funds to the creator.
            <b>let</b> c = coin::take(treasury_ref, creator_refund, ctx);
            transfer::public_transfer(c, room.creator);
            event::emit(<a href="../game_room/game_room.md#game_room_game_room_GameCompleted">GameCompleted</a> {
                room_id,
                winners: winner_addresses,
                total_prize_pool: 0,
                platform_fee: 0,
            });
        } <b>else</b> {
            <b>let</b> <b>mut</b> i = 0;
            <b>while</b> (i &lt; participants_len) {
                <b>let</b> participant_addr = *vector::borrow(participant_vector, i);
                <b>if</b> (table::contains(&room.participants, participant_addr)) {
                    <b>let</b> participant = table::borrow(&room.participants, participant_addr);
                    <b>if</b> (participant.entry_fee_paid &gt; 0) {
                        <b>let</b> refund_amount = participant.entry_fee_paid;
                        <b>let</b> refund_coin = coin::take(&<b>mut</b> store.treasury, refund_amount, ctx);
                        transfer::public_transfer(refund_coin, participant_addr);
                    };
                };
                i = i + 1;
            };
            event::emit(<a href="../game_room/game_room.md#game_room_game_room_GameCompleted">GameCompleted</a> {
                room_id,
                winners: winner_addresses,
                total_prize_pool: 0,
                platform_fee: 0,
            });
        };
        // Reset prize pool after all refunds are processed
        room.total_prize_pool = 0;
    } <b>else</b> {
        // Check <b>if</b> winner count is valid <b>for</b> the given rule
        <b>assert</b>!(winners_len &lt;= room.current_players, <a href="../game_room/game_room.md#game_room_game_room_EInvalidWinnerCount">EInvalidWinnerCount</a>);
        // checks <b>if</b> the number of room participants  is at least 60% of the maximum participants.
        // <b>if</b> yes, 2% of prize pool goes to the creator of the room and 5% of prize pool goes to the platform <b>as</b> fee
        // <b>else</b> plaform takes whole 7%
        <b>let</b> check = (room.current_players * 100) / room.max_players;
        // Calculate platform fee
        <b>let</b> platform_fee = <b>if</b> (check &lt; 60) {
            (room.total_prize_pool * <a href="../game_room/game_room.md#game_room_game_room_PLATFORM_FEE_PERCENTAGE">PLATFORM_FEE_PERCENTAGE</a>) / <a href="../game_room/game_room.md#game_room_game_room_FEE_DENOMINATOR">FEE_DENOMINATOR</a>
        } <b>else</b> {
            (room.total_prize_pool * (<a href="../game_room/game_room.md#game_room_game_room_PLATFORM_FEE_PERCENTAGE">PLATFORM_FEE_PERCENTAGE</a> - <a href="../game_room/game_room.md#game_room_game_room_ROOM_CREATOR_FEE_PERCENTAGE">ROOM_CREATOR_FEE_PERCENTAGE</a>)) / <a href="../game_room/game_room.md#game_room_game_room_FEE_DENOMINATOR">FEE_DENOMINATOR</a>
        };
        room.platform_fee_collected = platform_fee;
        <b>let</b> creator_fee = <b>if</b> (check &lt; 60) { 0 } <b>else</b> {
            (room.total_prize_pool * <a href="../game_room/game_room.md#game_room_game_room_ROOM_CREATOR_FEE_PERCENTAGE">ROOM_CREATOR_FEE_PERCENTAGE</a>) / <a href="../game_room/game_room.md#game_room_game_room_FEE_DENOMINATOR">FEE_DENOMINATOR</a>
        };
        // Send platform fee to admin <b>address</b> before distributing prizes
        <b>if</b> (platform_fee &gt; 0) {
            <b>let</b> fee_coin = coin::take(&<b>mut</b> store.treasury, platform_fee, ctx);
            transfer::public_transfer(fee_coin, <a href="../game_room/game_room.md#game_room_game_room_ADMIN_ADDRESS">ADMIN_ADDRESS</a>);
        };
        <b>if</b> (creator_fee &gt; 0) {
            <b>let</b> fee_coin = coin::take(&<b>mut</b> store.treasury, creator_fee, ctx);
            transfer::public_transfer(fee_coin, room.creator);
        };
        // Determine distribution based on rule
        <b>let</b> remaining_prize = room.total_prize_pool - platform_fee - creator_fee;
        <b>let</b> rule = string::as_bytes(&room.winner_split_rule);
        // Validate winners count against rule where applicable
        <b>if</b> (rule == b"winner_takes_all") {
            <b>assert</b>!(winners_len == 1, <a href="../game_room/game_room.md#game_room_game_room_EInvalidWinnerCount">EInvalidWinnerCount</a>);
        } <b>else</b> <b>if</b> (rule == b"top_2") {
            <b>assert</b>!(winners_len == 2, <a href="../game_room/game_room.md#game_room_game_room_EInvalidWinnerCount">EInvalidWinnerCount</a>);
        } <b>else</b> <b>if</b> (rule == b"top_3") {
            <b>assert</b>!(winners_len == 3, <a href="../game_room/game_room.md#game_room_game_room_EInvalidWinnerCount">EInvalidWinnerCount</a>);
        } <b>else</b> <b>if</b> (rule == b"top_4") {
            <b>assert</b>!(winners_len == 4, <a href="../game_room/game_room.md#game_room_game_room_EInvalidWinnerCount">EInvalidWinnerCount</a>);
        } <b>else</b> <b>if</b> (rule == b"top_5") {
            <b>assert</b>!(winners_len == 5, <a href="../game_room/game_room.md#game_room_game_room_EInvalidWinnerCount">EInvalidWinnerCount</a>);
        } <b>else</b> <b>if</b> (rule == b"top_10") {
            <b>assert</b>!(winners_len == 10, <a href="../game_room/game_room.md#game_room_game_room_EInvalidWinnerCount">EInvalidWinnerCount</a>);
        };
        // Helper local to compute amount <b>for</b> each winner index i
        <b>let</b> <b>mut</b> i = 0;
        <b>let</b> <b>mut</b> assigned_total = 0u64;
        <b>while</b> (i &lt; winners_len) {
            <b>let</b> amount = <b>if</b> (rule == b"winner_takes_all") {
                <b>if</b> (i == 0) { remaining_prize } <b>else</b> { 0 }
            } <b>else</b> <b>if</b> (rule == b"top_2") {
                <b>if</b> (i == 0) { (remaining_prize * 60) / 100 } <b>else</b> <b>if</b> (i == 1) { (remaining_prize * 40) / 100 } <b>else</b> { 0 }
            } <b>else</b> <b>if</b> (rule == b"top_3") {
                <b>if</b> (i == 0) { (remaining_prize * 50) / 100 } <b>else</b> <b>if</b> (i == 1) {
                    (remaining_prize * 30) / 100
                } <b>else</b> <b>if</b> (i == 2) { (remaining_prize * 20) / 100 } <b>else</b> { 0 }
            } <b>else</b> <b>if</b> (rule == b"top_4") {
                <b>if</b> (i == 0) { (remaining_prize * 40) / 100 } <b>else</b> <b>if</b> (i == 1) {
                    (remaining_prize * 30) / 100
                } <b>else</b> <b>if</b> (i == 2) { (remaining_prize * 20) / 100 } <b>else</b> <b>if</b> (i == 3) { (remaining_prize * 10) / 100 }
                 <b>else</b> { 0 }
            } <b>else</b> <b>if</b> (rule == b"top_5") {
                <b>if</b> (i == 0) { (remaining_prize * 30) / 100 } <b>else</b> <b>if</b> (i == 1) {
                    (remaining_prize * 25) / 100
                } <b>else</b> <b>if</b> (i == 2) { (remaining_prize * 20) / 100 } <b>else</b> <b>if</b> (i == 3) {
                    (remaining_prize * 15) / 100
                }  <b>else</b> <b>if</b> (i == 4) { (remaining_prize * 10) / 100 }
                <b>else</b> { 0 }
            } <b>else</b> {
                <b>if</b> (i == 0) { (remaining_prize * 20) / 100 } <b>else</b> <b>if</b> (i == 1) {
                    (remaining_prize * 15) / 100
                } <b>else</b> <b>if</b> (i == 2) { (remaining_prize * 12) / 100 } <b>else</b> <b>if</b> (i == 3) {
                    (remaining_prize * 10) / 100
                } <b>else</b> <b>if</b> (i == 4 || i == 5) {
                    (remaining_prize * 8) / 100
                } <b>else</b> <b>if</b> (i == 6 || i == 7 || i == 8) {
                    (remaining_prize * 7) / 100
                } <b>else</b> <b>if</b> (i == 9) { (remaining_prize * 6) / 100 }
                <b>else</b> { 0 }
            };
            assigned_total = assigned_total + amount;
            // For the last winner, give any remainder to ensure full distribution
            <b>let</b> final_amount = <b>if</b> (i == winners_len - 1) {
                remaining_prize - (assigned_total - amount)
            } <b>else</b> { amount };
            <b>let</b> winner = *vector::borrow(&winner_addresses, i);
            // Update participant <b>as</b> winner with earnings and score
            <b>if</b> (table::contains(&room.participants, winner)) {
                <b>let</b> participant = table::borrow_mut(&<b>mut</b> room.participants, winner);
                participant.is_winner = <b>true</b>;
                participant.earnings = final_amount;
                participant.score = *vector::borrow(&scores, i);
            };
            // Transfer prize to winner
            <b>if</b> (final_amount &gt; 0) {
                <b>let</b> prize_coin = coin::take(&<b>mut</b> store.treasury, final_amount, ctx);
                transfer::public_transfer(prize_coin, winner);
            };
            i = i + 1;
        };
        event::emit(<a href="../game_room/game_room.md#game_room_game_room_GameCompleted">GameCompleted</a> {
            room_id,
            winners: winner_addresses,
            total_prize_pool: room.total_prize_pool,
            platform_fee,
        });
        // After distribution, set prize pool to 0
        room.total_prize_pool = 0;
    }
}
</code></pre>

</details>

<a name="game_room_game_room_start_game"></a>

## Function `start_game`

Start game - sponsored

<pre><code><b>public</b> <b>fun</b> <a href="../game_room/game_room.md#game_room_game_room_start_game">start_game</a>&lt;T&gt;(store: &<b>mut</b> <a href="../game_room/game_room.md#game_room_game_room_GameRoomStore">game_room::game_room::GameRoomStore</a>&lt;T&gt;, room_id: <b>address</b>, clock: &<a href="../dependencies/sui/clock.md#sui_clock_Clock">sui::clock::Clock</a>, ctx: &<b>mut</b> <a href="../dependencies/sui/tx_context.md#sui_tx_context_TxContext">sui::tx_context::TxContext</a>)
</code></pre>

<details>
<summary>Implementation</summary>

<pre><code><b>public</b> <b>fun</b> <a href="../game_room/game_room.md#game_room_game_room_start_game">start_game</a>&lt;T&gt;(
    store: &<b>mut</b> <a href="../game_room/game_room.md#game_room_game_room_GameRoomStore">GameRoomStore</a>&lt;T&gt;,
    room_id: <b>address</b>,
    clock: &Clock,
    ctx: &<b>mut</b> TxContext,
) {
    <b>let</b> room = table::borrow_mut(&<b>mut</b> store.rooms, room_id);
    // Check <b>if</b> caller is creator
    <b>assert</b>!(room.creator == tx_context::sender(ctx), <a href="../game_room/game_room.md#game_room_game_room_ENotRoomCreator">ENotRoomCreator</a>);
    // Check <b>if</b> room is in waiting state
    <b>let</b> waiting: vector&lt;u8&gt; = <a href="../game_room/game_room.md#game_room_game_room_STATUS_WAITING">STATUS_WAITING</a>;
    <b>assert</b>!(string::as_bytes(&room.status) == waiting, <a href="../game_room/game_room.md#game_room_game_room_ERoomNotInWaitingState">ERoomNotInWaitingState</a>);
    // Check <b>if</b> we have enough players
    <b>assert</b>!(room.current_players &gt;= room.min_players_to_start, <a href="../game_room/game_room.md#game_room_game_room_EInsufficientPlayers">EInsufficientPlayers</a>);
    <b>let</b> current_time = clock::timestamp_ms(clock);
    room.status = string::utf8(<a href="../game_room/game_room.md#game_room_game_room_STATUS_ONGOING">STATUS_ONGOING</a>);
    room.actual_start_time = current_time;
    room.updated_at = current_time;
    event::emit(<a href="../game_room/game_room.md#game_room_game_room_RoomStarted">RoomStarted</a> {
        room_id,
        start_time: current_time,
        player_count: room.current_players,
    });
}
</code></pre>

</details>

<a name="game_room_game_room_get_game_room_rules"></a>

## Function `get_game_room_rules`

Get game room rules

<pre><code><b>public</b> <b>fun</b> <a href="../game_room/game_room.md#game_room_game_room_get_game_room_rules">get_game_room_rules</a>&lt;T&gt;(store: &<a href="../game_room/game_room.md#game_room_game_room_GameRoomStore">game_room::game_room::GameRoomStore</a>&lt;T&gt;, room_id: <b>address</b>): (&<a href="../dependencies/std/string.md#std_string_String">std::string::String</a>, &<a href="../dependencies/std/string.md#std_string_String">std::string::String</a>, u64, u64, &<a href="../dependencies/std/string.md#std_string_String">std::string::String</a>)
</code></pre>

<details>
<summary>Implementation</summary>

<pre><code><b>public</b> <b>fun</b> <a href="../game_room/game_room.md#game_room_game_room_get_game_room_rules">get_game_room_rules</a>&lt;T&gt;(
    store: &<a href="../game_room/game_room.md#game_room_game_room_GameRoomStore">GameRoomStore</a>&lt;T&gt;,
    room_id: <b>address</b>,
): (&String, &String, u64, u64, &String) {
    <b>let</b> room = table::borrow(&store.rooms, room_id);
    (&room.winner_split_rule, &room.currency, room.entry_fee, room.max_players, &room.status)
}
</code></pre>

</details>

<a name="game_room_game_room_room_exists"></a>

## Function `room_exists`

Check if room exists

<pre><code><b>public</b> <b>fun</b> <a href="../game_room/game_room.md#game_room_game_room_room_exists">room_exists</a>&lt;T&gt;(store: &<a href="../game_room/game_room.md#game_room_game_room_GameRoomStore">game_room::game_room::GameRoomStore</a>&lt;T&gt;, room_id: <b>address</b>): bool
</code></pre>

<details>
<summary>Implementation</summary>

<pre><code><b>public</b> <b>fun</b> <a href="../game_room/game_room.md#game_room_game_room_room_exists">room_exists</a>&lt;T&gt;(store: &<a href="../game_room/game_room.md#game_room_game_room_GameRoomStore">GameRoomStore</a>&lt;T&gt;, room_id: <b>address</b>): bool {
    table::contains(&store.rooms, room_id)
}
</code></pre>

</details>

<a name="game_room_game_room_get_total_rooms"></a>

## Function `get_total_rooms`

Get total rooms count

<pre><code><b>public</b> <b>fun</b> <a href="../game_room/game_room.md#game_room_game_room_get_total_rooms">get_total_rooms</a>&lt;T&gt;(store: &<a href="../game_room/game_room.md#game_room_game_room_GameRoomStore">game_room::game_room::GameRoomStore</a>&lt;T&gt;): u64
</code></pre>

<details>
<summary>Implementation</summary>

<pre><code><b>public</b> <b>fun</b> <a href="../game_room/game_room.md#game_room_game_room_get_total_rooms">get_total_rooms</a>&lt;T&gt;(store: &<a href="../game_room/game_room.md#game_room_game_room_GameRoomStore">GameRoomStore</a>&lt;T&gt;): u64 {
    store.room_counter
}
</code></pre>

</details>

<a name="game_room_game_room_is_player_in_room"></a>

## Function `is_player_in_room`

Check if player is in room

<pre><code><b>public</b> <b>fun</b> <a href="../game_room/game_room.md#game_room_game_room_is_player_in_room">is_player_in_room</a>&lt;T&gt;(store: &<a href="../game_room/game_room.md#game_room_game_room_GameRoomStore">game_room::game_room::GameRoomStore</a>&lt;T&gt;, room_id: <b>address</b>, player: <b>address</b>): bool
</code></pre>

<details>
<summary>Implementation</summary>

<pre><code><b>public</b> <b>fun</b> <a href="../game_room/game_room.md#game_room_game_room_is_player_in_room">is_player_in_room</a>&lt;T&gt;(store: &<a href="../game_room/game_room.md#game_room_game_room_GameRoomStore">GameRoomStore</a>&lt;T&gt;, room_id: <b>address</b>, player: <b>address</b>): bool {
    <b>let</b> room = table::borrow(&store.rooms, room_id);
    <b>if</b> (!table::contains(&room.participants, player)) {
        <b>return</b> <b>false</b>
    };
    <b>let</b> participant = table::borrow(&room.participants, player);
    participant.is_active
}
</code></pre>

</details>

<a name="game_room_game_room_get_participant_details"></a>

## Function `get_participant_details`

Get participant details

<pre><code><b>public</b> <b>fun</b> <a href="../game_room/game_room.md#game_room_game_room_get_participant_details">get_participant_details</a>&lt;T&gt;(store: &<a href="../game_room/game_room.md#game_room_game_room_GameRoomStore">game_room::game_room::GameRoomStore</a>&lt;T&gt;, room_id: <b>address</b>, player: <b>address</b>): &<a href="../game_room/game_room.md#game_room_game_room_GameRoomParticipant">game_room::game_room::GameRoomParticipant</a>
</code></pre>

<details>
<summary>Implementation</summary>

<pre><code><b>public</b> <b>fun</b> <a href="../game_room/game_room.md#game_room_game_room_get_participant_details">get_participant_details</a>&lt;T&gt;(
    store: &<a href="../game_room/game_room.md#game_room_game_room_GameRoomStore">GameRoomStore</a>&lt;T&gt;,
    room_id: <b>address</b>,
    player: <b>address</b>,
): &<a href="../game_room/game_room.md#game_room_game_room_GameRoomParticipant">GameRoomParticipant</a> {
    <b>let</b> room = table::borrow(&store.rooms, room_id);
    <b>assert</b>!(table::contains(&room.participants, player), <a href="../game_room/game_room.md#game_room_game_room_EPlayerNotInRoom">EPlayerNotInRoom</a>);
    table::borrow(&room.participants, player)
}
</code></pre>

</details>

<a name="game_room_game_room_get_signature_status"></a>

## Function `get_signature_status`

Helper function to check signature status (only relevant for special rooms)

<pre><code><b>public</b> <b>fun</b> <a href="../game_room/game_room.md#game_room_game_room_get_signature_status">get_signature_status</a>&lt;T&gt;(store: &<a href="../game_room/game_room.md#game_room_game_room_GameRoomStore">game_room::game_room::GameRoomStore</a>&lt;T&gt;, room_id: <b>address</b>): (u64, u64, bool)
</code></pre>

<details>
<summary>Implementation</summary>

<pre><code><b>public</b> <b>fun</b> <a href="../game_room/game_room.md#game_room_game_room_get_signature_status">get_signature_status</a>&lt;T&gt;(
    store: &<a href="../game_room/game_room.md#game_room_game_room_GameRoomStore">GameRoomStore</a>&lt;T&gt;,
    room_id: <b>address</b>,
): (u64, u64, bool) {
    <b>let</b> room = table::borrow(&store.rooms, room_id);
    // For non-special rooms, <b>return</b> that no signatures are needed
    <b>if</b> (!room.is_special) {
        <b>return</b> (0, 0, <b>true</b>) // No signatures needed, completion is automatic
    };
    <b>let</b> <b>mut</b> has_creator_signature = <b>false</b>;
    <b>let</b> <b>mut</b> has_participant_signature = <b>false</b>;
    <b>let</b> participant_vector = &room.participant_vector;
    <b>let</b> participants_len = vector::length(participant_vector);
    <b>let</b> <b>mut</b> i = 0;
    <b>while</b> (i &lt; participants_len) {
        <b>let</b> participant_addr = *vector::borrow(participant_vector, i);
        <b>if</b> (table::contains(&room.signatures, participant_addr)) {
            <b>let</b> signature = table::borrow(&room.signatures, participant_addr);
            <b>if</b> (signature.is_creator) {
                has_creator_signature = <b>true</b>;
            } <b>else</b> {
                has_participant_signature = <b>true</b>;
            };
        };
        i = i + 1;
    };
    (room.collected_signatures, room.required_signatures, has_creator_signature && has_participant_signature)
}
</code></pre>

</details>

<a name="game_room_game_room_has_signed"></a>

## Function `has_signed`

Helper function to check if a specific address has signed (only relevant for special rooms)

<pre><code><b>public</b> <b>fun</b> <a href="../game_room/game_room.md#game_room_game_room_has_signed">has_signed</a>&lt;T&gt;(store: &<a href="../game_room/game_room.md#game_room_game_room_GameRoomStore">game_room::game_room::GameRoomStore</a>&lt;T&gt;, room_id: <b>address</b>, signer: <b>address</b>): bool
</code></pre>

<details>
<summary>Implementation</summary>

<pre><code><b>public</b> <b>fun</b> <a href="../game_room/game_room.md#game_room_game_room_has_signed">has_signed</a>&lt;T&gt;(
    store: &<a href="../game_room/game_room.md#game_room_game_room_GameRoomStore">GameRoomStore</a>&lt;T&gt;,
    room_id: <b>address</b>,
    signer: <b>address</b>,
): bool {
    <b>let</b> room = table::borrow(&store.rooms, room_id);
    // For non-special rooms, no signatures are needed
    <b>if</b> (!room.is_special) {
        <b>return</b> <b>false</b>
    };
    table::contains(&room.signatures, signer)
}
</code></pre>

</details>
