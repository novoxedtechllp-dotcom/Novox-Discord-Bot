const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const fs = require('node:fs');
const path = require('node:path');

const reputationPath = path.join(__dirname, '../reputation.json');

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

		let reputation = {};
		if (fs.existsSync(reputationPath)) {
			reputation = JSON.parse(fs.readFileSync(reputationPath, 'utf8'));
		}

		const guildId = interaction.guildId;
		if (!reputation[guildId]) reputation[guildId] = {};
		if (!reputation[guildId][targetUser.id]) reputation[guildId][targetUser.id] = 0;

		reputation[guildId][targetUser.id] += 1;
		fs.writeFileSync(reputationPath, JSON.stringify(reputation, null, 2));

		const embed = new EmbedBuilder()
			.setColor(0xFFD700)
			.setDescription(`🎉 **${interaction.user.username}** has thanked **${targetUser.username}**!\n\n${targetUser.username} now has **${reputation[guildId][targetUser.id]}** reputation points.`);

		await interaction.reply({ embeds: [embed] });
	},
};
