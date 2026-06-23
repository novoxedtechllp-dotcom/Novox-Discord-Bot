const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('ping')
		.setDescription('Check the bot\'s connection latency.'),
	async execute(interaction) {
		const sent = await interaction.reply({ content: 'Pinging...', fetchReply: true, ephemeral: true });
		const latency = sent.createdTimestamp - interaction.createdTimestamp;
		const apiLatency = Math.round(interaction.client.ws.ping);
		
		const embed = new EmbedBuilder()
			.setColor(0x00FF00)
			.setTitle('📡 Network Latency Status')
			.addFields(
				{ name: 'Bot Latency', value: `\`\`\`yaml\n${latency}ms\n\`\`\``, inline: false },
				{ name: 'API Latency', value: `\`\`\`yaml\n${apiLatency}ms\n\`\`\``, inline: false }
			);

		await interaction.editReply({ content: null, embeds: [embed] });
	},
};
