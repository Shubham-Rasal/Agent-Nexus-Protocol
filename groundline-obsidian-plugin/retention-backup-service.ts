import * as fs from "fs/promises";
import * as crypto from "crypto";
import * as path from "path";
import {
	BackupRecord,
	BackupServiceConfig,
	RetentionPolicy,
	DEFAULT_RETENTION_POLICIES,
} from "./backup-types";
import {
	BackupContextManager,
	BackupContextHelpers,
	getDefaultConfig,
} from "./backup-context";
import { RPC_URLS, Synapse } from "@filoz/synapse-sdk";
import { Notice } from "obsidian";

export class RetentionBackupService {
	private retentionPolicies: RetentionPolicy[];

	constructor(config?: BackupServiceConfig) {
		this.retentionPolicies = DEFAULT_RETENTION_POLICIES;

		// Initialize context if config provided
		if (config) {
			BackupContextManager.createContext(config).catch(console.error);
		}
	}

	static async create(
		config?: BackupServiceConfig
	): Promise<RetentionBackupService> {
		const finalConfig = config || getDefaultConfig();
		await BackupContextManager.createContext(finalConfig);
		return new RetentionBackupService();
	}

	async initialize(): Promise<void> {
		// Context initialization is handled by BackupContextManager
		console.log("✅ Retention Backup Service ready (using shared context)");
	}

	async estimateBackupCost(
		filePath: string,
		retentionDays: number
	): Promise<{
		fileSize: number;
		estimatedCost: any;
		retentionPolicy: RetentionPolicy | null;
		calculatedCost: {
			totalCost: string;
			dailyRate: string;
			monthlyRate: string;
		};
	}> {
		const stats = await fs.stat(filePath);
		const fileSize = stats.size;

		// Find matching retention policy
		const retentionPolicy =
			this.retentionPolicies.find(
				(p) => p.retentionDays === retentionDays
			) || null;

		console.log(
			`📊 Estimating cost for file: ${path.basename(
				filePath
			)} (${fileSize} bytes)`
		);
		console.log(`📅 Retention period: ${retentionDays} days`);

		// Calculate storage cost using the context helper
		const costs = await BackupContextHelpers.estimateStorageCost(fileSize);

		// Calculate actual cost based on retention period
		const monthlyRateFloat = parseFloat(costs.perMonth);
		const dailyRateFloat = monthlyRateFloat / 30; // Approximate daily rate
		const totalCostForRetention = dailyRateFloat * retentionDays;

		const calculatedCost = {
			totalCost: totalCostForRetention.toFixed(6),
			dailyRate: dailyRateFloat.toFixed(6),
			monthlyRate: monthlyRateFloat.toFixed(6),
		};

		console.log(
			`💰 Monthly rate: ${monthlyRateFloat.toFixed(6)} per month`
		);
		console.log(`📅 Daily rate: ${dailyRateFloat.toFixed(6)} per day`);
		console.log(
			`🎯 Total cost for ${retentionDays} days: ${totalCostForRetention.toFixed(
				6
			)}`
		);

		return {
			fileSize,
			estimatedCost: costs,
			retentionPolicy,
			calculatedCost,
		};
	}

	async scheduleBackup(
		filePath: string,
		retentionDays?: number,
		metadata?: Record<string, any>
	): Promise<BackupRecord> {
		const config = BackupContextHelpers.getConfig();
		const finalRetentionDays = retentionDays || config.defaultRetentionDays;
		const costEstimate = await this.estimateBackupCost(
			filePath,
			finalRetentionDays
		);

		const now = Date.now();
		const expiryTimestamp = now + finalRetentionDays * 24 * 60 * 60 * 1000;

		const backupRecord: BackupRecord = {
			id: crypto.randomUUID(),
			filePath,
			fileName: path.basename(filePath),
			fileSize: costEstimate.fileSize,
			uploadTimestamp: now,
			retentionDays: finalRetentionDays,
			expiryTimestamp,
			status: "pending",
			estimatedCost: costEstimate.estimatedCost
				? {
						perMonth:
							costEstimate.estimatedCost.perMonth?.toString(),
						perDay: costEstimate.estimatedCost.perDay?.toString(),
						perEpoch:
							costEstimate.estimatedCost.perEpoch?.toString(),
				  }
				: undefined,
			calculatedCost: costEstimate.calculatedCost,
			metadata,
		};

		const backupStorage = BackupContextHelpers.getBackupStorage();
		await backupStorage.addRecord(backupRecord);
		console.log(
			`📝 Backup scheduled for ${
				backupRecord.fileName
			} (expires: ${new Date(expiryTimestamp).toISOString()})`
		);

		return backupRecord;
	}

