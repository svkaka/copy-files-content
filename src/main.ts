import {Plugin, TFile, Notice, Menu, TAbstractFile, TFolder} from 'obsidian';
import {DEFAULT_SETTINGS, MyPluginSettings} from "./settings";

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
		const visited: Set<string> = new Set
		const cleanedSelectedFiles: TFile[] = []
		// respect the order of selection
		this.getFilesRecursive(files).forEach((file) => {
			if (!visited.has(file.path)) {
				visited.add(file.path)
				cleanedSelectedFiles.push(file)
			}
		})

		if (cleanedSelectedFiles.length === 0) {
			new Notice("No .md files found.");
			return;
		}

		const readPromises = cleanedSelectedFiles.map(async (file) => {
			try {
				const content = await this.app.vault.read(file);
				//TODO custom header
				const breadcrumb = file.path.replace(`.${file.extension}`, '');

				return `# ${breadcrumb}\n\n${content}\n\n---\n\n`;
			} catch (err) {
				console.error(`Failed to read ${file.path}`, err);
				return null;
			}
		});

		const results = await Promise.all(readPromises);
		const finalContent = results.filter((c): c is string => c !== null).join('');

		if (finalContent) {
			await navigator.clipboard.writeText(finalContent);
			new Notice(`Copied ${cleanedSelectedFiles.length} files to clipboard!`);
		} else {
			new Notice("Failed to copy content.");
		}
	}

	/**
	 * Recursive helper to flatten folders into a list of files.
	 */
	getFilesRecursive(files: TAbstractFile[]): TFile[] {
		let result: TFile[] = [];

		for (const file of files) {
			if (file instanceof TFile) {
				// TODO support other types
				if (file.extension === 'md') {
					result.push(file);
				}
			} else if (file instanceof TFolder) {
				result = result.concat(this.getFilesRecursive(file.children));
			}
		}
		return result;
	}
}
