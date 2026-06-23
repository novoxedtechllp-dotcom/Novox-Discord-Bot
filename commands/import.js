const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');

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
			let jsonData = response.data;

			if (!Array.isArray(jsonData)) {
				// Legacy migration for old local JSON files
				let migratedData = [];
				try {
					if (targetDb === 'config.json') {
						for (const [guildId, config] of Object.entries(jsonData)) {
							migratedData.push({ guildId: guildId, tech_channels: config.topics || {}, ticket_channels: config.topics || {}, mentor_roles: {}, student_roles: {} });
						}
					} else if (targetDb === 'data.json') {
						migratedData.push({ id: 'main', lastPostedUrls: jsonData.lastPostedUrls || {} });
					} else if (targetDb === 'reputation.json') {
						for (const [guildId, users] of Object.entries(jsonData)) {
							for (const [userId, points] of Object.entries(users)) {
								migratedData.push({ guildId, userId, points });
							}
						}
					} else if (targetDb === 'resources.json') {
						for (const [guildId, topics] of Object.entries(jsonData)) {
							for (const [topic, items] of Object.entries(topics)) {
								for (const item of items) {
									migratedData.push({ guildId, topic, link: item.link, description: item.description, addedBy: item.addedBy });
								}
							}
						}
					}
					jsonData = migratedData;
				} catch (e) {
					return interaction.editReply({ content: '❌ Invalid JSON format. Could not parse legacy data.' });
				}
			}
			
			const { Models } = require('../database/mongoose');
			
			let Model;
			if (targetDb === 'config.json') Model = Models.Config;
			else if (targetDb === 'data.json') Model = Models.Data;
			else if (targetDb === 'reputation.json') Model = Models.Reputation;
			else if (targetDb === 'resources.json') Model = Models.Resource;

			if (Model) {
				await Model.deleteMany({});
				if (jsonData.length > 0) {
					await Model.insertMany(jsonData);
				}
				let replyMessage = `✅ **${targetDb}** has been successfully overwritten in MongoDB.`;
				if (targetDb === 'config.json') {
					replyMessage += `\n⚠️ **Note:** Legacy topics were mapped to BOTH tech updates and ticket channels for backward compatibility. Please run \`/setup course\` to re-verify your configuration!`;
				}
				await interaction.editReply({ content: replyMessage });
			} else {
				await interaction.editReply({ content: '❌ Invalid database target.' });
			}

		} catch (error) {
			console.error('Error importing JSON:', error);
			await interaction.editReply({ content: '❌ An error occurred while importing the file.' });
		}
	},
};
