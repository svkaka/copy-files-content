import {Plugin, TFile, Notice, Menu, TAbstractFile, TFolder} from 'obsidian';
import {DEFAULT_SETTINGS, CopyPluginSettings, CopySettingsTab, TEMPLATE_COMPONENT} from "./settings";

export default class CopyFilesContent extends Plugin {
	settings: CopyPluginSettings;

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

		this.addSettingTab(new CopySettingsTab(this.app, this));
	}

	onunload() {
	}

	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData() as Partial<CopyPluginSettings>);
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}

	async copySelectedFiles(files: TAbstractFile[]): Promise<void> {
		const ignored = this.settings.ignoredExtensions.split(',').map(e => e.trim().toLowerCase());

		const visited: Set<string> = new Set
		const cleanedSelectedFiles: TFile[] = []
		// respect the order of selection
		this.getFilesRecursive(files).forEach((file) => {
			if (!visited.has(file.path) && !ignored.includes(file.extension.toLowerCase())) {
				visited.add(file.path)
				cleanedSelectedFiles.push(file)
			}
		})

		if (cleanedSelectedFiles.length === 0) {
			new Notice("No valid files found.");
			return;
		}
		const template = this.settings.template;
		if (!template.includes(TEMPLATE_COMPONENT.CONTENT)) {
			new Notice(`Warning: Template is missing ${TEMPLATE_COMPONENT.CONTENT}. Output will be empty.`);
		}

		const readPromises = cleanedSelectedFiles.map(async (file) => {
			try {
				//Reads a plaintext file that is stored inside the vault,
				const content = await this.app.vault.read(file);
				return template
					.split(TEMPLATE_COMPONENT.PATH).join(file.path)
					.split(TEMPLATE_COMPONENT.FOLDER).join(file.parent?.path || "")
					.split(TEMPLATE_COMPONENT.FILENAME).join(file.basename)
					.split(TEMPLATE_COMPONENT.EXTENSION).join(file.extension)
					.split(TEMPLATE_COMPONENT.CONTENT).join(content)
					.split('\\n').join('\n');
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
				result.push(file);
			} else if (file instanceof TFolder) {
				result = result.concat(this.getFilesRecursive(file.children));
			}
		}
		return result;
	}
}
