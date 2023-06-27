import { Currency } from "@dataverse/runtime-connector";

export const getCurrencyAddress = (currency: Currency) => {
  switch (currency) {
    case Currency.USDC:
      return "0x2058A9D7613eEE744279e3856Ef0eAda5FCbaA7e";
    case Currency.DAI:
      return "0x001B3B4d0F3714Ca98ba10F6042DaEbF0B1B7b6F";
    case Currency.WETH:
      return "0x3C68CE8504087f89c640D02d133646d98e64ddd9";
    case Currency.WMATIC:
      return "0x9c3C9283D3e44854697Cd22D3Faa240Cfb032889";
  }
};
