import {App, PluginSettingTab, Setting, ButtonComponent} from "obsidian";
import CopyFilesContent from "./main";

export interface CopyPluginSettings {
	template: string;
	ignoredExtensions: string;
}

export enum TEMPLATE_COMPONENT {
	CONTENT = "{{content}}",
	PATH = "{{path}}",
	FOLDER = "{{folder}}",
	FILENAME = "{{fileName}}",
	EXTENSION = "{{extension}}",
}
export const TEMPLATE_STANDARD = `**File:** ${TEMPLATE_COMPONENT.PATH}\\n\\n${TEMPLATE_COMPONENT.CONTENT}\\n\\n---\\n\\n`;
export const TEMPLATE_RAW = `${TEMPLATE_COMPONENT.CONTENT}\\n\\n`;
export const DEFAULT_IGNORED_EXT = 'txt, svg';


export const DEFAULT_SETTINGS: CopyPluginSettings = {
	template: TEMPLATE_STANDARD,
	ignoredExtensions: DEFAULT_IGNORED_EXT
}

export class CopySettingsTab extends PluginSettingTab {
	plugin: CopyFilesContent;

	constructor(app: App, plugin: CopyFilesContent) {
		super(app, plugin);
		this.plugin = plugin;
	}

	templateToolbar(toolbar: HTMLDivElement): void {
		toolbar.style.display = 'flex';
		toolbar.style.flexWrap = 'wrap';
		toolbar.style.gap = '10px';
		toolbar.style.marginTop = '-10px';
		toolbar.style.paddingBottom = '20px';
		toolbar.style.backgroundColor = 'var(--background-secondary)'
		//todo fix this looks shit - use styles

		Object.values(TEMPLATE_COMPONENT).forEach(token => {
			new ButtonComponent(toolbar)
				.setButtonText(token)
				.setTooltip(`Insert ${token}`)
				.onClick(async () => {
					this.plugin.settings.template += token;
					await this.plugin.saveSettings();
					this.display();
				});
		});

		new ButtonComponent(toolbar)
			.setButtonText('newline')
			.setTooltip('Insert New Line')
			.onClick(async () => {
				//todo cursor based
				this.plugin.settings.template += '\\n';
				await this.plugin.saveSettings();
				this.display();
			});
		const spacer = toolbar.createDiv();
		spacer.style.flexGrow = '1';
		spacer.style.minWidth = '20px';

		new ButtonComponent(toolbar)
			.setButtonText('Standard')
			.setTooltip('Reset to Header + Content')
			.onClick(async () => {
				this.plugin.settings.template = TEMPLATE_STANDARD;
				await this.plugin.saveSettings();
				this.display();
			});

		new ButtonComponent(toolbar)
			.setButtonText('Raw')
			.setTooltip('Reset to Content Only')
			.onClick(async () => {
				this.plugin.settings.template = TEMPLATE_RAW;
				await this.plugin.saveSettings();
				this.display();
			});
	}

	display(): void {
		const {containerEl} = this;
		containerEl.empty();

		containerEl.createEl('h2', {text: 'Copy Content Settings'});

		new Setting(containerEl)
			.setName('Output Template')
			.setDesc('Define how files are formatted.')
			.addText(text => {
				text
					.setPlaceholder('Enter your template...')
					.setValue(this.plugin.settings.template)
					.onChange(async (value) => {
						this.plugin.settings.template = value;
						await this.plugin.saveSettings();
					});
				text.inputEl.style.width = '100%';
				text.inputEl.style.fontFamily = 'monospace';
			});
		//todo add extra button for validation

		this.templateToolbar(containerEl.createDiv())

		new Setting(containerEl)
			.setName('Ignored Extensions')
			.setDesc(createFragment((frag) => {
				frag.appendText('Comma-separated list of file types to skip.');
				frag.createEl('br');
				frag.createEl('small', {
					text: 'Note: Binary files (images, PDFs) are automatically skipped.',
					cls: 'text-muted'
				});
			}))
			.addText(text => {
				text
					.setPlaceholder(DEFAULT_IGNORED_EXT)
					.setValue(this.plugin.settings.ignoredExtensions)
					.onChange(async (value) => {
						this.plugin.settings.ignoredExtensions = value;
						await this.plugin.saveSettings();
					});
				text.inputEl.style.width = '100%';
				text.inputEl.style.fontFamily = 'monospace';
			})
	}
}
