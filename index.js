const { ethers, BigNumber } = require("ethers");
const fetch = require("node-fetch");
require("dotenv").config();
const { utils, Contract } = ethers;
const { sendEmail } = require("./email.js");
const provider = new ethers.providers.JsonRpcProvider(
  "https://bsc-dataseed1.binance.org/"
);
const PancakeSwapV2Contract = process.env.PANCAKEV2;
const swapAbi = [
  "event Swap(address indexed sender, uint amount0In, uint amount1In, uint amount0Out, uint amount1Out, address indexed to)"
];
const mv2Contract = new Contract(PancakeSwapV2Contract, swapAbi, provider);
const BUY = "Buy";
const SELL = "Sell";

/**
 * Todo:
 * Mailgun subscription ⚠️
 */

/**
 * Facts we rely on to display purchase details correctly:
 *
 * If msg.sender = to address on the Swap event, then thats final swap. Else its a re-routing swap e.g MContent - BNB - BUSD
 * If amountIn = 0 and amount1Out = 0, this is a Buy Swap
 * If amountiIn = 0 and amount0Out = 0, this is a Sell Swap
 */

const mock = {
  sender: "0x3472059945ee170660a9A97892a3cf77857Eba3A",
  amount0In: BigNumber.from(0),
  amount1In: BigNumber.from(100),
  amount0Out: BigNumber.from(200),
  amount1Out: BigNumber.from(0),
  to: "0x3472059945ee170660a9A97892a3cf77857Eba3A",
  transactionType: "Sell",
  bnbValue: BigNumber.from(200),
  hash: "0x1c13de572943e98e343a58536dc91b4c8ef226859ce86ac4bf0a1838a75148fa",
  from: "0x3472059945ee170660a9A97892a3cf77857Eba3A",
  tokenValue: BigNumber.from(500)
};

async function getBnbPrice() {
  const response = await fetch(
    `https://api.bscscan.com/api?module=stats&action=bnbprice&apikey=${process.env.BSC_KEY}`
  );

  if (response.ok) {
    const data = await response.json();

    return data.result.ethusd;
  } else {
    return 0;
  }
}

async function test() {
  const bnbPrice = await getBnbPrice();
  const bnbPricePadded = bnbPrice * 1000;

  const salesPrice = BigNumber.from(2345);
  console.log(salesPrice.mul(BigNumber.from(bnbPricePadded)));
}

async function main() {
  mv2Contract.on(
    "Swap",
    async (sender, amount0In, amount1In, amount0Out, amount1Out, to, event) => {
      console.log("Swap Event Fired 🔥\n");

      const data = {
        sender,
        amount0In,
        amount1In,
        amount0Out,
        amount1Out,
        to
      };

      const transaction = await provider.getTransaction(event.transactionHash);
      const transactionType = amount0In.eq(0) && amount1Out.eq(0) ? BUY : SELL;
      const bnbValue = transactionType == BUY ? amount1In : amount1Out;

      data.transactionType = transactionType;
      data.bnbValue = bnbValue;
      data.hash = event.transactionHash;
      data.from = transaction.from;

      if (transactionType == BUY) {
        console.log("BUY");
        //amount0Out - 10% tax is what user gets
        data.tokenValue = amount0Out.sub(amount0Out.div(10)).toString();
      } else {
        console.log("SELL");
        //amount0In without deductiong 10% Tax
        data.tokenValue = amount0In;
      }

      console.log(data);
      const bnbPrice = await getBnbPrice();
      const bnbValueUsd = Number(utils.formatEther(data.bnbValue)) * bnbPrice;

      console.log("BNB Price: ", bnbPrice);
      console.log("Transaction BNB Value in USD: ", bnbValueUsd);

      //Only email when limit is above 2k$
      if (bnbValueUsd >= 2000) sendEmail(data);
    }
  );
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

// PancakeSwap V2: MCONTENT 42:     0x00105e37399e3dD45Ca7a434C64e1C02CABC49Ec
// PancakeSwap: Router v2:          0x10ED43C718714eb63d5aA57B78B54704E256024E
// MContent Token Address:          0x799e1Cf88A236e42b4A87c544A22A94aE95A6910
// WBNB/BSC-USD LP:                 0x16b9a82891338f9bA80E2D6970FddA79D1eb0daE