	async scheduleBackupFromContent(
		fileName: string,
		content: Uint8Array,
		retentionDays?: number,
		metadata?: Record<string, any>
	): Promise<BackupRecord> {
		const config = BackupContextHelpers.getConfig();
		const finalRetentionDays = retentionDays || config.defaultRetentionDays;
		const fileSize = content.length;

		// Calculate storage cost based on file size
		const costs = await BackupContextHelpers.estimateStorageCost(fileSize);

		// Calculate actual cost based on retention period
		const monthlyRateFloat = parseFloat(costs.perMonth);
		const dailyRateFloat = monthlyRateFloat / 30;
		const totalCostForRetention = dailyRateFloat * finalRetentionDays;

		new Notice(
			`💰 Total cost for retention period: ${totalCostForRetention.toFixed(
				6
			)}`
		);

		const calculatedCost = {
			totalCost: totalCostForRetention.toFixed(6),
			dailyRate: dailyRateFloat.toFixed(6),
			monthlyRate: monthlyRateFloat.toFixed(6),
		};

		const now = Date.now();
		const expiryTimestamp = now + finalRetentionDays * 24 * 60 * 60 * 1000;

		const backupRecord: BackupRecord = {
			id: crypto.randomUUID(),
			filePath: "", // No file path since we're using content directly
			fileName,
			fileSize,
			uploadTimestamp: now,
			retentionDays: finalRetentionDays,
			expiryTimestamp,
			status: "pending",
			estimatedCost: costs
				? {
						perMonth: costs.perMonth?.toString(),
						perDay: costs.perDay?.toString(),
						perEpoch: costs.perEpoch?.toString(),
				  }
				: undefined,
			calculatedCost: calculatedCost,
			metadata,
		};

		const backupStorage = BackupContextHelpers.getBackupStorage();
		await backupStorage.addRecord(backupRecord);
		console.log(
			`📝 Backup scheduled for ${
				backupRecord.fileName
			} (expires: ${new Date(expiryTimestamp).toISOString()})`
		);

		return backupRecord;
	}

