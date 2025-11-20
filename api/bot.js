const { Telegraf, Markup } = require('telegraf');

// Bot token environment variable se lo
const BOT_TOKEN = process.env.BOT_TOKEN;

if (!BOT_TOKEN) {
  console.error('❌ BOT_TOKEN environment variable missing!');
  process.exit(1);
}

const bot = new Telegraf(BOT_TOKEN);

// Channel info
const CHANNEL_USERNAME = '@your_channel_username'; // Yahan apna channel username dalo
const CHANNEL_LINK = 'https://t.me/+bBLRtS2VKgIyMTNl';

// CC Database
const ccDatabase = [
  '5178058352733565|08|26|607',
  '5178058812691270|09|28|579', 
  '5178058352733565|08|26|607',
  '5178059251784303|03|28|158',
  '4155682202241956|03|28|309'
];

// Webhook setup for Vercel
module.exports = async (req, res) => {
  try {
    if (req.method === 'POST') {
      await bot.handleUpdate(req.body, res);
    } else {
      res.status(200).json({ 
        status: '🤖 Bot is running!',
        message: 'Use POST requests for Telegram updates'
      });
    }
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

// Start command
bot.start(async (ctx) => {
  const userId = ctx.from.id;
  
  // Temporary channel check disable for testing
  await showMainMenu(ctx);
});

// Channel join button
async function showChannelJoinButton(ctx) {
  await ctx.reply(
    '🚀 *Welcome to CC Refer Bot!*\n\n' +
    '📢 Please join our channel first to use this bot:',
    {
      parse_mode: 'Markdown',
      ...Markup.inlineKeyboard([
        [Markup.button.url('📢 Join Channel', CHANNEL_LINK)],
        [Markup.button.callback('✅ I Have Joined', 'check_join')]
      ])
    }
  );
}

// Check channel join
bot.action('check_join', async (ctx) => {
  await ctx.answerCbQuery('✅ Verification successful!');
  await showMainMenu(ctx);
});

// Main menu function
async function showMainMenu(ctx) {
  await ctx.reply(
    '🎯 *CC Refer Bot - Main Menu*\n\n' +
    'Select an option below:',
    {
      parse_mode: 'Markdown',
      ...Markup.inlineKeyboard([
        [Markup.button.callback('🔗 Refer Account', 'refer_account')],
        [Markup.button.callback('💳 Withdraw CC', 'withdraw_cc')],
        [Markup.button.callback('📊 My Stats', 'my_stats')],
        [Markup.button.callback('ℹ️ Help', 'help_info')]
      ])
    }
  );
}

// Refer Account
bot.action('refer_account', async (ctx) => {
  const referralLink = `https://t.me/${ctx.botInfo.username}?start=ref_${ctx.from.id}`;
  
  await ctx.reply(
    '👥 *Refer & Earn*\n\n' +
    `Your referral link:\n\`${referralLink}\`\n\n` +
    'Share this link with friends and earn rewards!',
    {
      parse_mode: 'Markdown',
      ...Markup.inlineKeyboard([
        [Markup.button.url('📤 Share Link', `https://t.me/share/url?url=${encodeURIComponent(referralLink)}&text=Join%20this%20awesome%20CC%20bot!`)],
        [Markup.button.callback('🔙 Back', 'main_menu')]
      ])
    }
  );
});

// Withdraw CC
bot.action('withdraw_cc', async (ctx) => {
  if (ccDatabase.length === 0) {
    await ctx.reply(
      '❌ No CC available for withdrawal at the moment.',
      Markup.inlineKeyboard([
        [Markup.button.callback('🔙 Back', 'main_menu')]
      ])
    );
    return;
  }
  
  const randomCC = ccDatabase[Math.floor(Math.random() * ccDatabase.length)];
  const [card, month, year, cvv] = randomCC.split('|');
  
  await ctx.reply(
    '💳 *CC Details*\n\n' +
    `Card: \`${card}\`\n` +
    `Expiry: ${month}/${year}\n` +
    `CVV: \`${cvv}\`\n\n` +
    '⚠️ Use responsibly!',
    {
      parse_mode: 'Markdown',
      ...Markup.inlineKeyboard([
        [Markup.button.callback('🔄 Another CC', 'withdraw_cc')],
        [Markup.button.callback('🔙 Back', 'main_menu')]
      ])
    }
  );
});

// My Stats
bot.action('my_stats', async (ctx) => {
  await ctx.reply(
    '📊 *Your Statistics*\n\n' +
    '👥 Referrals: 0\n' +
    '💳 CC Withdrawn: 0\n' +
    '⭐ Rating: 0/5\n\n' +
    'Keep referring to earn more!',
    {
      parse_mode: 'Markdown',
      ...Markup.inlineKeyboard([
        [Markup.button.callback('🔙 Back', 'main_menu')]
      ])
    }
  );
});

// Help - YAHAN ERROR THI - AB FIX HAI
bot.action('help_info', async (ctx) => {
  await ctx.reply(
    '❓ *Help & Information*\n\n' +
    '🤖 *How to use:*\n' +
    '• Use /start to begin\n' +
    '• Refer friends to earn rewards\n' +
    '• Withdraw CC from the menu\n' +
    '• Check your stats anytime\n\n' +
    '📞 Support: Contact admin for help',
    {
      parse_mode: 'Markdown',
      ...Markup.inlineKeyboard([
        [Markup.button.callback('🔙 Back', 'main_menu')]
      ])
    }
  );
});

// Back to main menu
bot.action('main_menu', async (ctx) => {
  await showMainMenu(ctx);
});

// Error handling
bot.catch((err, ctx) => {
  console.error('Bot error:', err);
});

// Webhook setup
if (process.env.VERCEL) {
  console.log('🚀 Vercel environment detected');
} else {
  bot.launch().then(() => {
    console.log('🤖 Bot started locally');
  });
}
