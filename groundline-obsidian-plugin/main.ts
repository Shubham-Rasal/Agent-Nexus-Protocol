import { App, Plugin, PluginSettingTab, Setting, Notice, TFile, Modal, ButtonComponent } from 'obsidian';
import { BackupContextManager, BackupContextHelpers } from './backup-context';
import { RetentionBackupService } from './retention-backup-service';
import { BackupServiceConfig } from './backup-types';
import { RPC_URLS, Synapse, WarmStorageService } from '@filoz/synapse-sdk';
import * as fs from 'fs/promises';
import { ethers } from 'ethers';
import { exec } from 'child_process';
// At top of main.ts
// Prevent Synapse from mistakenly using MetaMask
(globalThis as any).ethereum = undefined;

interface RetentionBackupSettings {
  privateKey: string;
  rpcURL: string;
  defaultRetentionDays: number;
  autoBackupEnabled: boolean;
  autoBackupInterval: number; // minutes
  lastBackupTime: number;
  includedFileTypes: string[];
  excludedFolders: string[];
}

const DEFAULT_SETTINGS: RetentionBackupSettings = {
  privateKey: '',
  rpcURL: RPC_URLS.calibration.http,
  defaultRetentionDays: 30,
  autoBackupEnabled: false,
  autoBackupInterval: 60,
  lastBackupTime: 0,
  includedFileTypes: ['md', 'txt', 'json'],
  excludedFolders: ['.obsidian', '.git', 'node_modules']
};

export default class RetentionBackupPlugin extends Plugin {
  settings: RetentionBackupSettings;
  backupService: RetentionBackupService | null = null;
  autoBackupInterval: number | null = null;
  statusBarItemEl: HTMLElement | null = null;

	async onload() {
		await this.loadSettings();

    // Initialize backup service if configured
    if (this.settings.privateKey) {
      await this.initializeBackupService();
    }

    // Add ribbon icon
    this.addRibbonIcon('cloud-upload', 'Backup to Filecoin', () => {
      this.openBackupModal();
    });

    // Add commands
		this.addCommand({
      id: 'backup-vault',
      name: 'Backup entire vault',
			callback: () => {
        this.backupVault();
			}
		});

		this.addCommand({
      id: 'backup-current-file',
      name: 'Backup current file',
      callback: () => {
        this.backupCurrentFile();
      }
    });

		this.addCommand({
			id: 'view-backups',
			name: 'View backup history',
			callback: () => {
				this.openBackupHistoryModal();
			}
		});

		// Add debugging test command
		this.addCommand({
			id: 'test-synapse-debug',
			name: 'Test Synapse SDK (Debug)',
			callback: () => {
        new Notice("🚀 Starting Synapse test...");
        const synapseScriptPath = "/home/bluequbit/Dev/groundline_plugin_test/.obsidian/plugins/obsidian-sample-plugin/synapse.js";
        exec(`node "${synapseScriptPath}"`, (err, stdout, stderr) => {
          if (err) {
            new Notice(`❌ Node test failed: ${err.message}`);
            return;
          }
          console.log(stdout);
          new Notice("✅ Node SDK test finished. Check console.");
        });
      },
		});

    // Add settings tab
    this.addSettingTab(new RetentionBackupSettingTab(this.app, this));

    // Add status bar item to show last backup time
    this.statusBarItemEl = this.addStatusBarItem();
    this.updateStatusBar(this.statusBarItemEl);

    // Setup auto backup if enabled
    if (this.settings.autoBackupEnabled) {
      this.setupAutoBackup();
    }
	}

