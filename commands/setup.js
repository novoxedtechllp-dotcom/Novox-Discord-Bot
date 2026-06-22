const { SlashCommandBuilder, PermissionFlagsBits, ChannelType } = require('discord.js');
const fs = require('node:fs');
const path = require('node:path');

const configPath = path.join(__dirname, '../config.json');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('setup')
		.setDescription('Setup channels for specific tech update topics (Admin only).')
		.setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
		.addStringOption(option =>
			option.setName('topic')
				.setDescription('The topic you want to configure a channel for')
				.setRequired(true)
				.addChoices(
					{ name: 'MERN Stack', value: 'mern' },
					{ name: 'Node.js', value: 'node' },
					{ name: 'Flutter', value: 'flutter' },
					{ name: 'UI/UX Design', value: 'ui_ux' },
					{ name: 'AI Gen', value: 'ai' },
					{ name: 'Digital Marketing', value: 'marketing' },
					{ name: 'Graphic Design', value: 'graphic_design' },
					{ name: 'Video Editing', value: 'video_editing' },
					{ name: 'Admin Feedback Channel', value: 'feedback_admin' }
				))
		.addChannelOption(option =>
			option.setName('channel')
				.setDescription('The channel to send updates for this topic')
				.addChannelTypes(ChannelType.GuildText)
				.setRequired(true)),
	async execute(interaction) {
		const topic = interaction.options.getString('topic');
		const channel = interaction.options.getChannel('channel');
		
		let config = {};
		if (fs.existsSync(configPath)) {
			config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
		}

		if (!config[interaction.guildId]) {
			config[interaction.guildId] = { topics: {} };
		}
		if (!config[interaction.guildId].topics) {
			config[interaction.guildId].topics = {};
		}

		config[interaction.guildId].topics[topic] = channel.id;

		fs.writeFileSync(configPath, JSON.stringify(config, null, 2));

		await interaction.reply({ content: `✅ Updates for **${topic}** will now be sent to ${channel}.`, ephemeral: true });
	},
};
