const { SlashCommandBuilder, PermissionFlagsBits, ChannelType, EmbedBuilder } = require('discord.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('setup')
		.setDescription('Setup channels and roles for the bot (Admin only).')
		.setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
		.addSubcommand(subcommand =>
			subcommand
				.setName('course')
				.setDescription('Setup channels for a specific course')
				.addStringOption(option =>
					option.setName('topic')
						.setDescription('The course you want to configure')
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
				.addChannelOption(option =>
					option.setName('tech_channel')
						.setDescription('Channel for automated tech updates (RSS)')
						.addChannelTypes(ChannelType.GuildText)
						.setRequired(false))
				.addChannelOption(option =>
					option.setName('ticket_channel')
						.setDescription('Channel where student questions will be sent')
						.addChannelTypes(ChannelType.GuildText)
						.setRequired(false))
				.addRoleOption(option =>
					option.setName('mentor_role')
						.setDescription('Role to ping when a question is asked')
						.setRequired(false))
				.addRoleOption(option =>
					option.setName('student_role')
						.setDescription('Role required to ask questions for this course')
						.setRequired(false))
		)
		.addSubcommand(subcommand =>
			subcommand
				.setName('system')
				.setDescription('Setup system channels (Leaderboard, Feedback)')
				.addStringOption(option =>
					option.setName('type')
						.setDescription('The system feature to configure')
						.setRequired(true)
						.addChoices(
							{ name: 'Admin Feedback Channel', value: 'feedback_admin' },
							{ name: 'Live Leaderboard', value: 'leaderboard_live' }
						))
				.addChannelOption(option =>
					option.setName('channel')
						.setDescription('The channel to use')
						.addChannelTypes(ChannelType.GuildText)
						.setRequired(true))
		),
	async execute(interaction) {
		const { Models } = require('../database/mongoose');
		
		let configDoc = await Models.Config.findOne({ guildId: interaction.guildId });
		if (!configDoc) {
			configDoc = new Models.Config({ guildId: interaction.guildId, tech_channels: {}, ticket_channels: {}, mentor_roles: {}, student_roles: {} });
		}
		if (!configDoc.tech_channels) configDoc.tech_channels = new Map();
		if (!configDoc.ticket_channels) configDoc.ticket_channels = new Map();
		if (!configDoc.mentor_roles) configDoc.mentor_roles = new Map();
		if (!configDoc.student_roles) configDoc.student_roles = new Map();

		if (interaction.options.getSubcommand() === 'course') {
			const topic = interaction.options.getString('topic');
			const techChannel = interaction.options.getChannel('tech_channel');
			const ticketChannel = interaction.options.getChannel('ticket_channel');
			const mentorRole = interaction.options.getRole('mentor_role');
			const studentRole = interaction.options.getRole('student_role');

			if (!techChannel && !ticketChannel && !mentorRole && !studentRole) {
				return interaction.reply({ content: '❌ You must provide at least one option to update.', ephemeral: true });
			}

			let response = `✅ Updated settings for **${topic}**:\n`;

			if (techChannel) {
				configDoc.tech_channels.set(topic, techChannel.id);
				response += `- Tech Updates Channel: ${techChannel}\n`;
			}
			if (ticketChannel) {
				configDoc.ticket_channels.set(topic, ticketChannel.id);
				response += `- Ticket Channel: ${ticketChannel}\n`;
			}
			if (mentorRole) {
				configDoc.mentor_roles.set(topic, mentorRole.id);
				response += `- Mentor Role: ${mentorRole}\n`;
			}
			if (studentRole) {
				configDoc.student_roles.set(topic, studentRole.id);
				response += `- Student Role: ${studentRole}\n`;
			}

			await configDoc.save();
			await interaction.reply({ content: response, ephemeral: true });

		} else if (interaction.options.getSubcommand() === 'system') {
			const type = interaction.options.getString('type');
			const channel = interaction.options.getChannel('channel');

			// Store system channels in ticket_channels for backward compatibility/simplicity
			configDoc.ticket_channels.set(type, channel.id);

			if (type === 'leaderboard_live') {
				const embed = new EmbedBuilder()
					.setColor(0x0099FF)
					.setTitle('🏆 Live Reputation Leaderboard')
					.setDescription('Syncing data... Please wait for someone to receive a reputation point.');
				
				const msg = await channel.send({ embeds: [embed] });
				configDoc.liveLeaderboardMessageId = msg.id;
			}

			await configDoc.save();
			await interaction.reply({ content: `✅ System channel for **${type}** set to ${channel}.`, ephemeral: true });
		}
	},
};
