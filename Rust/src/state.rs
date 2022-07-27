use {
    borsh::{BorshDeserialize, BorshSerialize},
    solana_program::pubkey::Pubkey,
};
#[derive(BorshSerialize, BorshDeserialize, Debug)]
pub struct StakingPlatform {
    pub is_initialized: bool,
    pub owner: Pubkey,
    pub apr: u16,
    pub total_staked: u64,
    pub total_stakers: u16,
    pub pool_size: u64,
    pub staking_period: u64,
    pub emergency_stop: bool,
    pub claimed_rewards: u64,
    pub claimable_rewards: u64,
    pub apr_change_arr: Vec<APRChange>,
}
#[derive(BorshSerialize, BorshDeserialize, Debug)]
pub struct APRChange {
    pub new_apr: u16,
    pub time_of_change: u64,
    pub reward_change: u64
}
#[derive(BorshSerialize, BorshDeserialize, Debug)]
pub struct Staker {
    pub is_initialized: bool,
    pub wallet_address: Pubkey,
    pub amount: u64,
    pub time_of_stake: u64,
    pub staking_time_period: u64,
}
