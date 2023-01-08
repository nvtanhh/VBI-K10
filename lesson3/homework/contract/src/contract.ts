import { NearBindgen, near, call, view, LookupMap } from 'near-sdk-js';
import { AccountId } from 'near-sdk-js/lib/types';

class NFTContractMetadata {
  spec: string; // required, essentially a version like "nft-2.0.0", replacing "2.0.0" with the implemented version of NEP-177
  name: string; // required, ex. "Mochi Rising — Digital Edition" or "Metaverse 3"
  symbol: string;// required, ex. "MOCHI"
  icon: string | null; // Data URL
  base_uri: string | null; // Centralized gateway known to have reliable access to decentralized storage assets referenced by `reference` or `media` URLs
  reference: string | null; // URL to a JSON file with more info
  reference_hash: string | null;
}

const sample = {
  "spec": "nft-2.0.0",
  "name": "Mochi Rising — Digital Edition",
  "symbol": "MOCHI"
}

export class MyNFT {
  token_id: number;
  owner_id: AccountId;
  metadata: NFTContractMetadata;

  constructor(token_id: number, owner_id: AccountId, metadata: NFTContractMetadata) {
    this.token_id = token_id;
    this.owner_id = owner_id;
    this.metadata = metadata;
  }
}

@NearBindgen({})
class Contract {
  owner_id: AccountId;
  token_id: number;
  owner_by_id: LookupMap<string>;
  token_by_id: LookupMap<MyNFT>;
  constructor() {
    this.token_id = 0;
    this.owner_id = '';
    this.owner_by_id = new LookupMap('o');
    this.token_by_id = new LookupMap('t');
  }

  @call({})
  init({ owner_id }: { owner_id: AccountId }) {
    this.token_id = 0;
    this.owner_id = owner_id;
    this.owner_by_id = new LookupMap('o');
    this.token_by_id = new LookupMap('t');
  }

  @view({})
  nft_total_supply(): number {
    return this.token_id;
  }

  @view({})
  get_all_tokens({ start, limit }: { start?: number, limit?: number }): MyNFT[] {
    const result = [];

    if (start > this.token_id) return result;

    for (let i = start; i < start + limit; i++) {
      if (i >= this.token_id) break;
      result.push(this.token_by_id.get(i.toString()));
    }

    return result;
  }

  @view({})
  get_token_by_id({ token_id }: { token_id: string }): MyNFT | null {
    return this.token_by_id.get(token_id)
  }

  @view({})
  nft_supply_for_owner({ account_id }: { account_id: string }): number {
    const all_owner_tokens = this.get_all_tokens({}).filter((token) => token.owner_id === account_id);
    return all_owner_tokens.length;
  }

  @view({})
  get_tokens_for_owner({ owner_id, start, limit }: { owner_id: AccountId, start: number, limit: number }): MyNFT[] {
    const all_owner_tokens = this.get_all_tokens({}).filter((token) => token.owner_id === owner_id);

    return all_owner_tokens.slice(start, start + limit);
  }

  @call({})
  mint_nft({ token_owner_id, metadata }: { token_owner_id: AccountId, metadata: NFTContractMetadata }) {
    this.owner_by_id.set(this.token_id.toString(), token_owner_id);

    let token = new MyNFT(
      this.token_id,
      token_owner_id,
      metadata
    );

    this.token_by_id.set(this.token_id.toString(), token);
    this.token_id++;

    return token;
  }

}