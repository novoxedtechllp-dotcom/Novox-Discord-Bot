const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const fs = require('node:fs');
const path = require('node:path');
const Parser = require('rss-parser');

const parser = new Parser();
const configPath = path.join(__dirname, '../config.json');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('tech-update')
		.setDescription('Manually trigger a tech update post (Admin only).')
		.setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
	async execute(interaction) {
		// Defer the reply since fetching RSS might take a moment
		await interaction.deferReply({ ephemeral: true });

		let config = {};
		if (fs.existsSync(configPath)) {
			config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
		}

		const guildConfig = config[interaction.guildId];
		if (!guildConfig || !guildConfig.topics || Object.keys(guildConfig.topics).length === 0) {
			return interaction.editReply({ content: 'No tech update channels have been configured for this server. Please run `/setup` first.' });
		}

		const dataPath = path.join(__dirname, '../data.json');
		let data = {};
		if (fs.existsSync(dataPath)) {
			data = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
		}

		const feeds = {
			mern: 'https://dev.to/feed/tag/mern',
			node: 'https://dev.to/feed/tag/node',
			flutter: 'https://medium.com/feed/flutter',
			ui_ux: 'https://uxdesign.cc/feed',
			ai: 'https://artificialintelligence-news.com/feed/',
			marketing: 'https://searchengineland.com/feed',
			graphic_design: 'https://www.creativebloq.com/feed',
			video_editing: 'https://www.premiumbeat.com/blog/feed/'
		};

		let postedCount = 0;

		for (const [topic, feedUrl] of Object.entries(feeds)) {
			if (!guildConfig.topics[topic]) continue; // Skip if this topic isn't configured for the guild

			const channel = interaction.client.channels.cache.get(guildConfig.topics[topic]);
			if (!channel) continue;

			try {
				const feed = await parser.parseURL(feedUrl);
				if (feed.items && feed.items.length > 0) {
					let unpostedItems = [];
					const todayString = new Date().toDateString();

					for (const item of feed.items) {
						if (data.lastPostedUrls && data.lastPostedUrls[topic] === item.link) break;
						
						if (item.pubDate) {
							if (new Date(item.pubDate).toDateString() === todayString) {
								unpostedItems.push(item);
							}
						} else {
							unpostedItems.push(item); // Fallback if no pubDate
						}
					}

					// If it's the very first run for this topic and nothing was published today, just post the newest one
					if (unpostedItems.length === 0 && (!data.lastPostedUrls || !data.lastPostedUrls[topic])) {
						unpostedItems.push(feed.items[0]);
					}

					if (unpostedItems.length > 0) {
						// Cap at 5 to prevent spam, and reverse to post chronologically (oldest first)
						unpostedItems = unpostedItems.slice(0, 5).reverse();

						for (const item of unpostedItems) {
							let updateMessage = `${item.title}\n\n${item.link}`;
							await channel.send(updateMessage);
							postedCount++;
						}

						if (!data.lastPostedUrls) data.lastPostedUrls = {};
						// The newest item is now the last one in our reversed array
						data.lastPostedUrls[topic] = unpostedItems[unpostedItems.length - 1].link;
					}
				}
			} catch (error) {
				console.error(`Error fetching manual updates for ${topic}:`, error);
			}
		}

		fs.writeFileSync(dataPath, JSON.stringify(data, null, 2));

		if (postedCount > 0) {
			await interaction.editReply({ content: `✅ Successfully posted ${postedCount} new tech update(s) to their respective channels!` });
		} else {
			await interaction.editReply({ content: 'There are no new tech updates at this moment. The latest articles were already posted.' });
		}
	},
};
