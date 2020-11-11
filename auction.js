const config = require("./config.json")
const fs = require('fs');

const main = () => {
    const input = JSON.parse(fs.readFileSync('/dev/stdin'));
    const [sitesConfiguration, biddersConfiguration] = processConfiguration(config);
    runAuction(input, sitesConfiguration, biddersConfiguration);
}

/**
 *  runs auction to determine highest bidder among a number of potential customers
 * 
 * @param {Array} auctions 
 * @param {Object} sitesConfig 
 * @param {Object} biddersConfig 
 */
const runAuction = (auctions, sitesConfig, biddersConfig) => {
    let finalAuctionResults = [];
    auctions.forEach(auction => {
        let {
            site,
            units,
            bids
        } = auction;
        let highestBids = {};
        // fast lookup, convert units to object
        units = units.reduce((map, unit) => {
            map[unit] = true;
            return map;
        }, {});
        if (sitesConfig.hasOwnProperty(site)) {
            bids.forEach(bidding => {
                const {
                    bidder,
                    unit,
                    bid
                } = bidding;
                if (biddersConfig.hasOwnProperty(bidder) &&
                    sitesConfig[site].bidders.hasOwnProperty(bidder) &&
                    units.hasOwnProperty(unit)) {
                    adjustment = biddersConfig[bidder].adjustment;
                    let bidAdjusted = adjustBid(bid);
                    if (bidAdjusted >= sitesConfig[site].floor) {
                        if (highestBids.hasOwnProperty(unit)) {
                            if (bidAdjusted > highestBids[unit].bidAdjusted) {
                                highestBids[unit] = {
                                    bidAdjusted,
                                    bid,
                                    bidder
                                }
                            }
                        } else {
                            highestBids[unit] = {
                                bidAdjusted,
                                bid,
                                bidder
                            }
                        }
                    }
                }
            })
            finalAuctionResults.push(highestBids)
        } else {
            finalAuctionResults.push(highestBids);
        }
    })
    finalAuctionResults = finalAuctionResults.map(highestBidResults => {
        const result = [];
        for (let unit in highestBidResults) {
            let {
                bid,
                bidder
            } = highestBidResults[unit];
            result.push({
                bidder,
                unit,
                bid
            })
        }
        return result
    })
    console.log(finalAuctionResults)
    return;
}

/**
 * Adjust the bid based of historical trends
 * 
 * @param {Number} bid  
 */
const adjustBid = (bid) => {
    if (adjustment > 0) {
        return bidAdjusted !== 0 ? bid * (1 + adjustment) : bid;
    } else {
        return bid * (1 + adjustment);
    }
}

/**
 * The purpose of processing the configuration is transform the configuration
 * to objects for O(1) lookup.
 * 
 * @param {Object} config - configuration of sites and bidders
 */
const processConfiguration = (config) => {
    let sitesConfig = {};
    config.sites.forEach(site => {
        let bidders = {}
        site.bidders.forEach(bidder => {
            bidders[bidder] = true;
        })
        sitesConfig[site.name] = {
            floor: site.floor,
            bidders
        }
    })
    let biddersConfig = {};
    config.bidders.forEach(bidder => {
        biddersConfig[bidder.name] = {
            adjustment: bidder.adjustment
        };
    })
    return [sitesConfig, biddersConfig]
}

main();