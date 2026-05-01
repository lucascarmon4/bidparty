export const mockLobby = {
  party: {
    title: 'Luxury Watch Collection Party',
    category: 'Watches & Jewelry',
    organizer: 'WatchMaster',
  },
  items: [
    { id: '1', name: 'Vintage Rolex Submariner', startingBid: 5000, image: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=120&q=80' },
    { id: '2', name: 'MacBook Pro M3 Max', startingBid: 2500, image: 'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=120&q=80' },
    { id: '3', name: 'Limited Edition Sneakers', startingBid: 800, image: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=120&q=80' },
    { id: '4', name: 'Diamond Tennis Bracelet', startingBid: 3200, image: 'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=120&q=80' },
    { id: '5', name: 'Vintage Camera Set', startingBid: 450, image: 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=120&q=80' },
  ],
  messages: [
    { id: '1', username: 'AuctionHero', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=AuctionHero', content: 'This is going to be epic! 🔥', timeAgo: '2 min ago', isMe: false },
    { id: '2', username: 'BidWarrior', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=BidWarrior', content: 'Ready to win some items!', timeAgo: '3 min ago', isMe: false },
    { id: '3', username: 'PriceChaser', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=PriceChaser', content: 'GL everyone!', timeAgo: '5 min ago', isMe: false },
    { id: '4', username: 'BidMaster3000', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=BidMaster3000', content: "Let's go! 💪", timeAgo: '6 min ago', isMe: true },
  ],
  participants: [
    { username: 'AuctionHero', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=AuctionHero', xp: 234, level: 15 },
    { username: 'BidWarrior', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=BidWarrior', xp: 189, level: 8 },
    { username: 'PriceChaser', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=PriceChaser', xp: 156, level: 22 },
    { username: 'DealSeeker', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=DealSeeker', xp: 145, level: 11 },
    { username: 'QuickBidder', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=QuickBidder', xp: 123, level: 19 },
    { username: 'SniperKing', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=SniperKing', xp: 98, level: 14 },
  ],
};
