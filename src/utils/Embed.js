const {
  ContainerBuilder,
  TextDisplayBuilder,
  SeparatorBuilder,
  SeparatorSpacingSize,
  SectionBuilder,
  ThumbnailBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  MessageFlags,
} = require('discord.js');

const { BOT_NAME } = require('../config/config');

// ─── Helpers ───────────────────────────────────────────────────────────────

/** Build a visible separator line */
function sep(divider = true) {
  return new SeparatorBuilder()
    .setDivider(divider)
    .setSpacing(SeparatorSpacingSize.Small);
}

/** Single TextDisplay line */
function txt(content) {
  return new TextDisplayBuilder().setContent(content);
}

/**
 * Build a clean Container with a title, separator, quote body, footer separator, and footer.
 */
function buildContainer(_color, titleLine, bodyLines = [], thumb = null, extra = []) {
  const container = new ContainerBuilder();

  // Title
  container.addTextDisplayComponents(txt(titleLine));
  container.addSeparatorComponents(sep(true));

  // Format body lines with blockquote if not already formatted
  const formattedBody = bodyLines.map(l => (l.startsWith('>') || l.startsWith('#') ? l : `> ${l}`));

  if (thumb) {
    const section = new SectionBuilder()
      .addTextDisplayComponents(...formattedBody.map(l => txt(l)))
      .setThumbnailAccessory(new ThumbnailBuilder({ media: { url: thumb } }));
    container.addSectionComponents(section);
  } else {
    formattedBody.forEach(l => container.addTextDisplayComponents(txt(l)));
  }

  if (extra.length) {
    container.addSeparatorComponents(sep(true));
    extra.forEach(l => container.addTextDisplayComponents(txt(l.startsWith('>') || l.startsWith('#') ? l : `> ${l}`)));
  }

  // Footer with divider line above it
  container.addSeparatorComponents(sep(true));
  container.addTextDisplayComponents(txt(`-# ${BOT_NAME}`));

  return container;
}

// ─── Reply payload helper ─────────────────────────────────────────────────

function reply(...components) {
  return {
    flags: MessageFlags.IsComponentsV2,
    components,
  };
}

// ─── Public API ───────────────────────────────────────────────────────────

const V2 = {
  reply,
  sep,
  txt,

  /** Success container */
  success(title, desc, _client, extra = []) {
    return buildContainer(null, `## ${title}`, [desc], null, extra);
  },

  /** Error container */
  error(title, desc, _client, extra = []) {
    return buildContainer(null, `## ${title}`, [desc], null, extra);
  },

  /** Warning container */
  warning(title, desc, _client, extra = []) {
    return buildContainer(null, `## ${title}`, [desc], null, extra);
  },

  /** Info container */
  info(title, desc, _client, extra = []) {
    return buildContainer(null, `## ${title}`, [desc], null, extra);
  },

  /** Security container */
  security(title, desc, _client, extra = []) {
    return buildContainer(null, `## ${title}`, [desc], null, extra);
  },

  /** Panel */
  panel(title, desc, _client, fields = []) {
    const lines = [desc, ...fields];
    return buildContainer(null, `## ${title}`, lines);
  },

  /** Rich container */
  rich(_color, titleLine, bodyLines, thumbURL, extra = []) {
    return buildContainer(null, titleLine, bodyLines, thumbURL, extra);
  },

  /** Confirm / Cancel buttons row */
  confirmRow(id = 'confirm') {
    return new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId(id + '_yes').setLabel('Confirm').setStyle(ButtonStyle.Danger),
      new ButtonBuilder().setCustomId(id + '_no').setLabel('Cancel').setStyle(ButtonStyle.Secondary)
    );
  },

  buildContainer,
};

module.exports = V2;
