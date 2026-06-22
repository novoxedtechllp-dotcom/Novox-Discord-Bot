const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const fs = require('node:fs');
const path = require('node:path');

const reputationPath = path.join(__dirname, '../reputation.json');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('leaderboard')
		.setDescription('View the top 10 most helpful mentors and students.'),
	async execute(interaction) {
		let reputation = {};
		if (fs.existsSync(reputationPath)) {
			reputation = JSON.parse(fs.readFileSync(reputationPath, 'utf8'));
		}

		const guildId = interaction.guildId;
		const guildRep = reputation[guildId] || {};

		const sortedUsers = Object.entries(guildRep)
			.sort(([, a], [, b]) => b - a)
			.slice(0, 10);

		if (sortedUsers.length === 0) {
			return interaction.reply({ content: 'No one has any reputation points yet! Use `/thank` to appreciate someone.', ephemeral: true });
		}

		const embed = new EmbedBuilder()
			.setColor(0x0099FF)
			.setTitle('🏆 Reputation Leaderboard')
			.setDescription('The most helpful members of our community:');

		let leaderboardText = '';
		for (let i = 0; i < sortedUsers.length; i++) {
			const [userId, points] = sortedUsers[i];
			leaderboardText += `**${i + 1}.** <@${userId}> — ${points} points\n`;
		}

		embed.addFields({ name: 'Top 10', value: leaderboardText });

		await interaction.reply({ embeds: [embed] });
	},
};
