const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const Parser = require('rss-parser');

const parser = new Parser();

module.exports = {
	data: new SlashCommandBuilder()
		.setName('tech-update')
		.setDescription('Manually trigger a tech update post (Admin only).')
		.setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
	async execute(interaction) {
		// Defer the reply since fetching RSS might take a moment
		await interaction.deferReply({ ephemeral: true });

		const { Models } = require('../database/mongoose');
		
		const configDoc = await Models.Config.findOne({ guildId: interaction.guildId });

		if (!configDoc || !configDoc.tech_channels || configDoc.tech_channels.size === 0) {
			return interaction.editReply({ content: 'No tech update channels have been configured for this server. Please run `/setup` first.' });
		}

		let dataDoc = await Models.Data.findOne({ id: 'main' });
		if (!dataDoc) {
			dataDoc = new Models.Data({ id: 'main', lastPostedUrls: {} });
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
			if (!configDoc.tech_channels.get(topic)) continue; // Skip if this topic isn't configured for the guild
			
			const channel = interaction.client.channels.cache.get(configDoc.tech_channels.get(topic));
			if (!channel) continue;

			try {
				const feed = await parser.parseURL(feedUrl);
				if (feed.items && feed.items.length > 0) {
					let unpostedItems = [];
					const todayString = new Date().toDateString();

					const lastPostedUrl = dataDoc.lastPostedUrls.get(topic);

					for (const item of feed.items) {
						if (lastPostedUrl && lastPostedUrl === item.link) break;
						
						if (item.pubDate) {
							if (new Date(item.pubDate).toDateString() === todayString) {
								unpostedItems.push(item);
							}
						} else {
							unpostedItems.push(item); // Fallback if no pubDate
						}
					}

					// If it's the very first run for this topic and nothing was published today, just post the newest one
					if (unpostedItems.length === 0 && !lastPostedUrl) {
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

						// The newest item is now the last one in our reversed array
						dataDoc.lastPostedUrls.set(topic, unpostedItems[unpostedItems.length - 1].link);
					}
				}
			} catch (error) {
				console.error(`Error fetching manual updates for ${topic}:`, error);
			}
		}

		await dataDoc.save();

		if (postedCount > 0) {
			await interaction.editReply({ content: `✅ Successfully posted ${postedCount} new tech update(s) to their respective channels!` });
		} else {
			await interaction.editReply({ content: 'There are no new tech updates at this moment. The latest articles were already posted.' });
		}
	},
};
