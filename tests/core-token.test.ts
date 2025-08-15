import { describe, it, expect, beforeEach } from "vitest";

interface MockContract {
	admin: string;
	paused: boolean;
	totalSupply: bigint;
	mintCap: bigint;
	balances: Map<string, bigint>;
	allowances: Map<string, bigint>;
	stakedBalances: Map<string, bigint>;
	delegatedStakes: Map<string, bigint>;
	MAX_SUPPLY: bigint;

	isAdmin(caller: string): boolean;
	setPaused(
		caller: string,
		pause: boolean
	): { value: boolean } | { error: number };
	updateMintCap(
		caller: string,
		newCap: bigint
	): { value: bigint } | { error: number };
	mint(
		caller: string,
		recipient: string,
		amount: bigint
	): { value: bigint } | { error: number };
	burn(caller: string, amount: bigint): { value: bigint } | { error: number };
	approve(
		caller: string,
		spender: string,
		amount: bigint
	): { value: bigint } | { error: number };
	increaseAllowance(
		caller: string,
		spender: string,
		added: bigint
	): { value: bigint } | { error: number };
	decreaseAllowance(
		caller: string,
		spender: string,
		subtracted: bigint
	): { value: bigint } | { error: number };
	transfer(
		caller: string,
		recipient: string,
		amount: bigint
	): { value: bigint } | { error: number };
	transferFrom(
		caller: string,
		owner: string,
		recipient: string,
		amount: bigint
	): { value: bigint } | { error: number };
	stake(caller: string, amount: bigint): { value: bigint } | { error: number };
	unstake(
		caller: string,
		amount: bigint
	): { value: bigint } | { error: number };
	delegateStake(
		caller: string,
		delegatee: string,
		amount: bigint
	): { value: bigint } | { error: number };
	revokeDelegation(
		caller: string,
		delegatee: string
	): { value: boolean } | { error: number };
}

