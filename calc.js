// Deal math, shared by deal_board.html and the tests.
(function (root) {
  const DEFAULTS = { buyerFeePct: 25, sellFeePct: 10, undercutPct: 5, minProfit: 20, minRoiPct: 15 };

  function evaluate(input, settings) {
    const s = Object.assign({}, DEFAULTS, settings);
    const buy = Number(input.buyPrice);
    const qty = Number(input.quantity);
    const similar = (input.similarPrices || [])
      .map(Number).filter((p) => p > 0).sort((a, b) => a - b);

    const errors = [];
    if (!(buy > 0)) errors.push('Enter your all-in buy price per ticket.');
    if (!Number.isInteger(qty) || qty < 2) errors.push('Quantity must be 2 or more.');
    if (similar.length < 2) errors.push('Enter at least 2 prices of similar seats.');
    if (!(s.sellFeePct < 100)) errors.push('Selling fees must be under 100%.');
    if (errors.length) return { ok: false, errors };

    const bf = s.buyerFeePct / 100;
    const sf = s.sellFeePct / 100;
    const uc = s.undercutPct / 100;

    // Similar listings show buyer prices (fees included). Strip the buyer fee
    // to get what those sellers asked for, then undercut the 2nd cheapest.
    const sellerPrices = similar.map((p) => p / (1 + bf));
    const listPrice = sellerPrices[1] * (1 - uc);       // est. sale: what you list at
    const buyerSees = listPrice * (1 + bf);
    const payout = listPrice * (1 - sf);
    const profitPerTicket = payout - buy;
    const roiPct = (profitPerTicket / buy) * 100;
    const breakEvenList = buy / (1 - sf);
    const breakEvenBuyerSees = breakEvenList * (1 + bf);

    const reasons = [];
    if (profitPerTicket < s.minProfit) reasons.push(`Profit per ticket under $${s.minProfit}`);
    if (roiPct < s.minRoiPct) reasons.push(`ROI under ${s.minRoiPct}%`);

    return {
      ok: true,
      sellerPrices,
      listPrice,
      buyerSees,
      payout,
      profitPerTicket,
      totalProfit: profitPerTicket * qty,
      roiPct,
      breakEvenList,
      breakEvenBuyerSees,
      verdict: reasons.length ? 'PASS' : 'BUY',
      reasons,
    };
  }

  const api = { DEFAULTS, evaluate };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.DealCalc = api;
})(this);
