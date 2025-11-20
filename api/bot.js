const { Telegraf, Markup } = require('telegraf');

const BOT_TOKEN = process.env.BOT_TOKEN;
const CHANNEL_USERNAME = '@loard_x79'; // Aapka channel username
const CHANNEL_LINK = 'https://t.me/+bBLRtS2VKgIyMTNl';
const ADMIN_USERNAME = '@loard_x79'; // Aapka username

// Databases
let userDatabase = {};
let referralDatabase = {};

const ccDatabase = [
  '5178058352733565|08|26|607',
  '5178058812691270|09|28|579', 
  '5178059251784303|03|28|158',
  '4155682202241956|03|28|309'
];

const bot = new Telegraf(BOT_TOKEN);

// Vercel webhook handler
module.exports = async (req, res) => {
  try {
    if (req.method === 'POST') {
      await bot.handleUpdate(req.body, res);
    } else {
      res.status(200).json({ 
        status: '✅ Premium CC Refer Bot - Active',
        developer: ADMIN_USERNAME,
        channel: CHANNEL_USERNAME
      });
    }
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

// Channel check function
async function checkChannelMembership(ctx) {
  try {
    const userId = ctx.from.id;
    const member = await ctx.telegram.getChatMember(CHANNEL_USERNAME, userId);
    return member.status !== 'left';
  } catch (error) {
    console.log('Channel check error:', error);
    return false;
  }
}

// Start command
bot.start(async (ctx) => {
  const userId = ctx.from.id;
  const startPayload = ctx.startPayload;

  // Initialize user
  if (!userDatabase[userId]) {
    userDatabase[userId] = {
      id: userId,
      username: ctx.from.username || 'No username',
      first_name: ctx.from.first_name,
      join_date: new Date().toISOString(),
      referrals: 0,
      cc_used: 0,
      balance: 0,
      total_earned: 0,
      available_cc: 0
    };
  }

  // Handle referral
  if (startPayload && startPayload.startsWith('ref_')) {
    const referrerId = parseInt(startPayload.split('_')[1]);
    if (referrerId && userDatabase[referrerId] && referrerId !== userId) {
      userDatabase[referrerId].referrals += 1;
      userDatabase[referrerId].balance += 1; // 1 point per referral
      
      // Check if reached 11 referrals for CC reward
      if (userDatabase[referrerId].referrals % 11 === 0) {
        userDatabase[referrerId].available_cc += 1;
        
        // Notify referrer about CC reward
        try {
          await ctx.telegram.sendMessage(
            referrerId,
            `🎉 *BONUS REWARD!* 🎉\n\n` +
            `🔥 You reached ${userDatabase[referrerId].referrals} referrals!\n` +
            `💳 You earned: 1 FREE CC WITHDRAWAL\n` +
            `🎁 Available CC Withdrawals: ${userDatabase[referrerId].available_cc}\n\n` +
            `Use "💳 Withdraw CC" to claim your reward!`,
            { parse_mode: 'Markdown' }
          );
        } catch (error) {
          console.log('Could not notify referrer about bonus');
        }
      }
      
      // Notify referrer about new referral
      try {
        await ctx.telegram.sendMessage(
          referrerId,
          `📈 *New Referral Joined!*\n\n` +
          `👤 ${ctx.from.first_name} used your link\n` +
          `📊 Total Referrals: ${userDatabase[referrerId].referrals}\n` +
          `🎯 Next CC at: ${11 - (userDatabase[referrerId].referrals % 11)} referrals\n` +
          `💳 Available CC: ${userDatabase[referrerId].available_cc}`,
          { parse_mode: 'Markdown' }
        );
      } catch (error) {
        console.log('Could not notify referrer');
      }
    }
  }

  // Check channel membership
  const isMember = await checkChannelMembership(ctx);
  
  if (!isMember) {
    await showChannelJoinAlert(ctx);
  } else {
    await showWelcomeMenu(ctx);
  }
});

// Channel join alert
async function showChannelJoinAlert(ctx) {
  await ctx.reply(
    `🌟 *Welcome to Premium CC Refer Bot!* 🌟\n\n` +
    `📢 *Required:* Please join our official channel to access all features.\n\n` +
    `✨ *Benefits:*\n` +
    `• Exclusive CC Drops\n` +
    `• Referral Rewards (1 CC per 11 referrals)\n` +
    `• Premium Support\n` +
    `• Latest Updates\n\n` +
    `🔐 *Access will be granted automatically after joining*`,
    {
      parse_mode: 'Markdown',
      ...Markup.inlineKeyboard([
        [Markup.button.url('🌟 JOIN OFFICIAL CHANNEL', CHANNEL_LINK)],
        [Markup.button.callback('✅ I HAVE JOINED', 'check_join')]
      ])
    }
  );
}

// Check join callback
bot.action('check_join', async (ctx) => {
  await ctx.answerCbQuery('🔄 Checking...');
  
  const isMember = await checkChannelMembership(ctx);
  
  if (!isMember) {
    await ctx.reply(
      '❌ *Access Denied*\n\n' +
      'You have not joined our channel yet. Please join first to use the bot.',
      {
        parse_mode: 'Markdown',
        ...Markup.inlineKeyboard([
          [Markup.button.url('🌟 JOIN CHANNEL', CHANNEL_LINK)],
          [Markup.button.callback('🔄 CHECK AGAIN', 'check_join')]
        ])
      }
    );
  } else {
    await ctx.reply('✅ *Access Granted!* Welcome to Premium CC Bot!', { parse_mode: 'Markdown' });
    await showWelcomeMenu(ctx);
  }
});

// Welcome Menu
async function showWelcomeMenu(ctx) {
  const userId = ctx.from.id;
  const user = userDatabase[userId];
  
  await ctx.reply(
    `🛡️ *PREMIUM CC REFER BOT* 🛡️\n\n` +
    `👋 Welcome, ${user.first_name}!\n\n` +
    `💎 *Premium Features:*\n` +
    `• CC Withdrawals\n` +
    `• Referral Rewards\n` +
    `• Daily Updates\n` +
    `• Premium Support\n\n` +
    `🎯 *Referral System:*\n` +
    `• 1 CC = 11 Referrals\n` +
    `• Real-time Tracking\n` +
    `• Instant Rewards`,
    {
      parse_mode: 'Markdown',
      ...Markup.inlineKeyboard([
        [Markup.button.callback('🔗 REFER & EARN', 'refer_account')],
        [Markup.button.callback('💳 WITHDRAW CC', 'withdraw_cc')],
        [Markup.button.callback('📊 MY STATS', 'my_stats')],
        [Markup.button.callback('🆘 HELP & SUPPORT', 'help_info')]
      ])
    }
  );
}

// Refer Account
bot.action('refer_account', async (ctx) => {
  const userId = ctx.from.id;
  const user = userDatabase[userId];
  const referralLink = `https://t.me/${ctx.botInfo.username}?start=ref_${userId}`;
  
  const referralsNeeded = 11 - (user.referrals % 11);
  const nextCCAt = user.referrals + referralsNeeded;

  await ctx.reply(
    `🚀 *REFER & EARN PROGRAM* 🚀\n\n` +
    `🔗 *Your Referral Link:*\n\`${referralLink}\`\n\n` +
    `📊 *Your Referral Progress:*\n` +
    `👥 Total Referrals: ${user.referrals}\n` +
    `🎯 Next CC at: ${nextCCAt} referrals\n` +
    `📈 Needed: ${referralsNeeded} more\n` +
    `💳 Available CC: ${user.available_cc}\n\n` +
    `💰 *Reward System:*\n` +
    `• 1 CC = 11 Referrals\n` +
    `• Unlimited Earnings\n` +
    `• Instant Rewards\n\n` +
    `📢 *Share this message:*\n` +
    `"Join this premium CC bot and earn free CCs! Use my referral link to get started!"`,
    {
      parse_mode: 'Markdown',
      ...Markup.inlineKeyboard([
        [Markup.button.url('📤 SHARE ON TELEGRAM', `https://t.me/share/url?url=${encodeURIComponent(referralLink)}&text=Join%20this%20premium%20CC%20Refer%20Bot%20and%20earn%20free%20CCs!%20🚀`)],
        [Markup.button.callback('🔄 REFRESH STATS', 'refer_account')],
        [Markup.button.callback('🔙 MAIN MENU', 'main_menu')]
      ])
    }
  );
});

// Withdraw CC
bot.action('withdraw_cc', async (ctx) => {
  const userId = ctx.from.id;
  const user = userDatabase[userId];

  // Check if user has available CC
  if (user.available_cc <= 0) {
    const referralsNeeded = 11 - (user.referrals % 11);
    
    await ctx.reply(
      `❌ *NO CC AVAILABLE* ❌\n\n` +
      `💳 Available CC Withdrawals: ${user.available_cc}\n\n` +
      `📊 *Referral Progress:*\n` +
      `👥 Your Referrals: ${user.referrals}\n` +
      `🎯 Next CC at: ${user.referrals + referralsNeeded} referrals\n` +
      `📈 Needed: ${referralsNeeded} more referrals\n\n` +
      `💎 *How to Earn CC:*\n` +
      `• Share your referral link\n` +
      `• Get 11 referrals = 1 CC\n` +
      `• Unlimited earnings!`,
      {
        parse_mode: 'Markdown',
        ...Markup.inlineKeyboard([
          [Markup.button.callback('🔗 GET REFERRAL LINK', 'refer_account')],
          [Markup.button.callback('🔄 CHECK AGAIN', 'withdraw_cc')],
          [Markup.button.callback('🔙 MAIN MENU', 'main_menu')]
        ])
      }
    );
    return;
  }

  // Check if CC available in database
  if (ccDatabase.length === 0) {
    await ctx.reply(
      '❌ *TEMPORARILY UNAVAILABLE*\n\n' +
      'No CC available in database at the moment.\nPlease try again later.',
      Markup.inlineKeyboard([
        [Markup.button.callback('🔙 MAIN MENU', 'main_menu')]
      ])
    );
    return;
  }

  // Process CC withdrawal
  const randomCC = ccDatabase[Math.floor(Math.random() * ccDatabase.length)];
  const [card, month, year, cvv] = randomCC.split('|');
  
  // Update user data
  user.available_cc -= 1;
  user.cc_used += 1;

  await ctx.reply(
    `🎉 *CC WITHDRAWAL SUCCESSFUL!* 🎉\n\n` +
    `💳 *Card Details:*\n` +
    `🃏 Card: \`${card}\`\n` +
    `📅 Expiry: ${month}/${year}\n` +
    `🔒 CVV: \`${cvv}\`\n\n` +
    `📊 *Your Balance:*\n` +
    `💳 Available CC: ${user.available_cc}\n` +
    `👥 Total Referrals: ${user.referrals}\n\n` +
    `⚠️ *Important:*\n` +
    `• Use responsibly and legally\n` +
    `• Do not share with others\n` +
    `• Report issues to admin`,
    {
      parse_mode: 'Markdown',
      ...Markup.inlineKeyboard([
        [Markup.button.callback('🔄 WITHDRAW ANOTHER', 'withdraw_cc')],
        [Markup.button.callback('🔗 GET MORE REFERRALS', 'refer_account')],
        [Markup.button.callback('🔙 MAIN MENU', 'main_menu')]
      ])
    }
  );
});

// My Stats
bot.action('my_stats', async (ctx) => {
  const userId = ctx.from.id;
  const user = userDatabase[userId];
  const referralsNeeded = 11 - (user.referrals % 11);
  const progress = Math.floor((user.referrals % 11) / 11 * 100);

  await ctx.reply(
    `📊 *YOUR STATISTICS* 📊\n\n` +
    `👤 *Profile:*\n` +
    `🆔 User: ${user.first_name}\n` +
    `📅 Member Since: ${new Date(user.join_date).toLocaleDateString()}\n\n` +
    `💰 *Earnings:*\n` +
    `👥 Total Referrals: ${user.referrals}\n` +
    `💳 CC Withdrawn: ${user.cc_used}\n` +
    `🎁 Available CC: ${user.available_cc}\n\n` +
    `🎯 *Referral Progress:*\n` +
    `📈 Progress: ${user.referrals % 11}/11 (${progress}%)\n` +
    `🎯 Next CC in: ${referralsNeeded} referrals\n` +
    `🏆 Total Cycles: ${Math.floor(user.referrals / 11)}\n\n` +
    `💎 Keep referring to earn more CCs!`,
    {
      parse_mode: 'Markdown',
      ...Markup.inlineKeyboard([
        [Markup.button.callback('🔗 REFER & EARN', 'refer_account')],
        [Markup.button.callback('💳 WITHDRAW CC', 'withdraw_cc')],
        [Markup.button.callback('🔄 REFRESH', 'my_stats')],
        [Markup.button.callback('🔙 MAIN MENU', 'main_menu')]
      ])
    }
  );
});

// Help & Support
bot.action('help_info', async (ctx) => {
  await ctx.reply(
    `🆘 *HELP & SUPPORT* 🆘\n\n` +
    `❓ *How It Works:*\n` +
    `1. Share your referral link\n` +
    `2. Get 11 referrals = 1 CC\n` +
    `3. Withdraw CC instantly\n` +
    `4. Repeat and earn more!\n\n` +
    `📖 *Rules:*\n` +
    `• Must join our channel\n` +
    `• No fake referrals\n` +
    `• Use CCs responsibly\n` +
    `• Follow Telegram ToS\n\n` +
    `👑 *Developer:* ${ADMIN_USERNAME}\n` +
    `📢 *Channel:* ${CHANNEL_USERNAME}\n\n` +
    `🛠️ *Need Help?*\n` +
    `Contact developer directly for support.`,
    {
      parse_mode: 'Markdown',
      ...Markup.inlineKeyboard([
        [Markup.button.url('📢 JOIN CHANNEL', CHANNEL_LINK)],
        [Markup.button.url('👑 CONTACT DEVELOPER', `https://t.me/${ADMIN_USERNAME.replace('@', '')}`)],
        [Markup.button.callback('🔙 MAIN MENU', 'main_menu')]
      ])
    }
  );
});

// Main Menu
bot.action('main_menu', async (ctx) => {
  await showWelcomeMenu(ctx);
});

// Error handling
bot.catch((err, ctx) => {
  console.error('Bot error:', err);
});

console.log('🤖 Premium CC Refer Bot with Referral System Initialized');