const mockContract: MockContract = {
	admin: "ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM",
	paused: false,
	totalSupply: 0n,
	mintCap: 100_000_000_000_000n,
	balances: new Map(),
	allowances: new Map(),
	stakedBalances: new Map(),
	delegatedStakes: new Map(),
	MAX_SUPPLY: 100_000_000_000_000n,

	isAdmin(caller: string) {
		return caller === this.admin;
	},

	setPaused(caller: string, pause: boolean) {
		if (!this.isAdmin(caller)) return { error: 100 };
		this.paused = pause;
		return { value: pause };
	},

	updateMintCap(caller: string, newCap: bigint) {
		if (!this.isAdmin(caller)) return { error: 100 };
		if (newCap > this.MAX_SUPPLY || newCap > this.mintCap)
			return { error: 104 };
		this.mintCap = newCap;
		return { value: newCap };
	},

	mint(caller: string, recipient: string, amount: bigint) {
		if (!this.isAdmin(caller)) return { error: 100 };
		if (amount <= 0n) return { error: 107 };
		if (this.totalSupply + amount > this.mintCap) return { error: 104 };
		const bal = this.balances.get(recipient) || 0n;
		this.balances.set(recipient, bal + amount);
		this.totalSupply += amount;
		return { value: amount };
	},

	burn(caller: string, amount: bigint) {
		if (this.paused) return { error: 105 };
		if (amount <= 0n) return { error: 107 };
		const bal = this.balances.get(caller) || 0n;
		if (bal < amount) return { error: 101 };
		this.balances.set(caller, bal - amount);
		this.totalSupply -= amount;
		return { value: amount };
	},

	approve(caller: string, spender: string, amount: bigint) {
		if (this.paused) return { error: 105 };
		const key = `${caller}:${spender}`;
		this.allowances.set(key, amount);
		return { value: amount };
	},

	increaseAllowance(caller: string, spender: string, added: bigint) {
		if (this.paused) return { error: 105 };
		if (added <= 0n) return { error: 107 };
		const key = `${caller}:${spender}`;
		const current = this.allowances.get(key) || 0n;
		const newAllow = current + added;
		this.allowances.set(key, newAllow);
		return { value: newAllow };
	},

	decreaseAllowance(caller: string, spender: string, subtracted: bigint) {
		if (this.paused) return { error: 105 };
		if (subtracted <= 0n) return { error: 107 };
		const key = `${caller}:${spender}`;
		const current = this.allowances.get(key) || 0n;
		if (current < subtracted) return { error: 103 };
		const newAllow = current - subtracted;
		this.allowances.set(key, newAllow);
		return { value: newAllow };
	},

	transfer(caller: string, recipient: string, amount: bigint) {
		if (this.paused) return { error: 105 };
		if (amount <= 0n) return { error: 107 };
		const bal = this.balances.get(caller) || 0n;
		if (bal < amount) return { error: 101 };
		this.balances.set(caller, bal - amount);
		this.balances.set(recipient, (this.balances.get(recipient) || 0n) + amount);
		return { value: amount };
	},

	transferFrom(
		caller: string,
		owner: string,
		recipient: string,
		amount: bigint
	) {
		if (this.paused) return { error: 105 };
		if (amount <= 0n) return { error: 107 };
		const key = `${owner}:${caller}`;
		const allow = this.allowances.get(key) || 0n;
		if (allow < amount) return { error: 103 };
		const bal = this.balances.get(owner) || 0n;
		if (bal < amount) return { error: 101 };
		this.allowances.set(key, allow - amount);
		this.balances.set(owner, bal - amount);
		this.balances.set(recipient, (this.balances.get(recipient) || 0n) + amount);
		return { value: amount };
	},

	stake(caller: string, amount: bigint) {
		if (this.paused) return { error: 105 };
		if (amount <= 0n) return { error: 107 };
		const bal = this.balances.get(caller) || 0n;
		if (bal < amount) return { error: 101 };
		this.balances.set(caller, bal - amount);
		this.stakedBalances.set(
			caller,
			(this.stakedBalances.get(caller) || 0n) + amount
		);
		return { value: amount };
	},

	unstake(caller: string, amount: bigint) {
		if (this.paused) return { error: 105 };
		if (amount <= 0n) return { error: 107 };
		const staked = this.stakedBalances.get(caller) || 0n;
		if (staked < amount) return { error: 102 };
		this.stakedBalances.set(caller, staked - amount);
		this.balances.set(caller, (this.balances.get(caller) || 0n) + amount);
		return { value: amount };
	},

	delegateStake(caller: string, delegatee: string, amount: bigint) {
		if (this.paused) return { error: 105 };
		if (amount <= 0n) return { error: 107 };
		const staked = this.stakedBalances.get(caller) || 0n;
		if (staked < amount) return { error: 102 };
		const key = `${caller}:${delegatee}`;
		if (this.delegatedStakes.has(key)) return { error: 109 };
		this.delegatedStakes.set(key, amount);
		return { value: amount };
	},

	revokeDelegation(caller: string, delegatee: string) {
		if (this.paused) return { error: 105 };
		const key = `${caller}:${delegatee}`;
		if (!this.delegatedStakes.has(key)) return { error: 108 };
		this.delegatedStakes.delete(key);
		return { value: true };
	},
};

