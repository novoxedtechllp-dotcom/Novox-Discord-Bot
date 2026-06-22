const { SlashCommandBuilder, PermissionFlagsBits, AttachmentBuilder } = require('discord.js');
const fs = require('node:fs');
const path = require('node:path');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('export')
		.setDescription('Export all bot databases as JSON files (Admin only).')
		.setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
	async execute(interaction) {
		const files = ['config.json', 'data.json', 'reputation.json', 'resources.json'];
		const attachments = [];

		for (const file of files) {
			const filePath = path.join(__dirname, '..', file);
			if (fs.existsSync(filePath)) {
				const attachment = new AttachmentBuilder(filePath, { name: file });
				attachments.push(attachment);
			}
		}

		if (attachments.length === 0) {
			return interaction.reply({ content: 'No data files found to export.', ephemeral: true });
		}

		await interaction.reply({ content: '📦 **Database Export:**\nHere are the current database files.', files: attachments, ephemeral: true });
	},
};
