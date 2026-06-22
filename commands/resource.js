const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const fs = require('node:fs');
const path = require('node:path');

const resourcesPath = path.join(__dirname, '../resources.json');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('resource')
		.setDescription('Manage the community resource library.')
		.addSubcommand(subcommand =>
			subcommand
				.setName('add')
				.setDescription('Add a new resource link.')
				.addStringOption(option => 
					option.setName('topic')
						.setDescription('The topic category')
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
					option.setName('link')
						.setDescription('The URL of the resource')
						.setRequired(true))
				.addStringOption(option => 
					option.setName('description')
						.setDescription('A short description of what this is')
						.setRequired(true)))
		.addSubcommand(subcommand =>
			subcommand
				.setName('get')
				.setDescription('Get a list of saved resources for a topic.')
				.addStringOption(option => 
					option.setName('topic')
						.setDescription('The topic you want to learn about')
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
						))),
	async execute(interaction) {
		let resourcesData = {};
		if (fs.existsSync(resourcesPath)) {
			resourcesData = JSON.parse(fs.readFileSync(resourcesPath, 'utf8'));
		}
		
		const guildId = interaction.guildId;
		if (!resourcesData[guildId]) resourcesData[guildId] = {};

		const subcommand = interaction.options.getSubcommand();
		const topic = interaction.options.getString('topic');

		if (subcommand === 'add') {
			const link = interaction.options.getString('link');
			const description = interaction.options.getString('description');

			if (!resourcesData[guildId][topic]) {
				resourcesData[guildId][topic] = [];
			}

			resourcesData[guildId][topic].push({
				link: link,
				description: description,
				addedBy: interaction.user.id
			});

			fs.writeFileSync(resourcesPath, JSON.stringify(resourcesData, null, 2));
			await interaction.reply({ content: `✅ Resource successfully added to the **${topic}** library!`, ephemeral: true });

		} else if (subcommand === 'get') {
			const topicResources = resourcesData[guildId][topic] || [];

			if (topicResources.length === 0) {
				return interaction.reply({ content: `There are currently no resources saved for **${topic}**. Feel free to add some!`, ephemeral: true });
			}

			const embed = new EmbedBuilder()
				.setColor(0x00FF00)
				.setTitle(`📚 Community Resources: ${topic.toUpperCase()}`)
				.setDescription('Here are the resources collected by our mentors and students:');

			topicResources.forEach((res, index) => {
				embed.addFields({ name: `${index + 1}. ${res.description}`, value: `${res.link}\n*(Added by <@${res.addedBy}>)*` });
			});

			await interaction.reply({ embeds: [embed] });
		}
	},
};
