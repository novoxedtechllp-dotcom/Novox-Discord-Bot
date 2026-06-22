const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('help')
		.setDescription('View the list of available commands.'),
	async execute(interaction) {
		const isAdmin = interaction.member.permissions.has(PermissionFlagsBits.Administrator);

		const embed = new EmbedBuilder()
			.setColor(0x0099FF)
			.setTitle('📚 Bot Command Manual');

		let generalCommands = '' +
			'**`/ask`** — Ask a question and create a mentor Q&A thread.\n' +
			'**`/resource add`** — Add a useful link to the community library.\n' +
			'**`/resource get`** — Retrieve saved links for a specific topic.\n' +
			'**`/thank`** — Thank someone and give them a reputation point.\n' +
			'**`/leaderboard`** — View the most helpful members in the server.\n' +
			'**`/feedback`** — Send anonymous feedback securely to the admins.\n' +
			'**`/tech-update`** — Manually post the latest tech industry news.\n' +
			'**`/ping`** — Check the bot\'s connection latency.';

		embed.addFields({ name: 'User & Mentor Commands', value: generalCommands });

		if (isAdmin) {
			let adminCommands = '' +
				'**`/setup`** — Map topics or admin features to specific channels.\n' +
				'**`/export`** — Export all internal databases as JSON files.\n' +
				'**`/import`** — Overwrite a database with a JSON file.';

			embed.addFields({ name: 'Admin Only Commands', value: adminCommands });
			embed.setDescription('You are viewing the **Administrator** manual. You have access to configuration commands.');
		} else {
			embed.setDescription('Here are all the commands you can use to interact with the community!');
		}

		await interaction.reply({ embeds: [embed], ephemeral: true });
	},
};
