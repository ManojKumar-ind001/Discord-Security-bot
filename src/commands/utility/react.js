const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const V2 = require('../../utils/Embed');
const Perm = require('../../utils/Permissions');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('react')
    .setDescription('Make the bot react to a message with an emoji')
    .addStringOption(o =>
      o.setName('message_id')
        .setDescription('Message ID or Message Link to react to')
        .setRequired(true)
    )
    .addStringOption(o =>
      o.setName('emoji')
        .setDescription('Emoji to react with (e.g. 👍, 🔥, or custom emoji <:name:id>)')
        .setRequired(true)
    )
    .addChannelOption(o =>
      o.setName('channel')
        .setDescription('Channel where the message is (default: current channel)')
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages),
  cooldown: 3,

  async execute(interaction, client) {
    if (!(await Perm.check(interaction, 'mod'))) return;

    let msgIdInput = interaction.options.getString('message_id').trim();
    const emojiInput = interaction.options.getString('emoji').trim();
    let targetChannel = interaction.options.getChannel('channel') || interaction.channel;

    // Handle Discord message link format (e.g. https://discord.com/channels/guildId/channelId/messageId)
    const linkMatch = msgIdInput.match(/channels\/\d+\/(\d+)\/(\d+)/);
    if (linkMatch) {
      const channelId = linkMatch[1];
      msgIdInput = linkMatch[2];
      try {
        const fetchedChannel = await interaction.guild.channels.fetch(channelId);
        if (fetchedChannel) targetChannel = fetchedChannel;
      } catch {}
    }

    if (!targetChannel || !targetChannel.isTextBased()) {
      return interaction.reply({
        ...V2.reply(V2.error('Invalid Channel', 'Please specify a valid text channel.', client)),
        ephemeral: true,
      });
    }

    try {
      const targetMessage = await targetChannel.messages.fetch(msgIdInput).catch(() => null);
      if (!targetMessage) {
        return interaction.reply({
          ...V2.reply(
            V2.error(
              'Message Not Found',
              `Could not find message with ID \`${msgIdInput}\` in ${targetChannel}.\nMake sure the ID is correct and the bot has access.`,
              client
            )
          ),
          ephemeral: true,
        });
      }

      // Check for custom emoji regex <:name:id> or <a:name:id>
      let emojiToReact = emojiInput;
      const customEmojiMatch = emojiInput.match(/<a?:(\w+):(\d+)>/);
      if (customEmojiMatch) {
        emojiToReact = customEmojiMatch[2]; // Use emoji ID
      }

      await targetMessage.react(emojiToReact);

      return interaction.reply({
        ...V2.reply(
          V2.success(
            'Reaction Added',
            `Successfully reacted to [message](${targetMessage.url}) with ${emojiInput} in ${targetChannel}.`,
            client
          )
        ),
        ephemeral: true,
      });
    } catch (err) {
      return interaction.reply({
        ...V2.reply(
          V2.error(
            'Reaction Failed',
            `Failed to add reaction: \`${err.message}\`\nNote: If using custom emojis, the bot must be in that server or have access to external emojis.`,
            client
          )
        ),
        ephemeral: true,
      });
    }
  },
};
