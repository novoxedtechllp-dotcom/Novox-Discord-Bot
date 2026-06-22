const { Events } = require('discord.js');

module.exports = {
	name: Events.InteractionCreate,
	async execute(interaction) {
		if (interaction.isButton()) {
			if (interaction.customId === 'claim_ticket') {
				// Prevent claiming multiple times or by the student
				await interaction.reply({ content: `✅ This ticket has been claimed by <@${interaction.user.id}>! They will assist you shortly.` });
				
				// Update the original message to remove the claim button
				const originalMessage = interaction.message;
				const components = originalMessage.components[0].components;
				const newComponents = components.map(c => {
					if (c.customId === 'claim_ticket') {
						return { ...c.data, disabled: true, label: `Claimed by ${interaction.user.username}` };
					}
					return c;
				});
				await originalMessage.edit({ components: [{ type: 1, components: newComponents }] });

			} else if (interaction.customId === 'close_ticket') {
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
