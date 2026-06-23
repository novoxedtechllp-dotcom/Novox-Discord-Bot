const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');


module.exports = {
	data: new SlashCommandBuilder()
		.setName('feedback')
		.setDescription('Send anonymous feedback to the admins.')
		.addStringOption(option => 
			option.setName('course')
				.setDescription('Which class/course is this feedback about?')
				.setRequired(true)
				.addChoices(
					{ name: 'MERN Stack', value: 'mern' },
					{ name: 'Node.js', value: 'node' },
					{ name: 'Flutter', value: 'flutter' },
					{ name: 'UI/UX Design', value: 'ui_ux' },
					{ name: 'AI Gen', value: 'ai' },
					{ name: 'Digital Marketing', value: 'marketing' },
					{ name: 'Graphic Design', value: 'graphic_design' },
					{ name: 'Video Editing', value: 'video_editing' }
				))
		.addStringOption(option => 
			option.setName('message')
				.setDescription('Your anonymous feedback message')
				.setRequired(true)),
	async execute(interaction) {
		const course = interaction.options.getString('course');
		const message = interaction.options.getString('message');

		const { Models } = require('../database/mongoose');
		const configDoc = await Models.Config.findOne({ guildId: interaction.guildId });
		if (!configDoc || !configDoc.ticket_channels || !configDoc.ticket_channels.get('feedback_admin')) {
			return interaction.reply({ content: '❌ The admin has not configured a feedback channel yet.', ephemeral: true });
		}

		if (configDoc.student_roles && configDoc.student_roles.get(course)) {
			const requiredRoleId = configDoc.student_roles.get(course);
			if (!interaction.member.roles.cache.has(requiredRoleId)) {
				return interaction.reply({ content: `❌ You must have the <@&${requiredRoleId}> role to send feedback for this course.`, ephemeral: true });
			}
		}

		const adminChannelId = configDoc.ticket_channels.get('feedback_admin');
		const adminChannel = interaction.client.channels.cache.get(adminChannelId);
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
