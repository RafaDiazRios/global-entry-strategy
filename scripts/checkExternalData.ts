import { getWgiGovernanceData } from "../server/strategy/wgi";
import { getWorldBankMarketData } from "../server/strategy/worldBank";

const governance = await getWgiGovernanceData("DE");
const market = await getWorldBankMarketData("DE");
console.log(JSON.stringify({ governance, fdiInflowUsd: market.fdiInflowUsd, fdiInflowPctGdp: market.fdiInflowPctGdp, sourceYear: market.sourceYear, sourceStatus: market.sourceStatus }, null, 2));