	onunload() {
    if (this.autoBackupInterval) {
      window.clearInterval(this.autoBackupInterval);
    }
	}

	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}

  async initializeBackupService() {
    try {
      const config: BackupServiceConfig = {
        synapseConfig: {
          privateKey: this.settings.privateKey,
          rpcURL: RPC_URLS.calibration.http,
          withCDN: true
        },
        defaultRetentionDays: this.settings.defaultRetentionDays,
        dataSetId: 24, // Will be created
        storageFilePath: `${this.app.vault.configDir}/backup-records.json`
      };

      this.backupService = await RetentionBackupService.create(config);
      new Notice('✅ Backup service initialized with config: ' + config.synapseConfig.privateKey);
    } catch (error) {
      new Notice(`❌ Failed to initialize backup service: ${error.message}`);
      console.error('Backup service initialization failed:', error);
    }
  }

  async backupVault() {
    // Create persistent progress notice
    const progressNotice = new Notice('🚀 Starting vault backup...', 0);
    
    try {
      // Step 1: Scan files
      progressNotice.setMessage('📁 Scanning vault for markdown files...');
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const files = this.app.vault.getFiles();
      const mdFiles = files.filter(file => file.extension === 'md');
      
      if (mdFiles.length === 0) {
        progressNotice.hide();
        new Notice('📭 No markdown files found for backup');
        return;
      }

      progressNotice.setMessage(`📊 Found ${mdFiles.length} markdown files to backup`);
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Step 2: Calculate total size
      progressNotice.setMessage('📏 Calculating total backup size...');
      let totalSize = 0;
      for (const file of mdFiles) {
        try {
          const stat = await this.app.vault.adapter.stat(file.path);
          if (stat) totalSize += stat.size;
        } catch (error) {
          console.warn(`Could not get size for ${file.path}:`, error);
        }
      }
      
      progressNotice.setMessage(`📏 Total size: ${this.formatFileSize(totalSize)} across ${mdFiles.length} files`);
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Step 3: Process each file
      let successCount = 0;
      let failCount = 0;
      const synapseScriptPath = "/home/bluequbit/Dev/groundline_plugin_test/.obsidian/plugins/obsidian-sample-plugin/synapse.js";
      
      for (let i = 0; i < mdFiles.length; i++) {
        const file = mdFiles[i];
        const progress = Math.round(((i + 1) / mdFiles.length) * 100);

        // Use the adapter's getResourcePath to get a usable file path for the plugin
        // Note: getResourcePath returns a URL, not a filesystem path. If you need the actual path,
        // you may need to reconstruct it based on the vault location and file.path.
        // For now, we'll attempt to use process.cwd() + file.path as a workaround for desktop plugins.
        // This is not portable to mobile or remote vaults.
        const vaultBasePath = (this.app.vault.adapter as any).basePath;
        const filePath = vaultBasePath ? require('path').join(vaultBasePath, file.path) : file.path;

        progressNotice.setMessage(`⬆️ Backing up: ${file.name} (${i + 1}/${mdFiles.length}) - ${progress}%`);
        
        try {
          // Execute synapse.js for this file
          await new Promise((resolve, reject) => {
            const child = require('child_process').exec(
              `node "${synapseScriptPath}" "${filePath}"`,
              (error : any, stdout: any, stderr: any  ) => {
                if (error) {
                  reject(error);
                  return;
                }
                
                // Parse stdout for CID
                let cid = '';
                const lines = stdout.split('\n');
                for (const line of lines) {
                  if (line.includes('Upload complete:')) {
                    cid = line.split(':')[1].trim();
                    break;
                  }
                }
                
                resolve(cid);
              }
            );
            
            // Log output in real-time
            child.stdout.on('data', (data : any) => {
              const lines = data.toString().split('\n');
              for (const line of lines) {
                if (line.trim()) {
                  console.log(`[${file.name}] ${line.trim()}`);
                }
              }
            });
          });
          
          successCount++;
          
          // Show individual success for small batches
          if (mdFiles.length <= 5) {
            new Notice(`✅ ${file.name} backed up successfully`, 4000);
          }
        } catch (error) {
          console.error(`Failed to backup ${file.name}:`, error);
          failCount++;
          new Notice(`❌ Failed: ${file.name} - ${error.message}`, 4000);
        }
        
        // Small delay between files
        await new Promise(resolve => setTimeout(resolve, 200));
      }
      
      // Step 4: Finalize
      progressNotice.setMessage('📝 Updating backup records...');
      this.settings.lastBackupTime = Date.now();
      await this.saveSettings();
      
      // Update status bar
      if (this.statusBarItemEl) {
        this.updateStatusBar(this.statusBarItemEl);
      }
      
      // Hide progress and show final result
      progressNotice.hide();
      
      if (failCount === 0) {
        new Notice(`🎉 Vault backup completed successfully!\n✅ ${successCount} files backed up\n💾 Total size: ${this.formatFileSize(totalSize)}`, 6000);
      } else if (successCount > 0) {
        new Notice(`⚠️ Vault backup completed with errors:\n✅ ${successCount} files succeeded\n❌ ${failCount} files failed\nCheck console for details.`, 7000);
      } else {
        new Notice(`❌ Vault backup failed completely:\n❌ All ${failCount} files failed to backup\nCheck console and settings.`, 7000);
      }
      
    } catch (error) {
      progressNotice.hide();
      console.error('Vault backup failed:', error);
      new Notice(`❌ Vault backup process failed: ${error.message}`, 6000);
    }
  }

  async backupFileWithProgress(file: TFile, progressNotice?: Notice): Promise<any> {
    if (progressNotice) {
      progressNotice.setMessage(`📄 Processing ${file.name}...`);
    }
    
    // Get file content directly
    const content = await this.app.vault.read(file);
    const fileBuffer = new TextEncoder().encode(content);
    
    if (progressNotice) {
      progressNotice.setMessage(`📋 Scheduling backup for ${file.name}...`);
    }
    
    // Schedule backup with metadata and direct content
    const backupRecord = await this.backupService!.scheduleBackupFromContent(
      file.name,
      fileBuffer,
      this.settings.defaultRetentionDays,
      {
        category: 'obsidian-vault',
        sensitivity: 'standard',
        source: 'obsidian-plugin',
        originalPath: file.path,
        fileType: file.extension,
        vault: this.app.vault.getName(),
        timestamp: new Date().toISOString()
      }
    );
    
    if (progressNotice) {
      progressNotice.setMessage(`⬆️ Uploading ${file.name} to Filecoin...`);
    }
    
    // Execute backup directly with content
    const result = await this.backupService!.executeBackupFromContent(backupRecord.id, fileBuffer);
    return result;
  }

  formatFileSize(bytes: number): string {
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    if (bytes === 0) return '0 Bytes';
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  }

  updateStatusBar(statusBarItem: HTMLElement): void {
    if (this.settings.lastBackupTime === 0) {
      statusBarItem.setText('📦 No backup yet');
    } else {
      const lastBackup = new Date(this.settings.lastBackupTime);
      const timeAgo = this.getTimeAgo(lastBackup);
      statusBarItem.setText(`📦 Last backup: ${timeAgo}`);
    }
  }

  private getTimeAgo(date: Date): string {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);

    if (diffDays > 0) {
      return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    } else if (diffHours > 0) {
      return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    } else {
      return 'Recently';
    }
  }

  async backupCurrentFile() {
    if (!this.backupService) {
      new Notice('❌ Backup service not configured. Please check settings.');
      return;
    }

    const activeFile = this.app.workspace.getActiveFile();
    if (!activeFile) {
      new Notice('❌ No active file to backup');
      return;
    }

    if (!this.isEligibleForBackup(activeFile)) {
      new Notice(`❌ File type ${activeFile.extension} not eligible for backup`);
      return;
    }

    // Create progress notice for single file backup
    const progressNotice = new Notice(`🚀 Starting backup of ${activeFile.name}...`, 0);
    
    try {
      // Get file size
      const stat = await this.app.vault.adapter.stat(activeFile.path);
      const fileSize = stat ? this.formatFileSize(stat.size) : 'unknown size';
      
      progressNotice.setMessage(`📏 File size: ${fileSize}`);
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Estimate cost
      progressNotice.setMessage(`💰 Estimating storage cost...`);
      await new Promise(resolve => setTimeout(resolve, 800));
      
      // Backup the file
      const backupResult = await this.backupFileWithProgress(activeFile, progressNotice);
      
      progressNotice.hide();
      const cidDisplay = backupResult?.pieceCid ? `\n📦 CID: ${backupResult.pieceCid}` : '';
      new Notice(`✅ Successfully backed up ${activeFile.name}\n📄 Size: ${fileSize}\n⏰ Retention: ${this.settings.defaultRetentionDays} days${cidDisplay}`, 6000);
      
    } catch (error) {
      progressNotice.hide();
      console.error(`Failed to backup ${activeFile.name}:`, error);
      new Notice(`❌ Failed to backup ${activeFile.name}: ${error.message}`, 5000);
    }
  }

  async backupFile(file: TFile) {
    try {
      // Get file content directly
      const content = await this.app.vault.read(file);
      const fileBuffer = new TextEncoder().encode(content);
      
      // Schedule backup with metadata and direct content
      const backupRecord = await this.backupService!.scheduleBackupFromContent(
        file.name,
        fileBuffer,
        this.settings.defaultRetentionDays,
        {
          category: 'obsidian-vault',
          sensitivity: 'standard',
          source: 'obsidian-plugin',
          originalPath: file.path,
          fileType: file.extension,
          vault: this.app.vault.getName(),
          timestamp: new Date().toISOString()
        }
      );
      
      // Execute backup directly with content
      const result = await this.backupService!.executeBackupFromContent(backupRecord.id, fileBuffer);
      
      const cidDisplay = result?.pieceCid ? `\n📦 CID: ${result.pieceCid}` : '';
      new Notice(`✅ Backed up: ${file.name}${cidDisplay}`, 4000);
    } catch (error) {
      new Notice(`❌ Failed to backup ${file.name}: ${error.message}`);
      console.error(`Backup failed for ${file.name}:`, error);
    }
  }

  isEligibleForBackup(file: TFile): boolean {
    // Check file extension
    if (!this.settings.includedFileTypes.includes(file.extension)) {
      return false;
    }
    
    // Check excluded folders
    for (const excludedFolder of this.settings.excludedFolders) {
      if (file.path.startsWith(excludedFolder)) {
        return false;
      }
    }
    
    return true;
  }

  setupAutoBackup() {
    if (this.autoBackupInterval) {
      window.clearInterval(this.autoBackupInterval);
    }
    
    this.autoBackupInterval = window.setInterval(() => {
      this.backupVault();
    }, this.settings.autoBackupInterval * 60 * 1000);
  }

  openBackupModal() {
    new BackupModal(this.app, this).open();
  }

  openBackupHistoryModal() {
    new BackupHistoryModal(this.app, this).open();
  }

  
}

