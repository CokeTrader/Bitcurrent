/**
 * NFT Marketplace Integration
 * Trade NFTs alongside crypto
 */

const pool = require('../config/database');

class NFTMarketplaceService {
  async listNFT(userId, nftDetails) {
    const { contractAddress, tokenId, price, blockchain } = nftDetails;

    const result = await pool.query(
      `INSERT INTO nft_listings (
        user_id, contract_address, token_id, price, blockchain, status, created_at
      ) VALUES ($1, $2, $3, $4, $5, 'active', NOW()) RETURNING *`,
      [userId, contractAddress, tokenId, price, blockchain]
    );

    return { success: true, listing: result.rows[0] };
  }

  async buyNFT(userId, listingId) {
    const listing = await pool.query(
      'SELECT * FROM nft_listings WHERE id = $1 AND status = $\'active\'',
      [listingId]
    );

    if (listing.rows.length === 0) {
      return { success: false, error: 'NFT not available' };
    }

    const nft = listing.rows[0];

    await pool.query(
      `UPDATE nft_listings SET buyer_id = $1, status = 'sold', sold_at = NOW() WHERE id = $2`,
      [userId, listingId]
    );

    return { success: true, message: 'NFT purchased', nft };
  }
}

module.exports = new NFTMarketplaceService();

