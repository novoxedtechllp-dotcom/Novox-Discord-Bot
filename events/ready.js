const { Events, ActivityType } = require('discord.js');
const cron = require('node-cron');
const Parser = require('rss-parser');
const parser = new Parser();

module.exports = {
	name: Events.ClientReady,
	once: true,
	execute(client) {
		console.log(`Ready! Logged in as ${client.user.tag}`);

		const activities = [
			{ name: 'student questions | /ask', type: ActivityType.Watching },
			{ name: 'the Leaderboard | /leaderboard', type: ActivityType.Watching },
			{ name: 'Tech Updates', type: ActivityType.Watching }
		];
		
		let activityIndex = 0;
		client.user.setActivity(activities[0]);
		
		setInterval(() => {
			activityIndex = (activityIndex + 1) % activities.length;
			client.user.setActivity(activities[activityIndex]);
		}, 30000); // Rotate every 30 seconds

		// Schedule Tech Updates every day at 10:00 AM
		// Using cron expression '0 10 * * *' (Adjust as needed)
		cron.schedule('0 10 * * *', async () => {
			console.log('Running daily tech update task...');
			const { Models } = require('../database/mongoose');

			const allConfigs = await Models.Config.find({});
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

			for (const config of allConfigs) {
				for (const [topic, feedUrl] of Object.entries(feeds)) {
					if (config.tech_channels && config.tech_channels.get(topic)) {
						const channelId = config.tech_channels.get(topic);
						const channel = client.channels.cache.get(channelId);
						if (!channel) continue;

						try {
							const feed = await parser.parseURL(feedUrl);
							if (feed.items && feed.items.length > 0) {
								let unpostedItems = [];
								const todayString = new Date().toDateString();

								if (!config.lastPostedUrls) {
									config.lastPostedUrls = new Map();
								}
								const lastPostedUrl = config.lastPostedUrls.get(topic);

								for (const item of feed.items) {
									if (lastPostedUrl && lastPostedUrl === item.link) break;
									
									if (item.pubDate) {
										if (new Date(item.pubDate).toDateString() === todayString) {
											unpostedItems.push(item);
										}
									} else {
										unpostedItems.push(item);
									}
								}

								// First run fallback
								if (unpostedItems.length === 0 && !lastPostedUrl) {
									unpostedItems.push(feed.items[0]);
								}

								if (unpostedItems.length > 0) {
									unpostedItems = unpostedItems.slice(0, 5).reverse();

									for (const item of unpostedItems) {
										const embed = new EmbedBuilder()
											.setColor(0x0099FF)
											.setTitle(item.title)
											.setURL(item.link)
											.setDescription(item.contentSnippet ? item.contentSnippet.substring(0, 200) + '...' : 'No description available.')
											.setFooter({ text: `Source: ${feed.title || 'Tech Blog'}` });

										if (item.pubDate) {
											embed.setTimestamp(new Date(item.pubDate));
										}

										await channel.send({ embeds: [embed] });
									}

									config.lastPostedUrls.set(topic, unpostedItems[unpostedItems.length - 1].link);
								}
							}
						} catch (error) {
							console.error(`Error fetching updates for ${topic} in guild ${config.guildId}:`, error);
						}
					}
				}
				await config.save();
			}
		}, {
			scheduled: true,
			timezone: "Asia/Kolkata"
		});

		// Listen to MongoDB changes to auto-update the live leaderboard
		const { Models } = require('../database/mongoose');
		const { EmbedBuilder } = require('discord.js');
		
		// Helper to sync all live leaderboards
		const syncAllLeaderboards = async () => {
			try {
				const allConfigs = await Models.Config.find({});
				for (const configDoc of allConfigs) {
					if (configDoc.ticket_channels && configDoc.ticket_channels.get('leaderboard_live') && configDoc.liveLeaderboardMessageId) {
						const channelId = configDoc.ticket_channels.get('leaderboard_live');
						const channel = client.channels.cache.get(channelId);
						if (channel) {
							const msg = await channel.messages.fetch(configDoc.liveLeaderboardMessageId).catch(() => null);
							if (msg) {
								const sortedUsers = await Models.Reputation.find({ guildId: configDoc.guildId }).sort({ points: -1 }).limit(10);
								let leaderboardText = '';
								for (let i = 0; i < sortedUsers.length; i++) {
									const userRep = sortedUsers[i];
									leaderboardText += `**${i + 1}.** <@${userRep.userId}> — ${userRep.points} points\n`;
								}
								
								const lbEmbed = new EmbedBuilder()
									.setColor(0x0099FF)
									.setTitle('🏆 Live Reputation Leaderboard')
									.setDescription('The most helpful members of our community:')
									.addFields({ name: 'Top 10', value: leaderboardText || 'No points yet.' })
									.setFooter({ text: `Last updated: ${new Date().toLocaleString()}` });

								await msg.edit({ embeds: [lbEmbed] });
							}
						}
					}
				}
			} catch (error) {
				console.error('Error syncing leaderboards:', error);
			}
		};

		// Run an initial sync 3 seconds after boot
		setTimeout(syncAllLeaderboards, 3000);

		const changeStream = Models.Reputation.watch();
		changeStream.on('change', async (change) => {
			if (['insert', 'update', 'delete', 'replace'].includes(change.operationType)) {
				await syncAllLeaderboards();
			}
		});

		// Graceful shutdown handling
		const shutdown = async () => {
			console.log('Shutting down gracefully...');
			await changeStream.close();
			process.exit(0);
		};

		process.on('SIGINT', shutdown);
		process.on('SIGTERM', shutdown);
	},
};