class BackupModal extends Modal {
  plugin: RetentionBackupPlugin;

  constructor(app: App, plugin: RetentionBackupPlugin) {
		super(app);
    this.plugin = plugin;
	}

	onOpen() {
    const { contentEl } = this;
    contentEl.createEl('h2', { text: 'Backup Options' });

    // Backup entire vault button
    new ButtonComponent(contentEl)
      .setButtonText('🗂️ Backup Vault to Filecoin')
      .setClass('mod-cta')
      .onClick(() => {
        this.close();
        this.plugin.backupVault();
      });

    contentEl.createEl('br');

    // Backup current file button
    new ButtonComponent(contentEl)
      .setButtonText('📄 Backup Current File')
      .onClick(() => {
        this.close();
        this.plugin.backupCurrentFile();
      });

    contentEl.createEl('br');

    // View backup history button
    new ButtonComponent(contentEl)
      .setButtonText('📊 View Backup History')
      .onClick(() => {
        this.close();
        this.plugin.openBackupHistoryModal();
      });
	}

	onClose() {
    const { contentEl } = this;
		contentEl.empty();
	}
}

class BackupHistoryModal extends Modal {
  plugin: RetentionBackupPlugin;

  constructor(app: App, plugin: RetentionBackupPlugin) {
    super(app);
    this.plugin = plugin;
  }

