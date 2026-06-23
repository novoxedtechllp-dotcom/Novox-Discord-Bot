const { SlashCommandBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder } = require('discord.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('ask')
		.setDescription('Ask a question and create a private mentor thread.')
		.addStringOption(option => 
			option.setName('course')
				.setDescription('The course this question relates to')
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
			option.setName('question')
				.setDescription('A brief summary of your question')
				.setRequired(true)),
	async execute(interaction) {
		await interaction.deferReply({ ephemeral: true });
		
		const course = interaction.options.getString('course');
		const question = interaction.options.getString('question');

		const { Models } = require('../database/mongoose');
		const configDoc = await Models.Config.findOne({ guildId: interaction.guildId });
		
		if (!configDoc || !configDoc.ticket_channels || !configDoc.ticket_channels.get(course)) {
			return interaction.editReply({ content: '❌ The admin has not configured a ticket channel for this course yet.' });
		}

		if (configDoc.student_roles && configDoc.student_roles.get(course)) {
			const requiredRoleId = configDoc.student_roles.get(course);
			if (!interaction.member.roles.cache.has(requiredRoleId)) {
				return interaction.editReply({ content: `❌ You must have the <@&${requiredRoleId}> role to ask questions for this course.` });
			}
		}

		const channelId = configDoc.ticket_channels.get(course);
		const channel = interaction.client.channels.cache.get(channelId);

		if (!channel) {
			return interaction.editReply({ content: '❌ The configured channel for this course could not be found.' });
		}

		const embed = new EmbedBuilder()
			.setColor(0x0099FF)
			.setTitle(`New Student Question`)
			.setDescription(`**Asked by:** <@${interaction.user.id}>\n\n**Question:** ${question}\n\nMentors, please click "Claim Ticket" to create a private thread with this student.`);

		const claimButton = new ButtonBuilder()
			.setCustomId(`claim_${interaction.user.id}`)
			.setLabel('Claim Ticket')
			.setStyle(ButtonStyle.Primary);

		const row = new ActionRowBuilder().addComponents(claimButton);

		try {
			let messageContent = '';
			if (configDoc.mentor_roles && configDoc.mentor_roles.get(course)) {
				messageContent = `<@&${configDoc.mentor_roles.get(course)}> A new student question requires your attention!`;
			}
			
			await channel.send({ content: messageContent || null, embeds: [embed], components: [row] });
			await interaction.editReply({ content: `✅ Your question has been forwarded to the mentors for this course. You will be pinged when a mentor claims your ticket!` });
		} catch (error) {
			console.error(error);
			await interaction.editReply({ content: '❌ Failed to send the ticket to the mentor channel. Please check channel permissions.' });
		}
	},
};
