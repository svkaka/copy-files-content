import {Plugin, TFile, Notice, Menu, TAbstractFile} from 'obsidian';
import {DEFAULT_SETTINGS, MyPluginSettings} from "./settings";

// Remember to rename these classes and interfaces!

export default class CopyFilesContent extends Plugin {
	settings: MyPluginSettings;

	async onload() {
		await this.loadSettings();

		this.registerEvent(
			this.app.workspace.on("files-menu", (menu: Menu, files: TAbstractFile[]) => {
				menu.addItem((item) => {
					item
						.setTitle("Copy contents")
						.setIcon("clipboard-copy")
						.onClick(async () => this.copySelectedFiles(files));
				});
			})
		);
		this.registerEvent(
			this.app.workspace.on("file-menu", (menu: Menu, file: TAbstractFile) => {
				menu.addItem((item) => {
					item
						.setTitle("Copy content")
						.setIcon("clipboard-copy")
						.onClick(async () => this.copySelectedFiles([file]));
				});
			})
		);

		// TODO add a settings tab so the user can configure various aspects of the plugin
		// this.addSettingTab(new SampleSettingTab(this.app, this));
	}

	onunload() {
	}

	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData() as Partial<MyPluginSettings>);
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}

	async copySelectedFiles(files: TAbstractFile[]): Promise<void> {
		// TODO Support folders
		const validFiles = files.filter((f): f is TFile => f instanceof TFile);

		if (validFiles.length === 0) {
			new Notice("No files selected.");
			return;
		}

		const readPromises = validFiles.map(async (file) => {
			try {
				const content = await this.app.vault.read(file);
				//  TODO support Formatting
				return `# ${file.basename}\n\n${content}\n\n---\n\n`;
			} catch (err) {
				console.error(`Failed to read ${file.path}`, err);
				return null;
			}
		});

		const results = await Promise.all(readPromises);
		const finalContent = results.filter((c): c is string => c !== null).join('');

		if (finalContent) {
			await navigator.clipboard.writeText(finalContent);
			new Notice(`Copied ${validFiles.length} files to clipboard!`);
		} else {
			new Notice("Failed to copy content.");
		}
	}
}
