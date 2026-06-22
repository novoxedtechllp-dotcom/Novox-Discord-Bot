const { Events } = require('discord.js');
const cron = require('node-cron');
const Parser = require('rss-parser');
const parser = new Parser();

module.exports = {
	name: Events.ClientReady,
	once: true,
	execute(client) {
		console.log(`Ready! Logged in as ${client.user.tag}`);

		// Schedule Tech Updates every day at 10:00 AM
		// Using cron expression '0 10 * * *' (Adjust as needed)
		cron.schedule('0 10 * * *', async () => {
			console.log('Running daily tech update task...');
			const fs = require('node:fs');
			const path = require('node:path');
			const configPath = path.join(__dirname, '../config.json');
			const dataPath = path.join(__dirname, '../data.json');

			let config = {};
			if (fs.existsSync(configPath)) {
				config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
			}

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

			for (const [topic, feedUrl] of Object.entries(feeds)) {
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
								unpostedItems.push(item);
							}
						}

						// First run fallback
						if (unpostedItems.length === 0 && (!data.lastPostedUrls || !data.lastPostedUrls[topic])) {
							unpostedItems.push(feed.items[0]);
						}

						if (unpostedItems.length > 0) {
							unpostedItems = unpostedItems.slice(0, 5).reverse();
							let posted = false;

							for (const [guildId, guildConfig] of Object.entries(config)) {
								if (guildConfig.topics && guildConfig.topics[topic]) {
									const channel = client.channels.cache.get(guildConfig.topics[topic]);
									if (channel) {
										for (const item of unpostedItems) {
											await channel.send(`${item.title}\n\n${item.link}`);
										}
										posted = true;
									}
								}
							}

							if (posted) {
								if (!data.lastPostedUrls) data.lastPostedUrls = {};
								data.lastPostedUrls[topic] = unpostedItems[unpostedItems.length - 1].link;
							}
						}
					}
				} catch (error) {
					console.error(`Error fetching updates for ${topic}:`, error);
				}
			}

			fs.writeFileSync(dataPath, JSON.stringify(data, null, 2));
		}, {
			scheduled: true,
			timezone: "Asia/Kolkata"
		});
	},
};
