use std::str::FromStr;

use solana_program::program_pack::Pack;

use crate::state::APRChange;

use {
    crate::{
        error::StakeError,
        instruction::DynamicAPRInstruction,
        state::{Staker, StakingPlatform},
    },
    borsh::{BorshDeserialize, BorshSerialize},
    solana_program::{
        account_info::{next_account_info, AccountInfo},
        borsh::try_from_slice_unchecked,
        entrypoint::ProgramResult,
        
        program::{invoke, invoke_signed},
        program_error::ProgramError,
        pubkey::Pubkey,
        sysvar::{clock::Clock, Sysvar},
    },
    spl_token::{instruction as SPLIX, state::Account},
};
pub struct Processor {}
impl Processor {
    pub fn start(
        program_id: Pubkey,
        accounts: &[AccountInfo],
        instruction_data: &[u8],
    ) -> ProgramResult {
        let function = DynamicAPRInstruction::unpack(instruction_data)?;
        match function {
            DynamicAPRInstruction::Stake {
                amount,
                time_of_stake,
            } => Self::stake(program_id, accounts, amount, time_of_stake),
            DynamicAPRInstruction::Unstake => Self::unstake(program_id, accounts),
            DynamicAPRInstruction::ClaimReward => Self::claim_rewards(program_id, accounts),
            DynamicAPRInstruction::InitializePlatform {
                owner: _,
                locking_time,
                apr,
            } => Self::init_platform(program_id, accounts, locking_time, apr),
            DynamicAPRInstruction::RefundStakers => Self::refund_stakers(program_id, accounts),
            DynamicAPRInstruction::AddTokenToPools { token_amount } => {
                Self::add_token_to_pool(program_id, accounts, token_amount)
            }
        }
    }
    fn stake(
        program_id: Pubkey,
        accounts: &[AccountInfo],
        amount: u64,
        time_of_stake: u64,
    ) -> ProgramResult {
        let iter = &mut accounts.iter();
        let staker = next_account_info(iter)?;
        let staker_token_account = next_account_info(iter)?;
        let stake_account = next_account_info(iter)?;
        let staking_platform = next_account_info(iter)?;
        let stake_pda_token_account = next_account_info(iter)?;
        let staking_token = next_account_info(iter)?;
        let token_program = next_account_info(iter)?;
        let (pda, _nonce) = Pubkey::find_program_address(&[b"DynamicAPR"], &program_id);
        if staking_platform.owner != &program_id || stake_account.owner != &program_id {
            return Err(ProgramError::IllegalOwner);
        }
        let mut stake_acc_info: Staker =
            BorshDeserialize::try_from_slice(&mut stake_account.data.borrow_mut())?;
        let mut staking_platform_info: StakingPlatform =
            try_from_slice_unchecked(&mut staking_platform.data.borrow_mut())?;
        if staker.is_signer != true
            || Account::unpack_unchecked(&mut staker_token_account.data.borrow_mut())?.owner
                != *staker.key
            || Account::unpack_unchecked(&mut stake_pda_token_account.data.borrow_mut())?.owner
                != pda
        {
            return Err(StakeError::InvalidOwner.into());
        }
        stake_acc_info.amount = amount / 1000000000;
        stake_acc_info.time_of_stake = time_of_stake;
        stake_acc_info.staking_time_period = time_of_stake; //supposedly time period of stake not needed
        stake_acc_info.time_of_stake = Clock::get()?.unix_timestamp as u64;
        if staking_platform_info.total_staked == 0 {
            if let Err(error) = invoke(
                &SPLIX::transfer_checked(
                    token_program.key,
                    staker_token_account.key,
                    staking_token.key,
                    stake_pda_token_account.key,
                    staker.key,
                    &[staker.key],
                    amount,
                    9,
                )?,
                &[
                    staker_token_account.clone(),
                    staking_token.clone(),
                    stake_pda_token_account.clone(),
                    staker.clone(),
                ],
            ) {
                return Err(error);
            }
            staking_platform_info.total_staked += amount;
            staking_platform_info.total_stakers += 1;
            staking_platform_info.apr_change_arr.push(APRChange {
                new_apr: staking_platform_info.apr,
                time_of_change: Clock::get()?.unix_timestamp as u64,
                reward_change: ((amount as f64 / 1000000000.00) as f64
                    * staking_platform_info.apr as f64
                    / 10000.00) as u64,
            });
            staking_platform_info.serialize(&mut &mut staking_platform.data.borrow_mut()[..])?;
        } else {
            let index = staking_platform_info.apr_change_arr.len() - 1;
            if index == 0 {
                let mut time_passed = ((Clock::get()?.unix_timestamp as u64
                    - staking_platform_info.apr_change_arr[index].time_of_change)
                    as f64
                    / 31536000.00)
                    * 100.00;
                    
                time_passed = round(time_passed, 4);
                let mut reward_before_apr_change =
                    time_passed * staking_platform_info.apr as f64 / 10000.00;
                    reward_before_apr_change=staking_platform_info.total_staked as f64/1000000000.00*reward_before_apr_change;
                    
                staking_platform_info.apr_change_arr[index] = APRChange {
                    new_apr: staking_platform_info.apr_change_arr[index].new_apr,
                    time_of_change: staking_platform_info.apr_change_arr[index].time_of_change,
                    reward_change: (round(reward_before_apr_change,8)*100000000.00) as u64, //calculate reward on previous apr w.r.t time passed before new staker
                };
                //fixed reward for all stakers on all previous APR 0..n
                let mut _claimable_reward = 0.00;
                for i in 0..staking_platform_info.apr_change_arr.len() {
                    _claimable_reward += staking_platform_info.apr_change_arr[i].reward_change as f64/100000000.00;
                }
                let mut new_pool_size = (staking_platform_info.pool_size as f64 / 1000000000.00)
                    - reward_before_apr_change;
                    new_pool_size= round(new_pool_size, 8)*100000000.0;
                
                let percent_change_pool_size = reward_before_apr_change * 100.0
                    / (staking_platform_info.pool_size as f64 / 1000000000.00);
                let mut apr_change = staking_platform_info.apr as f64
                    - (percent_change_pool_size * staking_platform_info.apr as f64 / 100.00);
                
                    apr_change = round(apr_change, 8)*100000000.0;
                    
                staking_platform_info.apr = apr_change as u64;
                staking_platform_info.total_stakers += 1;
                staking_platform_info.total_staked += amount;
                staking_platform_info.pool_size = new_pool_size  as u64;
                // staking_platform_info.claimable_rewards = _claimable_reward;
                //supposed annual reward on new APR for all stakers 0..n
                let reward = (staking_platform_info.total_staked as f64 / 1000000000.00)
                    * apr_change
                    / 1000000000000.00;
                
                if reward > staking_platform_info.pool_size  as f64/100000000.00
                    || _claimable_reward as f64 > staking_platform_info.pool_size as f64/100000000.00
                {
                    return Err(StakeError::RewardEnding.into());
                }
                staking_platform_info.apr_change_arr.push(APRChange {
                    new_apr: apr_change as u64,
                    time_of_change: Clock::get()?.unix_timestamp as u64,
                    reward_change: reward as u64,
                });
                staking_platform_info.serialize(&mut &mut staking_platform.data.borrow_mut()[..])?;
            } else {
                
                let mut time_passed = ((Clock::get()?.unix_timestamp as u64
                    - staking_platform_info.apr_change_arr[index].time_of_change)
                    as f64
                    / 31536000.00)
                    * 100.00;
                    time_passed = round(time_passed, 4);
                    
                let mut reward_before_apr_change =
                    time_passed * staking_platform_info.apr as f64 / 10000000000.00;
                reward_before_apr_change=staking_platform_info.total_staked as f64/1000000000.00*reward_before_apr_change;
                
                staking_platform_info.apr_change_arr[index] = APRChange {
                    new_apr: staking_platform_info.apr_change_arr[index].new_apr,
                    time_of_change: staking_platform_info.apr_change_arr[index].time_of_change,
                    reward_change: (round(reward_before_apr_change,8)*100000000.00) as u64 //calculate reward on previous apr w.r.t time passed before new staker
                };
                //fixed reward for all stakers on all previous APR 0..n
                let mut _claimable_reward = 0.00;
                for i in 0..staking_platform_info.apr_change_arr.len() {
                    _claimable_reward += staking_platform_info.apr_change_arr[i].reward_change as f64/100000000.00;
                }
                let mut new_pool_size = (staking_platform_info.pool_size as f64 / 100000000.00)
                    - reward_before_apr_change ;
                    new_pool_size= round(new_pool_size, 8)*100000000.0;
                    let percent_change_pool_size = reward_before_apr_change * 100.0
                    / (staking_platform_info.pool_size as f64 / 100000000.00);
                let mut apr_change = staking_platform_info.apr  as f64/10000000000.00
                    - (percent_change_pool_size * (staking_platform_info.apr as f64/10000000000.00) / 100.00);
                    
                    apr_change = round(apr_change, 8)*10000000000.0;
                    
                staking_platform_info.apr = apr_change as u64;
                staking_platform_info.total_stakers += 1;
                staking_platform_info.total_staked += amount;
                staking_platform_info.pool_size = (new_pool_size) as u64;
                // staking_platform_info.claimable_rewards = _claimable_reward;
                //supposed annual reward on new APR for all stakers 0..n
                let reward = (staking_platform_info.total_staked as f64 / 1000000000.00)
                    * apr_change
                    / 1000000000000.00;
                
                    if reward > staking_platform_info.pool_size  as f64/100000000.00
                    || _claimable_reward as f64/ 100000000.00 > staking_platform_info.pool_size as f64/100000000.00
                {
                    return Err(StakeError::RewardEnding.into());
                }
                
                staking_platform_info.apr_change_arr.push(APRChange {
                    new_apr: apr_change as u64,
                    time_of_change: Clock::get()?.unix_timestamp as u64,
                    reward_change: reward as u64,
                });
                staking_platform_info.serialize(&mut &mut staking_platform.data.borrow_mut()[..])?;
            }
            if let Err(error) = invoke(
                &SPLIX::transfer_checked(
                    token_program.key,
                    staker_token_account.key,
                    staking_token.key,
                    stake_pda_token_account.key,
                    staker.key,
                    &[staker.key],
                    amount,
                    9,
                )?,
                &[
                    staker_token_account.clone(),
                    staking_token.clone(),
                    stake_pda_token_account.clone(),
                    staker.clone(),
                ],
            ) {
                return Err(error);
            }
        }
        stake_acc_info.serialize(&mut &mut stake_account.data.borrow_mut()[..])?;
        
        Ok(())
    }
    fn unstake(program_id: Pubkey, accounts: &[AccountInfo]) -> ProgramResult {
        let iter = &mut accounts.iter();
        let staker = next_account_info(iter)?;
        let staker_token_account = next_account_info(iter)?;
        let stake_account = next_account_info(iter)?;
        let staking_platform = next_account_info(iter)?;
        let stake_pda_token_account = next_account_info(iter)?;
        let staking_token = next_account_info(iter)?;
        let token_program = next_account_info(iter)?;
        let pda_account = next_account_info(iter)?;
        let (pda, _nonce) = Pubkey::find_program_address(&[b"DynamicAPR"], &program_id);
        if staking_platform.owner != &program_id || stake_account.owner != &program_id {
            return Err(ProgramError::IllegalOwner);
        }
        let stake_acc_info: Staker =
            BorshDeserialize::try_from_slice(&mut stake_account.data.borrow_mut())?;
        let mut staking_platform_info: StakingPlatform =
            try_from_slice_unchecked(&mut staking_platform.data.borrow_mut())?;
        if staker.is_signer != true
            || Account::unpack_unchecked(&mut staker_token_account.data.borrow_mut())?.owner
                != *staker.key
            || Account::unpack_unchecked(&mut stake_pda_token_account.data.borrow_mut())?.owner
                != pda
            || pda_account.key != &pda
        {
            return Err(StakeError::InvalidOwner.into());
        }
        if let Err(error) = invoke_signed(
            &SPLIX::transfer_checked(
                token_program.key,
                stake_pda_token_account.key,
                staking_token.key,
                staker_token_account.key,
                &pda,
                &[&pda],
                stake_acc_info.amount,
                9,
            )?,
            &[
                stake_pda_token_account.clone(),
                staking_token.clone(),
                staker_token_account.clone(),
                pda_account.clone(),
            ],
            &[&[&b"DynamicAPR"[..], &[_nonce]]],
        ) {
            return Err(error);
        }
        staking_platform_info.total_staked -= stake_acc_info.amount;
        staking_platform_info.total_stakers -= 1;
        **staker.try_borrow_mut_lamports()? = staker
            .lamports()
            .checked_add(stake_account.lamports())
            .ok_or(ProgramError::InsufficientFunds)?;
        **stake_account.try_borrow_mut_lamports()? = 0;
        *stake_account.try_borrow_mut_data()? = &mut [];
        staking_platform_info.serialize(&mut &mut staking_platform.data.borrow_mut()[..])?;
        Ok(())
    }
    fn claim_rewards(program_id: Pubkey, accounts: &[AccountInfo]) -> ProgramResult {
        let iter = &mut accounts.iter();
        let staker = next_account_info(iter)?;
        let staker_token_account = next_account_info(iter)?;
        let stake_account = next_account_info(iter)?;
        let staking_platform = next_account_info(iter)?;
        let pool_pda_token_account = next_account_info(iter)?;
        let staking_token = next_account_info(iter)?;
        let token_program = next_account_info(iter)?;
        let pool_pda_account = next_account_info(iter)?;
        let (pda, _nonce) = Pubkey::find_program_address(&[b"DynamicAPRPool"], &program_id);
        if staking_platform.owner != &program_id || stake_account.owner != &program_id {
            return Err(ProgramError::IllegalOwner);
        }
        let stake_acc_info: Staker =
            BorshDeserialize::try_from_slice(&mut stake_account.data.borrow_mut())?;
        let mut staking_platform_info: StakingPlatform =
            try_from_slice_unchecked(&mut staking_platform.data.borrow_mut())?;
        if staker.is_signer != true
            || Account::unpack_unchecked(&mut staker_token_account.data.borrow_mut())?.owner
                != *staker.key
            || Account::unpack_unchecked(&mut pool_pda_token_account.data.borrow_mut())?.owner
                != pda
            || pool_pda_account.key != &pda
        {
            return Err(StakeError::InvalidOwner.into());
        }
        let mut reward = 0.00;
        let current_time = Clock::get()?.unix_timestamp as u64;
        for i in 0..staking_platform_info.apr_change_arr.len() - 1 {
            if stake_acc_info.time_of_stake
                <= staking_platform_info.apr_change_arr[i].time_of_change
            {
                let time_change = staking_platform_info.apr_change_arr[i + 1].time_of_change
                    - staking_platform_info.apr_change_arr[i].time_of_change;
                let percent_of_time = time_change as f64 / 31536000.00 * 100.00;
                reward += (percent_of_time
                    * staking_platform_info.apr_change_arr[i - 1].new_apr as f64
                    / 10000.00) as f64;
            }
        }
        let index = staking_platform_info.apr_change_arr.len() - 1;
        let mut reward_on_last_change =
            (((current_time - staking_platform_info.apr_change_arr[index].time_of_change) as f64
                / 31536000.00)
                * 100.00)
                * staking_platform_info.apr as f64
                / 10000.00;
        reward_on_last_change += reward;
        if let Err(error) = invoke_signed(
            &SPLIX::transfer_checked(
                token_program.key,
                pool_pda_token_account.key,
                staking_token.key,
                staker_token_account.key,
                &pda,
                &[&pda],
                reward_on_last_change as u64,
                9,
            )?,
            &[
                pool_pda_token_account.clone(),
                staking_token.clone(),
                staker_token_account.clone(),
                pool_pda_account.clone(),
            ],
            &[&[&b"DynamicAPRPool"[..], &[_nonce]]],
        ) {
            return Err(error);
        }
        staking_platform_info.claimed_rewards = reward_on_last_change as u64;
        staking_platform_info.serialize(&mut &mut staking_platform.data.borrow_mut()[..])?;
        Ok(())
    }
    fn refund_stakers(_program_id: Pubkey, accounts: &[AccountInfo]) -> ProgramResult {
        let _iter = &mut accounts.iter();
        Ok(())
    }
    fn init_platform(
        program_id: Pubkey,
        accounts: &[AccountInfo],
        locking_time: u64,
        apr: u64,
    ) -> ProgramResult {
        let iter = &mut accounts.iter();
        let owner = next_account_info(iter)?;
        let staking_platform = next_account_info(iter)?;
        let mut staking_platform_info: StakingPlatform =
            try_from_slice_unchecked(&mut staking_platform.data.borrow_mut())?;
        if staking_platform_info.is_initialized == true {
            return Err(ProgramError::AccountAlreadyInitialized);
        }
        if *owner.key != Pubkey::from_str("CANuE2zG2hjHPMbWLMU7vKiGZjeSR6FfqLNxrMRbuVMB").unwrap() {
            return Err(StakeError::InvalidOwner.into());
        }
        if staking_platform.owner != &program_id {
            return Err(ProgramError::IllegalOwner);
        }
        staking_platform_info.is_initialized = true;
        staking_platform_info.owner = *owner.key;
        staking_platform_info.apr = apr;
        staking_platform_info.staking_period = locking_time;

        staking_platform_info.serialize(&mut &mut staking_platform.data.borrow_mut()[..])?;
        Ok(())
    }

