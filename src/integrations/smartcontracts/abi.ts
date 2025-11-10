export const gameRoomAbi = [
    {
        "inputs": [
            {
                "internalType": "address",
                "name": "usdtAddress",
                "type": "address"
            },
            {
                "internalType": "address",
                "name": "usdcAddress",
                "type": "address"
            }
        ],
        "stateMutability": "nonpayable",
        "type": "constructor"
    },
    {
        "inputs": [],
        "name": "AccessControlBadConfirmation",
        "type": "error"
    },
    {
        "inputs": [
            {
                "internalType": "address",
                "name": "account",
                "type": "address"
            },
            {
                "internalType": "bytes32",
                "name": "neededRole",
                "type": "bytes32"
            }
        ],
        "name": "AccessControlUnauthorizedAccount",
        "type": "error"
    },
    {
        "inputs": [],
        "name": "AlreadyInRoom",
        "type": "error"
    },
    {
        "inputs": [],
        "name": "AlreadySigned",
        "type": "error"
    },
    {
        "inputs": [],
        "name": "InsufficientEntryFee",
        "type": "error"
    },
    {
        "inputs": [],
        "name": "InsufficientPlayers",
        "type": "error"
    },
    {
        "inputs": [],
        "name": "InsufficientSignatures",
        "type": "error"
    },
    {
        "inputs": [],
        "name": "InsufficientSponsorAmount",
        "type": "error"
    },
    {
        "inputs": [],
        "name": "InvalidRoomCode",
        "type": "error"
    },
    {
        "inputs": [],
        "name": "InvalidWinnerCount",
        "type": "error"
    },
    {
        "inputs": [],
        "name": "NotAuthorizedToSign",
        "type": "error"
    },
    {
        "inputs": [
            {
                "internalType": "address",
                "name": "sender",
                "type": "address"
            }
        ],
        "name": "NotOwner",
        "type": "error"
    },
    {
        "inputs": [],
        "name": "NotRoomCreator",
        "type": "error"
    },
    {
        "inputs": [
            {
                "internalType": "address",
                "name": "owner",
                "type": "address"
            }
        ],
        "name": "OwnableInvalidOwner",
        "type": "error"
    },
    {
        "inputs": [
            {
                "internalType": "address",
                "name": "account",
                "type": "address"
            }
        ],
        "name": "OwnableUnauthorizedAccount",
        "type": "error"
    },
    {
        "inputs": [],
        "name": "PlayerNotInRoom",
        "type": "error"
    },
    {
        "inputs": [],
        "name": "ReentrancyGuardReentrantCall",
        "type": "error"
    },
    {
        "inputs": [
            {
                "internalType": "uint256",
                "name": "roomId",
                "type": "uint256"
            },
            {
                "internalType": "address",
                "name": "player",
                "type": "address"
            }
        ],
        "name": "RefundNotClaimableForPlayerOrAlreadyClaimed",
        "type": "error"
    },
    {
        "inputs": [
            {
                "internalType": "uint256",
                "name": "roomId",
                "type": "uint256"
            }
        ],
        "name": "RefundNotPendingForRoom",
        "type": "error"
    },
    {
        "inputs": [],
        "name": "RoomCancelledError",
        "type": "error"
    },
    {
        "inputs": [],
        "name": "RoomCompleted",
        "type": "error"
    },
    {
        "inputs": [],
        "name": "RoomFull",
        "type": "error"
    },
    {
        "inputs": [],
        "name": "RoomNotFound",
        "type": "error"
    },
    {
        "inputs": [],
        "name": "RoomNotInWaitingState",
        "type": "error"
    },
    {
        "inputs": [
            {
                "internalType": "address",
                "name": "token",
                "type": "address"
            }
        ],
        "name": "SafeERC20FailedOperation",
        "type": "error"
    },
    {
        "inputs": [
            {
                "internalType": "uint256",
                "name": "amount",
                "type": "uint256"
            },
            {
                "internalType": "enum GameRoomContract.Currency",
                "name": "currency",
                "type": "uint8"
            }
        ],
        "name": "TransferFailed",
        "type": "error"
    },
    {
        "anonymous": false,
        "inputs": [
            {
                "indexed": true,
                "internalType": "uint256",
                "name": "roomId",
                "type": "uint256"
            },
            {
                "indexed": false,
                "internalType": "address[]",
                "name": "winners",
                "type": "address[]"
            },
            {
                "indexed": false,
                "internalType": "uint256",
                "name": "totalPrizePool",
                "type": "uint256"
            },
            {
                "indexed": false,
                "internalType": "uint256",
                "name": "platformFee",
                "type": "uint256"
            }
        ],
        "name": "GameCompleted",
        "type": "event"
    },
    {
        "anonymous": false,
        "inputs": [
            {
                "indexed": true,
                "internalType": "address",
                "name": "previousOwner",
                "type": "address"
            },
            {
                "indexed": true,
                "internalType": "address",
                "name": "newOwner",
                "type": "address"
            }
        ],
        "name": "OwnershipTransferred",
        "type": "event"
    },
    {
        "anonymous": false,
        "inputs": [
            {
                "indexed": true,
                "internalType": "uint256",
                "name": "roomId",
                "type": "uint256"
            },
            {
                "indexed": true,
                "internalType": "address",
                "name": "player",
                "type": "address"
            },
            {
                "indexed": false,
                "internalType": "uint256",
                "name": "entryFeePaid",
                "type": "uint256"
            }
        ],
        "name": "PlayerJoined",
        "type": "event"
    },
    {
        "anonymous": false,
        "inputs": [
            {
                "indexed": true,
                "internalType": "uint256",
                "name": "roomId",
                "type": "uint256"
            },
            {
                "indexed": true,
                "internalType": "address",
                "name": "player",
                "type": "address"
            },
            {
                "indexed": false,
                "internalType": "uint256",
                "name": "refundAmount",
                "type": "uint256"
            }
        ],
        "name": "PlayerLeft",
        "type": "event"
    },
    {
        "anonymous": false,
        "inputs": [
            {
                "indexed": true,
                "internalType": "uint256",
                "name": "roomId",
                "type": "uint256"
            },
            {
                "indexed": true,
                "internalType": "address",
                "name": "refundRecipient",
                "type": "address"
            },
            {
                "indexed": false,
                "internalType": "uint256",
                "name": "refundAmount",
                "type": "uint256"
            }
        ],
        "name": "RefundClaimed",
        "type": "event"
    },
    {
        "anonymous": false,
        "inputs": [
            {
                "indexed": true,
                "internalType": "uint256",
                "name": "roomId",
                "type": "uint256"
            },
            {
                "indexed": false,
                "internalType": "address[]",
                "name": "refundRecipients",
                "type": "address[]"
            },
            {
                "indexed": false,
                "internalType": "uint256",
                "name": "refundAmount",
                "type": "uint256"
            }
        ],
        "name": "RefundPending",
        "type": "event"
    },
    {
        "anonymous": false,
        "inputs": [
            {
                "indexed": true,
                "internalType": "bytes32",
                "name": "role",
                "type": "bytes32"
            },
            {
                "indexed": true,
                "internalType": "bytes32",
                "name": "previousAdminRole",
                "type": "bytes32"
            },
            {
                "indexed": true,
                "internalType": "bytes32",
                "name": "newAdminRole",
                "type": "bytes32"
            }
        ],
        "name": "RoleAdminChanged",
        "type": "event"
    },
    {
        "anonymous": false,
        "inputs": [
            {
                "indexed": true,
                "internalType": "bytes32",
                "name": "role",
                "type": "bytes32"
            },
            {
                "indexed": true,
                "internalType": "address",
                "name": "account",
                "type": "address"
            },
            {
                "indexed": true,
                "internalType": "address",
                "name": "sender",
                "type": "address"
            }
        ],
        "name": "RoleGranted",
        "type": "event"
    },
    {
        "anonymous": false,
        "inputs": [
            {
                "indexed": true,
                "internalType": "bytes32",
                "name": "role",
                "type": "bytes32"
            },
            {
                "indexed": true,
                "internalType": "address",
                "name": "account",
                "type": "address"
            },
            {
                "indexed": true,
                "internalType": "address",
                "name": "sender",
                "type": "address"
            }
        ],
        "name": "RoleRevoked",
        "type": "event"
    },
    {
        "anonymous": false,
        "inputs": [
            {
                "indexed": true,
                "internalType": "uint256",
                "name": "roomId",
                "type": "uint256"
            },
            {
                "indexed": true,
                "internalType": "address",
                "name": "creator",
                "type": "address"
            },
            {
                "indexed": false,
                "internalType": "uint256",
                "name": "totalRefundAmount",
                "type": "uint256"
            }
        ],
        "name": "RoomCancelled",
        "type": "event"
    },
    {
        "anonymous": false,
        "inputs": [
            {
                "indexed": true,
                "internalType": "uint256",
                "name": "roomId",
                "type": "uint256"
            },
            {
                "indexed": true,
                "internalType": "address",
                "name": "creator",
                "type": "address"
            },
            {
                "indexed": false,
                "internalType": "string",
                "name": "name",
                "type": "string"
            },
            {
                "indexed": false,
                "internalType": "uint256",
                "name": "entryFee",
                "type": "uint256"
            },
            {
                "indexed": false,
                "internalType": "enum GameRoomContract.Currency",
                "name": "currency",
                "type": "uint8"
            },
            {
                "indexed": false,
                "internalType": "uint256",
                "name": "maxPlayers",
                "type": "uint256"
            },
            {
                "indexed": false,
                "internalType": "bool",
                "name": "isSpecial",
                "type": "bool"
            },
            {
                "indexed": false,
                "internalType": "bool",
                "name": "isSponsored",
                "type": "bool"
            },
            {
                "indexed": false,
                "internalType": "bool",
                "name": "isPrivate",
                "type": "bool"
            },
            {
                "indexed": false,
                "internalType": "enum GameRoomContract.SplitRule",
                "name": "winnerSplitRule",
                "type": "uint8"
            }
        ],
        "name": "RoomCreated",
        "type": "event"
    },
    {
        "anonymous": false,
        "inputs": [
            {
                "indexed": true,
                "internalType": "uint256",
                "name": "roomId",
                "type": "uint256"
            },
            {
                "indexed": false,
                "internalType": "uint256",
                "name": "startTime",
                "type": "uint256"
            },
            {
                "indexed": false,
                "internalType": "uint256",
                "name": "playerCount",
                "type": "uint256"
            }
        ],
        "name": "RoomStarted",
        "type": "event"
    },
    {
        "inputs": [],
        "name": "ADMIN_ROLE",
        "outputs": [
            {
                "internalType": "bytes32",
                "name": "",
                "type": "bytes32"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "DEFAULT_ADMIN_ROLE",
        "outputs": [
            {
                "internalType": "bytes32",
                "name": "",
                "type": "bytes32"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "FEE_DENOMINATOR",
        "outputs": [
            {
                "internalType": "uint256",
                "name": "",
                "type": "uint256"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "GAME_CREATOR_FEE_PERCENTAGE",
        "outputs": [
            {
                "internalType": "uint256",
                "name": "",
                "type": "uint256"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "GAME_MANAGER_ROLE",
        "outputs": [
            {
                "internalType": "bytes32",
                "name": "",
                "type": "bytes32"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "PLATFORM_FEE_PERCENTAGE",
        "outputs": [
            {
                "internalType": "uint256",
                "name": "",
                "type": "uint256"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "ROOM_CREATOR_FEE_PERCENTAGE",
        "outputs": [
            {
                "internalType": "uint256",
                "name": "",
                "type": "uint256"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "ROOM_CREATOR_ROLE",
        "outputs": [
            {
                "internalType": "bytes32",
                "name": "",
                "type": "bytes32"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "address",
                "name": "account",
                "type": "address"
            }
        ],
        "name": "addGameManager",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "uint256",
                "name": "roomId",
                "type": "uint256"
            }
        ],
        "name": "cancelRoom",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "uint256",
                "name": "roomId",
                "type": "uint256"
            }
        ],
        "name": "claimRefund",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "uint256",
                "name": "roomId",
                "type": "uint256"
            },
            {
                "internalType": "address[]",
                "name": "winnerAddresses",
                "type": "address[]"
            },
            {
                "internalType": "uint256[]",
                "name": "scores",
                "type": "uint256[]"
            },
            {
                "internalType": "address",
                "name": "gameCreator",
                "type": "address"
            }
        ],
        "name": "completeGame",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [
            {
                "components": [
                    {
                        "internalType": "string",
                        "name": "name",
                        "type": "string"
                    },
                    {
                        "internalType": "string",
                        "name": "gameId",
                        "type": "string"
                    },
                    {
                        "internalType": "string",
                        "name": "roomCode",
                        "type": "string"
                    },
                    {
                        "internalType": "uint256",
                        "name": "entryFee",
                        "type": "uint256"
                    },
                    {
                        "internalType": "uint256",
                        "name": "maxPlayers",
                        "type": "uint256"
                    },
                    {
                        "internalType": "uint256",
                        "name": "sponsorAmount",
                        "type": "uint256"
                    },
                    {
                        "internalType": "uint256",
                        "name": "startTime",
                        "type": "uint256"
                    },
                    {
                        "internalType": "uint256",
                        "name": "endTime",
                        "type": "uint256"
                    },
                    {
                        "internalType": "uint256",
                        "name": "paymentAmount",
                        "type": "uint256"
                    },
                    {
                        "internalType": "bool",
                        "name": "isSponsored",
                        "type": "bool"
                    },
                    {
                        "internalType": "bool",
                        "name": "isPrivate",
                        "type": "bool"
                    },
                    {
                        "internalType": "bool",
                        "name": "isSpecial",
                        "type": "bool"
                    },
                    {
                        "internalType": "enum GameRoomContract.Currency",
                        "name": "currency",
                        "type": "uint8"
                    },
                    {
                        "internalType": "enum GameRoomContract.SplitRule",
                        "name": "winnerSplitRule",
                        "type": "uint8"
                    }
                ],
                "internalType": "struct GameRoomContract.CreateRoomParams",
                "name": "params",
                "type": "tuple"
            }
        ],
        "name": "createRoom",
        "outputs": [
            {
                "internalType": "uint256",
                "name": "",
                "type": "uint256"
            }
        ],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "uint256",
                "name": "roomId",
                "type": "uint256"
            }
        ],
        "name": "fetchRoom",
        "outputs": [
            {
                "internalType": "uint256",
                "name": "id",
                "type": "uint256"
            },
            {
                "internalType": "bytes32",
                "name": "gameId",
                "type": "bytes32"
            },
            {
                "internalType": "uint256",
                "name": "entryFee",
                "type": "uint256"
            },
            {
                "internalType": "enum GameRoomContract.Currency",
                "name": "currency",
                "type": "uint8"
            },
            {
                "internalType": "uint256",
                "name": "maxPlayers",
                "type": "uint256"
            },
            {
                "internalType": "bool",
                "name": "isPrivate",
                "type": "bool"
            },
            {
                "internalType": "bool",
                "name": "isSponsored",
                "type": "bool"
            },
            {
                "internalType": "bool",
                "name": "isSpecial",
                "type": "bool"
            },
            {
                "internalType": "enum GameRoomContract.RoomStatus",
                "name": "status",
                "type": "uint8"
            },
            {
                "internalType": "uint256",
                "name": "totalPrizePool",
                "type": "uint256"
            },
            {
                "internalType": "address",
                "name": "creator",
                "type": "address"
            },
            {
                "internalType": "uint256",
                "name": "currentPlayers",
                "type": "uint256"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "uint256",
                "name": "",
                "type": "uint256"
            }
        ],
        "name": "gameRooms",
        "outputs": [
            {
                "internalType": "uint256",
                "name": "id",
                "type": "uint256"
            },
            {
                "internalType": "uint256",
                "name": "entryFee",
                "type": "uint256"
            },
            {
                "internalType": "uint256",
                "name": "maxPlayers",
                "type": "uint256"
            },
            {
                "internalType": "uint256",
                "name": "sponsorAmount",
                "type": "uint256"
            },
            {
                "internalType": "uint256",
                "name": "startTime",
                "type": "uint256"
            },
            {
                "internalType": "uint256",
                "name": "endTime",
                "type": "uint256"
            },
            {
                "internalType": "uint256",
                "name": "totalPrizePool",
                "type": "uint256"
            },
            {
                "internalType": "uint256",
                "name": "platformFeeCollected",
                "type": "uint256"
            },
            {
                "internalType": "uint256",
                "name": "createdAt",
                "type": "uint256"
            },
            {
                "internalType": "uint256",
                "name": "updatedAt",
                "type": "uint256"
            },
            {
                "internalType": "uint256",
                "name": "minPlayersToStart",
                "type": "uint256"
            },
            {
                "internalType": "uint256",
                "name": "actualStartTime",
                "type": "uint256"
            },
            {
                "internalType": "uint256",
                "name": "actualEndTime",
                "type": "uint256"
            },
            {
                "internalType": "uint256",
                "name": "activePlayersCount",
                "type": "uint256"
            },
            {
                "internalType": "bytes32",
                "name": "roomCode",
                "type": "bytes32"
            },
            {
                "internalType": "bytes32",
                "name": "gameId",
                "type": "bytes32"
            },
            {
                "internalType": "enum GameRoomContract.Currency",
                "name": "currency",
                "type": "uint8"
            },
            {
                "internalType": "enum GameRoomContract.SplitRule",
                "name": "winnerSplitRule",
                "type": "uint8"
            },
            {
                "internalType": "enum GameRoomContract.RoomStatus",
                "name": "status",
                "type": "uint8"
            },
            {
                "internalType": "bool",
                "name": "isPrivate",
                "type": "bool"
            },
            {
                "internalType": "bool",
                "name": "isSponsored",
                "type": "bool"
            },
            {
                "internalType": "bool",
                "name": "isSpecial",
                "type": "bool"
            },
            {
                "internalType": "bool",
                "name": "isRefundPending",
                "type": "bool"
            },
            {
                "internalType": "address",
                "name": "creator",
                "type": "address"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "uint256",
                "name": "roomId",
                "type": "uint256"
            }
        ],
        "name": "getGameRoomRules",
        "outputs": [
            {
                "internalType": "enum GameRoomContract.SplitRule",
                "name": "winnerSplitRule",
                "type": "uint8"
            },
            {
                "internalType": "uint256",
                "name": "entryFee",
                "type": "uint256"
            },
            {
                "internalType": "enum GameRoomContract.Currency",
                "name": "currency",
                "type": "uint8"
            },
            {
                "internalType": "uint256",
                "name": "maxPlayers",
                "type": "uint256"
            },
            {
                "internalType": "enum GameRoomContract.RoomStatus",
                "name": "status",
                "type": "uint8"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "uint256",
                "name": "roomId",
                "type": "uint256"
            },
            {
                "internalType": "address",
                "name": "player",
                "type": "address"
            }
        ],
        "name": "getParticipantDetails",
        "outputs": [
            {
                "components": [
                    {
                        "internalType": "address",
                        "name": "player",
                        "type": "address"
                    },
                    {
                        "internalType": "uint256",
                        "name": "score",
                        "type": "uint256"
                    },
                    {
                        "internalType": "uint256",
                        "name": "entryFeePaid",
                        "type": "uint256"
                    },
                    {
                        "internalType": "uint256",
                        "name": "joinedAt",
                        "type": "uint256"
                    },
                    {
                        "internalType": "uint256",
                        "name": "leftAt",
                        "type": "uint256"
                    },
                    {
                        "internalType": "uint256",
                        "name": "earnings",
                        "type": "uint256"
                    },
                    {
                        "internalType": "uint256",
                        "name": "index",
                        "type": "uint256"
                    },
                    {
                        "internalType": "bool",
                        "name": "isActive",
                        "type": "bool"
                    },
                    {
                        "internalType": "bool",
                        "name": "isWinner",
                        "type": "bool"
                    }
                ],
                "internalType": "struct GameRoomContract.GameRoomParticipant",
                "name": "",
                "type": "tuple"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "bytes32",
                "name": "role",
                "type": "bytes32"
            }
        ],
        "name": "getRoleAdmin",
        "outputs": [
            {
                "internalType": "bytes32",
                "name": "",
                "type": "bytes32"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "uint256",
                "name": "roomId",
                "type": "uint256"
            }
        ],
        "name": "getRoomParticipants",
        "outputs": [
            {
                "internalType": "address[]",
                "name": "",
                "type": "address[]"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "getTotalRooms",
        "outputs": [
            {
                "internalType": "uint256",
                "name": "",
                "type": "uint256"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "bytes32",
                "name": "role",
                "type": "bytes32"
            },
            {
                "internalType": "address",
                "name": "account",
                "type": "address"
            }
        ],
        "name": "grantRole",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "bytes32",
                "name": "role",
                "type": "bytes32"
            },
            {
                "internalType": "address",
                "name": "account",
                "type": "address"
            }
        ],
        "name": "hasRole",
        "outputs": [
            {
                "internalType": "bool",
                "name": "",
                "type": "bool"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "uint256",
                "name": "roomId",
                "type": "uint256"
            },
            {
                "internalType": "address",
                "name": "player",
                "type": "address"
            }
        ],
        "name": "isPlayerInRoom",
        "outputs": [
            {
                "internalType": "bool",
                "name": "",
                "type": "bool"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "uint256",
                "name": "roomId",
                "type": "uint256"
            },
            {
                "internalType": "string",
                "name": "roomCode",
                "type": "string"
            },
            {
                "internalType": "uint256",
                "name": "paymentAmount",
                "type": "uint256"
            }
        ],
        "name": "joinRoom",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "uint256",
                "name": "roomId",
                "type": "uint256"
            }
        ],
        "name": "leaveRoom",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "owner",
        "outputs": [
            {
                "internalType": "address",
                "name": "",
                "type": "address"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "uint256",
                "name": "",
                "type": "uint256"
            }
        ],
        "name": "platformTreasury",
        "outputs": [
            {
                "internalType": "uint256",
                "name": "platformFee",
                "type": "uint256"
            },
            {
                "internalType": "uint256",
                "name": "roomCreatorFee",
                "type": "uint256"
            },
            {
                "internalType": "uint256",
                "name": "gameCreatorFee",
                "type": "uint256"
            },
            {
                "internalType": "uint256",
                "name": "totalFee",
                "type": "uint256"
            },
            {
                "internalType": "address",
                "name": "gameCreator",
                "type": "address"
            },
            {
                "internalType": "uint256",
                "name": "timestamp",
                "type": "uint256"
            },
            {
                "internalType": "contract IERC20",
                "name": "token",
                "type": "address"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "address",
                "name": "account",
                "type": "address"
            }
        ],
        "name": "removeGameManager",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "renounceOwnership",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "bytes32",
                "name": "role",
                "type": "bytes32"
            },
            {
                "internalType": "address",
                "name": "callerConfirmation",
                "type": "address"
            }
        ],
        "name": "renounceRole",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "bytes32",
                "name": "role",
                "type": "bytes32"
            },
            {
                "internalType": "address",
                "name": "account",
                "type": "address"
            }
        ],
        "name": "revokeRole",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "roomCounter",
        "outputs": [
            {
                "internalType": "uint256",
                "name": "",
                "type": "uint256"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "uint256",
                "name": "roomId",
                "type": "uint256"
            }
        ],
        "name": "roomExists",
        "outputs": [
            {
                "internalType": "bool",
                "name": "",
                "type": "bool"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "uint256",
                "name": "percentage",
                "type": "uint256"
            }
        ],
        "name": "setGameCreatorFeePercentage",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "uint256",
                "name": "percentage",
                "type": "uint256"
            }
        ],
        "name": "setPlatformFeePercentage",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "uint256",
                "name": "percentage",
                "type": "uint256"
            }
        ],
        "name": "setRoomCreatorFeePercentage",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "uint256",
                "name": "roomId",
                "type": "uint256"
            }
        ],
        "name": "startGame",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "bytes4",
                "name": "interfaceId",
                "type": "bytes4"
            }
        ],
        "name": "supportsInterface",
        "outputs": [
            {
                "internalType": "bool",
                "name": "",
                "type": "bool"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "address",
                "name": "newOwner",
                "type": "address"
            }
        ],
        "name": "transferOwnership",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "usdc",
        "outputs": [
            {
                "internalType": "contract IERC20",
                "name": "",
                "type": "address"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "usdt",
        "outputs": [
            {
                "internalType": "contract IERC20",
                "name": "",
                "type": "address"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    }
] as const;