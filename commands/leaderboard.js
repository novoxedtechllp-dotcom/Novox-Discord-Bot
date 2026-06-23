const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');


module.exports = {
	data: new SlashCommandBuilder()
		.setName('leaderboard')
		.setDescription('View the top 10 most helpful mentors and students.'),
	async execute(interaction) {
		const { Models } = require('../database/mongoose');
		const guildId = interaction.guildId;

		const sortedUsers = await Models.Reputation.find({ guildId: guildId }).sort({ points: -1 }).limit(10);

		if (sortedUsers.length === 0) {
			return interaction.reply({ content: 'No one has any reputation points yet! Use `/thank` to appreciate someone.', ephemeral: true });
		}

		const embed = new EmbedBuilder()
			.setColor(0x0099FF)
			.setTitle('🏆 Reputation Leaderboard')
			.setDescription('The most helpful members of our community:');

		let leaderboardText = '';
		for (let i = 0; i < sortedUsers.length; i++) {
			const userRep = sortedUsers[i];
			leaderboardText += `**${i + 1}.** <@${userRep.userId}> — ${userRep.points} points\n`;
		}

		embed.addFields({ name: 'Top 10', value: leaderboardText });

		await interaction.reply({ embeds: [embed] });
	},
};