	async executeBackupFromContent(
		recordId: string,
		fileBuffer: Uint8Array
	): Promise<BackupRecord> {
		const backupStorage = BackupContextHelpers.getBackupStorage();
		const config = BackupContextHelpers.getConfig();
		const record = await backupStorage.getRecord(recordId);
		if (!record) {
			throw new Error(`Backup record ${recordId} not found`);
		}

		if (record.status !== "pending") {
			throw new Error(
				`Backup record ${recordId} is not in pending status`
			);
		}

		try {
			console.log(
				`🚀 Starting direct backup upload for ${record.fileName}...`
			);

			// Create comprehensive metadata for provenance and retention policy
			const provenanceMetadata = {
				// Original metadata from user
				...record.metadata,

				// Retention policy information
				retentionPolicy: {
					name:
						record.retentionDays <= 1
							? "daily"
							: record.retentionDays <= 7
							? "weekly"
							: record.retentionDays <= 30
							? "monthly"
							: record.retentionDays <= 90
							? "quarterly"
							: "custom",
					retentionDays: record.retentionDays,
					scheduledDate: new Date(
						record.uploadTimestamp
					).toISOString(),
					expiryDate: new Date(record.expiryTimestamp).toISOString(),
					autoExpiry: true,
				},

				// Provenance information
				provenance: {
					sourceFile: {
						path: record.metadata?.originalPath || "",
						name: record.fileName,
						size: record.fileSize,
						uploadTimestamp: record.uploadTimestamp,
					},
					backupSystem: {
						service: "RetentionBackupService",
						version: "1.0.0",
						backupId: record.id,
						createdBy: "automated-backup-system",
					},
					cost: {
						estimatedTotalCost: record.calculatedCost?.totalCost,
						dailyRate: record.calculatedCost?.dailyRate,
						monthlyRate: record.calculatedCost?.monthlyRate,
						currency: "USDFC",
					},
				},
			};

			// Create storage context with limited metadata (max 5 keys)
			const flatMetadata: Record<string, string> = {
				retention_days: String(record.retentionDays),
				expiry_date: provenanceMetadata.retentionPolicy.expiryDate,
				backup_id: record.id,
				total_cost: record.calculatedCost?.totalCost || "0",
				category: record.metadata?.category || "general",
			};

			// const context = await BackupContextHelpers.createStorageContext(flatMetadata)
			const synapse = await Synapse.create({
				privateKey: config.synapseConfig.privateKey,
				rpcURL: config.synapseConfig.rpcURL,
				withCDN: true,
			});

			new Notice(`✅ Synapse instance created successfully`);
			console.log(`✅ Synapse signer:`, synapse.getSigner());

			new Notice(`📦 Creating storage context...`);
			const context = await synapse.storage.createContext({
				withCDN: true,
				callbacks: {
					onDataSetResolved: (info: any) => {
						console.log(`✅ Using data set ${info.dataSetId}`);
						new Notice(`✅ Using data set ${info.dataSetId}`);
					},
				},
			});

			new Notice(`✅ Storage context created successfully`);

			// Perform preflight check
			// const preflight = await context.preflightUpload(fileBuffer.length);
			// console.log(
			// 	`✈️ Preflight check - Provider: ${JSON.stringify(preflight)}`
			// );
			// console.log(
			// 	`💰 Actual cost: ${preflight.estimatedCost?.perMonth} per month`
			// );
			// console.log(
			// 	`💳 Allowance sufficient: ${preflight.allowanceCheck.sufficient}`
			// );

			// if (!preflight.allowanceCheck.sufficient) {
			// 	throw new Error("Insufficient allowance for upload");
			// }

			// new Notice(
			// 	`💰 Allowance sufficient: ${preflight.allowanceCheck.sufficient}`
			// );

			// Upload the file with comprehensive metadata

			const filePath =
				"/home/bluequbit/Dev/groundline_plugin_test/.obsidian/plugins/obsidian-sample-plugin/AGENTS.md";
			const testFileBuffer = await fs.readFile(filePath);

			new Notice(
				`Uploading file ${filePath} with size ${testFileBuffer.length}`
			);

			const uploadResult = await context.upload(testFileBuffer, {
				onPieceAdded: (piece) => {
					new Notice(`💰 Piece added: ${piece}`);
				},
				onUploadComplete: (commp) => {
					new Notice(`💰 Upload complete: ${commp}`);
				},
			});

			// Update the record
			// const updatedRecord = {
			// 	...record,
			// 	pieceCid: uploadResult.pieceCid.toString(),
			// 	dataSetId: context.dataSetId,
			// 	status: "uploaded" as const,
			// 	estimatedCost: preflight.estimatedCost
			// 		? {
			// 				perMonth:
			// 					preflight.estimatedCost.perMonth?.toString(),
			// 				perDay: preflight.estimatedCost.perDay?.toString(),
			// 				perEpoch:
			// 					preflight.estimatedCost.perEpoch?.toString(),
			// 		  }
			// 		: undefined,
			// };

			// await backupStorage.updateRecord(recordId, updatedRecord);
			console.log(
				`🎉 Backup completed successfully for ${record.fileName}`
			);

			return record;
		} catch (error) {
			console.error(`❌ Backup failed for ${record.fileName}:`, error);
			await backupStorage.updateRecord(recordId, { status: "failed" });
			throw error;
		}
	}

	async processExpiredBackups(): Promise<void> {
		console.log("🧹 Processing expired backups...");

		const backupStorage = BackupContextHelpers.getBackupStorage();
		const expiredRecords = await backupStorage.getExpiredRecords();

		if (expiredRecords.length === 0) {
			console.log("✅ No expired backups found");
			return;
		}

		console.log(`Found ${expiredRecords.length} expired backup(s)`);

		for (const record of expiredRecords) {
			console.log(
				`⏰ Marking backup as expired: ${
					record.fileName
				} (expired: ${new Date(record.expiryTimestamp).toISOString()})`
			);
			await backupStorage.markExpired(record.id);
		}

		console.log("✅ Expired backups processed");
	}

