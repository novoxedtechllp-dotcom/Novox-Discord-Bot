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
			option.setName('question')
				.setDescription('A brief summary of your question')
				.setRequired(true)),
	async execute(interaction) {
		const course = interaction.options.getString('course');
		const question = interaction.options.getString('question');

		// Create a private thread in the current channel
		const thread = await interaction.channel.threads.create({
			name: `[${course}] Q&A - ${interaction.user.username}`,
			autoArchiveDuration: 1440,
			type: 11, // GUILD_PUBLIC_THREAD
			reason: 'Student asked a question',
		});

		// Add the student to the thread
		await thread.members.add(interaction.user.id);

		const embed = new EmbedBuilder()
			.setColor(0x0099FF)
			.setTitle(`New Question: ${course}`)
			.setDescription(`**Asked by:** <@${interaction.user.id}>\n\n**Question:** ${question}\n\nMentors, please click "Claim Ticket" if you are helping this student.`);

		const claimButton = new ButtonBuilder()
			.setCustomId('claim_ticket')
			.setLabel('Claim Ticket')
			.setStyle(ButtonStyle.Primary);

		const closeButton = new ButtonBuilder()
			.setCustomId('close_ticket')
			.setLabel('Close Ticket')
			.setStyle(ButtonStyle.Danger);

		const row = new ActionRowBuilder().addComponents(claimButton, closeButton);

		await thread.send({ content: `<@${interaction.user.id}> Your ticket has been created! A mentor will be with you shortly.`, embeds: [embed], components: [row] });

		await interaction.reply({ content: `✅ Your ticket has been created: <#${thread.id}>`, ephemeral: true });
	},
};