    fn add_token_to_pool(
        program_id: Pubkey,
        accounts: &[AccountInfo],
        amount: u64,
    ) -> ProgramResult {
        let iter = &mut accounts.iter();
        let owner = next_account_info(iter)?;
        let owner_token_account = next_account_info(iter)?;
        let staking_platform = next_account_info(iter)?;
        let pool_pda_token_account = next_account_info(iter)?;
        let staking_token = next_account_info(iter)?;
        let token_program = next_account_info(iter)?;
        let pool_pda_account = next_account_info(iter)?;
        let (pda, _nonce) = Pubkey::find_program_address(&[b"DynamicAPRPool"], &program_id);
        if staking_platform.owner != &program_id {
            return Err(ProgramError::IllegalOwner);
        }
        //add check so only owner can add to pool
        let mut staking_platform_info: StakingPlatform =
            try_from_slice_unchecked(&mut staking_platform.data.borrow_mut())?;

        if Account::unpack_unchecked(&mut pool_pda_token_account.data.borrow_mut())?.owner != pda
            || pool_pda_account.key != &pda
        {
            return Err(StakeError::InvalidOwner.into());
        }

        if let Err(error) = invoke(
            &SPLIX::transfer_checked(
                token_program.key,
                owner_token_account.key,
                staking_token.key,
                pool_pda_token_account.key,
                owner.key,
                &[owner.key],
                amount,
                9,
            )?,
            &[
                owner_token_account.clone(),
                staking_token.clone(),
                pool_pda_token_account.clone(),
                owner.clone(),
            ],
        ) {
            return Err(error);
        }
        staking_platform_info.pool_size += amount;
        staking_platform_info.serialize(&mut &mut staking_platform.data.borrow_mut()[..])?;
        Ok(())
    }
}
fn round(x: f64, decimals: u32) -> f64 {
    let y = 10i32.pow(decimals) as f64;
    (x * y).round() / y
}
