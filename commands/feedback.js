const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const fs = require('node:fs');
const path = require('node:path');

const configPath = path.join(__dirname, '../config.json');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('feedback')
		.setDescription('Send anonymous feedback to the admins.')
		.addStringOption(option => 
			option.setName('course')
				.setDescription('Which class/course is this feedback about?')
				.setRequired(true)
				.addChoices(
					{ name: 'MERN Stack', value: 'MERN Stack' },
					{ name: 'Node.js', value: 'Node.js' },
					{ name: 'Flutter', value: 'Flutter' },
					{ name: 'UI/UX Design', value: 'UI/UX Design' },
					{ name: 'AI Gen', value: 'AI Gen' },
					{ name: 'Digital Marketing', value: 'Digital Marketing' },
					{ name: 'Graphic Design', value: 'Graphic Design' },
					{ name: 'Video Editing', value: 'Video Editing' }
				))
		.addStringOption(option => 
			option.setName('message')
				.setDescription('Your anonymous feedback message')
				.setRequired(true)),
	async execute(interaction) {
		const course = interaction.options.getString('course');
		const message = interaction.options.getString('message');

		let config = {};
		if (fs.existsSync(configPath)) {
			config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
		}

		const guildConfig = config[interaction.guildId];
		if (!guildConfig || !guildConfig.topics || !guildConfig.topics.feedback_admin) {
			return interaction.reply({ content: 'Anonymous feedback is not configured for this server. Admins must run `/setup` first.', ephemeral: true });
		}

		const adminChannel = interaction.client.channels.cache.get(guildConfig.topics.feedback_admin);
		if (!adminChannel) {
			return interaction.reply({ content: 'Could not find the configured admin feedback channel.', ephemeral: true });
		}

		const embed = new EmbedBuilder()
			.setColor(0xED4245)
			.setTitle(`🕵️ Anonymous Feedback: ${course}`)
			.setDescription(`"${message}"`)
			.setFooter({ text: 'This message was sent securely and anonymously.' });

		await adminChannel.send({ embeds: [embed] });
		await interaction.reply({ content: '✅ Your feedback has been anonymously sent to the admins. Thank you!', ephemeral: true });
	},
};
