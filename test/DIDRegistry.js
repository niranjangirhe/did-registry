const { expect } = require("chai");

describe("DIDRegistry", function () {
  async function deploy() {
    const DIDRegistry = await ethers.getContractFactory("DIDRegistry");
    return await DIDRegistry.deploy();
  }

  it("sets mapping and emits event", async function () {
    const registry = await deploy();
    const did = "did:example:123";
    const alias = "alice";

    await expect(registry.setMapping(did, alias))
      .to.emit(registry, "MappingSet")
      .withArgs(did, alias);

    expect(await registry.getAlias(did)).to.equal(alias);
    expect(await registry.getDid(alias)).to.equal(did);
  });

  it("reverts when DID already mapped to an alias", async function () {
    const registry = await deploy();
    await registry.setMapping("did:example:111", "bob");

    await expect(
      registry.setMapping("did:example:111", "charlie")
    ).to.be.revertedWith("DIDRegistry: DID is already mapped to another alias");
  });

  it("reverts when alias already mapped to a DID", async function () {
    const registry = await deploy();
    await registry.setMapping("did:example:222", "dora");

    await expect(
      registry.setMapping("did:example:333", "dora")
    ).to.be.revertedWith("DIDRegistry: Alias is already mapped to another DID");
  });

  it("getters return empty string when not mapped", async function () {
    const registry = await deploy();
    expect(await registry.getAlias("did:unknown:0")).to.equal("");
    expect(await registry.getDid("unknown_alias")).to.equal("");
  });

  it("checkMapping returns correct flags across states", async function () {
    const registry = await deploy();
    const didA = "did:example:aaa";
    const aliasA = "alice";
    const didB = "did:example:bbb";
    const aliasB = "bob";

    // Initially none mapped
    let [aliasTaken, didMapped] = await registry.checkMapping(aliasA, didA);
    expect(aliasTaken).to.equal(false);
    expect(didMapped).to.equal(false);

    // Map didA <-> aliasA
    await registry.setMapping(didA, aliasA);

    // aliasA taken, didA mapped
    ;[aliasTaken, didMapped] = await registry.checkMapping(aliasA, didA);
    expect(aliasTaken).to.equal(true);
    expect(didMapped).to.equal(true);

    // aliasB and didB still free
    ;[aliasTaken, didMapped] = await registry.checkMapping(aliasB, didB);
    expect(aliasTaken).to.equal(false);
    expect(didMapped).to.equal(false);
  });
});
