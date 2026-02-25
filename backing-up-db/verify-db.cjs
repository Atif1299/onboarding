const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();

(async () => {
  console.log('States:', await p.state.count());
  console.log('Counties:', await p.county.count());
  console.log('Users:', await p.user.count());
  console.log('AdminUsers:', await p.adminUser.count());
  console.log('Offers:', await p.offer.count());
  console.log('Auctions:', await p.auction.count());
  console.log('ClaimedAuctions:', await p.claimedAuction.count());
  console.log('PasswordResetTokens:', await p.passwordResetToken.count());
  await p.$disconnect();
})();
