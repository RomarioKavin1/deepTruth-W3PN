import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const AnonymityTiersModule = buildModule("AnonymityTiersModule", (m) => {
  // Deploy the AnonymityTiers contract
  const anonymityTiers = m.contract("AnonymityTiers", []);

  return { anonymityTiers };
});

export default AnonymityTiersModule;
