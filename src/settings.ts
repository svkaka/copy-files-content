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
	EXTENSION = "{{fileExt}}",
}

export const TEMPLATE_STANDARD = `**File:** ${TEMPLATE_COMPONENT.PATH}\\n\\n${TEMPLATE_COMPONENT.CONTENT}\\n\\n---\\n\\n`;
export const TEMPLATE_RAW = `${TEMPLATE_COMPONENT.CONTENT}\\n\\n`;
export const DEFAULT_IGNORED_EXT = 'svg';


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


	display(): void {
		const {containerEl} = this;
		containerEl.empty();

		let textAreaEl: HTMLTextAreaElement;

		new Setting(containerEl)
			.setName('Export template')
			.setDesc("Configure the layout of exported content.")
			.addTextArea(text => {
				textAreaEl = text.inputEl;
				text
					.setPlaceholder('e.g. **File:** {{path}}\n\n{{content}}')
					.setValue(this.plugin.settings.template)
					.onChange(async (value) => {
						this.plugin.settings.template = value;
						await this.plugin.saveSettings();
					});
				text.inputEl.addClass('copy-files-textarea');
			});

		const insertAtCursor = async (token: string) => {
			if (!textAreaEl) return;

			const start = textAreaEl.selectionStart;
			const end = textAreaEl.selectionEnd;
			const currentText = textAreaEl.value;

			const newText = currentText.substring(0, start) + token + currentText.substring(end);

			textAreaEl.value = newText;
			this.plugin.settings.template = newText;

			// Move cursor to just after the inserted token
			textAreaEl.focus();
			textAreaEl.setSelectionRange(start + token.length, start + token.length);

			await this.plugin.saveSettings();
		};


		const toolbar = containerEl.createDiv({cls: 'copy-files-toolbar'});
		Object.values(TEMPLATE_COMPONENT).forEach(token => {
			new ButtonComponent(toolbar)
				.setButtonText(token)
				.setTooltip(`Insert ${token}`)
				.onClick(async () => insertAtCursor(token));
		});

		new ButtonComponent(toolbar)
			.setButtonText('\\n\\n')
			.setTooltip('Insert new lines')
			.onClick(async () => insertAtCursor('\\n\\n'));

		new ButtonComponent(toolbar)
			.setButtonText('---')
			.setTooltip('Insert separator')
			.onClick(async () => insertAtCursor('\\n\\n---\\n\\n'));


		toolbar.createDiv({cls: 'copy-files-spacer'});

		new ButtonComponent(toolbar)
			.setButtonText('Standard')
			.setTooltip('Reset to header + content')
			.onClick(async () => {
				this.plugin.settings.template = TEMPLATE_STANDARD;
				await this.plugin.saveSettings();
				textAreaEl.value = TEMPLATE_STANDARD;
			});

		new ButtonComponent(toolbar)
			.setButtonText('Raw')
			.setTooltip('Reset to content only')
			.onClick(async () => {
				this.plugin.settings.template = TEMPLATE_RAW;
				await this.plugin.saveSettings();
				textAreaEl.value = TEMPLATE_RAW;
			});


		new Setting(containerEl)
			.setName('Ignored extensions')
			.setHeading();

		new Setting(containerEl)
			.setName('Ignored extensions')
			.setDesc('Comma-separated list of file types to skip.')
			.addText(text => {
				text
					.setPlaceholder(DEFAULT_IGNORED_EXT)
					.setValue(this.plugin.settings.ignoredExtensions)
					.onChange(async (value) => {
						this.plugin.settings.ignoredExtensions = value;
						await this.plugin.saveSettings();
					});
				text.inputEl.addClass('copy-files-input');
			});
	}
}