	async getStorageStats(): Promise<{
		totalBackups: number;
		activeBackups: number;
		expiredBackups: number;
		failedBackups: number;
		totalMonthlyCost: number;
	}> {
		const backupStorage = BackupContextHelpers.getBackupStorage();
		const allRecords = await backupStorage.loadRecords();
		const activeRecords = await backupStorage.getActiveRecords();
		const expiredRecords = await backupStorage.getRecordsByStatus(
			"expired"
		);
		const failedRecords = await backupStorage.getRecordsByStatus("failed");
		const costInfo = await backupStorage.getTotalStorageCost();

		return {
			totalBackups: allRecords.length,
			activeBackups: activeRecords.length,
			expiredBackups: expiredRecords.length,
			failedBackups: failedRecords.length,
			totalMonthlyCost: costInfo.totalMonthly,
		};
	}

	async listBackups(
		status?: BackupRecord["status"]
	): Promise<BackupRecord[]> {
		const backupStorage = BackupContextHelpers.getBackupStorage();
		if (status) {
			return await backupStorage.getRecordsByStatus(status);
		}
		return await backupStorage.loadRecords();
	}

	async downloadBackup(recordId: string, outputPath?: string): Promise<void> {
		const backupStorage = BackupContextHelpers.getBackupStorage();
		const record = await backupStorage.getRecord(recordId);
		if (!record) {
			throw new Error(`Backup record ${recordId} not found`);
		}

		if (!record.pieceCid) {
			throw new Error(`Backup record ${recordId} has no piece CID`);
		}

		console.log(`📥 Downloading backup: ${record.fileName}`);

		// Download from any provider
		const data = await BackupContextHelpers.downloadFromStorage(
			record.pieceCid
		);

		const finalOutputPath = outputPath || `./restored_${record.fileName}`;
		await fs.writeFile(finalOutputPath, data);

		console.log(`✅ Backup downloaded to: ${finalOutputPath}`);
	}

	async addRetentionPolicy(policy: RetentionPolicy): Promise<void> {
		this.retentionPolicies.push(policy);
	}

	getRetentionPolicies(): RetentionPolicy[] {
		return [...this.retentionPolicies];
	}

	async startScheduler(intervalMinutes: number = 60): Promise<void> {
		console.log(
			`🕐 Starting backup scheduler (interval: ${intervalMinutes} minutes)`
		);

		const intervalMs = intervalMinutes * 60 * 1000;

		setInterval(async () => {
			try {
				await this.processExpiredBackups();
			} catch (error) {
				console.error("❌ Error in backup scheduler:", error);
			}
		}, intervalMs);

		// Run once immediately
		await this.processExpiredBackups();
	}

	async getBackupProvenance(recordId: string): Promise<{
		record: BackupRecord;
		provenance: any;
		retentionPolicy: any;
		costAnalysis: any;
	} | null> {
		const backupStorage = BackupContextHelpers.getBackupStorage();
		const record = await backupStorage.getRecord(recordId);
		if (!record) {
			return null;
		}

		return {
			record,
			provenance: {
				sourceFile: {
					path: record.filePath,
					name: record.fileName,
					size: record.fileSize,
					uploadDate: new Date(record.uploadTimestamp).toISOString(),
				},
				backupSystem: {
					service: "RetentionBackupService",
					version: "1.0.0",
					backupId: record.id,
				},
				storage: {
					pieceCid: record.pieceCid,
					dataSetId: record.dataSetId,
					status: record.status,
				},
			},
			retentionPolicy: {
				retentionDays: record.retentionDays,
				scheduledDate: new Date(record.uploadTimestamp).toISOString(),
				expiryDate: new Date(record.expiryTimestamp).toISOString(),
				daysRemaining: Math.max(
					0,
					Math.floor(
						(record.expiryTimestamp - Date.now()) /
							(24 * 60 * 60 * 1000)
					)
				),
				isExpired: record.expiryTimestamp <= Date.now(),
			},
			costAnalysis: {
				calculatedCost: record.calculatedCost,
				estimatedCost: record.estimatedCost,
				costPerDay: record.calculatedCost?.dailyRate,
				totalPaid: record.calculatedCost?.totalCost,
			},
		};
	}
}
