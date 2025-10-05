# Obsidian Filecoin Backup Plugin

This plugin enables automated backup of your Obsidian vault to Filecoin, providing secure, decentralized storage for your notes.

## Features

- 🗂️ Backup entire vault to Filecoin
- 📄 Individual file backup support
- 📊 Real-time progress tracking
- 💾 Automatic backup scheduling
- 🔄 Retention period management
- 📝 Backup history tracking

## Installation

1. Download the latest release from the releases page
2. Extract the archive into your vault's `.obsidian/plugins` directory
3. Enable the plugin in Obsidian's Community Plugins settings

## Configuration

1. Open Settings > Community Plugins > Filecoin Backup
2. Configure the following settings:
   - Private Key: Your Filecoin private key for transactions
   - RPC URL: Filecoin RPC endpoint (defaults to Calibration testnet)
   - Default Retention Days: How long to retain backups (1-365 days)
   - Auto Backup: Enable/disable automatic backups
   - Backup Interval: How often to run automatic backups (15-1440 minutes)
   - File Types: Which file extensions to include in backups
   - Excluded Folders: Folders to skip during backup

## Usage

### Backing Up Your Vault

There are several ways to initiate a backup:

1. **Using the Ribbon Icon**
   - Click the cloud upload icon in the left sidebar
   - Choose "Backup Vault to Filecoin"

2. **Using Commands**
   - Open the Command Palette (Ctrl/Cmd + P)
   - Search for "Backup vault" or "Backup current file"

3. **Automatic Backups**
   - Enable auto-backup in settings
   - Set your desired backup interval
   - The plugin will automatically backup your vault at the specified interval

### Monitoring Backup Progress

- A persistent notice shows real-time backup progress
- For small batches (≤5 files), individual file progress is shown
- For larger batches, overall progress percentage is displayed
- Check the console for detailed progress logs

### Viewing Backup History

1. Open Settings > Community Plugins > Filecoin Backup
2. Click "View Backup History"
3. See details for each backup:
   - File name
   - Backup date
   - Retention period
   - CID (Content Identifier)
   - Status

## Technical Details

- Uses Synapse SDK for Filecoin integration
- Supports both desktop and mobile Obsidian (some features may be desktop-only)
- Files are backed up individually to maintain granular control
- All backups include metadata for better organization
- Progress tracking via IPC between main process and backup service

## Development

### Prerequisites

- Node.js v16 or higher
- npm or yarn
- Basic understanding of TypeScript and Obsidian Plugin API

### Setup

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start development build:
   ```bash
   npm run dev
   ```

### Building

To create a production build:
```bash
npm run build
```

### Testing

To test the plugin:
1. Copy `main.js`, `styles.css`, and `manifest.json` to your test vault's plugins directory
2. Enable the plugin in Obsidian
3. Configure settings with your Filecoin credentials
4. Try backing up files and monitor the console for detailed logs

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## License

[MIT License](LICENSE)

## Support

- Report issues on GitHub
- Join our community discussions
- Check the [API Documentation](https://github.com/obsidianmd/obsidian-api)

## Security Considerations

- Private keys are stored locally in your vault settings
- No data is transmitted without explicit user action
- All backups are encrypted before transmission
- Network requests only made during backup operations