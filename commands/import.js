const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const fs = require('node:fs');
const path = require('node:path');
const axios = require('axios');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('import')
		.setDescription('Import a JSON database file (Admin only).')
		.setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
		.addStringOption(option => 
			option.setName('database')
				.setDescription('Which database to overwrite')
				.setRequired(true)
				.addChoices(
					{ name: 'config.json', value: 'config.json' },
					{ name: 'data.json', value: 'data.json' },
					{ name: 'reputation.json', value: 'reputation.json' },
					{ name: 'resources.json', value: 'resources.json' }
				))
		.addAttachmentOption(option => 
			option.setName('file')
				.setDescription('The JSON file to import')
				.setRequired(true)),
	async execute(interaction) {
		const targetDb = interaction.options.getString('database');
		const attachment = interaction.options.getAttachment('file');

		if (!attachment.name.endsWith('.json')) {
			return interaction.reply({ content: '❌ The uploaded file must be a JSON file.', ephemeral: true });
		}

		await interaction.deferReply({ ephemeral: true });

		try {
			const response = await axios.get(attachment.url);
			const jsonData = response.data;

			if (typeof jsonData !== 'object') {
				return interaction.editReply({ content: '❌ Invalid JSON format.' });
			}

			const filePath = path.join(__dirname, '..', targetDb);
			fs.writeFileSync(filePath, JSON.stringify(jsonData, null, 2));

			await interaction.editReply({ content: `✅ **${targetDb}** has been successfully overwritten with the imported data.` });
		} catch (error) {
			console.error('Error importing JSON:', error);
			await interaction.editReply({ content: '❌ An error occurred while importing the file.' });
		}
	},
};
