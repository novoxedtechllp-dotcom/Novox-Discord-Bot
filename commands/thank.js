const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');


module.exports = {
	data: new SlashCommandBuilder()
		.setName('thank')
		.setDescription('Thank someone for helping you and give them a reputation point!')
		.addUserOption(option => 
			option.setName('user')
				.setDescription('The user you want to thank')
				.setRequired(true)),
	async execute(interaction) {
		const targetUser = interaction.options.getUser('user');
		
		if (targetUser.id === interaction.user.id) {
			return interaction.reply({ content: 'You cannot thank yourself!', ephemeral: true });
		}
		if (targetUser.bot) {
			return interaction.reply({ content: 'You cannot thank a bot!', ephemeral: true });
		}

		const { Models } = require('../database/mongoose');
		const guildId = interaction.guildId;

		let repDoc = await Models.Reputation.findOne({ guildId: guildId, userId: targetUser.id });
		if (!repDoc) {
			repDoc = new Models.Reputation({ guildId: guildId, userId: targetUser.id, points: 0, lastThankedBy: {} });
		}

		const now = new Date();
		if (repDoc.lastThankedBy && repDoc.lastThankedBy.has(interaction.user.id)) {
			const lastThanked = repDoc.lastThankedBy.get(interaction.user.id);
			const hoursSinceLastThank = (now - lastThanked) / (1000 * 60 * 60);
			
			if (hoursSinceLastThank < 24) {
				const timeLeft = Math.ceil(24 - hoursSinceLastThank);
				return interaction.reply({ content: `⏳ You can only thank this person once per day. Try again in **${timeLeft} hours**.`, ephemeral: true });
			}
		}

		if (!repDoc.lastThankedBy) {
			repDoc.lastThankedBy = new Map();
		}
		repDoc.lastThankedBy.set(interaction.user.id, now);

		repDoc.points += 1;
		await repDoc.save();

		const embed = new EmbedBuilder()
			.setColor(0xFFD700)
			.setDescription(`🎉 **${interaction.user.username}** has thanked **${targetUser.username}**!\n\n${targetUser.username} now has **${repDoc.points}** reputation points.`);

		await interaction.reply({ embeds: [embed] });
	},
};
