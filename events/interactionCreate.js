const { Events, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

module.exports = {
	name: Events.InteractionCreate,
	async execute(interaction) {
		if (interaction.isButton()) {
			if (interaction.customId.startsWith('claim_')) {
				const studentId = interaction.customId.split('_')[1];

				if (studentId === interaction.user.id) {
					return interaction.reply({ content: '❌ You cannot claim your own ticket!', ephemeral: true });
				}

				await interaction.deferReply({ ephemeral: true });

				let studentName = studentId;
				try {
					const member = await interaction.guild.members.fetch(studentId);
					studentName = member.user.username;
				} catch (e) {
					console.error('Failed to fetch student member for thread name');
				}

				const thread = await interaction.channel.threads.create({
					name: `Ticket - ${studentName}`,
					autoArchiveDuration: 1440,
					type: 12, // GUILD_PRIVATE_THREAD
					reason: 'Ticket claimed by mentor',
				});

				await thread.members.add(studentId).catch(console.error);
				await thread.members.add(interaction.user.id).catch(console.error);

				const closeButton = new ButtonBuilder()
					.setCustomId('close_ticket')
					.setLabel('Close Ticket')
					.setStyle(ButtonStyle.Danger);
				const closeRow = new ActionRowBuilder().addComponents(closeButton);

				await thread.send({ 
					content: `<@${studentId}> Your ticket has been claimed by mentor <@${interaction.user.id}>! You can chat privately here.\n\n(Use the Close Ticket button below when the issue is resolved)`,
					components: [closeRow] 
				});
				
				const originalMessage = interaction.message;
				const components = originalMessage.components[0].components;
				const newComponents = components.map(c => {
					if (c.customId === interaction.customId) {
						return ButtonBuilder.from(c).setDisabled(true).setLabel(`Claimed by ${interaction.user.username}`);
					}
					return ButtonBuilder.from(c);
				});
				const row = new ActionRowBuilder().addComponents(newComponents);
				await originalMessage.edit({ components: [row] });
				
				await interaction.editReply({ content: `✅ Successfully claimed ticket! Check out the new thread: <#${thread.id}>` });

			} else if (interaction.customId === 'close_ticket') {
				const originalMessage = interaction.message;
				if (originalMessage && originalMessage.components.length > 0) {
					const disabledRow = new ActionRowBuilder().addComponents(
						ButtonBuilder.from(originalMessage.components[0].components[0])
							.setDisabled(true)
							.setLabel('Ticket Closed')
					);
					await originalMessage.edit({ components: [disabledRow] }).catch(console.error);
				}
				
				await interaction.reply({ content: '🔒 This ticket is now closed. Archiving thread...' });
				const thread = interaction.channel;
				setTimeout(async () => {
					await thread.setArchived(true);
				}, 3000);
			}
			return;
		}

		if (!interaction.isChatInputCommand()) return;

		// Security feature: Only allow commands from the specified GUILD_ID
		if (interaction.guildId !== process.env.GUILD_ID) {
			console.log(`[SECURITY] Unauthorized use attempt in guild: ${interaction.guildId}`);
			return interaction.reply({ content: 'This bot is locked to a specific server.', ephemeral: true });
		}

		const command = interaction.client.commands.get(interaction.commandName);

		if (!command) {
			console.error(`No command matching ${interaction.commandName} was found.`);
			return;
		}

		try {
			await command.execute(interaction);
		} catch (error) {
			console.error(error);
			if (interaction.replied || interaction.deferred) {
				await interaction.followUp({ content: 'There was an error while executing this command!', ephemeral: true });
			} else {
				await interaction.reply({ content: 'There was an error while executing this command!', ephemeral: true });
			}
		}
	},
};
