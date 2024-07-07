# Etherscan-API Discord Bot

A Discord bot that tracks Ethereum transactions using the Etherscan API. This bot allows users to check the last 5 transactions of an Ethereum address, track a specific address for new transactions, and stop tracking an address.

## Table of Contents
1. [Features](#features)
2. [Installation](#installation)
3. [Configuration](#configuration)
4. [Usage](#usage)
5. [Commands](#commands)
6. [Technical Details](#technical-details)
7. [Troubleshooting](#troubleshooting)
8. [Contributing](#contributing)
9. [License](#license)

## Features

- **/checktx [Address]**: Check the last 5 transactions of a specified Ethereum address.
- **/trackaddress [Address] [Channel_ID]**: Track a specified Ethereum address and post updates to a specified Discord channel.
- **/stoptracking [Address]**: Stop tracking a specified Ethereum address.

## Installation

1. **Clone the repository:**
    ```sh
    git clone https://github.com/BaronVonAlex/Etherscan-API-Discord-Bot.git
    cd Etherscan-API-Discord-Bot
    ```

2. **Install dependencies:**
    ```sh
    npm install
    ```

3. **Set up your environment variables:**
    Create a `.env` file in the root directory and add your bot token and Etherscan API key.
    ```env
    DISCORD_TOKEN=your_discord_bot_token
    ETHERSCAN_API_KEY=your_etherscan_api_key
    ```

## Configuration

1. **Bot Token**: Obtain a bot token by creating a new bot on the [Discord Developer Portal](https://discord.com/developers/applications).
2. **Etherscan API Key**: Obtain an API key from [Etherscan](https://etherscan.io/apis).

## Usage

1. **Run the bot:**
    ```sh
    node index.js
    ```

2. **Invite the bot to your Discord server:**
    Use the OAuth2 URL Generator on the [Discord Developer Portal](https://discord.com/developers/applications) to generate an invite link for your bot.

## Commands

- **/checktx [Address]**: Checks the last 5 transactions of the specified Ethereum address. 
  - **Example**: `/checktx 0x742d35Cc6634C0532925a3b844Bc454e4438f44e`

- **/trackaddress [Address] [Channel_ID]**: Tracks a specified Ethereum address and posts updates to the specified Discord channel.
  - **Example**: `/trackaddress 0x742d35Cc6634C0532925a3b844Bc454e4438f44e 123456789012345678`

- **/stoptracking [Address]**: Stops tracking the specified Ethereum address.
  - **Example**: `/stoptracking 0x742d35Cc6634C0532925a3b844Bc454e4438f44e`

## Technical Details

- **Language**: JavaScript (Node.js)
- **Libraries**:
  - `discord.js`: Interacting with the Discord API.
  - `axios`: Making HTTP requests to the Etherscan API.
  - `dotenv`: Loading environment variables from a `.env` file.

- **Structure**:
  - `index.js`: Main file that initializes the bot and handles commands.
  - `commands/`: Directory containing command handlers.
    - `checktx.js`: Handler for the `/checktx` command.
    - `trackaddress.js`: Handler for the `/trackaddress` command.
    - `stoptracking.js`: Handler for the `/stoptracking` command.
  - `utils/`: Directory containing utility functions for interacting with the Etherscan API and Discord.

## Troubleshooting

- **Bot crashes with very active addresses**: The bot may crash if it processes an address with too many transactions in a short time. Use the `/checktx` command with caution for very active addresses.

## Contributing

Contributions are welcome! Please fork the repository and create a pull request with your changes. Ensure your code follows the project's coding standards and includes appropriate tests.

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.