  async onOpen() {
    const { contentEl } = this;
    contentEl.createEl('h2', { text: 'Backup History' });

    if (!this.plugin.backupService) {
      contentEl.createEl('p', { text: '❌ Backup service not configured' });
      return;
    }

    try {
      const backups = await this.plugin.backupService.listBackups();
      
      if (backups.length === 0) {
        contentEl.createEl('p', { text: '📭 No backups found' });
        return;
      }

      // Create backup list
      const backupList = contentEl.createEl('div', { cls: 'backup-history-list' });
      
      for (const backup of backups) {
        const backupItem = backupList.createEl('div', { cls: 'backup-item' });
        
        backupItem.createEl('h3', { text: backup.fileName });
        backupItem.createEl('p', { text: `Status: ${backup.status}` });
        backupItem.createEl('p', { text: `Retention: ${backup.retentionDays} days` });
        backupItem.createEl('p', { text: `Created: ${new Date(backup.uploadTimestamp).toLocaleString()}` });
        backupItem.createEl('p', { text: `Expires: ${new Date(backup.expiryTimestamp).toLocaleString()}` });
        
        if (backup.pieceCid) {
          backupItem.createEl('p', { text: `CID: ${backup.pieceCid}` });
          
          // Add download button
          new ButtonComponent(backupItem)
            .setButtonText('📥 Download')
            .onClick(async () => {
              try {
                const downloadPath = `${this.app.vault.configDir}/downloaded_${backup.fileName}`;
                await this.plugin.backupService!.downloadBackup(backup.id, downloadPath);
                new Notice(`✅ Downloaded: ${backup.fileName}`);
              } catch (error) {
                new Notice(`❌ Download failed: ${error.message}`);
              }
            });
        }
      }
    } catch (error) {
      contentEl.createEl('p', { text: `❌ Failed to load backup history: ${error.message}` });
    }
  }