describe("YieldCore Core Token Contract", () => {
	beforeEach(() => {
		mockContract.admin = "ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM";
		mockContract.paused = false;
		mockContract.totalSupply = 0n;
		mockContract.mintCap = 100_000_000_000_000n;
		mockContract.balances = new Map();
		mockContract.allowances = new Map();
		mockContract.stakedBalances = new Map();
		mockContract.delegatedStakes = new Map();
	});

	it("should allow admin to mint tokens within cap", () => {
		const result = mockContract.mint(
			mockContract.admin,
			"ST2CY5V39NHDPWSXMW9QDT3HC3GD6Q6RF0VLGJX6J",
			1000n
		);
		expect(result).toEqual({ value: 1000n });
		expect(
			mockContract.balances.get("ST2CY5V39NHDPWSXMW9QDT3HC3GD6Q6RF0VLGJX6J")
		).toBe(1000n);
		expect(mockContract.totalSupply).toBe(1000n);
	});

	it("should prevent minting over mint cap", () => {
		const result = mockContract.mint(
			mockContract.admin,
			"ST2CY5V39NHDPWSXMW9QDT3HC3GD6Q6RF0VLGJX6J",
			200_000_000_000_001n
		);
		expect(result).toEqual({ error: 104 });
	});

	it("should allow updating mint cap downward by admin", () => {
		const result = mockContract.updateMintCap(
			mockContract.admin,
			50_000_000_000_000n
		);
		expect(result).toEqual({ value: 50_000_000_000_000n });
		expect(mockContract.mintCap).toBe(50_000_000_000_000n);
	});

	it("should prevent non-admin from minting", () => {
		const result = mockContract.mint(
			"ST3NBRSFKX28FQ2ZJ1MAKX58HKHSDGNV5N7R21XCP",
			"ST2CY5V39NHDPWSXMW9QDT3HC3GD6Q6RF0VLGJX6J",
			1000n
		);
		expect(result).toEqual({ error: 100 });
	});

	it("should burn tokens from caller", () => {
		mockContract.mint(
			mockContract.admin,
			"ST2CY5V39NHDPWSXMW9QDT3HC3GD6Q6RF0VLGJX6J",
			500n
		);
		const result = mockContract.burn(
			"ST2CY5V39NHDPWSXMW9QDT3HC3GD6Q6RF0VLGJX6J",
			200n
		);
		expect(result).toEqual({ value: 200n });
		expect(
			mockContract.balances.get("ST2CY5V39NHDPWSXMW9QDT3HC3GD6Q6RF0VLGJX6J")
		).toBe(300n);
		expect(mockContract.totalSupply).toBe(300n);
	});

	it("should approve and check allowance", () => {
		const result = mockContract.approve(
			"ST2CY5V39NHDPWSXMW9QDT3HC3GD6Q6RF0VLGJX6J",
			"ST3NBRSFKX28FQ2ZJ1MAKX58HKHSDGNV5N7R21XCP",
			500n
		);
		expect(result).toEqual({ value: 500n });
		expect(
			mockContract.allowances.get(
				"ST2CY5V39NHDPWSXMW9QDT3HC3GD6Q6RF0VLGJX6J:ST3NBRSFKX28FQ2ZJ1MAKX58HKHSDGNV5N7R21XCP"
			)
		).toBe(500n);
	});

	it("should increase allowance", () => {
		mockContract.approve(
			"ST2CY5V39NHDPWSXMW9QDT3HC3GD6Q6RF0VLGJX6J",
			"ST3NBRSFKX28FQ2ZJ1MAKX58HKHSDGNV5N7R21XCP",
			500n
		);
		const result = mockContract.increaseAllowance(
			"ST2CY5V39NHDPWSXMW9QDT3HC3GD6Q6RF0VLGJX6J",
			"ST3NBRSFKX28FQ2ZJ1MAKX58HKHSDGNV5N7R21XCP",
			300n
		);
		expect(result).toEqual({ value: 800n });
		expect(
			mockContract.allowances.get(
				"ST2CY5V39NHDPWSXMW9QDT3HC3GD6Q6RF0VLGJX6J:ST3NBRSFKX28FQ2ZJ1MAKX58HKHSDGNV5N7R21XCP"
			)
		).toBe(800n);
	});

	it("should decrease allowance", () => {
		mockContract.approve(
			"ST2CY5V39NHDPWSXMW9QDT3HC3GD6Q6RF0VLGJX6J",
			"ST3NBRSFKX28FQ2ZJ1MAKX58HKHSDGNV5N7R21XCP",
			500n
		);
		const result = mockContract.decreaseAllowance(
			"ST2CY5V39NHDPWSXMW9QDT3HC3GD6Q6RF0VLGJX6J",
			"ST3NBRSFKX28FQ2ZJ1MAKX58HKHSDGNV5N7R21XCP",
			200n
		);
		expect(result).toEqual({ value: 300n });
		expect(
			mockContract.allowances.get(
				"ST2CY5V39NHDPWSXMW9QDT3HC3GD6Q6RF0VLGJX6J:ST3NBRSFKX28FQ2ZJ1MAKX58HKHSDGNV5N7R21XCP"
			)
		).toBe(300n);
	});

	it("should transfer tokens directly", () => {
		mockContract.mint(
			mockContract.admin,
			"ST2CY5V39NHDPWSXMW9QDT3HC3GD6Q6RF0VLGJX6J",
			500n
		);
		const result = mockContract.transfer(
			"ST2CY5V39NHDPWSXMW9QDT3HC3GD6Q6RF0VLGJX6J",
			"ST3NBRSFKX28FQ2ZJ1MAKX58HKHSDGNV5N7R21XCP",
			200n
		);
		expect(result).toEqual({ value: 200n });
		expect(
			mockContract.balances.get("ST2CY5V39NHDPWSXMW9QDT3HC3GD6Q6RF0VLGJX6J")
		).toBe(300n);
		expect(
			mockContract.balances.get("ST3NBRSFKX28FQ2ZJ1MAKX58HKHSDGNV5N7R21XCP")
		).toBe(200n);
	});

	it("should transfer from using allowance", () => {
		mockContract.mint(
			mockContract.admin,
			"ST2CY5V39NHDPWSXMW9QDT3HC3GD6Q6RF0VLGJX6J",
			500n
		);
		mockContract.approve(
			"ST2CY5V39NHDPWSXMW9QDT3HC3GD6Q6RF0VLGJX6J",
			"ST4HAS59JDAQJJ9AWCHK1D1D5YHRJDH8NQV3D6DAP",
			300n
		);
		const result = mockContract.transferFrom(
			"ST4HAS59JDAQJJ9AWCHK1D1D5YHRJDH8NQV3D6DAP",
			"ST2CY5V39NHDPWSXMW9QDT3HC3GD6Q6RF0VLGJX6J",
			"ST3NBRSFKX28FQ2ZJ1MAKX58HKHSDGNV5N7R21XCP",
			200n
		);
		expect(result).toEqual({ value: 200n });
		expect(
			mockContract.balances.get("ST2CY5V39NHDPWSXMW9QDT3HC3GD6Q6RF0VLGJX6J")
		).toBe(300n);
		expect(
			mockContract.balances.get("ST3NBRSFKX28FQ2ZJ1MAKX58HKHSDGNV5N7R21XCP")
		).toBe(200n);
		expect(
			mockContract.allowances.get(
				"ST2CY5V39NHDPWSXMW9QDT3HC3GD6Q6RF0VLGJX6J:ST4HAS59JDAQJJ9AWCHK1D1D5YHRJDH8NQV3D6DAP"
			)
		).toBe(100n);
	});

	it("should stake tokens", () => {
		mockContract.mint(
			mockContract.admin,
			"ST2CY5V39NHDPWSXMW9QDT3HC3GD6Q6RF0VLGJX6J",
			500n
		);
		const result = mockContract.stake(
			"ST2CY5V39NHDPWSXMW9QDT3HC3GD6Q6RF0VLGJX6J",
			200n
		);
		expect(result).toEqual({ value: 200n });
		expect(
			mockContract.balances.get("ST2CY5V39NHDPWSXMW9QDT3HC3GD6Q6RF0VLGJX6J")
		).toBe(300n);
		expect(
			mockContract.stakedBalances.get(
				"ST2CY5V39NHDPWSXMW9QDT3HC3GD6Q6RF0VLGJX6J"
			)
		).toBe(200n);
	});

	it("should unstake tokens", () => {
		mockContract.mint(
			mockContract.admin,
			"ST2CY5V39NHDPWSXMW9QDT3HC3GD6Q6RF0VLGJX6J",
			500n
		);
		mockContract.stake("ST2CY5V39NHDPWSXMW9QDT3HC3GD6Q6RF0VLGJX6J", 200n);
		const result = mockContract.unstake(
			"ST2CY5V39NHDPWSXMW9QDT3HC3GD6Q6RF0VLGJX6J",
			100n
		);
		expect(result).toEqual({ value: 100n });
		expect(
			mockContract.stakedBalances.get(
				"ST2CY5V39NHDPWSXMW9QDT3HC3GD6Q6RF0VLGJX6J"
			)
		).toBe(100n);
		expect(
			mockContract.balances.get("ST2CY5V39NHDPWSXMW9QDT3HC3GD6Q6RF0VLGJX6J")
		).toBe(400n);
	});
});
