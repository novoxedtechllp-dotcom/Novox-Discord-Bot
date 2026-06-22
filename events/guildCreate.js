const { Events } = require('discord.js');

module.exports = {
	name: Events.GuildCreate,
	execute(guild) {
		// Security feature: Leave any server that isn't the allowed GUILD_ID
		if (guild.id !== process.env.GUILD_ID) {
			console.log(`[SECURITY] Bot was added to an unauthorized server (${guild.name}). Leaving automatically.`);
			guild.leave()
				.then(g => console.log(`Left unauthorized server: ${g.name}`))
				.catch(console.error);
		}
	},
};