  onClose() {
    const { contentEl } = this;
    contentEl.empty();
  }
}

class RetentionBackupSettingTab extends PluginSettingTab {
  plugin: RetentionBackupPlugin;

  constructor(app: App, plugin: RetentionBackupPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
    const { containerEl } = this;
		containerEl.empty();

    containerEl.createEl('h2', { text: 'Retention Backup Settings' });

    // Private key setting
    new Setting(containerEl)
      .setName('Private Key')
      .setDesc('Your Filecoin private key for transactions')
      .addText(text => text
        .setPlaceholder('Enter private key')
        .setValue(this.plugin.settings.privateKey)
        .onChange(async (value) => {
          this.plugin.settings.privateKey = value;
          await this.plugin.saveSettings();
          if (value) {
            await this.plugin.initializeBackupService();
          }
        }));

    // RPC URL setting
    new Setting(containerEl)
      .setName('RPC URL')
      .setDesc('Filecoin RPC endpoint')
      .addText(text => text
        .setPlaceholder('RPC URL')
        .setValue(this.plugin.settings.rpcURL)
        .onChange(async (value) => {
          this.plugin.settings.rpcURL = value;
          await this.plugin.saveSettings();
        }));

    // Default retention days
    new Setting(containerEl)
      .setName('Default Retention Days')
      .setDesc('Default number of days to retain backups')
      .addSlider(slider => slider
        .setLimits(1, 365, 1)
        .setValue(this.plugin.settings.defaultRetentionDays)
        .setDynamicTooltip()
        .onChange(async (value) => {
          this.plugin.settings.defaultRetentionDays = value;
          await this.plugin.saveSettings();
        }));

    // Auto backup toggle
    new Setting(containerEl)
      .setName('Auto Backup')
      .setDesc('Automatically backup vault at regular intervals')
      .addToggle(toggle => toggle
        .setValue(this.plugin.settings.autoBackupEnabled)
        .onChange(async (value) => {
          this.plugin.settings.autoBackupEnabled = value;
          await this.plugin.saveSettings();
          if (value) {
            this.plugin.setupAutoBackup();
          } else if (this.plugin.autoBackupInterval) {
            window.clearInterval(this.plugin.autoBackupInterval);
          }
        }));

    // Auto backup interval
    new Setting(containerEl)
      .setName('Auto Backup Interval (minutes)')
      .setDesc('How often to run automatic backups')
      .addSlider(slider => slider
        .setLimits(15, 1440, 15)
        .setValue(this.plugin.settings.autoBackupInterval)
        .setDynamicTooltip()
        .onChange(async (value) => {
          this.plugin.settings.autoBackupInterval = value;
          await this.plugin.saveSettings();
          if (this.plugin.settings.autoBackupEnabled) {
            this.plugin.setupAutoBackup();
          }
        }));

    // File types setting
    new Setting(containerEl)
      .setName('Included File Types')
      .setDesc('File extensions to include in backups (comma separated)')
      .addText(text => text
        .setPlaceholder('md,txt,json')
        .setValue(this.plugin.settings.includedFileTypes.join(','))
        .onChange(async (value) => {
          this.plugin.settings.includedFileTypes = value.split(',').map(s => s.trim());
          await this.plugin.saveSettings();
        }));

    // Excluded folders setting
		new Setting(containerEl)
      .setName('Excluded Folders')
      .setDesc('Folders to exclude from backups (comma separated)')
			.addText(text => text
        .setPlaceholder('.obsidian,.git,node_modules')
        .setValue(this.plugin.settings.excludedFolders.join(','))
				.onChange(async (value) => {
          this.plugin.settings.excludedFolders = value.split(',').map(s => s.trim());
					await this.plugin.saveSettings();
				}));

    // Backup Control Section
    containerEl.createEl('h3', { text: 'Backup Controls' });
    
    // Last backup time display
    if (this.plugin.settings.lastBackupTime > 0) {
      const lastBackupDate = new Date(this.plugin.settings.lastBackupTime);
      const timeAgo = this.getTimeAgoText(lastBackupDate);
      containerEl.createEl('p', { 
        text: `Last backup: ${lastBackupDate.toLocaleString()} (${timeAgo})`,
        cls: 'backup-last-time'
      });
    } else {
      containerEl.createEl('p', { 
        text: 'No backups created yet',
        cls: 'backup-no-backups'
      });
    }

    // Manual backup buttons
    const backupControlsDiv = containerEl.createDiv({ cls: 'backup-controls' });
    
    // Backup current file button
    new Setting(backupControlsDiv)
      .setName('Backup Current File')
      .setDesc('Backup the currently active file to Filecoin')
      .addButton(button => button
        .setButtonText('📄 Backup Current File')
        .setClass('mod-cta')
        .onClick(async () => {
          await this.plugin.backupCurrentFile();
        }));

    // Backup entire vault button
    new Setting(backupControlsDiv)
      .setName('Backup Entire Vault')
      .setDesc('Backup all eligible files in your vault to Filecoin')
      .addButton(button => button
        .setButtonText('🗂️ Backup Entire Vault')
        .setClass('mod-warning')
        .onClick(async () => {
          await this.plugin.backupVault();
        }));

    // View backup history button
    new Setting(backupControlsDiv)
      .setName('Backup History')
      .setDesc('View and manage your backup history')
      .addButton(button => button
        .setButtonText('📊 View Backup History')
        .onClick(() => {
          this.plugin.openBackupHistoryModal();
        }));

    // Backup statistics
    if (this.plugin.backupService) {
      const statsDiv = containerEl.createDiv({ cls: 'backup-stats' });
      statsDiv.createEl('h4', { text: 'Backup Statistics' });
      
      // Async load and display stats
      this.loadBackupStats(statsDiv);
    }
  }

  private getTimeAgoText(date: Date): string {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);

    if (diffDays > 0) {
      return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    } else if (diffHours > 0) {
      return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    } else {
      return 'Recently';
    }
  }

  private async loadBackupStats(statsDiv: HTMLElement): Promise<void> {
    try {
      const stats = await this.plugin.backupService?.getStorageStats();
      if (stats) {
        const statsContent = statsDiv.createDiv({ cls: 'backup-stats-content' });
        
        statsContent.createEl('p', { 
          text: `📊 Total backups: ${stats.totalBackups}` 
        });
        statsContent.createEl('p', { 
          text: `✅ Active backups: ${stats.activeBackups}` 
        });
        statsContent.createEl('p', { 
          text: `⏰ Expired backups: ${stats.expiredBackups}` 
        });
        statsContent.createEl('p', { 
          text: `❌ Failed backups: ${stats.failedBackups}` 
        });
        statsContent.createEl('p', { 
          text: `💰 Total monthly cost: $${stats.totalMonthlyCost.toFixed(4)}` 
        });
      }
    } catch (error) {
      console.error('Failed to load backup stats:', error);
      statsDiv.createEl('p', { 
        text: '❌ Failed to load backup statistics',
        cls: 'backup-stats-error'
      });
    }
  }
}