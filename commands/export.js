const { SlashCommandBuilder, PermissionFlagsBits, AttachmentBuilder } = require('discord.js');


module.exports = {
	data: new SlashCommandBuilder()
		.setName('export')
		.setDescription('Export all bot databases as JSON files (Admin only).')
		.setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
	async execute(interaction) {
		await interaction.deferReply({ ephemeral: true });
		const { Models } = require('../database/mongoose');

		const attachments = [];

		const configData = await Models.Config.find({});
		const dataData = await Models.Data.find({});
		const repData = await Models.Reputation.find({});
		const resData = await Models.Resource.find({});

		const files = [
			{ name: 'config.json', data: configData },
			{ name: 'data.json', data: dataData },
			{ name: 'reputation.json', data: repData },
			{ name: 'resources.json', data: resData }
		];

		for (const file of files) {
			const buffer = Buffer.from(JSON.stringify(file.data, null, 2), 'utf-8');
			attachments.push(new AttachmentBuilder(buffer, { name: file.name }));
		}

		const replyContent = '📦 **Database Export (MongoDB):**\nHere are the current database collections exported as JSON.\n\n⚠️ **WARNING:** This is an ephemeral message (only visible to you). **You must download and save these files to your device now.** If you dismiss this message, the files will be lost!';

		await interaction.editReply({ content: replyContent, files: attachments });
	},
};
